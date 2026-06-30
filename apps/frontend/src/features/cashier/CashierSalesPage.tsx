import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Search, Film, Calendar, Clock, Monitor, ShoppingCart, User, CreditCard,
  CheckCircle2, Printer, LogOut, Loader2, RefreshCw, Ticket, ChevronRight, Banknote
} from 'lucide-react';
import { publicApi } from '../../api/publicApi';
import { useSeatWs } from '../../hooks/useSeatWs';
import { bookingApi } from '../../api/bookingApi';
import { staffShiftApi, CASHIER_SHIFT_SESSION_KEY, readCashierShiftSession } from '../../api/staffShiftApi';
import { authApi } from '../../api/authApi';
import Cookies from 'js-cookie';
import type { SearchScheduleResult, PublicSeatMap, PublicSeat, PublicPricing } from '../../types/public.types';
import type { CashierShiftSession } from '../../types/shift.types';
import { showError, showSuccess } from '../../utils/ToastUtils';

const CashierSalesPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Cashier Shift Session
  const [session, setSession] = useState<CashierShiftSession | null>(() => readCashierShiftSession());
  const [cinemaName, setCinemaName] = useState<string>('');

  // Search & Catalog
  const [searchKeyword, setSearchKeyword] = useState('');
  const [schedules, setSchedules] = useState<SearchScheduleResult[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [selectedDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  // Selection state
  const [selectedMovieId, setSelectedMovieId] = useState<string | null>(null);
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(null);
  const [seatMap, setSeatMap] = useState<PublicSeatMap | null>(null);
  const [pricing, setPricing] = useState<PublicPricing | null>(null);
  const [loadingSeats, setLoadingSeats] = useState(false);
  const [selectedSeats, setSelectedSeats] = useState<PublicSeat[]>([]);
  const [seatSegmentMap, setSeatSegmentMap] = useState<Record<string, string>>({});

  // Checkout State
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerLookupStatus, setCustomerLookupStatus] = useState<'idle' | 'loading' | 'found' | 'not-found'>('idle');

  
  const [voucherId, setVoucherId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<number>(2); // Default to CASH (2)
  const [bookingLoading, setBookingLoading] = useState(false);

  // Success Modal State
  const [completedOrder, setCompletedOrder] = useState<any | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // WS Seat Lock
  const { lockedSeats, lockSeat, unlockSeat } = useSeatWs(selectedScheduleId);

  // Parse cinemaName from session
  useEffect(() => {
    if (!session) {
      navigate('/cashier', { replace: true });
      return;
    }
    // Fetch user info or use cached local storage
    const storedUser = localStorage.getItem('user_info');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setCinemaName(user.cinemaName || 'Cinema Branch');
      } catch {
        setCinemaName('Cinema Branch');
      }
    }
  }, [session, navigate]);

  // Fetch Schedules Catalog
  const fetchSchedulesCatalog = useCallback(async () => {
    const storedUser = localStorage.getItem('user_info');
    let cinemaId = '';
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        cinemaId = user.cinemaId || (user.managedCinemas && user.managedCinemas[0]?.cinemaId) || '';
      } catch { /* ignore */ }
    }

    if (!cinemaId) return;

    setLoadingCatalog(true);
    try {
      const response = await publicApi.searchSchedules(selectedDate, undefined, cinemaId);
      setSchedules(response.data || []);
    } catch (err) {
      showError(t('cashierSales.errorLoadingSchedule'));
    } finally {
      setLoadingCatalog(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchSchedulesCatalog();
  }, [fetchSchedulesCatalog]);

  // Fetch Seat Map & Pricing
  const fetchSeatData = useCallback(async (scheduleId: string) => {
    setLoadingSeats(true);
    setSelectedSeats([]);
    setSeatSegmentMap({});
    try {
      const [seatRes, pricingRes] = await Promise.all([
        publicApi.getSeatMap(scheduleId),
        publicApi.getPricing(scheduleId)
      ]);
      setSeatMap(seatRes.data);
      setPricing(pricingRes.data);

      // Pre-select first customer segment for each seat
      if (pricingRes.data?.segmentPrices?.length > 0) {
        const defaultSegmentId = pricingRes.data.segmentPrices[0].userSegmentId;
        const initialSegments: Record<string, string> = {};
        seatRes.data?.seatMap?.forEach(seat => {
          initialSegments[seat.seatId] = defaultSegmentId;
        });
        setSeatSegmentMap(initialSegments);
      }
    } catch (err) {
      showError(t('cashierSales.errorLoadingSeatMap'));
      setSeatMap(null);
      setPricing(null);
    } finally {
      setLoadingSeats(false);
    }
  }, []);

  useEffect(() => {
    if (selectedScheduleId) {
      fetchSeatData(selectedScheduleId);
    } else {
      setSeatMap(null);
      setPricing(null);
    }
  }, [selectedScheduleId, fetchSeatData]);

  // Search Customer Lookup
  const handleCustomerLookup = async () => {
    const email = customerEmail.trim();
    if (!email) {
      showError(t('cashierSales.errorEnterEmail'));
      return;
    }
    setCustomerLookupStatus('loading');
    try {
      const response = await bookingApi.lookupCustomerByEmail(email);
      if (response.data) {
        setCustomerName(response.data.userName);
        setCustomerPhone(response.data.phoneNumber);
        setCustomerLookupStatus('found');
        showSuccess(t('cashierSales.memberFound', { userName: response.data.userName }));
      } else {
        setCustomerLookupStatus('not-found');
        showError(t('cashierSales.memberNotFound'));
      }
    } catch {
      setCustomerLookupStatus('not-found');
      showError(t('cashierSales.errorLookupCustomer'));
    }
  };

  // Toggle seat selection
  const toggleSeat = async (seat: PublicSeat) => {
    if (seat.isBooked) return;
    const isCurrentlySelected = selectedSeats.find(s => s.seatId === seat.seatId);
    const isLockedByOther = lockedSeats[seat.seatId] && !isCurrentlySelected;
    if (isLockedByOther) return;

    const cashierName = session?.staffName || 'Cashier';

    if (isCurrentlySelected) {
      setSelectedSeats(prev => prev.filter(s => s.seatId !== seat.seatId));
      await unlockSeat(seat.seatId);
    } else {
      if (selectedSeats.length >= 10) {
        showError(t('cashierSales.errorMaxSeats'));
        return;
      }
      setSelectedSeats(prev => [...prev, seat]);
      const success = await lockSeat(seat.seatId, cashierName);
      if (!success) {
        setSelectedSeats(prev => prev.filter(s => s.seatId !== seat.seatId));
        showError(t('toast.seatLockFailed', 'Không thể chọn ghế này. Ghế đã bị chọn hoặc thao tác quá nhanh.'));
      }
    }
  };

  // Dynamic price calculation
  const totalPrice = useMemo(() => {
    return selectedSeats.reduce((sum, seat) => {
      const segmentId = seatSegmentMap[seat.seatId];
      const segment = pricing?.segmentPrices.find(s => s.userSegmentId === segmentId);
      return sum + (segment?.finalPrice || 0);
    }, 0);
  }, [selectedSeats, seatSegmentMap, pricing]);

  // Handle Checkout / Booking
  const handleCheckout = async () => {
    if (!selectedScheduleId) return;
    if (selectedSeats.length === 0) {
      showError(t('cashierSales.errorSelectAtLeastOneSeat'));
      return;
    }

    const name = customerName.trim();
    const phone = customerPhone.trim();
    if (!name || !phone) {
      showError(t('cashierSales.errorEnterCustomerInfo'));
      return;
    }

    setBookingLoading(true);
    try {
      const payload = {
        scheduleId: selectedScheduleId,
        seatSelections: selectedSeats.map(s => ({
          seatId: s.seatId,
          userSegmentId: seatSegmentMap[s.seatId]
        })),
        customerName: name,
        customerEmail: customerEmail.trim() || undefined,
        customerPhone: phone,
        voucherId: voucherId || undefined,
        staffId: session?.staffId,
        paymentMethod: paymentMethod // 2 = CASH, 0 = VNPAY
      };

      const res = await bookingApi.createBooking(payload);
      
      if (paymentMethod === 2) {
        // Cash payment succeeded instantly
        setCompletedOrder({
          bookingCode: res.data.bookingCode || `GXD-${res.data.orderId.substring(0,8).toUpperCase()}`,
          movieName: seatMap?.movieName,
          auditoriumName: seatMap?.auditoriumName,
          showTime: seatMap?.startTime,
          seats: selectedSeats.map(s => s.seatName).join(', '),
          totalPrice: res.data.totalPrice || totalPrice,
          customerName: name,
          customerPhone: phone,
          orderDate: res.data.orderDate || new Date().toISOString()
        });
        showSuccess(t('cashierSales.cashPaymentSuccess'));
        setShowSuccessModal(true);

        // Reset state
        setSelectedSeats([]);
        if (selectedScheduleId) {
          fetchSeatData(selectedScheduleId);
        }
      } else {
        // VNPay payment setup
        if (res.data.paymentUrl) {
          window.open(res.data.paymentUrl, '_blank');
          showSuccess(t('cashierSales.vnpayPaymentOpened'));
        } else {
          showError(t('cashierSales.errorVnpayLink'));
        }
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || t('cashierSales.errorOrderCreation');
      showError(errorMsg);
    } finally {
      setBookingLoading(false);
    }
  };

  // Clock Out
  const handleClockOut = async () => {
    if (!window.confirm(t('cashierSales.confirmEndShift'))) return;
    setBookingLoading(true);
    try {
      const staffToken = session?.accessToken;
      await staffShiftApi.clockOut({}, staffToken);
      showSuccess(t('cashierSales.shiftLogoutSuccess'));
    } catch (err) {
      showError(t('cashierSales.errorShiftHandover'));
    } finally {
      localStorage.removeItem(CASHIER_SHIFT_SESSION_KEY);
      setSession(null);
      setBookingLoading(false);
      navigate('/cashier', { replace: true });
    }
  };

  // Website logout (completely log out of the shared POS account)
  const handleWebsiteLogout = async () => {
    if (!window.confirm(t('cashierSales.confirmLogoutPos'))) return;
    setBookingLoading(true);
    try {
      if (session?.accessToken) {
        try {
          await staffShiftApi.clockOut({}, session.accessToken);
        } catch { /* ignore clockout error */ }
      }
      await authApi.logout();
    } catch {
      // ignore
    } finally {
      localStorage.removeItem('user_info');
      localStorage.removeItem(CASHIER_SHIFT_SESSION_KEY);
      Cookies.remove('X-Access-Token');
      setSession(null);
      setBookingLoading(false);
      showSuccess(t('cashierSales.logoutSuccess'));
      navigate('/login', { replace: true });
    }
  };

  // Reset fields to start a new transaction
  const handleNewTransaction = () => {
    setSelectedSeats([]);
    setCustomerEmail('');
    setCustomerName('');
    setCustomerPhone('');
    setCustomerLookupStatus('idle');
    setVoucherId('');
    setPaymentMethod(2);
    setShowSuccessModal(false);
    setCompletedOrder(null);
  };

  // Filter schedules based on keyword search
  const filteredSchedules = useMemo(() => {
    if (!searchKeyword.trim()) return schedules;
    const kw = searchKeyword.toLowerCase();
    return schedules.filter(s => 
      s.movieName.toLowerCase().includes(kw) || 
      s.movieGenres.some(g => g.toLowerCase().includes(kw))
    );
  }, [schedules, searchKeyword]);


  // Max Col and Row for rendering grid
  const maxCol = seatMap?.seatMap ? Math.max(...seatMap.seatMap.map(s => s.colIndex)) + 1 : 0;
  const maxRow = seatMap?.seatMap ? Math.max(...seatMap.seatMap.map(s => s.rowIndex)) + 1 : 0;

  return (
    <div className="min-h-screen bg-[#060608] text-[#e2e8f0] font-sans flex flex-col antialiased selection:bg-[#ff8a00] selection:text-black">
      <style>{`
        .glass-panel {
          background: rgba(26, 26, 36, 0.45);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
        .seat-selected {
          background-color: #ff8a00 !important;
          color: #000000 !important;
          border-color: #ff8a00 !important;
          box-shadow: 0 0 12px rgba(255, 138, 0, 0.45);
        }
        .screen-curve {
          height: 6px;
          width: 80%;
          background: linear-gradient(90deg, transparent 0%, #ff8a00 50%, transparent 100%);
          border-radius: 50%;
          filter: blur(1px) drop-shadow(0 0 6px #ff8a00);
        }
        .custom-scroll::-webkit-scrollbar {
          width: 5px;
          height: 5px;
        }
        .custom-scroll::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.2);
        }
        .custom-scroll::-webkit-scrollbar-thumb {
          background: rgba(255, 138, 0, 0.3);
          border-radius: 10px;
        }
        .custom-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 138, 0, 0.6);
        }
      `}</style>

      {/* POS Top Header bar */}
      <header className="h-16 border-b border-white/5 bg-[#0f0f15]/80 backdrop-blur-md px-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#ff8a00] to-violet-600 flex items-center justify-center shadow-lg shadow-[#ff8a00]/10">
            <Ticket className="text-white" size={18} />
          </div>
          <div>
            <h1 className="font-extrabold text-md tracking-tight text-white m-0 flex items-center gap-2">
              CINEMA POS <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-amber-500/20 text-[#ff8a00] border border-amber-500/30">Terminal</span>
            </h1>
            <p className="text-[11px] text-zinc-400 m-0">{cinemaName}</p>
          </div>
        </div>

        {session && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-white/5 border border-white/5">
              <User className="text-[#ff8a00]" size={16} />
              <div className="text-left">
                <p className="text-xs font-bold text-white leading-tight m-0">{session.staffName}</p>
                <p className="text-[10px] text-zinc-400 m-0">{t('cashierSales.cashierActive')}</p>
              </div>
            </div>
            
            <button
              onClick={handleClockOut}
              disabled={bookingLoading}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-red-400 bg-red-950/20 border border-red-900/30 hover:bg-red-950/40 hover:text-red-300 transition-colors"
            >
              <LogOut size={14} />
              {t('cashierSales.shiftHandover')}
            </button>

            <button
              onClick={handleWebsiteLogout}
              disabled={bookingLoading}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-zinc-400 bg-white/5 border border-white/10 hover:bg-white/10 hover:text-white transition-colors"
            >
              <LogOut size={14} />
              {t('cashierSales.logout')}
            </button>
          </div>
        )}
      </header>

      {/* Main Dashboard Workspace split */}
      <main className="flex-1 grid grid-cols-12 overflow-hidden h-[calc(100vh-64px)]">
        
        {/* Left Column: Movie list and showtimes (Col span 3) */}
        <section className="col-span-3 border-r border-white/5 bg-[#0b0b0f] flex flex-col overflow-hidden">
          <div className="p-4 border-b border-white/5 bg-black/10">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
              <input
                type="text"
                placeholder={t('cashierSales.searchMovies')}
                value={searchKeyword}
                onChange={e => setSearchKeyword(e.target.value)}
                className="w-full bg-[#161622] text-sm text-white pl-9 pr-4 py-2.5 rounded-xl border border-white/5 outline-none focus:border-[#ff8a00]/50 transition-colors"
              />
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Calendar size={14} className="text-zinc-400" />
              <span className="text-xs text-zinc-300 font-medium">{t('cashierSales.today')} ({new Date(selectedDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })})</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scroll p-3 space-y-2.5">
            {loadingCatalog ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="animate-spin text-[#ff8a00]" size={32} />
                <p className="text-xs text-zinc-400">{t('cashierSales.loadingMovies')}</p>
              </div>
            ) : filteredSchedules.length === 0 ? (
              <div className="text-center py-16 text-zinc-500">
                <Film className="mx-auto text-zinc-700 mb-3" size={36} />
                <p className="text-xs">{t('cashierSales.noMoviesFound')}</p>
              </div>
            ) : (
              filteredSchedules.map(movie => {
                const isSelected = selectedMovieId === movie.movieId;
                return (
                  <div
                    key={movie.movieId}
                    className={`rounded-xl border transition-all duration-200 overflow-hidden cursor-pointer ${
                      isSelected 
                        ? 'bg-[#1e1a12]/30 border-[#ff8a00]/40 shadow-sm shadow-[#ff8a00]/5' 
                        : 'bg-[#12121a]/60 border-white/5 hover:bg-[#181824]'
                    }`}
                    onClick={() => {
                      setSelectedMovieId(movie.movieId);
                      // Clear schedule if different movie
                      if (selectedMovieId !== movie.movieId) {
                        setSelectedScheduleId(null);
                      }
                    }}
                  >
                    <div className="p-3 flex gap-3">
                      <img
                        src={movie.movieImageUrl}
                        alt={movie.movieName}
                        className="w-14 h-20 object-cover rounded-lg bg-zinc-900 flex-shrink-0"
                        onError={e => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=150';
                        }}
                      />
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <h3 className="text-sm font-bold text-white truncate leading-snug mb-1">{movie.movieName}</h3>
                          <p className="text-[11px] text-zinc-400 truncate">{movie.movieGenres.join(', ')}</p>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 font-bold border border-zinc-700/40">
                            {movie.movieRequiredAgeSymbol}
                          </span>
                          <span className="text-[10px] text-zinc-400 flex items-center gap-1 font-semibold">
                            <Clock size={10} /> {movie.movieDuration} {t('cashierSales.minutes')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Showtimes slots list if selected */}
                    {isSelected && (
                      <div className="px-3 pb-3 pt-2 border-t border-white/5 bg-black/10">
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">{t('cashierSales.todayShowtimes')}</p>
                        <div className="grid grid-cols-2 gap-2">
                          {movie.cinemas.flatMap(c => c.formatShowtimes).flatMap(fs => 
                            fs.showtimes.map(st => {
                              const isSlotSelected = selectedScheduleId === st.scheduleId;
                              return (
                                <button
                                  key={st.scheduleId}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedScheduleId(st.scheduleId);
                                  }}
                                  className={`px-2 py-1.5 rounded-lg text-xs font-bold transition-all border text-center ${
                                    isSlotSelected
                                      ? 'bg-[#ff8a00] text-black border-[#ff8a00]'
                                      : 'bg-[#20202e] text-zinc-300 border-white/5 hover:bg-[#28283a] hover:text-white'
                                  }`}
                                >
                                  {new Date(st.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                  <span className="block text-[9px] font-medium opacity-70 truncate">{st.auditoriumNumber}</span>
                                </button>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Middle Column: Seat Map Grid (Col span 5) */}
        <section className="col-span-5 bg-[#0f0f15]/30 flex flex-col overflow-hidden">
          {loadingSeats ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4">
              <Loader2 className="animate-spin text-[#ff8a00]" size={36} />
              <p className="text-sm text-zinc-400">{t('cashierSales.loadingSeatMap')}</p>
            </div>
          ) : !selectedScheduleId || !seatMap ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                <Monitor className="text-zinc-600" size={32} />
              </div>
              <h2 className="text-lg font-bold text-white mb-1">{t('cashierSales.auditoriumScreen')}</h2>
              <p className="text-xs text-zinc-500 max-w-xs leading-relaxed">
                {t('cashierSales.selectMovieAndShowtime')}
              </p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden p-6">
              {/* Showtime brief banner */}
              <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-6">
                <div>
                  <span className="text-[10px] uppercase font-extrabold tracking-widest text-[#ff8a00]">{seatMap.movieVisualFormatName}</span>
                  <h2 className="text-base font-extrabold text-white leading-tight mt-0.5 mb-1">{seatMap.movieName}</h2>
                  <p className="text-xs text-zinc-400 m-0">
                    {t('cashierSales.room')}: <span className="text-white font-bold">{seatMap.auditoriumName}</span> • {t('cashierSales.showTime')}: <span className="text-white font-bold">{new Date(seatMap.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                  </p>
                </div>
                <button
                  onClick={() => selectedScheduleId && fetchSeatData(selectedScheduleId)}
                  className="btn-icon p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-zinc-400 hover:text-white"
                  title={t('cashierSales.reloadSeats')}
                >
                  <RefreshCw size={14} />
                </button>
              </div>

              {/* Curve screen */}
              <div className="w-full flex flex-col items-center mb-12">
                <div className="screen-curve"></div>
                <p className="text-[9px] tracking-[0.4em] uppercase text-zinc-500 mt-2.5">{t('cashierSales.screen')}</p>
              </div>

              {/* Seats Grid */}
              <div className="flex-1 flex items-center justify-center overflow-auto custom-scroll mb-8">
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${maxCol}, minmax(0, 1fr))`,
                    gridTemplateRows: `repeat(${maxRow}, minmax(0, 1fr))`,
                    gap: 6,
                    padding: 12,
                    borderRadius: 16,
                    backgroundColor: 'rgba(255, 255, 255, 0.01)',
                    border: '1px solid rgba(255,255,255,0.02)',
                    width: 'fit-content'
                  }}
                >
                  {seatMap.seatMap?.map(seat => {
                    const isSelected = selectedSeats.find(s => s.seatId === seat.seatId);
                    const lockedBy = lockedSeats[seat.seatId];
                    const isLockedByOther = lockedBy && !isSelected;

                    return (
                      <button
                        key={seat.seatId}
                        disabled={seat.isBooked || !!isLockedByOther}
                        onClick={() => toggleSeat(seat)}
                        style={{
                          gridColumnStart: seat.colIndex + 1,
                          gridRowStart: seat.rowIndex + 1,
                          width: 34,
                          height: 34,
                          fontSize: 10
                        }}
                        className={`rounded-lg flex items-center justify-center font-bold border transition-all duration-150 active:scale-90 ${
                          seat.isBooked
                            ? 'bg-zinc-950/60 text-zinc-800 border-zinc-900 cursor-not-allowed opacity-30'
                            : isLockedByOther
                            ? 'bg-red-950/30 text-red-500 border-red-900/50 cursor-not-allowed'
                            : isSelected
                            ? 'seat-selected'
                            : 'bg-[#181824] text-zinc-300 border-white/5 hover:bg-[#202030] hover:text-white cursor-pointer'
                        }`}
                        title={isLockedByOther ? `${t('cashierSales.lockedByOther')}: ${lockedBy}` : seat.seatName}
                      >
                        {seat.seatName}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Legends */}
              <div className="flex items-center justify-center gap-6 px-4 py-3 rounded-xl bg-white/5 border border-white/5 text-xs text-zinc-400">
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded bg-[#181824] border border-white/5"></div>
                  <span>{t('cashierSales.available')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded bg-[#ff8a00] border border-[#ff8a00]"></div>
                  <span>{t('cashierSales.selecting')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded bg-red-950/30 border border-red-900/50"></div>
                  <span>{t('cashierSales.reserving')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded bg-zinc-950/60 border border-zinc-900 opacity-30"></div>
                  <span>{t('cashierSales.sold')}</span>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Right Column: Order Summary, Customer Lookup & Checkout (Col span 4) */}
        <section className="col-span-4 border-l border-white/5 bg-[#0b0b0f] flex flex-col overflow-hidden">
          <div className="p-4 border-b border-white/5 bg-black/10 flex items-center gap-2">
            <ShoppingCart size={16} className="text-[#ff8a00]" />
            <h2 className="text-sm font-bold text-white m-0">{t('cashierSales.paymentDetails')}</h2>
          </div>

          <div className="flex-1 overflow-y-auto custom-scroll p-4 space-y-5">
            {/* Movie showtime detail box */}
            {seatMap && (
              <div className="p-3 bg-white/5 border border-white/5 rounded-xl space-y-1.5 text-xs text-zinc-400">
                <div className="flex justify-between">
                  <span>{t('cashierSales.movie')}:</span>
                  <span className="font-bold text-white text-right">{seatMap.movieName}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t('cashierSales.timeSlot')}:</span>
                  <span className="font-semibold text-white">
                    {new Date(seatMap.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} ({new Date(seatMap.startTime).toLocaleDateString('vi-VN')})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>{t('cashierSales.auditorium')}:</span>
                  <span className="font-semibold text-white">{seatMap.auditoriumName}</span>
                </div>
              </div>
            )}

            {/* Selected Seats Listing */}
            <div>
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-2">{t('cashierSales.selectedSeatsCount', { count: selectedSeats.length })}</label>
              {selectedSeats.length === 0 ? (
                <div className="text-center py-6 border border-dashed border-white/5 rounded-xl text-zinc-500 text-xs italic">
                  {t('cashierSales.noSeatsSelected')}
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedSeats.map(seat => {
                    const segmentId = seatSegmentMap[seat.seatId];
                    const segment = pricing?.segmentPrices.find(s => s.userSegmentId === segmentId);
                    return (
                      <div key={seat.seatId} className="p-3 bg-[#161622] border border-white/5 rounded-xl flex flex-col gap-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-[#ff8a00] text-sm">{t('cashierSales.seat')} {seat.seatName}</span>
                          <span className="font-extrabold text-white text-sm">
                            {(segment?.finalPrice || 0).toLocaleString('vi-VN')} đ
                          </span>
                        </div>
                        
                        {/* Segment selector (Adult, student etc.) */}
                        <div className="flex gap-2 items-center">
                          <span className="text-[10px] text-zinc-400">{t('cashierSales.ticketType')}:</span>
                          <select
                            value={seatSegmentMap[seat.seatId] || ''}
                            onChange={(e) => setSeatSegmentMap(prev => ({ ...prev, [seat.seatId]: e.target.value }))}
                            className="flex-1 bg-black/40 text-zinc-300 text-xs py-1.5 px-2 rounded border border-white/5 outline-none cursor-pointer"
                          >
                            {pricing?.segmentPrices.map(sp => (
                              <option key={sp.userSegmentId} value={sp.userSegmentId} className="bg-[#0f0f15] text-white">
                                {sp.segmentName} ({(sp.finalPrice).toLocaleString('vi-VN')}đ)
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Customer Lookup Info */}
            <div className="p-4 bg-[#161622]/45 border border-white/5 rounded-xl space-y-3.5">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">{t('cashierSales.memberAccountOptional')}</label>
              
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder={t('cashierSales.memberEmailPlaceholder')}
                  value={customerEmail}
                  onChange={e => setCustomerEmail(e.target.value)}
                  className="flex-1 bg-black/40 text-xs text-white px-3 py-2 rounded-lg border border-white/5 outline-none focus:border-[#ff8a00]/30"
                />
                <button
                  type="button"
                  onClick={handleCustomerLookup}
                  className="px-3 py-2 rounded-lg bg-zinc-800 text-xs font-bold text-white border border-white/5 hover:bg-zinc-700 active:scale-95 transition-all"
                >
                  {t('cashierSales.lookup')}
                </button>
              </div>

              {customerLookupStatus !== 'idle' && (
                <p className="text-[10px] m-0 text-zinc-400">
                  {customerLookupStatus === 'loading' && t('cashierSales.lookupLoading')}
                  {customerLookupStatus === 'found' && t('cashierSales.lookupFound')}
                  {customerLookupStatus === 'not-found' && t('cashierSales.lookupNotFound')}
                </p>
              )}

              {/* Guest / Lookup details fields */}
              <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-white/5">
                <div>
                  <label className="text-[9px] text-zinc-400 block mb-1">{t('cashierSales.customerName')} *</label>
                  <input
                    type="text"
                    placeholder={t('cashierSales.customerNamePlaceholder')}
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    className="w-full bg-black/40 text-xs text-white px-2.5 py-2 rounded-lg border border-white/5 outline-none focus:border-[#ff8a00]/30"
                  />
                </div>
                <div>
                  <label className="text-[9px] text-zinc-400 block mb-1">{t('cashierSales.phoneNumber')} *</label>
                  <input
                    type="tel"
                    placeholder={t('cashierSales.phoneNumberPlaceholder')}
                    value={customerPhone}
                    onChange={e => setCustomerPhone(e.target.value)}
                    className="w-full bg-black/40 text-xs text-white px-2.5 py-2 rounded-lg border border-white/5 outline-none focus:border-[#ff8a00]/30"
                  />
                </div>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">{t('cashierSales.paymentMethod')}</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod(2)}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                    paymentMethod === 2
                      ? 'bg-[#ff8a00]/10 border-[#ff8a00] text-[#ff8a00]'
                      : 'bg-[#12121a]/60 border-white/5 text-zinc-400 hover:bg-[#181824]'
                  }`}
                >
                  <Banknote size={20} className="mb-1" />
                  <span className="text-xs font-bold">{t('cashierSales.cashPayment')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod(0)}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                    paymentMethod === 0
                      ? 'bg-violet-500/10 border-violet-500 text-violet-400'
                      : 'bg-[#12121a]/60 border-white/5 text-zinc-400 hover:bg-[#181824]'
                  }`}
                >
                  <CreditCard size={20} className="mb-1" />
                  <span className="text-xs font-bold">{t('cashierSales.vnpayPayment')}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Checkout footer block */}
          <div className="p-4 border-t border-white/5 bg-[#0f0f15]/90 space-y-3.5">
            <div className="flex justify-between items-center">
              <span className="text-zinc-400 text-xs">{t('cashierSales.totalPayment')}:</span>
              <span className="text-xl font-extrabold text-[#ff8a00]">
                {totalPrice.toLocaleString('vi-VN')} đ
              </span>
            </div>

            <button
              onClick={handleCheckout}
              disabled={selectedSeats.length === 0 || bookingLoading}
              className={`w-full h-12 rounded-xl font-bold flex items-center justify-center gap-2 border-none transition-all active:scale-98 ${
                selectedSeats.length === 0
                  ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                  : bookingLoading
                  ? 'bg-[#ff8a00]/70 text-black cursor-wait'
                  : 'bg-[#ff8a00] text-black hover:shadow-lg hover:shadow-[#ff8a00]/20 hover:scale-[1.01] cursor-pointer'
              }`}
            >
              {bookingLoading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  <CheckCircle2 size={18} />
                  <span>{t('cashierSales.confirmAndPrint')}</span>
                </>
              )}
            </button>
          </div>
        </section>
      </main>

      {/* POS Success modal print preview popup */}
      {showSuccessModal && completedOrder && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 z-50 animate-fadeIn">
          <div className="w-full max-w-md bg-[#101017] border border-[#ff8a00]/30 rounded-2xl p-6 shadow-2xl space-y-5 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
              <CheckCircle2 size={24} />
            </div>

            <div className="space-y-1">
              <h2 className="text-lg font-extrabold text-white">{t('cashierSales.paymentComplete')}</h2>
              <p className="text-xs text-zinc-400">{t('cashierSales.cashOrderRecorded')}</p>
            </div>

            {/* Simulated ticket paper box style */}
            <div className="p-4 bg-white text-black rounded-xl text-left font-mono text-xs shadow-inner space-y-3 relative overflow-hidden border border-zinc-200">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-red-500 via-[#ff8a00] to-violet-600"></div>
              
              <div className="text-center font-bold text-sm tracking-wider border-b border-dashed border-zinc-300 pb-2">
                CINEMA TICKET
              </div>

              <div className="space-y-1.5 pt-1">
                <div><span className="opacity-70">{t('cashierSales.bookingCode')}:</span> <strong className="float-right text-sm">{completedOrder.bookingCode}</strong></div>
                <div><span className="opacity-70">{t('cashierSales.movie')}:</span> <strong className="float-right text-right truncate max-w-[70%]">{completedOrder.movieName}</strong></div>
                <div><span className="opacity-70">{t('cashierSales.room')}:</span> <strong className="float-right">{completedOrder.auditoriumName}</strong></div>
                <div><span className="opacity-70">{t('cashierSales.showTime')}:</span> <strong className="float-right">{new Date(completedOrder.showTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} ({new Date(completedOrder.showTime).toLocaleDateString('vi-VN')})</strong></div>
                <div><span className="opacity-70">{t('cashierSales.seats')}:</span> <strong className="float-right">{completedOrder.seats}</strong></div>
                <div className="border-t border-dashed border-zinc-300 pt-2 font-bold text-sm mt-2">
                  <span>{t('cashierSales.totalAmount')}:</span>
                  <span className="float-right">{(completedOrder.totalPrice).toLocaleString('vi-VN')} đ</span>
                </div>
              </div>

              <div className="border-t border-dashed border-zinc-300 pt-2 space-y-1">
                <div><span className="opacity-70">{t('cashierSales.customer')}:</span> <span className="float-right">{completedOrder.customerName}</span></div>
                <div><span className="opacity-70">{t('cashierSales.phone')}:</span> <span className="float-right">{completedOrder.customerPhone}</span></div>
                <div><span className="opacity-70">{t('cashierSales.printTime')}:</span> <span className="float-right">{new Date(completedOrder.orderDate).toLocaleTimeString('vi-VN')}</span></div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="w-full h-11 rounded-xl bg-white text-black font-bold flex items-center justify-center gap-2 hover:bg-zinc-100 transition-all cursor-pointer border-none"
              >
                <Printer size={16} />
                <span>{t('cashierSales.printReceipt')}</span>
              </button>

              <button
                type="button"
                onClick={handleNewTransaction}
                className="w-full h-11 rounded-xl bg-[#ff8a00] text-black font-bold flex items-center justify-center gap-2 hover:bg-[#ff8a00]/95 hover:shadow-lg hover:shadow-[#ff8a00]/10 transition-all cursor-pointer border-none"
              >
                <span>{t('cashierSales.newTransaction')}</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CashierSalesPage;
