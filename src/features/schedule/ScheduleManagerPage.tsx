import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import TimelineGrid from './components/TimelineGrid';
import DraggableMovie from './components/DraggableMovie';
import type { Movie as ScheduleMovie, ScheduleData, ShowTimeSlot, Auditorium as ScheduleAuditorium } from './types';
import { Save, Loader2, Search, ChevronLeft, ChevronRight, Calendar, Film } from 'lucide-react';
import { showSuccess, showError } from '../../utils/ToastUtils';
import TrashCan from './components/TrashCan';
import ManualAddModal from './components/ManualAddModal';
import { scheduleApi } from '../../api/scheduleApi';
import { toVietnamDateTimeLocalValue, vietnamDateTimeLocalToOffsetString } from '../../utils/dateTimeUtils';
import { useCinema } from '../../contexts/CinemaContext';
import AppSidebar from '../../components/AppSidebar';
import type { SidebarSection } from '../../components/AppSidebar';
import Header from '../../components/Header';

const colorPalette = ['#ff8a00', '#2563eb', '#16a34a', '#d97706', '#9333ea', '#0891b2', '#ea580c'];

interface ScheduleManagerPageProps {
  isEmbedded?: boolean;
}

const ScheduleManagerPage: React.FC<ScheduleManagerPageProps> = ({ isEmbedded = false }) => {
    const { t } = useTranslation();
    const { activeCinemaId } = useCinema();
    const [scheduleData, setScheduleData] = useState<ScheduleData>({ cinemaId: 'default', data: [] });
    const [draggingMovie, setDraggingMovie] = useState<ScheduleMovie | null>(null);
    const [manualAddMovie, setManualAddMovie] = useState<ScheduleMovie | null>(null);
    const [selectedAuditoriumId, setSelectedAuditoriumId] = useState<string>('');
    const [selectedDate] = useState<Date>(new Date());

    const [moviesList, setMoviesList] = useState<ScheduleMovie[]>([]);
    const [auditoriumsList, setAuditoriumsList] = useState<ScheduleAuditorium[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // App layout sidebar tabs
    const [activeTab, setActiveTab] = useState('schedule');
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Calendar week state
    const today = new Date();
    const [weekStart, setWeekStart] = useState(() => {
      const d = new Date(today);
      d.setDate(d.getDate() - d.getDay() + 1);
      return d;
    });

    const sidebarSections: SidebarSection[] = [
      {
        label: t('Management'),
        items: [
          { id: 'schedule', label: t('Schedules'), icon: <Calendar size={18} /> },
          { id: 'movies', label: t('Movies'), icon: <Film size={18} /> },
        ],
      },
    ];

    const handleTabChange = (tab: string) => {
      setActiveTab(tab);
      if (tab === 'movies') {
        window.location.href = '/movie-manager';
      }
    };

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
        if (!activeCinemaId) { setLoading(false); return; }
        setLoading(true);
        try {
            const [moviesRes, audsRes] = await Promise.all([
                scheduleApi.getMoviesWithFormats(activeCinemaId),
                scheduleApi.getMyAuditoriums(activeCinemaId)
            ]);
            const moviesMap = new Map<string, ScheduleMovie>();
            let colorIndex = 0;
            (moviesRes.data || []).forEach(m => {
                if (!moviesMap.has(m.movieId)) {
                    moviesMap.set(m.movieId, {
                        id: m.movieId,
                        title: m.movieName,
                        durationMinutes: 120,
                        formats: [],
                        color: colorPalette[colorIndex % colorPalette.length]
                    });
                    colorIndex++;
                }
                const movie = moviesMap.get(m.movieId)!;
                if (!movie.formats.find(f => f.id === m.formatId)) {
                    movie.formats.push({ id: m.formatId, name: m.formatName });
                }
            });
            const mappedMovies = Array.from(moviesMap.values());
            const mappedAuds: ScheduleAuditorium[] = (audsRes.data?.auditoriums || []).map((a: any) => {
                const formatsFromApi = a.formats || a.formatInfos || [];
                const supportedFormats = (Array.isArray(formatsFromApi) ? formatsFromApi : [])
                    .map((f: any) => ({ id: f.formatId || f.id || '', name: f.formatName || f.name || '' }))
                    .filter((f: any) => f.id);
                return { id: a.auditoriumId, name: a.auditoriumNumber.toString(), supportedFormats };
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
            showError(t('toast.loadDepsFailed'));
        } finally { setLoading(false); }
    };

    const activeAuditorium = auditoriumsList.find(a => a.id === selectedAuditoriumId);
    const filteredAuditoriums = activeAuditorium ? [activeAuditorium] : [];

    const handleAddSlot = (auditoriumId: string, slot: ShowTimeSlot) => {
        setScheduleData(prev => {
            const newData = [...prev.data];
            const audIndex = newData.findIndex(d => d.auditoriumId === auditoriumId);
            if (audIndex >= 0) newData[audIndex] = { ...newData[audIndex], slots: [...newData[audIndex].slots, slot] };
            else newData.push({ auditoriumId, slots: [slot] });
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
                showSuccess(t('toast.deleteScheduleSuccess'));
            }
        } catch (error: any) {
            if (error.response?.status !== 404) {
                const msg = error.response?.data?.message || 'Lỗi khi xóa lịch chiếu.';
                showError(msg);
            }
        } finally {
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
            if (fromIndex >= 0) newData[fromIndex] = { ...newData[fromIndex], slots: newData[fromIndex].slots.filter(s => s.id !== slot.id) };
            const toIndex = newData.findIndex(d => d.auditoriumId === toAuditoriumId);
            if (toIndex >= 0) newData[toIndex] = { ...newData[toIndex], slots: [...newData[toIndex].slots, updatedSlot] };
            else newData.push({ auditoriumId: toAuditoriumId, slots: [updatedSlot] });
            return { ...prev, data: newData };
        });
    };

    const handleSaveSchedule = async () => {
        if (!selectedAuditoriumId) return;
        const allSlots = scheduleData.data.find(d => d.auditoriumId === selectedAuditoriumId)?.slots || [];
        const slotsToSave = allSlots.filter(s => s.id.startsWith('new-') || s.isDirty);
        if (slotsToSave.length === 0) { showError(t('toast.noChanges')); return; }
        setSaving(true);
        try {
            const payload = {
                auditoriumId: selectedAuditoriumId,
                slots: slotsToSave.map(s => ({
                    scheduleId: s.id.startsWith('new-') ? "00000000-0000-0000-0000-000000000000" : s.id,
                    movieId: s.movieId,
                    formatId: s.formatId,
                    startedDate: vietnamDateTimeLocalToOffsetString(toVietnamDateTimeLocalValue(s.start)) ?? s.start
                }))
            };
            await scheduleApi.createSchedule(payload);
            showSuccess(t('toast.scheduleSaved'));
        } catch (error: any) {
            const msg = error.response?.data?.message || "";
            if (msg.includes("15 phút") || msg.includes("trùng lịch") || error.response?.data?.errorCode === 'E02') {
                showError(t('toast.schedule15minGapToast'));
            } else showError(msg || t('toast.scheduleSaveFailed'));
        } finally { setSaving(false); }
    };

    // Navigate week
    const goPrevWeek = () => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() - 7);
      setWeekStart(d);
    };
    const goNextWeek = () => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + 7);
      setWeekStart(d);
    };
    const goToday = () => {
      const d = new Date();
      d.setDate(d.getDate() - d.getDay() + 1);
      setWeekStart(d);
    };

    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      return d;
    });

    const weekLabel = `${weekDays[0].toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} — ${weekDays[6].toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;

    const filteredMovies = moviesList.filter(m =>
      !searchQuery || m.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        if (isEmbedded) {
            return (
                <div className="state-center" style={{ minHeight: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <Loader2 size={32} style={{ color: 'var(--accent)', animation: 'spin 1s linear infinite' }} />
                    <p style={{ fontSize: 14, color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace", marginTop: 12 }}>Loading Schedules Data...</p>
                </div>
            );
        }
        return (
            <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-base)' }}>
              <Header title={t('Schedule Manager')} role="Schedule Manager" />
              <main className="main-content">
                <div className="page-container">
                  <div className="state-center" style={{ minHeight: '60vh' }}>
                      <Loader2 size={32} style={{ color: 'var(--accent)', animation: 'spin 1s linear infinite' }} />
                      <p style={{ fontSize: 14, color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>Loading Schedules Data...</p>
                  </div>
                </div>
              </main>
            </div>
        );
    }

    const renderWorkspace = () => {
        return (
            <>
              {/* Page Title + Controls */}
              <div style={{
                padding: '20px 24px', background: 'var(--bg-surface)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                borderBottom: '1px solid var(--border-color)', flexShrink: 0,
              }}>
                <div>
                  <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px' }}>
                    Movie Scheduler
                  </h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {/* Auditorium Selector */}
                    <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 12px' }}>
                      <span style={{ color: 'var(--accent)', fontSize: 16, lineHeight: 1 }}>🎬</span>
                      <select
                        value={selectedAuditoriumId}
                        onChange={(e) => setSelectedAuditoriumId(e.target.value)}
                        style={{
                          background: 'transparent', border: 'none', color: 'var(--text-primary)',
                          fontSize: 12, fontFamily: "'JetBrains Mono', monospace",
                          padding: '4px 16px 4px 0', outline: 'none', cursor: 'pointer',
                        }}
                      >
                        {auditoriumsList.map(aud => {
                          const formatNames = aud.supportedFormats.map(f => f.name).filter(Boolean).join(', ');
                          return (
                            <option key={aud.id} value={aud.id} style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)' }}>
                              Auditorium {aud.name}{formatNames ? ` (${formatNames})` : ''}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                    {/* Date Navigation */}
                    <div className="glass-card" style={{ display: 'flex', alignItems: 'center', padding: 4 }}>
                      <button onClick={goPrevWeek} className="btn-ghost" style={{ padding: 6 }}>
                        <ChevronLeft size={16} />
                      </button>
                      <span style={{ padding: '4px 12px', fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                        {weekLabel}
                      </span>
                      <button onClick={goNextWeek} className="btn-ghost" style={{ padding: 6 }}>
                        <ChevronRight size={16} />
                      </button>
                    </div>
                    <button onClick={goToday} className="btn-ghost" style={{
                      padding: '6px 12px', fontSize: 11, fontFamily: "'JetBrains Mono', monospace",
                    }}>
                      Today
                    </button>
                  </div>
                </div>
                {/* Save Button */}
                <button
                  onClick={handleSaveSchedule}
                  disabled={saving}
                  className="btn btn-primary"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '10px 20px', fontWeight: 700, fontSize: 12,
                    fontFamily: "'JetBrains Mono', monospace",
                    opacity: saving ? 0.6 : 1,
                  }}
                >
                  {saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={16} />}
                  Save Changes
                </button>
              </div>

              {/* Main Workspace */}
              <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
                {/* == Movie Drawer == */}
                <aside style={{
                  width: 300, background: 'var(--bg-surface)',
                  borderRight: '1px solid var(--border-color)', flexShrink: 0,
                  display: 'flex', flexDirection: 'column', padding: 16, gap: 16,
                  overflow: 'hidden',
                }}>
                  <div>
                    <h4 style={{
                      fontSize: 11, color: 'var(--text-secondary)', fontFamily: "'JetBrains Mono', monospace",
                      letterSpacing: '0.05em', textTransform: 'uppercase', margin: '0 0 8px 0',
                    }}>Drag Movies</h4>
                    <div style={{ position: 'relative' }}>
                      <Search size={14} style={{
                        position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
                        color: 'var(--text-muted)',
                      }} />
                      <input
                        type="text"
                        placeholder="Filter films..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="input"
                        style={{ width: '100%', paddingLeft: 32, fontSize: 12, padding: '8px 10px 8px 32px' }}
                      />
                    </div>
                  </div>

                  <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {filteredMovies.length === 0 && (
                      <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)', fontSize: 12 }}>
                        {searchQuery ? 'No movies match your search.' : 'No movies available'}
                      </div>
                    )}
                    {filteredMovies.map(movie => (
                      <DraggableMovie
                        key={movie.id}
                        movie={movie}
                        onDragStart={() => setDraggingMovie(movie)}
                        onDragEnd={() => setDraggingMovie(null)}
                        onManualAdd={setManualAddMovie}
                      />
                    ))}

                    <div style={{ marginTop: 'auto', paddingTop: 24, textAlign: 'center' }}>
                      <p style={{ fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                        Drag movies from this list and drop them into a time slot on the calendar grid.
                      </p>
                    </div>
                  </div>
                </aside>

                {/* == Calendar Content == */}
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
              </div>

              {/* Manual Add Modal */}
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

              {/* TrashCan */}
              <TrashCan onDeleteSlot={handleDeleteSlot} />
            </>
        );
    };

    if (isEmbedded) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                {renderWorkspace()}
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', flexDirection: 'column' }}>
            <AppSidebar
                isOpen={sidebarOpen}
                onToggle={() => setSidebarOpen(!sidebarOpen)}
                activeTab={activeTab}
                onTabChange={handleTabChange}
                sections={sidebarSections}
                role="Schedule Manager"
            />

            <Header
                title={t('Schedule Manager')}
                role="Schedule Manager"
                showSidebarToggle
                onMenuToggle={() => setSidebarOpen(true)}
            />

            <main className="main-content" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {renderWorkspace()}
            </main>
        </div>
    );
};

export default ScheduleManagerPage;
