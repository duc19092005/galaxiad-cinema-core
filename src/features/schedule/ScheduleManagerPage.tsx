import React, { useState, useEffect } from 'react';
import TimelineGrid from './components/TimelineGrid';
import DraggableMovie from './components/DraggableMovie';
import type { Movie as ScheduleMovie, ScheduleData, ShowTimeSlot, Auditorium as ScheduleAuditorium } from './types';
import { Calendar, Save, Menu, X, Film, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import TrashCan from './components/TrashCan';
import ManualAddModal from './components/ManualAddModal';
import { scheduleApi } from '../../api/scheduleApi';

import { useCinema } from '../../contexts/CinemaContext';

interface ScheduleManagerPageProps {
    embedded?: boolean;
}

const colorPalette = ['#e11d48', '#2563eb', '#16a34a', '#d97706', '#9333ea', '#0891b2', '#ea580c'];

const ScheduleManagerPage: React.FC<ScheduleManagerPageProps> = ({ embedded = false }) => {
    const { t } = useTranslation();
    const { activeCinemaId } = useCinema();
    const [scheduleData, setScheduleData] = useState<ScheduleData>({ cinemaId: 'default', data: [] });
    const [draggingMovie, setDraggingMovie] = useState<ScheduleMovie | null>(null);
    const [manualAddMovie, setManualAddMovie] = useState<ScheduleMovie | null>(null);
    const [selectedAuditoriumId, setSelectedAuditoriumId] = useState<string>('');
    const [selectedDate] = useState<Date>(new Date());
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Dynamic data
    const [moviesList, setMoviesList] = useState<ScheduleMovie[]>([]);
    const [auditoriumsList, setAuditoriumsList] = useState<ScheduleAuditorium[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchInitialData();
    }, [activeCinemaId]);

    useEffect(() => {
        if (selectedAuditoriumId && auditoriumsList.length > 0) {
            fetchSchedulesForAuditorium(selectedAuditoriumId);
        }
    }, [selectedAuditoriumId, auditoriumsList]);

    const fetchSchedulesForAuditorium = async (audId: string) => {
        try {
            const res = await scheduleApi.getSchedulesByAuditorium(audId);
            const slots: ShowTimeSlot[] = (res.data || []).filter(s => !s.isDeleted).map(s => ({
                id: s.scheduleId,
                movieId: s.movieId,
                formatId: s.formatId,
                formatName: s.formatName,
                start: s.startedDate,
                end: s.endedTime,
                price: 0
            }));
            setScheduleData(prev => {
                const newData = [...prev.data];
                const audIndex = newData.findIndex(d => d.auditoriumId === audId);
                if (audIndex >= 0) newData[audIndex] = { ...newData[audIndex], slots };
                else newData.push({ auditoriumId: audId, slots });
                return { ...prev, data: newData };
            });
        } catch (err) {
            console.error("Failed to fetch schedules", err);
        }
    };

    const fetchInitialData = async () => {
        if (!activeCinemaId) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const [moviesRes, audsRes] = await Promise.all([
                scheduleApi.getMoviesWithFormats(activeCinemaId),
                scheduleApi.getMyAuditoriums(activeCinemaId)
            ]);

            // Group movies by movieId
            const moviesMap = new Map<string, ScheduleMovie>();
            let colorIndex = 0;

            (moviesRes.data || []).forEach(m => {
                if (!moviesMap.has(m.movieId)) {
                    moviesMap.set(m.movieId, {
                        id: m.movieId,
                        title: m.movieName,
                        durationMinutes: 120, // Default duration
                        formats: [],
                        color: colorPalette[colorIndex % colorPalette.length]
                    });
                    colorIndex++;
                }
                const movie = moviesMap.get(m.movieId)!;
                if (!movie.formats.find(f => f.id === m.formatId)) {
                    movie.formats.push({
                        id: m.formatId,
                        name: m.formatName
                    });
                }
            });

            const mappedMovies = Array.from(moviesMap.values());

            const mappedAuds: ScheduleAuditorium[] = (audsRes.data?.auditoriums || []).map((a: any) => {
                // ASP.NET returns lowercase property names: formats, formatId, formatName
                const formatsFromApi = a.formats || a.formatInfos || [];
                const supportedFormats = (Array.isArray(formatsFromApi) ? formatsFromApi : [])
                    .map((f: any) => ({
                        id: f.formatId || f.id || '',
                        name: f.formatName || f.name || ''
                    }))
                    .filter((f: any) => f.id);

                return {
                    id: a.auditoriumId,
                    name: a.auditoriumNumber.toString(),
                    supportedFormats: supportedFormats
                };
            });

            setMoviesList(mappedMovies);
            setAuditoriumsList(mappedAuds);
            if (mappedAuds.length > 0) {
                const initialAudId = mappedAuds[0].id;
                setSelectedAuditoriumId(initialAudId);
                setScheduleData({ cinemaId: 'default', data: mappedAuds.map(a => ({ auditoriumId: a.id, slots: [] })) });
            }
        } catch (error) {
            console.error("Failed to fetch schedule dependencies", error);
            toast.error("Failed to load dependencies");
        } finally {
            setLoading(false);
        }
    };

    const activeAuditorium = auditoriumsList.find(a => a.id === selectedAuditoriumId);
    const filteredAuditoriums = activeAuditorium ? [activeAuditorium] : [];

    const handleAddSlot = (auditoriumId: string, slot: ShowTimeSlot) => {
        setScheduleData(prev => {
            const newData = [...prev.data];
            const audIndex = newData.findIndex(d => d.auditoriumId === auditoriumId);
            if (audIndex >= 0) {
                newData[audIndex] = { ...newData[audIndex], slots: [...newData[audIndex].slots, slot] };
            } else {
                newData.push({ auditoriumId, slots: [slot] });
            }
            return { ...prev, data: newData };
        });
    };

    const handleUpdateSlot = (auditoriumId: string, slotId: string, updates: Partial<ShowTimeSlot>) => {
        setScheduleData(prev => {
            const newData = [...prev.data];
            const audIndex = newData.findIndex(d => d.auditoriumId === auditoriumId);
            if (audIndex >= 0) {
                const newSlots = newData[audIndex].slots.map(s => s.id === slotId ? { ...s, ...updates, isDirty: true } : s);
                newData[audIndex] = { ...newData[audIndex], slots: newSlots };
            }
            return { ...prev, data: newData };
        });
    };

    const handleDeleteSlot = async (auditoriumId: string, slotId: string) => {
        try {
            if (slotId !== "00000000-0000-0000-0000-000000000000" && !slotId.startsWith('new-')) {
                await scheduleApi.deleteSchedule(slotId);
                toast.success('Xóa lịch chiếu thành công.');
            }
        } catch (error: any) {
            // If already deleted or move to archive, just remove locally without error toast if it's 404
            if (error.response?.status !== 404) {
                const msg = error.response?.data?.message || 'Lỗi khi xóa lịch chiếu.';
                toast.error(msg);
            }
        } finally {
            // Xóa ở local
            setScheduleData(prev => {
                const newData = [...prev.data];
                const audIndex = newData.findIndex(d => d.auditoriumId === auditoriumId);
                if (audIndex >= 0) {
                    const newSlots = newData[audIndex].slots.filter(s => s.id !== slotId);
                    newData[audIndex] = { ...newData[audIndex], slots: newSlots };
                }
                return { ...prev, data: newData };
            });
        }
    };

    const handleMoveSlot = (fromAuditoriumId: string, toAuditoriumId: string, slot: ShowTimeSlot) => {
        setScheduleData(prev => {
            const newData = [...prev.data];
            const fromIndex = newData.findIndex(d => d.auditoriumId === fromAuditoriumId);
            const updatedSlot = { ...slot, isDirty: true };

            if (fromIndex >= 0) {
                newData[fromIndex] = { ...newData[fromIndex], slots: newData[fromIndex].slots.filter(s => s.id !== slot.id) };
            }
            const toIndex = newData.findIndex(d => d.auditoriumId === toAuditoriumId);
            if (toIndex >= 0) {
                newData[toIndex] = { ...newData[toIndex], slots: [...newData[toIndex].slots, updatedSlot] };
            } else {
                newData.push({ auditoriumId: toAuditoriumId, slots: [updatedSlot] });
            }
            return { ...prev, data: newData };
        });
    };

    const handleSaveSchedule = async () => {
        if (!selectedAuditoriumId) return;
        const allSlots = scheduleData.data.find(d => d.auditoriumId === selectedAuditoriumId)?.slots || [];
        
        // Filter: ONLY new slots OR dirty (moved/updated) slots
        const slotsToSave = allSlots.filter(s => s.id.startsWith('new-') || s.isDirty);
        
        if (slotsToSave.length === 0) {
            toast("Không có thay đổi nào để lưu.");
            return;
        }

        setSaving(true);
        try {
            const payload = {
                auditoriumId: selectedAuditoriumId,
                slots: slotsToSave.map(s => {
                    return {
                        scheduleId: s.id.startsWith('new-') ? "00000000-0000-0000-0000-000000000000" : s.id,
                        movieId: s.movieId,
                        formatId: s.formatId,
                        startedDate: s.start
                    };
                })
            };

            await scheduleApi.createSchedule(payload);
            toast.success('Schedule saved successfully!');
        } catch (error: any) {
            console.error("Save schedule error", error);
            const msg = error.response?.data?.message || "";
            if (msg.includes("15 phút") || msg.includes("trùng lịch") || error.response?.data?.errorCode === 'E02') {
                toast.error("Vui lòng để trống 15 phút giữa các suất chiếu để dọn dẹp phòng rạp.");
            } else {
                toast.error(msg || "Failed to save schedule");
            }
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800/60">
                <div className="flex flex-col items-center">
                    <Loader2 className="w-8 h-8 animate-spin text-red-600 mb-4" />
                    <p className="text-slate-500 font-medium">Loading Schedules Data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`flex flex-col text-slate-900 dark:text-slate-100 overflow-hidden transition-colors duration-300 ${embedded ? 'flex-1 h-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 shadow-md' : 'h-screen bg-slate-50 dark:bg-slate-900'}`}>
            {/* Header - shrink-0 so it never collapses */}
            <header className="h-14 sm:h-16 flex items-center justify-between px-3 sm:px-6 z-30 transition-colors duration-300 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm w-full shrink-0">
                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                    <button
                        className="md:hidden p-2 text-slate-600 dark:text-white font-medium hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    >
                        {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                    <div className="p-1.5 bg-red-600 rounded-lg hidden sm:block">
                        <Calendar className="text-white w-5 h-5" />
                    </div>
                    <h1 className="text-sm sm:text-xl font-bold bg-gradient-to-r from-red-600 to-red-800 bg-clip-text text-transparent hidden sm:block whitespace-nowrap">
                        {t('scheduleManager.title')}
                    </h1>
                </div>

                <div className="flex items-center pl-2 gap-2 sm:gap-3 shrink-0">
                    <div className="flex items-center bg-slate-100 dark:bg-slate-700 rounded-lg p-1 sm:mr-2">
                        <select
                            className="bg-transparent border-none text-xs sm:text-sm font-bold focus:ring-0 text-slate-700 dark:text-white/90 py-1 pl-2 pr-6 sm:pr-8 cursor-pointer max-w-[160px] sm:max-w-none"
                            value={selectedAuditoriumId}
                            onChange={(e) => setSelectedAuditoriumId(e.target.value)}
                        >
                            {auditoriumsList.map(aud => {
                                const formatNames = aud.supportedFormats.map(f => f.name).filter(Boolean).join(', ');
                                return (
                                    <option key={aud.id} value={aud.id} className="text-slate-900 bg-white dark:text-white/90 dark:bg-slate-700">
                                        Auditorium {aud.name}{formatNames ? ` (${formatNames})` : ''}
                                    </option>
                                );
                            })}
                        </select>
                    </div>

                    <div className="hidden lg:block h-6 w-px bg-slate-300 dark:bg-slate-600 mx-1"></div>
                    <button
                        className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs sm:text-sm font-bold rounded-lg shadow-lg shadow-red-500/30 transition-all shrink-0"
                        onClick={handleSaveSchedule}
                        disabled={saving}
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        <span className="hidden sm:inline">{t('scheduleManager.save')}</span>
                    </button>
                </div>
            </header>

            {/* Body: sidebar + timeline, flex-1 fills remaining height */}
            <div
                className="flex flex-1 min-h-0 relative"
                onDragEnd={() => setDraggingMovie(null)}
            >
                {/* Mobile overlay */}
                {isSidebarOpen && (
                    <div
                        className="absolute inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm"
                        onClick={() => setIsSidebarOpen(false)}
                    />
                )}

                {/* Movie Sidebar - fixed height, does NOT scroll with timeline */}
                <aside className={`absolute inset-y-0 left-0 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 z-40 w-64 sm:w-72 md:w-72 lg:w-80 flex flex-col shrink-0 transition-transform duration-300 ease-in-out bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 shadow-2xl md:shadow-xl`}>
                    <div className="p-3 sm:p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between shrink-0">
                        <h2 className="font-bold text-slate-700 dark:text-white/90 flex items-center gap-2 text-sm">
                            <Film className="w-4 h-4 text-red-500" />
                            {t('scheduleManager.dragMoviesTitle')}
                        </h2>
                        {isSidebarOpen && (
                            <button className="md:hidden text-white/60 hover:text-red-500 hover:drop-shadow-[0_0_4px_rgba(239,68,68,0.4)]" onClick={() => setIsSidebarOpen(false)}>
                                <X className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                    <div className="p-3 shrink-0">
                        <input
                            type="text"
                            placeholder={t('scheduleManager.search')}
                            className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-900 border-none rounded-md text-sm ring-2 ring-transparent focus:ring-red-500 transition-all text-slate-800 dark:text-white/90"
                        />
                    </div>

                    <div className="flex-1 overflow-y-auto p-3 sm:p-4 custom-scrollbar min-h-0">
                        {moviesList.length === 0 && (
                            <div className="text-center text-sm text-slate-500 p-4">No movies available</div>
                        )}
                        {moviesList.map(movie => (
                            <DraggableMovie
                                key={movie.id}
                                movie={movie}
                                onDragStart={() => setDraggingMovie(movie)}
                                onDragEnd={() => setDraggingMovie(null)}
                                onManualAdd={setManualAddMovie}
                            />
                        ))}
                    </div>

                    <div className="p-3 border-t text-xs text-slate-500 text-center transition-colors duration-300 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 shrink-0">
                        {t('scheduleManager.dragMoviesDesc')}
                    </div>
                </aside>

                {/* Timeline Grid - this is the only area that scrolls */}
                <main className="flex-1 overflow-hidden relative flex flex-col min-w-0">
                    <TimelineGrid
                        auditoriums={filteredAuditoriums}
                        scheduleData={scheduleData}
                        selectedDate={selectedDate}
                        movies={moviesList}
                        draggingMovie={draggingMovie}
                        onAddSlot={handleAddSlot}
                        onUpdateSlot={handleUpdateSlot}
                        onMoveSlot={handleMoveSlot}
                    />
                    <TrashCan onDeleteSlot={handleDeleteSlot} />
                </main>
            </div>

            {/* Manual Add Form Modal */}
            {manualAddMovie && activeAuditorium && (
                <ManualAddModal
                    movie={manualAddMovie}
                    auditorium={activeAuditorium}
                    scheduleSlots={scheduleData.data.find(d => d.auditoriumId === selectedAuditoriumId)?.slots || []}
                    selectedDate={selectedDate}
                    onClose={() => setManualAddMovie(null)}
                    onAdd={(newSlot) => handleAddSlot(selectedAuditoriumId, newSlot)}
                />
            )}
        </div>
    );
};

export default ScheduleManagerPage;
