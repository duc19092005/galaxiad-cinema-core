import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { Auditorium, ScheduleData, Movie, ShowTimeSlot } from '../types';
import {
    getPixelsFromTime,
    getTimeFromPixels,
    checkCollision,
    formatTime,
    START_HOUR,
    TOTAL_HOURS,
    PIXELS_PER_MIN
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

        const cleaning = draggingMovie ? 20 : 0;
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
            invalidReason = '❌ Collides!';
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
        lastMousePosRef.current = null;
    };

    const handleDragLeave = () => {
        setGhost(null);
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
            className="flex-1 overflow-auto custom-scrollbar relative select-none bg-slate-50 dark:bg-slate-900"
            ref={containerRef}
            onDragOver={(e) => {
                e.preventDefault();
            }}
            onDrop={() => { lastMousePosRef.current = null; }}
        >
            <div className="flex min-w-max relative min-h-full" style={{ height: TOTAL_HEIGHT + 40 + TOP_OFFSET + BOTTOM_OFFSET }}>
                {/* Time Ruler */}
                <div className="w-12 sm:w-16 flex-shrink-0 sticky left-0 z-30 transition-colors duration-300 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800/60">
                    <div className="h-10 sticky top-0 z-40 transition-colors duration-300 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800/60"></div>
                    {Array.from({ length: TOTAL_HOURS + 1 }).map((_, i) => {
                        const rawHour = START_HOUR + i;
                        const displayHour = rawHour % 24;
                        const label = `${String(displayHour).padStart(2, '0')}:00`;
                        const isPastMidnight = rawHour >= 24;
                        return (
                            <div
                                key={i}
                                className={`absolute w-full text-right pr-2 text-xs transition-colors duration-300 border-t border-slate-200 dark:border-slate-800/60 ${isPastMidnight ? 'text-indigo-500 dark:text-indigo-400' : 'text-slate-500 dark:text-white/60'}`}
                                style={{ top: i * 60 * PIXELS_PER_MIN + 40 + TOP_OFFSET, height: 60 * PIXELS_PER_MIN }}
                            >
                                <span className="-translate-y-2 block bg-slate-50 dark:bg-slate-900 px-1 inline-block">{label}</span>
                            </div>
                        );
                    })}
                </div>

                {/* Days Columns — width increased to 300px for comfortable scheduling */}
                {activeAuditorium && weekDays.map((dateObj) => {
                    const aud = activeAuditorium;
                    const dateString = dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });
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
                            className={`min-w-[200px] sm:min-w-[260px] lg:min-w-[300px] flex-1 relative group transition-colors duration-300 border-r border-slate-200 dark:border-slate-800/60 ${
                                isPastColumn
                                    ? 'bg-slate-100/70 dark:bg-slate-950/80'
                                    : isToday
                                        ? 'bg-blue-50/30 dark:bg-blue-950/20'
                                        : 'bg-white dark:bg-slate-950/50'
                            }`}
                            onDragOver={(e) => handleDragOver(e, aud.id, dateObj)}
                            onDrop={(e) => handleDrop(e, aud.id)}
                            onDragLeave={handleDragLeave}
                        >
                            {/* Header */}
                            <div className={`h-10 flex items-center justify-center font-bold text-sm sticky top-0 z-10 px-2 text-center transition-colors duration-300 border-b border-slate-200 dark:border-slate-800/60 ${
                                isToday
                                    ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                                    : isPastColumn
                                        ? 'bg-slate-200/70 dark:bg-slate-800/70 text-slate-400 dark:text-slate-500'
                                        : 'bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-white/90'
                            }`}>
                                {dateString}
                                {isToday && <span className="ml-1.5 text-[9px] font-black uppercase tracking-wider bg-blue-500 text-white px-1.5 py-0.5 rounded-full">TODAY</span>}
                            </div>

                            {/* Past-column dimming overlay */}
                            {isPastColumn && (
                                <div className="absolute inset-0 top-10 bg-slate-200/10 dark:bg-slate-900/20 pointer-events-none z-[1]" />
                            )}

                            {/* Grid Content */}
                            <div className="relative min-h-full" style={{ height: TOTAL_HEIGHT + TOP_OFFSET + BOTTOM_OFFSET }}>
                                {/* Grid hour lines */}
                                {Array.from({ length: TOTAL_HOURS }).map((_, i) => {
                                    const rawHour = START_HOUR + i;
                                    const isPastMidnight = rawHour >= 24;
                                    return (
                                        <div
                                            key={i}
                                            className={`absolute w-full border-t border-dashed pointer-events-none ${isPastMidnight ? 'border-indigo-200/50 dark:border-indigo-900/30' : 'border-slate-100 dark:border-slate-800/60/50'}`}
                                            style={{ top: i * 60 * PIXELS_PER_MIN + TOP_OFFSET, height: 60 * PIXELS_PER_MIN }}
                                        />
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
                                            <span className="absolute right-1 -top-3 text-[10px] font-semibold text-indigo-400 dark:text-indigo-500 bg-white dark:bg-slate-950 px-1 rounded">
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
                                        <div className="absolute left-0 right-0 border-t-2 border-red-500 dark:border-red-400" />
                                        {/* Dot */}
                                        <div className="absolute left-0 w-2.5 h-2.5 rounded-full bg-red-500 dark:bg-red-400 -translate-y-[5px] -translate-x-1 shadow-lg shadow-red-500/40" />
                                        {/* Label */}
                                        <span className="absolute left-4 -top-3 text-[9px] font-black text-red-500 dark:text-red-400 bg-blue-50 dark:bg-blue-950 px-1 rounded tracking-wider uppercase">
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

                                    return (
                                        <div
                                            key={slot.id}
                                            className="absolute left-1 right-1 rounded-md shadow-sm border border-black/10 overflow-hidden text-xs p-1.5 text-white hover:z-20 transition-all cursor-move"
                                            style={{ top, height, backgroundColor: movie?.color || '#64748b' }}
                                            draggable
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
                                            }}
                                        >
                                            <div className="font-bold truncate">{movie?.title || 'Unknown Movie'}</div>
                                            <div className="opacity-90">{formatTime(slot.start)} - {formatTime(slot.end)}</div>
                                            <div className="mt-1 opacity-75 font-bold">{slot.formatName || slot.formatId}</div>
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
                                        </div>
                                    );
                                })}

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
