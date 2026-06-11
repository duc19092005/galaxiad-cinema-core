// src/features/booking/TheatersPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Phone, Clock, Loader2, Sparkles, Navigation } from 'lucide-react';
import { publicApi } from '../../api/publicApi';
import type { ActiveCinema, SearchScheduleResult } from '../../types/public.types';
import Header from '../../components/Header';
import { showError } from '../../utils/ToastUtils';

interface CinemaDetails {
  address: string;
  phone: string;
  hours: string;
  lat: number;
  lng: number;
}

const CINEMA_INFOS: Record<string, CinemaDetails> = {
  'Galaxy Cinema Nguyễn Du': { address: '116 Nguyễn Du, Bến Thành, Quận 1, Hồ Chí Minh', phone: '1900 2235', hours: '08:00 - 23:30', lat: 10.7725, lng: 106.6961 },
  'Galaxy Cinema Nguy?n Du': { address: '116 Nguyễn Du, Bến Thành, Quận 1, Hồ Chí Minh', phone: '1900 2235', hours: '08:00 - 23:30', lat: 10.7725, lng: 106.6961 },
  'BHD Star Bitexco': { address: 'Lầu 3 & 4, Icon 68 Shopping Center, Bitexco Financial Tower, 2 Hải Triều, Quận 1, Hồ Chí Minh', phone: '1900 2099', hours: '08:30 - 23:00', lat: 10.7716, lng: 106.7044 },
  'Lotte Cinema West Lake': { address: 'Lotte Mall West Lake, 272 Võ Chí Công, Phú Thượng, Tây Hồ, Hà Nội', phone: '024 3333 2500', hours: '09:00 - 24:00', lat: 21.0745, lng: 105.8033 },
};

function getCinemaInfo(name: string, id: string): CinemaDetails & { city: string } {
  if (CINEMA_INFOS[name]) return { ...CINEMA_INFOS[name], city: name.includes('West Lake') ? 'Hà Nội' : 'Hồ Chí Minh' };
  
  const normalized = name.toLowerCase();
  if (normalized.includes('nguyễn du') || normalized.includes('nguy?n du') || normalized.includes('du')) {
    return { ...CINEMA_INFOS['Galaxy Cinema Nguyễn Du'], city: 'Hồ Chí Minh' };
  }
  if (normalized.includes('bitexco') || normalized.includes('bhd')) {
    return { ...CINEMA_INFOS['BHD Star Bitexco'], city: 'Hồ Chí Minh' };
  }
  if (normalized.includes('west lake') || normalized.includes('lotte') || normalized.includes('lake')) {
    return { ...CINEMA_INFOS['Lotte Cinema West Lake'], city: 'Hà Nội' };
  }

  // Stable random generation
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const isHanoi = hash % 2 === 0;
  return {
    address: isHanoi ? `${hash % 500} Vo Chi Cong, Tay Ho, Ha Noi` : `${hash % 800} Nguyen Trai, District 5, Ho Chi Minh City`,
    phone: `09${Math.abs(hash % 100000000).toString().padStart(8, '0')}`,
    hours: '08:00 - 23:30',
    lat: isHanoi ? 21.0285 : 10.7626,
    lng: isHanoi ? 105.8048 : 106.6602,
    city: isHanoi ? 'Hà Nội' : 'Hồ Chí Minh',
  };
}

