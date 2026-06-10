import React, { useState, useEffect } from 'react';
import TimelineGrid from './components/TimelineGrid';
import DraggableMovie from './components/DraggableMovie';
import type { Movie as ScheduleMovie, ScheduleData, ShowTimeSlot, Auditorium as ScheduleAuditorium } from './types';
import { Save, Menu, X, Loader2, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { showSuccess, showError } from '../../utils/ToastUtils';
import { useTranslation } from 'react-i18next';
import TrashCan from './components/TrashCan';
import ManualAddModal from './components/ManualAddModal';
import { scheduleApi } from '../../api/scheduleApi';
import { toVietnamDateTimeLocalValue, vietnamDateTimeLocalToOffsetString } from '../../utils/dateTimeUtils';
import { useCinema } from '../../contexts/CinemaContext';

interface ScheduleManagerPageProps {
    embedded?: boolean;
}

const colorPalette = ['#ff8a00', '#2563eb', '#16a34a', '#d97706', '#9333ea', '#0891b2', '#ea580c'];

// Theme colors matching the admin design
const C = {
  bg: '#051424',
  surface: '#122131',
  surfaceLow: '#0d1c2d',
  surfaceHigh: '#1c2b3c',
  surfaceHighest: '#273647',
  border: '#564334',
  text: '#d4e4fa',
  textMuted: '#ddc1ae',
  textVariant: '#ddc1ae',
  primary: '#ffb77f',
  primaryContainer: '#ff8a00',
  error: '#ffb4ab',
  success: '#10B981',
  tertiary: '#c8c5cb',
  outline: '#a58c7b',
};

const ScheduleManagerPage: React.FC<ScheduleManagerPageProps> = ({ embedded = false }) => {
    const { t } = useTranslation();
    const { activeCinemaId } = useCinema();
    const [scheduleData, setScheduleData] = useState<ScheduleData>({ cinemaId: 'default', data: [] });
    const [draggingMovie, setDraggingMovie] = useState<ScheduleMovie | null>(null);
    const [manualAddMovie, setManualAddMovie] = useState<ScheduleMovie | null>(null);
    const [selectedAuditoriumId, setSelectedAuditoriumId] = useState<string>('');
    const [selectedDate] = useState<Date>(new Date());
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const [moviesList, setMoviesList] = useState<ScheduleMovie[]>([]);
    const [auditoriumsList, setAuditoriumsList] = useState<ScheduleAuditorium[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Calendar week state
    const today = new Date();
    const [weekStart, setWeekStart] = useState(() => {
      const d = new Date(today);
      d.setDate(d.getDate() - d.getDay() + 1);
      return d;
    });

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

    const isToday = (date: Date) => {
      const t = new Date();
      return date.getDate() === t.getDate() && date.getMonth() === t.getMonth() && date.getFullYear() === t.getFullYear();
    };
    const isActiveDay = (date: Date) => {
      const t = selectedDate;
      return date.getDate() === t.getDate() && date.getMonth() === t.getMonth() && date.getFullYear() === t.getFullYear();
    };

    const weekLabel = `${weekDays[0].toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} — ${weekDays[6].toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;

    const filteredMovies = moviesList.filter(m =>
      !searchQuery || m.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Time slots from 08:00 to 00:00 (16 hours = 16 slots * 48px each)
    const timeSlots: string[] = [];
    for (let h = 8; h <= 23; h++) timeSlots.push(`${h.toString().padStart(2, '0')}:00`);

    // Current time indicator position
    const now = new Date();
    const minutesSince8 = (now.getHours() - 8) * 60 + now.getMinutes();
    const currentTimeTop = Math.max(0, minutesSince8 * 0.8); // 48px/h / 60min/h

    const DAY_NAMES = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', backgroundColor: C.bg, color: C.text, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                    <Loader2 size={32} style={{ color: C.primary, animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
                    <p style={{ fontSize: 14, color: C.textVariant }}>Loading Schedules Data...</p>
                </div>
            </div>
        );
    }

    return (
        <div style={{
          minHeight: embedded ? '100%' : '100vh',
          backgroundColor: C.bg,
          color: C.text,
          display: 'flex', flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden',
          fontFamily: "'Inter', sans-serif",
        }}>
          {/* Inline Styles */}
          <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Manrope:wght@600;700;800&display=swap');
            .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; vertical-align: middle; }
            ::-webkit-scrollbar { width: 6px; height: 6px; }
            ::-webkit-scrollbar-track { background: transparent; }
            ::-webkit-scrollbar-thumb { background: #273647; border-radius: 10px; }
            ::-webkit-scrollbar-thumb:hover { background: #ffb77f; }
            .movie-card-glow:hover { box-shadow: 0 0 15px rgba(255, 138, 0, 0.2); }
            @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          `}</style>

          {/* ======= TOP NAV ======= */}
          <header style={{
            height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 24px', backgroundColor: C.surface, borderBottom: `1px solid ${C.border}`,
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 24, flex: 1 }}>
              {embedded && (
                <button onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  style={{ background: 'none', border: 'none', color: C.textVariant, cursor: 'pointer', padding: 4 }}>
                  {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
              )}
              <h2 style={{
                fontFamily: "'Manrope', sans-serif", fontSize: 20, fontWeight: 700, color: C.text, margin: 0,
              }}>Command Center</h2>
              <div style={{ position: 'relative', width: 384, maxWidth: '100%' }}>
                <Search size={16} style={{
                  position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                  color: C.textVariant, pointerEvents: 'none',
                }} />
                <input
                  type="text"
                  placeholder="Search movies, schedules, or users..."
                  style={{
                    width: '100%', backgroundColor: C.surfaceLow, border: 'none', borderRadius: 9999,
                    padding: '8px 16px 8px 36px', color: C.text, fontSize: 12, outline: 'none',
                  }}
                  onFocus={e => { e.currentTarget.style.boxShadow = `0 0 0 1px ${C.primary}`; }}
                  onBlur={e => { e.currentTarget.style.boxShadow = 'none'; }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              {/* Notification */}
              <button style={{
                width: 40, height: 40, borderRadius: '50%', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                backgroundColor: 'transparent', color: C.textVariant, position: 'relative',
                transition: 'all 0.2s ease',
              }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = `${C.surfaceHighest}80`; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <span className="material-symbols-outlined">notifications</span>
                <span style={{ position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: '50%', backgroundColor: C.primary }} />
              </button>
              {/* Theme toggle */}
              <button style={{
                width: 40, height: 40, borderRadius: '50%', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                backgroundColor: 'transparent', color: C.textVariant,
                transition: 'all 0.2s ease',
              }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = `${C.surfaceHighest}80`; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <span className="material-symbols-outlined">contrast</span>
              </button>
              <div style={{ width: 1, height: 32, backgroundColor: C.border, margin: '0 8px' }} />
              <button style={{
                display: 'flex', alignItems: 'center', gap: 8, border: 'none', cursor: 'pointer',
                padding: '6px 12px', borderRadius: 9999,
                backgroundColor: 'transparent', color: C.textVariant,
                transition: 'all 0.2s ease',
              }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = `${C.surfaceHighest}80`; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.03em' }}>Account Settings</span>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>expand_more</span>
              </button>
            </div>
          </header>

          {/* ======= PAGE TITLE + CONTROLS ======= */}
          <div style={{
            padding: '24px', backgroundColor: C.surface,
            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
            borderBottom: `1px solid ${C.border}`, flexShrink: 0,
          }}>
            <div>
              <h3 style={{
                fontFamily: "'Manrope', sans-serif", fontSize: 28, fontWeight: 700,
                color: C.text, margin: '0 0 8px',
              }}>Movie Scheduler</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                {/* Auditorium Selector */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  backgroundColor: C.surfaceHigh, padding: '6px 16px', borderRadius: 8,
                  border: `1px solid ${C.border}`,
                }}>
                  <span className="material-symbols-outlined" style={{ color: C.primary, fontSize: 18 }}>theater_comedy</span>
                  <select
                    value={selectedAuditoriumId}
                    onChange={(e) => setSelectedAuditoriumId(e.target.value)}
                    style={{
                      backgroundColor: 'transparent', border: 'none', color: C.text,
                      fontSize: 12, fontFamily: "'JetBrains Mono', monospace",
                      padding: '4px 20px 4px 0', outline: 'none', cursor: 'pointer',
                    }}
                  >
                    {auditoriumsList.map(aud => {
                      const formatNames = aud.supportedFormats.map(f => f.name).filter(Boolean).join(', ');
                      return (
                        <option key={aud.id} value={aud.id} style={{ backgroundColor: C.surfaceHigh, color: C.text }}>
                          Auditorium {aud.name}{formatNames ? ` (${formatNames})` : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>
                {/* Date Navigation */}
                <div style={{
                  display: 'flex', alignItems: 'center',
                  backgroundColor: C.surfaceHigh, borderRadius: 8, padding: 4,
                  border: `1px solid ${C.border}`,
                }}>
                  <button onClick={goPrevWeek}
                    style={{ padding: 6, background: 'none', border: 'none', color: C.textVariant, cursor: 'pointer', borderRadius: 4, display: 'flex', alignItems: 'center' }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = C.surfaceHighest; }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span style={{ padding: '4px 16px', fontSize: 12, fontFamily: "'JetBrains Mono', monospace", color: C.text }}>
                    {weekLabel}
                  </span>
                  <button onClick={goNextWeek}
                    style={{ padding: 6, background: 'none', border: 'none', color: C.textVariant, cursor: 'pointer', borderRadius: 4, display: 'flex', alignItems: 'center' }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = C.surfaceHighest; }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
                <button onClick={goToday}
                  style={{
                    padding: '8px 16px', backgroundColor: C.surfaceHigh, border: `1px solid ${C.border}`,
                    color: C.text, borderRadius: 8, cursor: 'pointer',
                    fontSize: 12, fontFamily: "'JetBrains Mono', monospace",
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = C.surfaceHighest; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = C.surfaceHigh; }}
                >
                  Today
                </button>
              </div>
            </div>
            {/* Save Button */}
            <button
              onClick={handleSaveSchedule}
              disabled={saving}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '12px 24px', backgroundColor: C.primaryContainer,
                border: 'none', borderRadius: 8, color: '#2f1500',
                fontWeight: 700, fontSize: 12, fontFamily: "'JetBrains Mono', monospace",
                cursor: 'pointer', opacity: saving ? 0.6 : 1,
                boxShadow: `0 4px 16px ${C.primaryContainer}1a`,
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => { if (!saving) e.currentTarget.style.filter = 'brightness(1.1)'; }}
              onMouseLeave={e => { if (!saving) e.currentTarget.style.filter = 'brightness(1)'; }}
              onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.95)'; }}
              onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              {saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={16} />}
              Save Changes
            </button>
          </div>

          {/* ======= MAIN WORKSPACE ======= */}
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
            {/* ===== SIDEBAR: DRAG MOVIES ===== */}
            <aside style={{
              width: 320, backgroundColor: C.surfaceLow,
              borderRight: `1px solid ${C.border}`, flexShrink: 0,
              display: 'flex', flexDirection: 'column', padding: 16,
              transform: embedded && !isSidebarOpen ? 'translateX(-100%)' : 'translateX(0)',
              position: embedded ? 'absolute' : 'relative',
              zIndex: embedded ? 40 : 'auto',
              height: '100%',
              transition: 'transform 0.3s ease',
            }}>
              <div style={{ marginBottom: 24 }}>
                <h4 style={{
                  fontSize: 12, color: C.textVariant, fontFamily: "'JetBrains Mono', monospace",
                  letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 16, margin: '0 0 12px 0',
                }}>Drag Movies</h4>
                <div style={{ position: 'relative' }}>
                  <Search size={14} style={{
                    position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                    color: `${C.textVariant}66`,
                  }} />
                  <input
                    type="text"
                    placeholder="Filter films..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    style={{
                      width: '100%', backgroundColor: C.surfaceHigh,
                      border: `1px solid ${C.border}`, borderRadius: 8,
                      padding: '10px 12px 10px 36px', color: C.text, fontSize: 12,
                      outline: 'none', fontFamily: "'Inter', sans-serif",
                    }}
                    onFocus={e => { e.currentTarget.style.boxShadow = `0 0 0 1px ${C.primary}`; }}
                    onBlur={e => { e.currentTarget.style.boxShadow = 'none'; }}
                  />
                </div>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
                {filteredMovies.length === 0 && (
                  <div style={{ textAlign: 'center', padding: 24, color: C.textVariant, fontSize: 12 }}>
                    {searchQuery ? 'No movies match your search.' : 'No movies available'}
                  </div>
                )}
                {filteredMovies.map(movie => {
                  return (
                    <DraggableMovie
                      key={movie.id}
                      movie={movie}
                      onDragStart={() => setDraggingMovie(movie)}
                      onDragEnd={() => setDraggingMovie(null)}
                      onManualAdd={setManualAddMovie}
                    />
                  );
                })}

                {/* Drag hint */}
                <div style={{ marginTop: 'auto', paddingTop: 32, textAlign: 'center' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 32, color: C.border, opacity: 0.5 }}>drag_indicator</span>
                  <p style={{ fontSize: 11, color: C.textVariant, lineHeight: 1.6 }}>
                    Drag movies from this list and drop them into a time slot on the calendar grid.
                  </p>
                </div>
              </div>
            </aside>

            {/* ===== CALENDAR CONTENT ===== */}
            <main style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              backgroundColor: `${C.surfaceLow}4D`, overflow: 'hidden',
            }}>
              {/* Calendar Header (Days) */}
              <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
                {/* Time gutter */}
                <div style={{
                  width: 80, borderRight: `1px solid ${C.border}`,
                  backgroundColor: C.surface,
                  display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '8px 0',
                }}>
                  <span style={{ fontSize: 11, color: `${C.textVariant}66`, fontFamily: "'JetBrains Mono', monospace" }}>GMT+7</span>
                </div>
                {/* Day columns */}
                {weekDays.map((day, idx) => {
                  const active = isActiveDay(day);
                  const todayFlag = isToday(day);
                  return (
                    <div key={idx} style={{
                      flex: 1, padding: '16px 0', textAlign: 'center',
                      borderRight: idx < 6 ? `1px solid ${C.border}4D` : 'none',
                      backgroundColor: active ? `${C.primary}0D` : 'transparent',
                      position: 'relative',
                    }}>
                      {todayFlag && <span style={{ position: 'absolute', top: 8, right: 8, display: 'flex', width: 8, height: 8 }}>
                        <span style={{ position: 'absolute', width: '100%', height: '100%', borderRadius: '50%', backgroundColor: C.primary, opacity: 0.75, animation: 'pulse 2s infinite' }} />
                        <span style={{ position: 'relative', width: 8, height: 8, borderRadius: '50%', backgroundColor: C.primary }} />
                      </span>}
                      <p style={{
                        margin: '0 0 4px', fontSize: 11, color: active ? C.primary : C.textVariant,
                        fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.03em',
                      }}>
                        {DAY_NAMES[idx]}
                      </p>
                      <p style={{
                        margin: 0, fontSize: 20, fontWeight: 700, fontFamily: "'Manrope', sans-serif",
                        color: active ? C.primary : C.text,
                      }}>
                        {day.getDate()}
                      </p>
                      {active && <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 4, backgroundColor: C.primary }} />}
                    </div>
                  );
                })}
              </div>

              {/* Calendar Body (Scrollable) */}
              <div style={{ flex: 1, overflowY: 'auto', position: 'relative' }}>
                <div style={{ display: 'flex', minHeight: `${timeSlots.length * 48}px`, position: 'relative' }}>
                  {/* Time Indicators */}
                  <div style={{
                    width: 80, borderRight: `1px solid ${C.border}`,
                    backgroundColor: C.surface, flexShrink: 0,
                  }}>
                    {timeSlots.map((time, idx) => {
                      const isPeak = idx >= 5 && idx <= 8; // 13:00-16:00 peak
                      return (
                        <div key={idx} style={{
                          height: 48, borderBottom: `1px solid ${C.border}33`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <span style={{
                            fontSize: 11, color: isPeak ? C.primary : C.textVariant,
                            fontFamily: "'JetBrains Mono', monospace", fontWeight: isPeak ? 700 : 400,
                          }}>
                            {time}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Grid Columns */}
                  <div style={{ flex: 1, display: 'grid', gridTemplateColumns: `repeat(7, 1fr)`, position: 'relative' }}>
                    {weekDays.map((_, idx) => (
                      <div key={idx} style={{
                        borderRight: idx < 6 ? `1px solid ${C.border}33` : 'none',
                        position: 'relative',
                        backgroundImage: `
                          linear-gradient(to right, rgba(86, 67, 52, 0.2) 1px, transparent 1px),
                          linear-gradient(to bottom, rgba(86, 67, 52, 0.2) 1px, transparent 1px)
                        `,
                        backgroundSize: '100% 48px',
                      }}>
                        {/* Current time indicator on today column */}
                        {isToday(weekDays[idx]) && (
                          <div style={{
                            position: 'absolute', left: 0, right: 0,
                            top: currentTimeTop, height: 2,
                            backgroundColor: C.primary, zIndex: 20, pointerEvents: 'none',
                          }}>
                            <div style={{
                              position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
                              width: 8, height: 8, borderRadius: '50%', backgroundColor: C.primary,
                            }} />
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Scheduled Blocks - Rendered by TimelineGrid */}
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
                </div>
              </div>

              {/* Floating Action Buttons */}
              <div style={{ position: 'absolute', bottom: 24, right: 24, display: 'flex', flexDirection: 'column', gap: 12, zIndex: 30 }}>
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  backgroundColor: `${C.surfaceHigh}E6`,
                  backdropFilter: 'blur(16px)',
                  border: `1px solid ${C.border}`, borderRadius: '50%',
                  padding: 8,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                }}>
                  <button style={{
                    width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'none', border: 'none', color: C.text, cursor: 'pointer', borderRadius: '50%',
                    transition: 'all 0.2s ease',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = `${C.primaryContainer}33`; }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    <span className="material-symbols-outlined">add</span>
                  </button>
                  <div style={{ width: 24, height: 1, backgroundColor: C.border, margin: '4px 0' }} />
                  <button style={{
                    width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'none', border: 'none', color: C.text, cursor: 'pointer', borderRadius: '50%',
                    transition: 'all 0.2s ease',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = `${C.primaryContainer}33`; }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    <span className="material-symbols-outlined">zoom_in</span>
                  </button>
                  <button style={{
                    width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'none', border: 'none', color: C.text, cursor: 'pointer', borderRadius: '50%',
                    transition: 'all 0.2s ease',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = `${C.primaryContainer}33`; }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    <span className="material-symbols-outlined">zoom_out</span>
                  </button>
                </div>
                <button style={{
                  width: 56, height: 56, borderRadius: '50%',
                  backgroundColor: `${C.error}33`, border: `1px solid ${C.error}80`,
                  color: C.error, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                  transition: 'all 0.2s ease',
                }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = `${C.error}66`; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = `${C.error}33`; }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 28 }}>delete</span>
                </button>
              </div>
            </main>
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
        </div>
    );
};

export default ScheduleManagerPage;
