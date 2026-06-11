import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Loader2, AlertCircle
} from 'lucide-react';
import * as signalR from '@microsoft/signalr';
import { publicApi } from '../../api/publicApi';
import { bookingApi } from '../../api/bookingApi';
import type { PublicSeatMap, PublicSeat, PublicPricing } from '../../types/public.types';
import { useTranslation } from 'react-i18next';
import { showError } from '../../utils/ToastUtils';
import { API_BASE_URL } from '../../api/axiosClient';
import { authApi } from '../../api/authApi';
import Cookies from 'js-cookie';

// Premium booking theme colors
const BK = {
  bg: 'var(--bg-base)',
  surface: 'var(--bg-surface)',
  surfaceLow: 'var(--bg-base)',
  surfaceHigh: 'var(--bg-elevated)',
  surfaceHighest: 'var(--bg-hover)',
  border: 'var(--border-color)',
  text: 'var(--text-primary)',
  textVariant: 'var(--text-secondary)',
  primary: 'var(--accent)',
  primaryContainer: 'var(--accent)',
  error: 'var(--danger)',
  success: 'var(--success)',
};

const BookingPage: React.FC = () => {
    const { scheduleId } = useParams<{ scheduleId: string }>();
    const navigate = useNavigate();
    const { t } = useTranslation();

    const [seatMap, setSeatMap] = useState<PublicSeatMap | null>(null);
    const [selectedSeats, setSelectedSeats] = useState<PublicSeat[]>([]);
    const [seatSegmentMap, setSeatSegmentMap] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [bookingLoading, setBookingLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pricing, setPricing] = useState<PublicPricing | null>(null);

    const [userName, setUserName] = useState<string>('Guest');
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
    const [customerInfo, setCustomerInfo] = useState({ name: '', email: '', phone: '', address: '' });

    const [hubConnection, setHubConnection] = useState<signalR.HubConnection | null>(null);
    const [lockedSeats, setLockedSeats] = useState<Record<string, string>>({});

    useEffect(() => {
        const storedUser = localStorage.getItem('user_info');
        if (storedUser) {
            const user = JSON.parse(storedUser);
            setUserName(user.username || user.userName || 'Guest');
            setIsLoggedIn(true);
        } else {
            setUserName('Guest');
            setIsLoggedIn(false);
        }

        if (scheduleId) {
            fetchData();
            const connection = new signalR.HubConnectionBuilder()
                .withUrl(`${API_BASE_URL}/ws/seat`, { transport: signalR.HttpTransportType.ServerSentEvents })
                .withAutomaticReconnect()
                .build();

            const startConnection = async () => {
                try {
                    await connection.start();
                    await connection.invoke("JoinSchedule", scheduleId);
                    connection.on("OnSeatSelected", (seatId: string, userName: string) => {
                        setLockedSeats(prev => ({ ...prev, [seatId]: userName }));
                    });
                    connection.on("OnSeatUnselected", (seatId: string) => {
                        setLockedSeats(prev => { const next = { ...prev }; delete next[seatId]; return next; });
                    });
                    setHubConnection(connection);
                } catch (err) { console.error("SignalR Connection Error:", err); }
            };
            startConnection();
            return () => {
                if (connection.state === signalR.HubConnectionState.Connected) {
                    connection.invoke("LeaveSchedule", scheduleId)
                        .then(() => connection.stop())
                        .catch(err => console.error("Error leaving schedule:", err));
                }
            };
        }
    }, [scheduleId]);

    const fetchData = async () => {
        setLoading(true); setError(null);
        try {
            const seatRes = await publicApi.getSeatMap(scheduleId!);
            setSeatMap(seatRes.data);
            try {
                const priceRes = await publicApi.getPricing(scheduleId!);
                setPricing(priceRes.data);
            } catch { console.warn('Pricing not found, skipping for now'); }
        } catch (err) { setError('Failed to load booking information.'); }
        finally { setLoading(false); }
    };

    const toggleSeat = async (seat: PublicSeat) => {
        if (seat.isBooked) return;
        const isCurrentlySelected = selectedSeats.find(s => s.seatId === seat.seatId);
        if (!isCurrentlySelected && lockedSeats[seat.seatId]) return;

        if (isCurrentlySelected) {
            setSelectedSeats(prev => prev.filter(s => s.seatId !== seat.seatId));
            setSeatSegmentMap(prev => { const next = { ...prev }; delete next[seat.seatId]; return next; });
            if (hubConnection && hubConnection.state === signalR.HubConnectionState.Connected) {
                try { await hubConnection.invoke("UnselectSeat", scheduleId, seat.seatId); }
                catch (err) { console.error("Error unselecting seat", err); }
            }
        } else {
            if (selectedSeats.length >= 8) { showError(t('toast.maxSeats')); return; }
            setSelectedSeats(prev => [...prev, seat]);
            if (pricing && pricing.segmentPrices.length > 0) {
                setSeatSegmentMap(prev => ({ ...prev, [seat.seatId]: pricing.segmentPrices[0].userSegmentId }));
            }
            if (hubConnection && hubConnection.state === signalR.HubConnectionState.Connected) {
                try { await hubConnection.invoke("SelectSeat", scheduleId, seat.seatId, userName); }
                catch (err) { console.error("Error selecting seat", err); }
            }
        }
    };

    const handleBooking = async () => {
        if (selectedSeats.length === 0) { showError(t('toast.selectSeat')); return; }
        if (!isLoggedIn) {
            if (!customerInfo.name.trim() || !customerInfo.email.trim() || !customerInfo.phone.trim()) {
                showError(t('toast.fillContactInfo')); return;
            }
        }
        setBookingLoading(true);
        try {
            const payload: any = {
                scheduleId: scheduleId!.trim(),
                seatSelections: selectedSeats.map(s => ({ seatId: s.seatId, userSegmentId: seatSegmentMap[s.seatId] })),
                customerName: isLoggedIn ? undefined : customerInfo.name.trim(),
                customerEmail: isLoggedIn ? undefined : customerInfo.email.trim(),
                customerPhone: isLoggedIn ? undefined : customerInfo.phone.trim(),
                customerAddress: isLoggedIn ? undefined : customerInfo.address.trim()
            };
            const res = await bookingApi.createBooking(payload);
            if (res.data.paymentUrl) {
                window.location.href = res.data.paymentUrl;
            } else { showError(t('toast.paymentUrlError')); }
        } catch (err: any) {
            const errorMsg = err.response?.data?.message || t('toast.scheduleSaveFailed');
            showError(errorMsg);
        } finally { setBookingLoading(false); }
    };

    const totalPrice = selectedSeats.reduce((sum, seat) => {
        const segmentId = seatSegmentMap[seat.seatId];
        const segment = pricing?.segmentPrices.find(s => s.userSegmentId === segmentId);
        return sum + (segment?.finalPrice || 0);
    }, 0);

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', backgroundColor: BK.bg, color: BK.text, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Loader2 size={48} style={{ color: BK.primaryContainer, animation: 'bk-spin 1s linear infinite' }} />
            </div>
        );
    }

    if (error || !seatMap) {
        return (
            <div style={{ minHeight: '100vh', backgroundColor: BK.bg, color: BK.text, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
                <AlertCircle size={64} style={{ color: BK.error, marginBottom: 16 }} />
                <p style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>{error || 'Schedule not found'}</p>
                <button onClick={() => navigate('/home')}
                  style={{
                    padding: '12px 24px', backgroundColor: BK.primaryContainer, border: 'none',
                    borderRadius: 8, color: '#000', fontWeight: 600, cursor: 'pointer',
                  }}>
                  Go Home
                </button>
            </div>
        );
    }

    const maxCol = Math.max(...(seatMap.seatMap?.map(s => s.colIndex) || [0])) + 1;

    return (
        <div style={{ minHeight: '100vh', backgroundColor: BK.bg, color: BK.text, fontFamily: "'Inter', sans-serif" }}>
          <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&family=Inter:wght@400;500;600&display=swap');
            .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; vertical-align: middle; }
            .glass-card { background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(32px); border: 1px solid rgba(255, 255, 255, 0.1); border-top: 1px solid rgba(255, 255, 255, 0.15); border-left: 1px solid rgba(255, 255, 255, 0.15); }
            .screen-curve { height: 4px; width: 100%; background: linear-gradient(90deg, transparent 0%, #ff8a00 50%, transparent 100%); border-radius: 50%; filter: blur(1px) drop-shadow(0 0 8px #ff8a00); }
            .no-scrollbar::-webkit-scrollbar { display: none; }
            .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            @keyframes bk-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          `}</style>

          {/* ===== TOP NAV - Fixed responsive padding ===== */}
          <header style={{
            position: 'fixed', top: 0, width: '100%', zIndex: 50,
            backgroundColor: 'var(--bg-surface)', backdropFilter: 'blur(24px)',
            borderBottom: '1px solid var(--border-color)',
            height: 72, display: 'flex', alignItems: 'center',
          }}>
            <div style={{
              maxWidth: 1280, margin: '0 auto', width: '100%',
              padding: '0 clamp(16px, 4vw, 64px)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div
                onClick={() => navigate('/home')}
                style={{
                  cursor: 'pointer',
                  fontFamily: "'Montserrat', sans-serif",
                  fontSize: 24,
                  fontWeight: 800,
                  letterSpacing: '-0.5px',
                  background: 'linear-gradient(135deg, #ffb77f, #ff8a00)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  whiteSpace: 'nowrap',
                  lineHeight: 1,
                  userSelect: 'none',
                }}>
                CINEMA
              </div>
              <nav style={{ display: 'none', alignItems: 'center', gap: 32 }} className="md:flex">
                {['Movies', 'Cinemas', 'Offers', 'Membership'].map(item => (
                  <a key={item} href="#"
                    style={{ color: 'var(--text-secondary)', fontSize: 14, fontWeight: 500, textDecoration: 'none', transition: 'color 0.2s', whiteSpace: 'nowrap' }}
                    onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; }}
                  >
                    {item}
                  </a>
                ))}
              </nav>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(12px, 2vw, 24px)' }}>
                {isLoggedIn ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '4px 12px 4px 4px',
                      height: 38,
                      borderRadius: 9999,
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-primary)',
                    }}>
                      <div style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'rgba(255,138,0,0.12)',
                      }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)' }}>{userName[0]?.toUpperCase() || 'U'}</span>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 500 }} className="hidden sm:inline">{userName}</span>
                    </div>
                    <button
                      onClick={async () => {
                        try { await authApi.logout(); } catch {}
                        localStorage.removeItem('user_info');
                        Cookies.remove('X-Access-Token');
                        navigate('/login');
                      }}
                      style={{
                        backgroundColor: 'transparent',
                        color: 'var(--danger)',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontSize: 13,
                        padding: '4px 8px',
                      }}
                    >
                      {t('Logout')}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => navigate('/login')}
                    style={{
                      backgroundColor: 'var(--accent)',
                      color: '#000',
                      fontWeight: 700,
                      padding: '8px 24px',
                      borderRadius: 8,
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      whiteSpace: 'nowrap',
                      fontSize: 'clamp(13px, 2vw, 14px)',
                    }}
                  >
                    {t('Sign In')}
                  </button>
                )}
              </div>
            </div>
          </header>

          {/* ===== MAIN - Fixed responsive padding ===== */}
          <main style={{
            paddingTop: 128, paddingBottom: 96,
            maxWidth: 1280, margin: '0 auto',
            paddingLeft: 'clamp(16px, 4vw, 64px)',
            paddingRight: 'clamp(16px, 4vw, 64px)',
          }}>
            {/* Movie Info - Fixed responsive */}
            <div style={{
              marginBottom: 'clamp(24px, 5vw, 48px)',
              display: 'flex', flexDirection: 'column',
              justifyContent: 'flex-end', borderLeft: `4px solid ${BK.primary}`, paddingLeft: 24,
            }}
              className="md:flex-row md:items-end md:justify-between"
            >
              <div style={{ minWidth: 0, flex: 1 }}>
                <h1 style={{
                  fontFamily: "'Montserrat', sans-serif",
                  fontSize: 'clamp(24px, 5vw, 48px)',
                  fontWeight: 800,
                  color: BK.text, margin: '0 0 8px', letterSpacing: '-0.02em',
                  overflowWrap: 'break-word', wordBreak: 'break-word',
                }}>
                  {seatMap.movieName}
                </h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(8px, 2vw, 16px)', color: BK.textVariant, fontSize: 'clamp(12px, 2vw, 14px)', letterSpacing: '0.1em', fontWeight: 600, flexWrap: 'wrap' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>movie</span>
                    {seatMap.auditoriumName}
                  </span>
                  <span style={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: BK.border, flexShrink: 0 }} />
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>calendar_today</span>
                    {new Date(seatMap.startTime).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </span>
                  <span style={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: BK.border, flexShrink: 0 }} />
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>schedule</span>
                    {new Date(seatMap.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
              <button
                onClick={() => navigate(-1)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, color: BK.primary,
                  background: 'none', border: 'none', cursor: 'pointer', fontSize: 14,
                  transition: 'all 0.3s ease', padding: '8px 0', flexShrink: 0,
                }}
                onMouseEnter={e => { e.currentTarget.style.gap = '16px'; }}
                onMouseLeave={e => { e.currentTarget.style.gap = '8px'; }}
              >
                <span className="material-symbols-outlined">arrow_back</span>
                Change Session
              </button>
            </div>

            {/* Responsive grid - stacked on mobile, side-by-side on desktop */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'clamp(24px, 5vw, 48px)', alignItems: 'start' }}
              className="lg:grid-cols-[1fr_minmax(320px,420px)]"
            >
              {/* ===== SEAT SELECTION ===== */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 0 }}>
                {/* Screen */}
                <div style={{ width: '100%', maxWidth: 560, marginBottom: 'clamp(32px, 8vw, 64px)', position: 'relative' }}>
                  <div className="screen-curve" />
                  <p style={{
                    textAlign: 'center', color: BK.textVariant, fontSize: 10,
                    letterSpacing: '0.4em', textTransform: 'uppercase', marginTop: 16,
                  }}>
                    Screen
                  </p>
                </div>

                {/* Seat Grid - responsive sizing */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${maxCol}, minmax(0, 1fr))`,
                  gap: 'clamp(4px, 1.5vw, 8px)',
                  padding: 'clamp(8px, 2vw, 16px)',
                  borderRadius: 16,
                  backgroundColor: 'rgba(255,255,255,0.02)',
                  width: '100%',
                  maxWidth: `min(${maxCol * 56}px, 100%)`,
                  justifyContent: 'center',
                }}>
                  {seatMap.seatMap?.map((seat) => {
                    const isSelected = selectedSeats.find(s => s.seatId === seat.seatId);
                    const lockedBy = lockedSeats[seat.seatId];
                    const isLockedByOther = lockedBy && !isSelected;
                    let seatStyle: React.CSSProperties = {
                      width: 'clamp(28px, 6vw, 40px)',
                      height: 'clamp(28px, 6vw, 40px)',
                      borderRadius: 8,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 'clamp(9px, 1.5vw, 11px)', fontWeight: 500,
                      transition: 'all 0.2s ease', border: 'none', cursor: 'pointer',
                      fontFamily: "'Inter', sans-serif",
                      margin: '0 auto',
                    };

                    if (seat.isBooked) {
                      Object.assign(seatStyle, {
                        backgroundColor: BK.surfaceHigh,
                        opacity: 0.3, cursor: 'not-allowed',
                        color: BK.textVariant,
                      } as React.CSSProperties);
                    } else if (isLockedByOther) {
                      Object.assign(seatStyle, {
                        backgroundColor: 'rgba(175, 141, 17, 0.2)',
                        border: '1px solid rgba(175, 141, 17, 0.4)',
                        cursor: 'not-allowed',
                        color: BK.textVariant,
                      } as React.CSSProperties);
                    } else if (isSelected) {
                      Object.assign(seatStyle, {
                        backgroundColor: BK.primaryContainer,
                        color: '#000',
                        boxShadow: '0 0 15px rgba(255, 138, 0, 0.4)',
                        transform: 'scale(1.05)',
                        fontWeight: 700,
                      } as React.CSSProperties);
                    } else {
                      Object.assign(seatStyle, {
                        backgroundColor: BK.surfaceHigh,
                        cursor: 'pointer',
                        color: BK.textVariant,
                      } as React.CSSProperties);
                    }

                    return (
                      <button
                        key={seat.seatId}
                        disabled={seat.isBooked || !!isLockedByOther}
                        onClick={() => toggleSeat(seat)}
                        style={seatStyle}
                        onMouseEnter={e => { if (!seat.isBooked && !isLockedByOther && !isSelected) { e.currentTarget.style.backgroundColor = BK.surfaceHighest; e.currentTarget.style.color = BK.text; } }}
                        onMouseLeave={e => { if (!seat.isBooked && !isLockedByOther && !isSelected) { e.currentTarget.style.backgroundColor = BK.surfaceHigh; e.currentTarget.style.color = BK.textVariant; } }}
                        title={isLockedByOther ? `Selected by ${lockedBy}` : seat.seatName}
                      >
                        {seat.seatName}
                      </button>
                    );
                  })}
                </div>

                {/* Legend - responsive */}
                <div style={{
                  display: 'flex', flexWrap: 'wrap', justifyContent: 'center',
                  gap: 'clamp(12px, 3vw, 24px)',
                  padding: 'clamp(8px, 2vw, 12px) clamp(12px, 3vw, 24px)',
                  borderRadius: 9999, marginTop: 48,
                  background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(32px)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}>
                  <LegendItem color={BK.surfaceHigh} label="Available" />
                  <LegendItem color={BK.primaryContainer} label="Selected" shadow />
                  <LegendItem color="rgba(175,141,17,0.2)" label="Locked" border="rgba(175,141,17,0.4)" />
                  <LegendItem color={BK.surfaceHigh} label="Occupied" faded />
                </div>
              </div>

              {/* ===== BOOKING SUMMARY - responsive ===== */}
              <aside style={{
                position: 'sticky', top: 96,
              }} className="lg:sticky">
                <div className="glass-card" style={{
                  borderRadius: 16, padding: 'clamp(20px, 4vw, 32px)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                  overflow: 'hidden', position: 'relative',
                }}>
                  {/* Glow */}
                  <div style={{
                    position: 'absolute', top: -96, right: -96, width: 192, height: 192,
                    backgroundColor: `${BK.primary}1A`, filter: 'blur(100px)', borderRadius: '50%',
                    pointerEvents: 'none',
                  }} />

                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
                    <span className="material-symbols-outlined" style={{ color: BK.primary, fontVariationSettings: "'FILL' 1" }}>shopping_cart</span>
                    <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 'clamp(18px, 3vw, 20px)', fontWeight: 700, margin: 0 }}>Booking Summary</h2>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 24, marginBottom: 32 }}>
                    <SummaryRow label="Movie" value={seatMap.movieName} />
                    <SummaryRow label="Venue" value={seatMap.auditoriumName} />
                    <SummaryRow label="Format" value={seatMap.movieVisualFormatName || seatMap.auditoriumName} />

                    {/* Selected Seats */}
                    <div style={{ paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                      <span style={{ color: BK.textVariant, fontSize: 12, letterSpacing: '0.1em', fontWeight: 600, textTransform: 'uppercase', display: 'block', marginBottom: 12 }}>
                        Selected Seats
                      </span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {selectedSeats.length === 0 ? (
                          <span style={{ color: `${BK.textVariant}80`, fontStyle: 'italic', fontSize: 14 }}>No seats selected yet</span>
                        ) : selectedSeats.map(seat => (
                          <div key={seat.seatId} style={{
                            display: 'flex', flexDirection: 'column', gap: 4,
                            padding: '8px 12px', backgroundColor: `${BK.primary}0D`,
                            border: `1px solid ${BK.primary}1A`, borderRadius: 8,
                            width: '100%',
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontWeight: 700, color: BK.primary, fontSize: 13 }}>Seat {seat.seatName}</span>
                              <span style={{ fontSize: 13, fontWeight: 700 }}>
                                {(pricing?.segmentPrices.find(s => s.userSegmentId === seatSegmentMap[seat.seatId])?.finalPrice || 0).toLocaleString('vi-VN')}đ
                              </span>
                            </div>
                            <select
                              value={seatSegmentMap[seat.seatId]}
                              onChange={(e) => setSeatSegmentMap(prev => ({ ...prev, [seat.seatId]: e.target.value }))}
                              style={{
                                width: '100%', backgroundColor: 'transparent', border: 'none',
                                color: BK.textVariant, fontSize: 11, cursor: 'pointer', outline: 'none',
                              }}
                            >
                              {pricing?.segmentPrices.map(segment => (
                                <option key={segment.userSegmentId} value={segment.userSegmentId} style={{ backgroundColor: BK.surface, color: BK.text }}>
                                  {segment.segmentName}
                                </option>
                              ))}
                            </select>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Total Price */}
                  <div style={{
                    padding: 'clamp(12px, 2vw, 16px)', backgroundColor: `${BK.primary}0D`,
                    borderRadius: 12, border: `1px solid ${BK.primary}1A`, marginBottom: 32,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                      <span style={{ fontWeight: 500 }}>Total Price</span>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ color: BK.primary, fontSize: 'clamp(22px, 4vw, 28px)', fontWeight: 800 }}>
                          {totalPrice.toLocaleString('vi-VN')}đ
                        </span>
                        <p style={{ fontSize: 10, color: BK.textVariant, textTransform: 'uppercase', letterSpacing: '-0.01em', margin: 0 }}>
                          Inclusives of all taxes
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* User Info */}
                  {!isLoggedIn ? (
                    <div style={{
                      padding: 16, borderRadius: 12,
                      border: '1px solid rgba(147, 0, 10, 0.2)',
                      backgroundColor: 'rgba(147, 0, 10, 0.1)',
                      marginBottom: 24,
                    }}>
                      <p style={{ fontSize: 12, color: BK.textVariant, marginBottom: 12 }}>
                        <span style={{ color: BK.primary, fontWeight: 700 }}>Guest</span>. Please fill your details to proceed.
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <input type="text" placeholder="Full Name *" value={customerInfo.name}
                          onChange={e => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                          style={{
                            width: '100%', minHeight: 44, padding: '8px 12px', backgroundColor: 'rgba(0,0,0,0.2)',
                            border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
                            color: BK.text, fontSize: 13, outline: 'none', boxSizing: 'border-box',
                          }}
                          onFocus={e => { e.currentTarget.style.borderColor = BK.primary; }}
                          onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                        />
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                          <input type="email" placeholder="Email *" value={customerInfo.email}
                            onChange={e => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                            style={{
                              width: '100%', minHeight: 44, padding: '8px 12px', backgroundColor: 'rgba(0,0,0,0.2)',
                              border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
                              color: BK.text, fontSize: 13, outline: 'none', boxSizing: 'border-box',
                            }}
                            onFocus={e => { e.currentTarget.style.borderColor = BK.primary; }}
                            onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                          />
                          <input type="tel" placeholder="Phone *" value={customerInfo.phone}
                            onChange={e => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                            style={{
                              width: '100%', minHeight: 44, padding: '8px 12px', backgroundColor: 'rgba(0,0,0,0.2)',
                              border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
                              color: BK.text, fontSize: 13, outline: 'none', boxSizing: 'border-box',
                            }}
                            onFocus={e => { e.currentTarget.style.borderColor = BK.primary; }}
                            onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                          />
                        </div>
                        <input type="text" placeholder="Address (Optional)" value={customerInfo.address}
                          onChange={e => setCustomerInfo(prev => ({ ...prev, address: e.target.value }))}
                          style={{
                            width: '100%', minHeight: 44, padding: '8px 12px', backgroundColor: 'rgba(0,0,0,0.2)',
                            border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
                            color: BK.text, fontSize: 13, outline: 'none', boxSizing: 'border-box',
                          }}
                          onFocus={e => { e.currentTarget.style.borderColor = BK.primary; }}
                          onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div style={{
                      padding: 16, borderRadius: 12,
                      border: '1px solid rgba(147, 0, 10, 0.2)',
                      backgroundColor: 'rgba(147, 0, 10, 0.1)', marginBottom: 24,
                    }}>
                      <p style={{ fontSize: 12, color: BK.textVariant, margin: 0 }}>
                        Booking as <span style={{ color: BK.primary, fontWeight: 700 }}>{userName}</span>. Your details will be retrieved from your profile.
                      </p>
                    </div>
                  )}

                  {/* Pay Button */}
                  <button
                    disabled={selectedSeats.length === 0 || bookingLoading}
                    onClick={handleBooking}
                    style={{
                      width: '100%', minHeight: 56, borderRadius: 12,
                      fontFamily: "'Montserrat', sans-serif", fontSize: 'clamp(14px, 2.5vw, 16px)', fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
                      border: 'none', cursor: selectedSeats.length > 0 ? 'pointer' : 'not-allowed',
                      backgroundColor: selectedSeats.length > 0 ? BK.primaryContainer : BK.surfaceHigh,
                      color: selectedSeats.length > 0 ? '#000' : `${BK.textVariant}80`,
                      transition: 'all 0.3s ease',
                      padding: '0 24px',
                      boxShadow: selectedSeats.length > 0 ? `0 4px 25px rgba(255,138,0,0.4)` : 'none',
                    }}
                    onMouseEnter={e => { if (selectedSeats.length > 0) { e.currentTarget.style.boxShadow = '0 4px 25px rgba(255,138,0,0.4)'; e.currentTarget.style.transform = 'scale(1.02)'; } }}
                    onMouseLeave={e => { if (selectedSeats.length > 0) { e.currentTarget.style.boxShadow = '0 4px 25px rgba(255,138,0,0.4)'; e.currentTarget.style.transform = 'scale(1)'; } }}
                    onMouseDown={e => { if (selectedSeats.length > 0) e.currentTarget.style.transform = 'scale(0.97)'; }}
                    onMouseUp={e => { if (selectedSeats.length > 0) e.currentTarget.style.transform = 'scale(1.02)'; }}
                  >
                    {bookingLoading ? (
                      <Loader2 size={20} style={{ animation: 'bk-spin 1s linear infinite' }} />
                    ) : (
                      <>
                        <span className="material-symbols-outlined" style={{ fontSize: 20 }}>payments</span>
                        Proceed to Pay
                      </>
                    )}
                  </button>
                </div>

                {/* Promo Banner */}
                <div style={{
                  marginTop: 24, borderRadius: 16, overflow: 'hidden',
                  position: 'relative', cursor: 'pointer', height: 'clamp(96px, 20vw, 128px)',
                }}>
                  <img
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBCf7glp6ITcrfW0hlE9CXfpSZ7AKpilK45LhR60O8k-msYArV6MVcBMije9H5ruQss-UbuC6Gb1YAflcR428UUHyWYRUE37mAUiB7VVcDsku8dh0XkH6TnzJyx6Me9rtBRfmPBYyk05S__h3GC_UA8Zgnje4sA3Shl3oYaIMWBRFe43eWcgqhiiU_iEjv7gWW52Q2ay7rZQda7oW14y08BU8HYg4NYYb7c2oYMFYBIhsC3smbjMPl2266Wx7hu3U6mCtsWUDUQRCE"
                    alt="Promotional"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.7s ease' }}
                    className="promo-img"
                  />
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(to right, rgba(0,0,0,0.8), transparent)',
                    display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 24px',
                  }}>
                    <p style={{
                      color: BK.primary, fontWeight: 700, fontSize: 12,
                      letterSpacing: '0.05em', textTransform: 'uppercase', margin: '0 0 4px',
                    }}>
                      Premier Plus
                    </p>
                    <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 'clamp(14px, 3vw, 18px)', fontWeight: 600, margin: 0 }}>
                      Get 20% off popcorn
                    </p>
                  </div>
                </div>
              </aside>
            </div>
          </main>

          {/* Footer */}
          <footer style={{
            width: '100%', padding: 'clamp(24px, 5vw, 48px) clamp(16px, 4vw, 64px)',
            maxWidth: 1280, margin: '0 auto',
            borderTop: '1px solid var(--border-color)', marginTop: 80,
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 32, alignItems: 'center' }}
              className="md:flex-row md:justify-between"
            >
              <div style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 'clamp(18px, 3vw, 20px)', fontWeight: 800, color: BK.primary, opacity: 0.5 }}>
                CINEMA
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 'clamp(16px, 4vw, 32px)', color: BK.textVariant, fontSize: 'clamp(12px, 2vw, 14px)' }}>
                {['Privacy Policy', 'Terms of Service', 'Contact Us', 'Careers'].map(link => (
                  <a key={link} href="#"
                    style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s', whiteSpace: 'nowrap' }}
                    onMouseEnter={e => { e.currentTarget.style.color = BK.text; }}
                    onMouseLeave={e => { e.currentTarget.style.color = BK.textVariant; }}
                  >
                    {link}
                  </a>
                ))}
              </div>
              <div style={{ color: BK.textVariant, fontSize: 12, letterSpacing: '-0.01em', opacity: 0.5 }}>
                © 2026 CINEMA. ALL RIGHTS RESERVED.
              </div>
            </div>
          </footer>

        </div>
    );
};

// ===== Sub-components =====
const LegendItem: React.FC<{ color: string; label: string; shadow?: boolean; border?: string; faded?: boolean }> = ({ color, label, shadow, border, faded }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
    <div style={{
      width: 16, height: 16, borderRadius: 4,
      backgroundColor: color,
      boxShadow: shadow ? '0 0 8px rgba(255,138,0,0.5)' : undefined,
      border: border ? `1px solid ${border}` : undefined,
      opacity: faded ? 0.3 : 1,
    }} />
    <span style={{ fontSize: 12, color: BK.textVariant }}>{label}</span>
  </div>
);

const SummaryRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
    <span style={{ color: BK.textVariant, fontSize: 12, letterSpacing: '0.1em', fontWeight: 600, textTransform: 'uppercase' }}>
      {label}
    </span>
    <span style={{ fontWeight: 600, textAlign: 'right', fontSize: 14, overflowWrap: 'break-word', wordBreak: 'break-word', maxWidth: '60%' }}>{value}</span>
  </div>
);

export default BookingPage;