export const TheatersPage: React.FC = () => {
  const navigate = useNavigate();

  const [selectedCinema, setSelectedCinema] = useState<ActiveCinema | null>(null);
  const [schedules, setSchedules] = useState<SearchScheduleResult[]>([]);
  const [loadingCinemas, setLoadingCinemas] = useState(true);
  const [loadingSchedules, setLoadingSchedules] = useState(false);

  // Grouped cinemas state
  const [cities, setCities] = useState<Record<string, ActiveCinema[]>>({});

  useEffect(() => {
    fetchCinemas();
  }, []);

  const fetchCinemas = async () => {
    setLoadingCinemas(true);
    try {
      const res = await publicApi.getActiveCinemas();
      if (res.isSuccess) {
        const list = res.data || [];
        
        // Group by City
        const groups: Record<string, ActiveCinema[]> = {};
        list.forEach((c) => {
          const info = getCinemaInfo(c.cinemaName, c.cinemaId);
          if (!groups[info.city]) groups[info.city] = [];
          groups[info.city].push(c);
        });
        setCities(groups);

        // Pre-select if there is a header preference
        const stored = localStorage.getItem('user_selected_cinema');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            const found = list.find((item) => item.cinemaId === parsed.cinemaId);
            if (found) {
              setSelectedCinema(found);
              return;
            }
          } catch {
            // ignore
          }
        }
        
        // Fallback pre-select first cinema
        if (list.length > 0) {
          setSelectedCinema(list[0]);
        }
      } else {
        showError('Failed to load theaters.');
      }
    } catch (err) {
      console.error(err);
      showError('Error loading theaters list.');
    } finally {
      setLoadingCinemas(false);
    }
  };

  // Fetch showtimes for selected cinema
  useEffect(() => {
    if (!selectedCinema) return;
    
    const fetchCinemaSchedules = async () => {
      setLoadingSchedules(true);
      try {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const dateVal = String(today.getDate()).padStart(2, '0');
        const todayStr = `${year}-${month}-${dateVal}`;

        const res = await publicApi.searchSchedules(todayStr, undefined, selectedCinema.cinemaId);
        if (res.isSuccess) {
          setSchedules(res.data || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingSchedules(false);
      }
    };
    
    fetchCinemaSchedules();
  }, [selectedCinema]);

  const selectTheater = (cinema: ActiveCinema) => {
    setSelectedCinema(cinema);
    // Sync with location preference
    const info = getCinemaInfo(cinema.cinemaName, cinema.cinemaId);
    localStorage.setItem('user_selected_cinema', JSON.stringify({ ...cinema, city: info.city }));
    localStorage.setItem('user_selected_city', info.city);
    window.dispatchEvent(new Event('user_selected_cinema_changed'));
  };

  const formatTime = (timeStr: string) => {
    try {
      const date = new Date(timeStr);
      return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });
    } catch {
      return timeStr;
    }
  };

  const currentInfo = selectedCinema ? getCinemaInfo(selectedCinema.cinemaName, selectedCinema.cinemaId) : null;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)', overflowX: 'hidden' }}>
      <Header />

      <main style={{ paddingTop: '100px', paddingBottom: '60px', maxWidth: '1200px', margin: '0 auto', paddingLeft: '24px', paddingRight: '24px' }}>
        
        {/* Title */}
        <div style={{ marginBottom: '40px', textAlign: 'center' }}>
          <span style={{
            fontSize: '12px',
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            color: 'var(--primary, #ff8a00)',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            marginBottom: '8px'
          }}>
            <Sparkles size={14} /> Theater System
          </span>
          <h1 style={{ fontSize: '36px', fontWeight: 900, margin: 0, letterSpacing: '-0.02em' }}>
            Our Cinemas
          </h1>
        </div>

        {loadingCinemas ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
            <Loader2 size={36} className="animate-spin" style={{ color: 'var(--primary)', animation: 'spin 1s linear infinite' }} />
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '30px', ...{ '@media (min-width: 900px)': { gridTemplateColumns: '320px 1fr' } } } as any} className="lg:grid lg:grid-cols-[320px_1fr]">
            
            {/* Left Column: Cinemas Directory */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {Object.keys(cities).map((city) => (
                <div key={city} className="glass-card" style={{ padding: '20px', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--primary, #ff8a00)', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '8px' }}>
                    {city}
                  </h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {cities[city].map((cinema) => {
                      const isSelected = selectedCinema?.cinemaId === cinema.cinemaId;
                      return (
                        <button
                          key={cinema.cinemaId}
                          onClick={() => selectTheater(cinema)}
                          style={{
                            width: '100%',
                            textAlign: 'left',
                            padding: '12px 16px',
                            borderRadius: 'var(--radius-md, 10px)',
                            background: isSelected ? 'rgba(255,138,0,0.1)' : 'rgba(255,255,255,0.02)',
                            border: isSelected ? '1px solid var(--primary, #ff8a00)' : '1px solid rgba(255,255,255,0.05)',
                            color: isSelected ? 'var(--primary, #ff8a00)' : 'var(--text-primary)',
                            fontWeight: isSelected ? 700 : 500,
                            cursor: 'pointer',
                            fontSize: '14px',
                            transition: 'all 0.2s',
                          }}
                        >
                          {cinema.cinemaName}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Right Column: Selected Cinema details & showtimes */}
            {selectedCinema && currentInfo && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                
                {/* Cinema Info Card */}
                <div className="glass-card" style={{ padding: '30px', borderRadius: 'var(--radius-xl)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <h2 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '20px' }}>{selectedCinema.cinemaName}</h2>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      <MapPin size={18} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '2px' }} />
                      <div>
                        <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600 }}>Address</div>
                        <span style={{ fontSize: '13px', lineHeight: '1.4' }}>{currentInfo.address}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      <Phone size={18} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '2px' }} />
                      <div>
                        <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600 }}>Hotline</div>
                        <span style={{ fontSize: '13px', fontWeight: 700 }}>{currentInfo.phone}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      <Clock size={18} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '2px' }} />
                      <div>
                        <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600 }}>Hours</div>
                        <span style={{ fontSize: '13px' }}>{currentInfo.hours}</span>
                      </div>
                    </div>
                  </div>

                  {/* Mock Map View */}
                  <div 
                    style={{ 
                      height: '200px', 
                      borderRadius: 'var(--radius-lg)', 
                      background: 'linear-gradient(180deg, #18181b, #09090b)', 
                      border: '1px solid rgba(255,255,255,0.05)',
                      position: 'relative',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {/* Simulated grid lines */}
                    <div style={{ position: 'absolute', inset: 0, opacity: 0.04, backgroundSize: '20px 20px', backgroundImage: 'linear-gradient(to right, grey 1px, transparent 1px), linear-gradient(to bottom, grey 1px, transparent 1px)' }} />
                    
                    {/* Pulsing center point */}
                    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div 
                        style={{ 
                          width: '16px', 
                          height: '16px', 
                          borderRadius: '50%', 
                          backgroundColor: 'var(--primary, #ff8a00)', 
                          boxShadow: '0 0 15px var(--primary)',
                          animation: 'ping 2s infinite' 
                        }} 
                      />
                      <MapPin size={24} style={{ color: 'var(--primary)', marginTop: '-20px', position: 'relative', zIndex: 1 }} />
                      <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', marginTop: '8px' }}>
                        Map View (Lat: {currentInfo.lat}, Lng: {currentInfo.lng})
                      </span>
                    </div>
                    
                    <button 
                      style={{
                        position: 'absolute',
                        bottom: '12px',
                        right: '12px',
                        padding: '6px 12px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: 'white',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                      onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${currentInfo.lat},${currentInfo.lng}`, '_blank')}
                    >
                      <Navigation size={12} /> Directions
                    </button>
                  </div>
                </div>

                {/* Showtimes for Today Card */}
                <div className="glass-card" style={{ padding: '30px', borderRadius: 'var(--radius-xl)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    Showtimes Today
                  </h3>

                  {loadingSchedules ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
                      <Loader2 size={28} className="animate-spin" style={{ color: 'var(--primary)', animation: 'spin 1s linear infinite' }} />
                    </div>
                  ) : schedules.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-secondary)' }}>
                      No more sessions scheduled for today at this location.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                      {schedules.map((schedule) => (
                        <div 
                          key={schedule.movieId}
                          style={{
                            display: 'flex',
                            gap: '20px',
                            flexWrap: 'wrap',
                            borderBottom: '1px solid rgba(255,255,255,0.05)',
                            paddingBottom: '20px'
                          }}
                        >
                          {/* Mini poster */}
                          <div style={{ width: '60px', height: '84px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', flexShrink: 0 }}>
                            <img 
                              src={schedule.movieImageUrl || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=500'} 
                              alt={schedule.movieName}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=500' }}
                            />
                          </div>

                          {/* Movie content & showtimes */}
                          <div style={{ flex: 1, minWidth: '200px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                              <h4 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>{schedule.movieName}</h4>
                              <span style={{
                                background: 'rgba(255,138,0,0.15)',
                                color: 'var(--primary, #ff8a00)',
                                fontSize: '9px',
                                fontWeight: 800,
                                padding: '2px 6px',
                                borderRadius: '4px'
                              }}>
                                {schedule.movieRequiredAgeSymbol || 'T16'}
                              </span>
                              <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{schedule.movieDuration} mins</span>
                            </div>

                            {/* Showtimes for this specific cinema */}
                            {schedule.cinemas
                              .filter((c) => c.cinemaId === selectedCinema.cinemaId)
                              .map((c) => (
                                <div key={c.cinemaId} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                  {c.formatShowtimes.map((f) => (
                                    <div key={f.formatId} style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                      <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                                        {f.formatName}
                                      </span>
                                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                        {f.showtimes.map((st) => (
                                          <button
                                            key={st.scheduleId}
                                            onClick={() => navigate(`/booking/${st.scheduleId}`)}
                                            style={{
                                              padding: '6px 12px',
                                              borderRadius: '4px',
                                              background: 'rgba(255,255,255,0.03)',
                                              border: '1px solid rgba(255,255,255,0.08)',
                                              color: 'var(--text-primary)',
                                              fontSize: '12px',
                                              fontWeight: 700,
                                              cursor: 'pointer',
                                              transition: 'all 0.2s',
                                            }}
                                            onMouseOver={(e) => {
                                              e.currentTarget.style.background = 'var(--primary-soft)';
                                              e.currentTarget.style.borderColor = 'var(--primary)';
                                            }}
                                            onMouseOut={(e) => {
                                              e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                                              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                                            }}
                                          >
                                            {formatTime(st.startTime)}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};
