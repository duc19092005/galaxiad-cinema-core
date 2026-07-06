import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Clock } from 'lucide-react';
import type { Auditorium, ScheduleData, Movie, ShowTimeSlot } from '../types';
import {
    getPixelsFromTime,
    getTimeFromPixels,
    checkCollision,
    formatTime,
    START_HOUR,
    TOTAL_HOURS,
    PIXELS_PER_MIN,
    CLEANING_TIME_MINUTES
} from '../utils';

interface TimelineGridProps {
    auditoriums: Auditorium[];
    scheduleData: ScheduleData;
    movies: Movie[];
    draggingMovie: Movie | null;
    selectedDate: Date;
    onAddSlot: (auditoriumId: string, slot: ShowTimeSlot) => void;
    onUpdateSlot: (auditoriumId: string, slotId: string, updates: Partial<ShowTimeSlot>) => void;
    onMoveSlot: (fromAuditoriumId: string, toAuditoriumId: string, slot: ShowTimeSlot) => void;
}

// Helper: format local date as YYYY-MM-DD without timezone issues
const toLocalDateKey = (d: Date): string => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Helper: get the "logical date" for a slot.
// Late-night slots (0:00-2:00 AM) visually belong to the PREVIOUS day's column.
const getLogicalDateKey = (slotStart: string): string => {
    const d = new Date(slotStart);
    if (d.getHours() < START_HOUR) {
        d.setDate(d.getDate() - 1);
    }
    return toLocalDateKey(d);
};

// Helper: Get local ISO string without timezone shift (YYYY-MM-DDTHH:mm:ss.sss)
const toLocalISOString = (date: Date): string => {
    const tzoffset = date.getTimezoneOffset() * 60000;
    return (new Date(date.getTime() - tzoffset)).toISOString().slice(0, -1);
};

// Helper: Get current time in Vietnam (UTC+7)
const getNowVietnam = (): Date => {
    return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
};

const TimelineGrid: React.FC<TimelineGridProps> = ({
    auditoriums,
    scheduleData,
    movies,
    draggingMovie,
    selectedDate,
    onAddSlot,
    onUpdateSlot,
    onMoveSlot
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const lastMousePosRef = useRef<{ x: number; y: number } | null>(null);
    const isDraggingRef = useRef(false);

    const [ghost, setGhost] = useState<{
        columnId: string;
        auditoriumId: string;
        start: Date;
        end: Date;
        valid: boolean;
        invalidReason: string;
        top: number;
        height: number;
    } | null>(null);

    const [resizingSlot, setResizingSlot] = useState<{
        auditoriumId: string;
        slotId: string;
        initialY: number;
        initialHeight: number;
        start: Date;
    } | null>(null);

    const [movingSlot, setMovingSlot] = useState<{
        originalAuditoriumId: string;
        slot: ShowTimeSlot;
        movie: Movie;
        offsetX: number;
    } | null>(null);

    // Live current-time indicator (updates every minute)
    const [nowPixel, setNowPixel] = useState<{ dateKey: string; pixel: number } | null>(null);

    // Buffer zone indicators during drag
    const [bufferZones, setBufferZones] = useState<Array<{
        top: number;
        height: number;
        isAbove: boolean; // true = buffer before slot, false = buffer after slot
    }>>([]);
    const [dragOverColumnId, setDragOverColumnId] = useState<string | null>(null);

    useEffect(() => {
        const update = () => {
            const nowVN = getNowVietnam();
            const dateKey = toLocalDateKey(nowVN);
            let hours = nowVN.getHours();
            // Hours < START_HOUR means past midnight (next calendar day, same cinema day)
            if (hours < START_HOUR) hours += 24;
            const minutesFromStart = (hours - START_HOUR) * 60 + nowVN.getMinutes();
            if (minutesFromStart >= 0 && minutesFromStart <= TOTAL_HOURS * 60) {
                setNowPixel({ dateKey, pixel: minutesFromStart * PIXELS_PER_MIN });
            } else {
                setNowPixel(null);
            }
        };
        update();
        const id = setInterval(update, 60_000);
        return () => clearInterval(id);
    }, []);

    const TOTAL_HEIGHT = TOTAL_HOURS * 60 * PIXELS_PER_MIN;
    const TOP_OFFSET = 20;
    const BOTTOM_OFFSET = 20;

    const activeAuditorium = auditoriums[0];

    // Track mouse position at window level for reliable auto-scroll
    useEffect(() => {
        const handleWindowDragOver = (e: DragEvent) => {
            if (isDraggingRef.current) {
                lastMousePosRef.current = { x: e.clientX, y: e.clientY };
            }
        };
        window.addEventListener('dragover', handleWindowDragOver);
        return () => window.removeEventListener('dragover', handleWindowDragOver);
    }, []);

    // Calculate days to show: from today through end of next week
    const today = new Date(selectedDate);
    today.setHours(0, 0, 0, 0);
    const currentDayOfWeek = today.getDay();
    const daysToSunday = currentDayOfWeek === 0 ? 0 : 7 - currentDayOfWeek;
    const totalDaysToShow = daysToSunday + 7 + 1;

    const weekDays = Array.from({ length: totalDaysToShow }).map((_, i) => {
        const d = new Date(today);
        d.setDate(d.getDate() + i);
        return d;
    });

    // Track drag state
    useEffect(() => {
        isDraggingRef.current = !!(draggingMovie || movingSlot);
    }, [draggingMovie, movingSlot]);

    // Clear buffer zones when schedule data changes (e.g. after fetch)
    useEffect(() => {
        setBufferZones([]);
    }, [scheduleData]);

    // Throttled handleDragOver
    const lastDragOverTime = useRef(0);

    const handleDragOver = useCallback((e: React.DragEvent, auditoriumId: string, targetDate: Date) => {
        e.preventDefault();
        if (!draggingMovie && !movingSlot) return;

        lastMousePosRef.current = { x: e.clientX, y: e.clientY };

        // Throttle: 30ms for smoother response
        const now = Date.now();
        if (now - lastDragOverTime.current < 30) return;
        lastDragOverTime.current = now;

        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        let offsetY = e.clientY - rect.top;

        if (movingSlot) {
            offsetY -= movingSlot.offsetX;
        }

        offsetY -= (40 + TOP_OFFSET);

        const rawMinutes = offsetY / PIXELS_PER_MIN;
        const snappedMinutes = Math.round(rawMinutes / 10) * 10;
        const snappedPixel = Math.max(0, Math.min(snappedMinutes * PIXELS_PER_MIN, TOTAL_HEIGHT));

        const baseDate = new Date(targetDate);
        baseDate.setHours(START_HOUR, 0, 0, 0);

        const startTimeLocal = getTimeFromPixels(snappedPixel, baseDate);

        let duration = 0;

        if (draggingMovie) {
            duration = draggingMovie.durationMinutes;
        } else if (movingSlot) {
            const s = new Date(movingSlot.slot.start);
            const en = new Date(movingSlot.slot.end);
            duration = (en.getTime() - s.getTime()) / 60000;
        }

        const cleaning = draggingMovie ? CLEANING_TIME_MINUTES : 0;
        const effectiveDuration = draggingMovie ? (duration + cleaning) : duration;
        const endTimeLocal = new Date(startTimeLocal.getTime() + effectiveDuration * 60000);

        // End pixel check
        const endPixel = snappedPixel + effectiveDuration * PIXELS_PER_MIN;
        const isOutOfBounds = endPixel > TOTAL_HEIGHT;

        // Collision check
        const relevantSchedule = scheduleData.data.find(d => d.auditoriumId === auditoriumId);
        const existingSlots = relevantSchedule ? relevantSchedule.slots : [];
        const excludeId = movingSlot ? movingSlot.slot.id : undefined;
        const isColliding = checkCollision(startTimeLocal, endTimeLocal, existingSlots, excludeId);

        // Format compatibility
        const aud = auditoriums.find(a => a.id === auditoriumId);
        let isFormatCompatible = true;

        if (aud && aud.supportedFormats && aud.supportedFormats.length > 0) {
            const roomFormatIds = aud.supportedFormats.map(sf => sf.id.toLowerCase());

            if (draggingMovie) {
                isFormatCompatible = draggingMovie.formats.some(f =>
                    roomFormatIds.includes(f.id.toLowerCase())
                );
            } else if (movingSlot) {
                isFormatCompatible = roomFormatIds.includes(movingSlot.slot.formatId.toLowerCase());
            }
        }

        // ─── PAST TIME CHECK (Vietnam UTC+7) ───────────────────────────
        const nowVN = getNowVietnam();
        // Only block past-time if this column is TODAY (or an already-passed date)
        const todayKey = toLocalDateKey(nowVN);
        const columnKey = toLocalDateKey(targetDate);
        const isColumnInPast = columnKey < todayKey;
        const isPastTime = isColumnInPast || (columnKey === todayKey && startTimeLocal < nowVN);
        // ────────────────────────────────────────────────────────────────

        // Validity
        let invalidReason = '';
        let isValid = true;

        if (isPastTime) {
            isValid = false;
            const hh = String(nowVN.getHours()).padStart(2, '0');
            const mm = String(nowVN.getMinutes()).padStart(2, '0');
            invalidReason = `⛔ Đã qua ${hh}:${mm} (UTC+7)`;
        } else if (isOutOfBounds) {
            isValid = false;
            invalidReason = '⚠ Exceeds 02:00 AM';
        } else if (isColliding) {
            isValid = false;
            invalidReason = `❌ Cần cách ${CLEANING_TIME_MINUTES} phút dọn dẹp`;
        } else if (!isFormatCompatible) {
            isValid = false;
            invalidReason = '⚠ Format mismatch';
        }

        const columnId = `${auditoriumId}-${toLocalDateKey(targetDate)}`;

        setGhost({
            columnId,
            auditoriumId,
            start: startTimeLocal,
            end: endTimeLocal,
            valid: isValid,
            invalidReason,
            top: snappedPixel,
            height: Math.min(effectiveDuration * PIXELS_PER_MIN, TOTAL_HEIGHT - snappedPixel)
        });

        // Compute buffer zones for visual indicators — only for slots in this column's date
        const bufferPx = CLEANING_TIME_MINUTES * PIXELS_PER_MIN; // 15 min * 2 px/min = 30 px
        const zones: Array<{ top: number; height: number; isAbove: boolean }> = [];
        const columnSlots = existingSlots.filter(s => getLogicalDateKey(s.start) === columnKey);
        for (const slot of columnSlots) {
            // Only show buffer zones for slots that haven't ended yet
            const slotEnd = new Date(slot.end);
            if (slotEnd <= nowVN) continue;

            const slotTop = getPixelsFromTime(slot.start) + TOP_OFFSET;
            const slotBottom = getPixelsFromTime(slot.end) + TOP_OFFSET;
            // Buffer above the slot (only if slot hasn't started yet)
            if (new Date(slot.start) > nowVN) {
                zones.push({
                    top: Math.max(0, slotTop - bufferPx),
                    height: bufferPx,
                    isAbove: true,
                });
            }
            // Buffer below the slot
            zones.push({
                top: slotBottom,
                height: bufferPx,
                isAbove: false,
            });
        }
        setBufferZones(zones);
        setDragOverColumnId(columnId);
    }, [draggingMovie, movingSlot, auditoriums, scheduleData, TOP_OFFSET, TOTAL_HEIGHT]);

    const handleDrop = (e: React.DragEvent, auditoriumId: string) => {
        e.preventDefault();
        if (!ghost || !ghost.valid) {
            setGhost(null);
            return;
        }

        if (draggingMovie) {
            const aud = auditoriums.find(a => a.id === auditoriumId);
            const roomFormatIds = aud?.supportedFormats?.map(sf => sf.id.toLowerCase()) || [];

            const matchedFormat = draggingMovie.formats.find(f =>
                roomFormatIds.includes(f.id.toLowerCase())
            ) || draggingMovie.formats[0];

            const newSlot: ShowTimeSlot = {
                id: `new-${crypto.randomUUID()}`,
                movieId: draggingMovie.id,
                formatId: matchedFormat.id,
                formatName: matchedFormat.name,
                start: toLocalISOString(ghost.start),
                end: toLocalISOString(ghost.end),
                price: 100
            };
            onAddSlot(auditoriumId, newSlot);
        } else if (movingSlot) {
            const updatedSlot: ShowTimeSlot = {
                ...movingSlot.slot,
                start: toLocalISOString(ghost.start),
                end: toLocalISOString(ghost.end),
                isDirty: true
            };
            onMoveSlot(movingSlot.originalAuditoriumId, auditoriumId, updatedSlot);
        }

        setGhost(null);
        setMovingSlot(null);
        setBufferZones([]);
        setDragOverColumnId(null);
        lastMousePosRef.current = null;
    };

    const handleDragLeave = () => {
        setGhost(null);
        setBufferZones([]);
        setDragOverColumnId(null);
    };

    // ─── AUTO-SCROLL via requestAnimationFrame ─────────────────────────────────
    useEffect(() => {
        if (!draggingMovie && !movingSlot) return;

        let animationFrame: number | null = null;

        const checkScroll = () => {
            const pos = lastMousePosRef.current;
            const container = containerRef.current;

            if (pos && container) {
                const containerRect = container.getBoundingClientRect();
                const threshold = 80; // px zone near edge to trigger scroll
                const maxSpeed = 18;
                const minSpeed = 4;

                // Vertical scroll DOWN — cursor near bottom edge of container
                if (pos.y > containerRect.bottom - threshold && pos.y <= containerRect.bottom + 40) {
                    const distance = pos.y - (containerRect.bottom - threshold);
                    const ratio = Math.min(distance / threshold, 1);
                    const speed = minSpeed + ratio * (maxSpeed - minSpeed);
                    container.scrollTop += speed;
                }
                // Vertical scroll UP — cursor near top edge of container
                else if (pos.y < containerRect.top + threshold && pos.y >= containerRect.top - 40) {
                    const distance = (containerRect.top + threshold) - pos.y;
                    const ratio = Math.min(distance / threshold, 1);
                    const speed = minSpeed + ratio * (maxSpeed - minSpeed);
                    container.scrollTop -= speed;
                }

                // Horizontal scroll RIGHT
                if (pos.x > containerRect.right - threshold && pos.x <= containerRect.right + 40) {
                    const distance = pos.x - (containerRect.right - threshold);
                    const ratio = Math.min(distance / threshold, 1);
                    const speed = minSpeed + ratio * (maxSpeed - minSpeed);
                    container.scrollLeft += speed;
                }
                // Horizontal scroll LEFT
                else if (pos.x < containerRect.left + threshold && pos.x >= containerRect.left - 40) {
                    const distance = (containerRect.left + threshold) - pos.x;
                    const ratio = Math.min(distance / threshold, 1);
                    const speed = minSpeed + ratio * (maxSpeed - minSpeed);
                    container.scrollLeft -= speed;
                }
            }

            animationFrame = requestAnimationFrame(checkScroll);
        };

        animationFrame = requestAnimationFrame(checkScroll);
        return () => { if (animationFrame) cancelAnimationFrame(animationFrame); };
    }, [draggingMovie, movingSlot]);
    // ──────────────────────────────────────────────────────────────────────────

    // Mouse wheel scroll during drag
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleWheel = (e: WheelEvent) => {
            if (isDraggingRef.current) {
                e.preventDefault();
                container.scrollTop += e.deltaY;
                container.scrollLeft += e.deltaX;
            }
        };

        container.addEventListener('wheel', handleWheel, { passive: false });
        return () => container.removeEventListener('wheel', handleWheel);
    }, []);

    // Resize Logic
    useEffect(() => {
        const handleMouseMove = () => { if (!resizingSlot) return; };

        const handleMouseUp = (e: MouseEvent) => {
            if (!resizingSlot) return;
            const deltaY = e.clientY - resizingSlot.initialY;
            const newHeight = Math.max(30, resizingSlot.initialHeight + deltaY);
            const durationMinutes = newHeight / PIXELS_PER_MIN;
            const newEnd = new Date(resizingSlot.start.getTime() + durationMinutes * 60000);
            onUpdateSlot(resizingSlot.auditoriumId, resizingSlot.slotId, { end: newEnd.toISOString() });
            setResizingSlot(null);
            document.body.style.cursor = 'default';
        };

        if (resizingSlot) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'ns-resize';
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'default';
        };
    }, [resizingSlot, onUpdateSlot]);

    const todayKey = toLocalDateKey(getNowVietnam());

    return (
        <div
            className="flex-1 overflow-auto custom-scrollbar relative select-none"
            style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
                backdropFilter: 'blur(16px) saturate(1.2)',
                WebkitBackdropFilter: 'blur(16px) saturate(1.2)',
                border: '1px solid rgba(255,255,255,0.06)',
                boxShadow: '0 4px 24px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.04)',
                borderRadius: 'var(--radius-lg)',
            }}
            ref={containerRef}
            onDragOver={(e) => {
                e.preventDefault();
            }}
            onDrop={() => { lastMousePosRef.current = null; }}
        >
            <div className="flex min-w-max relative min-h-full" style={{ height: TOTAL_HEIGHT + 40 + TOP_OFFSET + BOTTOM_OFFSET }}>
                {/* Time Ruler */}
                <div className="w-12 sm:w-16 flex-shrink-0 sticky left-0 z-30 transition-colors duration-300 bg-cinema-bg/95 border-r border-cinema-border backdrop-blur-md">
                    <div className="h-10 sticky top-0 z-40 transition-colors duration-300 bg-cinema-surface/95 border-b border-cinema-border"></div>
                    {Array.from({ length: TOTAL_HOURS + 1 }).map((_, i) => {
                        const rawHour = START_HOUR + i;
                        const displayHour = rawHour % 24;
                        const label = `${String(displayHour).padStart(2, '0')}:00`;
                        const isPastMidnight = rawHour >= 24;
                        return (
                            <div
                                key={i}
                                className={`absolute w-full text-right pr-2 text-xs transition-colors duration-300 border-t border-cinema-border/50 ${isPastMidnight ? 'text-indigo-400' : 'text-cinema-text-muted'}`}
                                style={{ top: i * 60 * PIXELS_PER_MIN + 40 + TOP_OFFSET, height: 60 * PIXELS_PER_MIN }}
                            >
                                <span className="-translate-y-2 block bg-cinema-bg px-1 inline-block text-cinema-text-muted">{label}</span>
                            </div>
                        );
                    })}
                </div>
 
                {/* Days Columns — width increased to 300px for comfortable scheduling */}
                {activeAuditorium && weekDays.map((dateObj) => {
                    const aud = activeAuditorium;
                    const dateString = dateObj.toLocaleDateString('vi-VN', { weekday: 'short', month: 'numeric', day: 'numeric' });
                    const dateKey = toLocalDateKey(dateObj);
                    const columnId = `${aud.id}-${dateKey}`;
                    const isToday = dateKey === todayKey;
                    const isPastColumn = dateKey < todayKey;
 
                    const schedule = scheduleData.data.find(d => d.auditoriumId === aud.id);
                    const allSlots = schedule ? schedule.slots : [];
                    const slots = allSlots.filter(s => getLogicalDateKey(s.start) === dateKey);
 
                    return (
                        <div
                            key={columnId}
                            className={`min-w-[200px] sm:min-w-[260px] lg:min-w-[300px] flex-1 relative group transition-colors duration-300 border-r border-cinema-border ${
                                isPastColumn
                                    ? 'bg-black/20 dark:bg-black/45'
                                    : isToday
                                        ? 'bg-cinema-accent/5'
                                        : 'bg-transparent'
                            }`}
                            onDragOver={(e) => handleDragOver(e, aud.id, dateObj)}
                            onDrop={(e) => handleDrop(e, aud.id)}
                            onDragLeave={handleDragLeave}
                        >
                            {/* Header */}
                            <div className={`h-10 flex items-center justify-center font-bold text-sm sticky top-0 z-10 px-2 text-center transition-colors duration-300 border-b border-cinema-border backdrop-blur-md ${
                                isToday
                                    ? 'bg-cinema-accent/20 text-cinema-accent font-black'
                                    : isPastColumn
                                        ? 'bg-cinema-bg/85 text-cinema-text-muted opacity-60'
                                        : 'bg-cinema-surface/85 text-cinema-text'
                            }`}>
                                {dateString}
                                {isToday && <span className="ml-1.5 text-[9px] font-black uppercase tracking-wider bg-cinema-accent text-white px-1.5 py-0.5 rounded-full">TODAY</span>}
                            </div>
 
                            {/* Past-column dimming overlay */}
                            {isPastColumn && (
                                <div className="absolute inset-0 top-10 bg-black/10 dark:bg-black/20 pointer-events-none z-[1]" />
                            )}
 
                            {/* Grid Content */}
                            <div className="relative min-h-full" style={{ height: TOTAL_HEIGHT + TOP_OFFSET + BOTTOM_OFFSET }}>
                                {/* Grid hour lines */}
                                {Array.from({ length: TOTAL_HOURS }).map((_, i) => {
                                    const hourTop = i * 60 * PIXELS_PER_MIN + TOP_OFFSET;
                                    const halfHourTop = hourTop + 30 * PIXELS_PER_MIN;
                                    return (
                                        <React.Fragment key={i}>
                                            {/* Hourly solid line */}
                                            <div
                                                className="absolute left-0 right-0 border-t border-solid pointer-events-none border-cinema-border/60"
                                                style={{ top: hourTop }}
                                            />
                                            {/* Half-hourly dashed line */}
                                            <div
                                                className="absolute left-0 right-0 border-t border-dashed pointer-events-none border-cinema-border/20"
                                                style={{ top: halfHourTop }}
                                            />
                                        </React.Fragment>
                                    );
                                })}
 
                                {/* Midnight divider line */}
                                {(() => {
                                    const midnightPixel = (24 - START_HOUR) * 60 * PIXELS_PER_MIN + TOP_OFFSET;
                                    return (
                                        <div
                                            className="absolute left-0 right-0 border-t-2 border-dashed border-indigo-400/40 dark:border-indigo-500/20 pointer-events-none z-[2]"
                                            style={{ top: midnightPixel }}
                                        >
                                            <span className="absolute right-1 -top-3 text-[10px] font-semibold text-indigo-400 dark:text-indigo-500 bg-cinema-surface px-1 rounded border border-cinema-border/50">
                                                midnight
                                            </span>
                                        </div>
                                    );
                                })()}
 
                                {/* ─── CURRENT TIME INDICATOR (today only, UTC+7) ─── */}
                                {isToday && nowPixel && nowPixel.dateKey === dateKey && (
                                    <div
                                        className="absolute left-0 right-0 z-[6] pointer-events-none"
                                        style={{ top: nowPixel.pixel + TOP_OFFSET }}
                                    >
                                        {/* Line */}
                                        <div className="absolute left-0 right-0 border-t-2 border-red-500" />
                                        {/* Dot */}
                                        <div className="absolute left-0 w-2.5 h-2.5 rounded-full bg-red-500 -translate-y-[5px] -translate-x-1 shadow-lg shadow-red-500/40" />
                                        {/* Label */}
                                        <span className="absolute left-4 -top-3 text-[9px] font-black text-red-500 bg-cinema-surface px-1.5 py-0.5 rounded tracking-wider uppercase border border-cinema-border/50">
                                            NOW
                                        </span>
                                    </div>
                                )}
                                {/* ─────────────────────────────────────────────────── */}

                                {/* Slots */}
                                {slots.map(slot => {
                                    const movie = movies.find(m => m.id === slot.movieId);
                                    const top = getPixelsFromTime(slot.start) + TOP_OFFSET;
                                    const bottom = getPixelsFromTime(slot.end) + TOP_OFFSET;
                                    const height = bottom - top;
                                    const isPast = new Date(slot.end) <= getNowVietnam();

                                    return (
                                        <div
                                            key={slot.id}
                                            className={`absolute left-1 right-1 rounded-md shadow-sm border border-black/10 overflow-hidden text-xs p-1.5 text-white transition-all ${isPast ? 'opacity-40 cursor-default' : 'hover:z-20 cursor-move'}`}
                                            style={{ top, height, backgroundColor: movie?.color || '#64748b' }}
                                            draggable={!isPast}
                                            onDragStart={(e) => {
                                                const rect = e.currentTarget.getBoundingClientRect();
                                                const offsetY = e.clientY - rect.top;
                                                setMovingSlot({
                                                    originalAuditoriumId: aud.id,
                                                    slot,
                                                    movie: movie!,
                                                    offsetX: offsetY
                                                });
                                                const img = new Image();
                                                img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
                                                e.dataTransfer.setDragImage(img, 0, 0);
                                                e.dataTransfer.setData('application/json', JSON.stringify({
                                                    type: 'SLOT',
                                                    auditoriumId: aud.id,
                                                    slotId: slot.id
                                                }));
                                            }}
                                            onDragEnd={() => {
                                                setMovingSlot(null);
                                                lastMousePosRef.current = null;
                                                setGhost(null);
                                                setBufferZones([]);
                                                setDragOverColumnId(null);
                                            }}
                                        >
                                            <div className="font-bold truncate">{movie?.title || 'Unknown Movie'}</div>
                                            <div className="opacity-90">{formatTime(slot.start)} - {formatTime(slot.end)}</div>
                                            <div className="mt-1 opacity-75 font-bold">{slot.formatName || slot.formatId}</div>
                                            {isPast && (
                                                <div className="absolute top-1 right-1 text-[8px] font-black uppercase tracking-wider bg-black/40 text-white/70 px-1.5 py-0.5 rounded">
                                                    Đã chiếu
                                                </div>
                                            )}
                                            {!isPast && (
                                                <div
                                                    className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize hover:bg-black/20"
                                                    onMouseDown={(e) => {
                                                        e.stopPropagation();
                                                        e.preventDefault();
                                                        setResizingSlot({
                                                            auditoriumId: aud.id,
                                                            slotId: slot.id,
                                                            initialY: e.clientY,
                                                            initialHeight: height,
                                                            start: new Date(slot.start)
                                                        });
                                                    }}
                                                />
                                            )}
                                        </div>
                                    );
                                })}

                                {/* Buffer Zone Indicators — shown during drag only in the dragged-over column */}
                                {dragOverColumnId === columnId && bufferZones.length > 0 &&
                                    bufferZones.map((zone, i) => (
                                        <div
                                            key={`buf-${i}`}
                                            className="absolute left-0 right-0 pointer-events-none z-[4] flex items-center justify-center"
                                            style={{ top: zone.top, height: zone.height }}
                                        >
                                            <div className="absolute inset-0 bg-amber-400/8 border border-dashed border-amber-400/30 rounded-sm" />
                                            <span className="relative flex items-center gap-0.5 text-[8px] font-bold text-amber-500/60 uppercase tracking-wider select-none">
                                                <Clock size={8} />
                                                {CLEANING_TIME_MINUTES}p
                                            </span>
                                        </div>
                                    ))
                                }

                                {/* Ghost Block */}
                                {ghost && ghost.columnId === columnId && (
                                    <div
                                        className={`absolute left-1 right-1 rounded-md border-2 border-dashed flex flex-col items-center justify-center text-sm font-bold z-30 pointer-events-none gap-1
                                            ${ghost.valid
                                                ? 'bg-green-500/20 border-green-500 text-green-700 dark:text-green-300'
                                                : 'bg-red-500/20 border-red-500 text-red-700 dark:text-red-300'
                                            }`}
                                        style={{ top: ghost.top + TOP_OFFSET, height: ghost.height }}
                                    >
                                        {ghost.valid
                                            ? <><span>{formatTime(ghost.start.toISOString())}</span><span className="text-[10px] font-semibold opacity-70">→ {formatTime(ghost.end.toISOString())}</span></>
                                            : <span className="text-center px-2">{ghost.invalidReason}</span>
                                        }
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default TimelineGrid;
