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
import Header from '../../components/Header';
import { voucherApi, type UserVoucherDto } from '../../api/voucherApi';

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
    const [isCashierMode, setIsCashierMode] = useState<boolean>(false);
    const [userRole, setUserRole] = useState<string>('Guest');
    const [myVouchers, setMyVouchers] = useState<UserVoucherDto[]>([]);
    const [selectedVoucherId, setSelectedVoucherId] = useState<string>('');
    const [customerInfo, setCustomerInfo] = useState({ name: '', email: '', phone: '', address: '' });

    const [hubConnection, setHubConnection] = useState<signalR.HubConnection | null>(null);
    const [lockedSeats, setLockedSeats] = useState<Record<string, string>>({});

    useEffect(() => {
        const storedUser = localStorage.getItem('user_info');
        if (storedUser) {
            const user = JSON.parse(storedUser);
            setUserName(user.username || user.userName || 'Guest');
            
            const roles: string[] = user.roles || [];
            const isCashier = roles.includes('Cashier');
            setIsCashierMode(isCashier);

            if (roles.includes('VIP')) {
                setUserRole('VIP');
            } else if (roles.includes('Student')) {
                setUserRole('Student');
            } else if (roles.includes('Customer') || roles.includes('User')) {
                setUserRole('User');
            } else if (isCashier) {
                setUserRole('Cashier');
            } else {
                setUserRole('User');
            }
            setIsLoggedIn(true);
        } else {
            setUserName('Guest');
            setUserRole('Guest');
            setIsLoggedIn(false);
            setIsCashierMode(false);
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

    useEffect(() => {
        if (isLoggedIn) {
            const fetchWallet = async () => {
                try {
                    const res = await voucherApi.getMyVouchers();
                    if (res.isSuccess) {
                        const today = new Date().getTime();
                        const unused = (res.data || []).filter(v => 
                            !v.isUsed && 
                            (!v.validTo || new Date(v.validTo).getTime() >= today)
                        );
                        setMyVouchers(unused);
                    }
                } catch (err) {
                    console.error("Error fetching user vouchers:", err);
                }
            };
            fetchWallet();
        }
    }, [isLoggedIn]);

    const ROLE_DISCOUNTS: Record<string, number> = {
        'Guest': 0,
        'User': 5,
        'Student': 10,
        'VIP': 15
    };
    const roleDiscountPercent = ROLE_DISCOUNTS[userRole] || 0;

    const selectedVoucher = myVouchers.find(v => v.voucherId === selectedVoucherId);
    const voucherDiscountPercent = selectedVoucher ? selectedVoucher.voucherDiscountPercent : 0;

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
        if (!isLoggedIn || isCashierMode) {
            if (!customerInfo.name.trim() || !customerInfo.email.trim() || !customerInfo.phone.trim()) {
                showError(t('toast.fillContactInfo')); return;
            }
        }
        setBookingLoading(true);
        try {
            const storedSession = localStorage.getItem('cashier_shift_session');
            let staffIdFromSession: string | null = null;
            if (storedSession) {
                try {
                    const sessionData = JSON.parse(storedSession);
                    staffIdFromSession = sessionData.staffId || null;
                } catch { /* ignore */ }
            }

            const payload: any = {
                scheduleId: scheduleId!.trim(),
                seatSelections: selectedSeats.map(s => ({ seatId: s.seatId, userSegmentId: seatSegmentMap[s.seatId] })),
                customerName: (isLoggedIn && !isCashierMode) ? undefined : customerInfo.name.trim(),
                customerEmail: (isLoggedIn && !isCashierMode) ? undefined : customerInfo.email.trim(),
                customerPhone: (isLoggedIn && !isCashierMode) ? undefined : customerInfo.phone.trim(),
                customerAddress: (isLoggedIn && !isCashierMode) ? undefined : customerInfo.address.trim(),
                voucherId: selectedVoucherId ? selectedVoucherId : undefined,
                staffId: staffIdFromSession
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
            <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
                <Loader2 size={48} className="text-[#ff8a00] animate-spin" />
            </div>
        );
    }

    if (error || !seatMap) {
        return (
            <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center p-6 text-center">
                <AlertCircle size={64} className="text-red-400 mb-4" />
                <p className="text-2xl font-bold text-white mb-6">{error || 'Schedule not found'}</p>
                <button onClick={() => navigate('/home')} className="px-6 py-3 rounded-xl font-bold text-black bg-[#ff8a00]">Go Home</button>
            </div>
        );
    }

    const maxCol = Math.max(...(seatMap.seatMap?.map(s => s.colIndex) || [0])) + 1;

    return (
        <div className="min-h-screen bg-[#0A0A0A] text-[#e5e2e1] font-sans selection:bg-[#ff8a00] selection:text-black">
            <style>{`
                .glass-card {
                    background: rgba(255, 255, 255, 0.05);
                    backdrop-filter: blur(32px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-top: 1px solid rgba(255, 255, 255, 0.15);
                    border-left: 1px solid rgba(255, 255, 255, 0.15);
                }
                .seat-selected {
                    background-color: #ff8a00 !important;
                    color: #000 !important;
                    box-shadow: 0 0 15px rgba(255, 138, 0, 0.4);
                }
                .screen-curve {
                    height: 4px;
                    width: 100%;
                    background: linear-gradient(90deg, transparent 0%, #ff8a00 50%, transparent 100%);
                    border-radius: 50%;
                    filter: blur(1px) drop-shadow(0 0 8px #ff8a00);
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                    height: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(0,0,0,0.1);
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #ffb77f;
                    border-radius: 10px;
                }
            `}</style>

            {/* Redesigned Unified Header */}
            <Header />

            {/* Main Content */}
            <main className="pt-32 pb-24 px-6 md:px-16 max-w-7xl mx-auto">
                {/* Movie Info Breadcrumb */}
                <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 border-l-4 border-[#ff8a00] pl-6">
                    <div>
                        <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-2 leading-tight">{seatMap.movieName}</h1>
                        <div className="flex flex-wrap items-center gap-4 text-[#ddc1ae] text-sm font-semibold">
                            <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[18px]">movie</span> {seatMap.auditoriumName}</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-white/20"></span>
                            <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[18px]">calendar_today</span> {new Date(seatMap.startTime).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-white/20"></span>
                            <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[18px]">schedule</span> {new Date(seatMap.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                    </div>
                    <button className="flex items-center gap-2 text-[#ff8a00] hover:gap-4 transition-all duration-300 bg-transparent border-none cursor-pointer font-bold" onClick={() => navigate(-1)}>
                        <span className="material-symbols-outlined">arrow_back</span>
                        Change Session
                    </button>
                </div>

                {/* Seat and Summary Area */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                    {/* Left: Seat Selection */}
                    <div className="lg:col-span-8 flex flex-col items-center">
                        {/* Screen curve */}
                        <div className="w-full max-w-2xl mb-16 relative">
                            <div className="screen-curve"></div>
                            <p className="text-center text-[#ddc1ae] text-[10px] tracking-[0.4em] uppercase mt-4">Screen</p>
                        </div>

                        {/* Seat Grid */}
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
                        }} className="mb-16">
                            {seatMap.seatMap?.map((seat) => {
                                const isSelected = selectedSeats.find(s => s.seatId === seat.seatId);
                                const lockedBy = lockedSeats[seat.seatId];
                                const isLockedByOther = lockedBy && !isSelected;

                                return (
                                    <button
                                        key={seat.seatId}
                                        disabled={seat.isBooked || !!isLockedByOther}
                                        onClick={() => toggleSeat(seat)}
                                        className={`w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center font-bold text-xs transition-all duration-200 active:scale-90 border-none ${
                                            seat.isBooked
                                                ? 'bg-white/5 opacity-20 cursor-not-allowed text-zinc-600'
                                                : isLockedByOther
                                                ? 'bg-amber-500/10 text-[#e9c349] border border-[#e9c349]/30 cursor-not-allowed'
                                                : isSelected
                                                ? 'seat-selected'
                                                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white cursor-pointer'
                                        }`}
                                        title={isLockedByOther ? `Selected by ${lockedBy}` : seat.seatName}
                                    >
                                        {seat.seatName}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Legend */}
                        <div className="flex flex-wrap justify-center gap-8 px-6 py-4 rounded-full glass-card">
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded-sm bg-zinc-800"></div>
                                <span className="text-xs text-[#ddc1ae]">Available</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded-sm bg-[#ff8a00] shadow-[0_0_8px_rgba(255,138,0,0.5)]"></div>
                                <span className="text-xs text-[#ddc1ae]">Selected</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded-sm bg-amber-500/20 border border-amber-500/40"></div>
                                <span className="text-xs text-[#ddc1ae]">Locked</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded-sm bg-white/5 opacity-20"></div>
                                <span className="text-xs text-[#ddc1ae]">Occupied</span>
                            </div>
                        </div>
                    </div>

                    {/* Right: Summary */}
                    <aside className="lg:col-span-4 sticky top-32 w-full">
                        <div className="glass-card rounded-2xl p-8 shadow-2xl overflow-hidden relative border border-white/5">
                            <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#ff8a00]/10 blur-[100px] rounded-full pointer-events-none"></div>
                            
                            <div className="flex items-center gap-3 mb-8">
                                <span className="material-symbols-outlined text-[#ff8a00]" style={{ fontVariationSettings: "'FILL' 1" }}>shopping_cart</span>
                                <h2 className="text-xl font-bold text-white">Booking Summary</h2>
                            </div>

                            <div className="space-y-6 mb-8">
                                <div className="flex justify-between items-start">
                                    <span className="text-zinc-400 text-xs uppercase tracking-wider font-semibold">Movie</span>
                                    <span className="text-white font-bold text-right break-words max-w-[60%]">{seatMap.movieName}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-zinc-400 text-xs uppercase tracking-wider font-semibold">Venue</span>
                                    <span className="text-white font-semibold">{seatMap.auditoriumName}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-zinc-400 text-xs uppercase tracking-wider font-semibold">Format</span>
                                    <span className="text-white font-semibold">{seatMap.movieVisualFormatName || '2D'}</span>
                                </div>
                                
                                {/* Selected Seats */}
                                <div className="pt-6 border-t border-white/5">
                                    <span className="text-[#ddc1ae] text-xs uppercase tracking-wider block mb-3 font-bold">Selected Seats</span>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedSeats.length === 0 ? (
                                            <span className="text-zinc-500 italic text-sm">No seats selected yet</span>
                                        ) : (
                                            selectedSeats.map(seat => (
                                                <div key={seat.seatId} className="flex flex-col gap-2 p-3 bg-white/5 border border-white/10 rounded-xl w-full">
                                                    <div className="flex justify-between items-center">
                                                        <span className="font-bold text-[#ff8a00]">Seat {seat.seatName}</span>
                                                        <span className="font-bold text-white">
                                                            {(pricing?.segmentPrices.find(s => s.userSegmentId === seatSegmentMap[seat.seatId])?.finalPrice || 0).toLocaleString('vi-VN')}đ
                                                        </span>
                                                    </div>
                                                    <select
                                                        value={seatSegmentMap[seat.seatId] || ''}
                                                        onChange={(e) => setSeatSegmentMap(prev => ({ ...prev, [seat.seatId]: e.target.value }))}
                                                        className="w-full bg-zinc-900 text-zinc-300 text-xs p-2 rounded border border-white/5 outline-none cursor-pointer"
                                                    >
                                                        {pricing?.segmentPrices.map(segment => (
                                                            <option key={segment.userSegmentId} value={segment.userSegmentId} className="bg-zinc-950 text-white">
                                                                {segment.segmentName}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                            {/* Voucher Selector Dropdown */}
                             {isLoggedIn && !isCashierMode && (
                                 <div className="mb-6">
                                     <label className="text-zinc-400 text-xs uppercase tracking-wider block mb-2 font-semibold">
                                         Apply Voucher
                                     </label>
                                     <select
                                         value={selectedVoucherId}
                                         onChange={(e) => setSelectedVoucherId(e.target.value)}
                                         className="w-full bg-zinc-900 text-zinc-300 text-sm p-3 rounded-lg border border-white/10 outline-none cursor-pointer focus:border-[#ff8a00] transition-colors"
                                     >
                                         <option value="">No voucher applied</option>
                                         {myVouchers.map((v) => (
                                             <option key={v.voucherId} value={v.voucherId} className="bg-zinc-950 text-white">
                                                 {v.voucherName} (-{v.voucherDiscountPercent}%)
                                             </option>
                                         ))}
                                     </select>
                                 </div>
                             )}

                             {/* Pricing Breakdown */}
                             <div className="mb-6 space-y-2 text-sm border-t border-white/5 pt-4">
                                 <div className="flex justify-between text-zinc-400">
                                     <span>Subtotal</span>
                                     <span>{totalPrice.toLocaleString('vi-VN')}đ</span>
                                 </div>
                                 
                                 {roleDiscountPercent > 0 && (
                                     <div className="flex justify-between text-emerald-400 font-medium">
                                         <span>Role Discount ({userRole} -{roleDiscountPercent}%)</span>
                                         <span>-{(totalPrice * roleDiscountPercent / 100).toLocaleString('vi-VN')}đ</span>
                                     </div>
                                 )}

                                 {voucherDiscountPercent > 0 && (
                                     <div className="flex justify-between text-[#ff8a00] font-medium">
                                         <span>Voucher Discount (-{voucherDiscountPercent}%)</span>
                                         <span>-{(totalPrice * voucherDiscountPercent / 100).toLocaleString('vi-VN')}đ</span>
                                     </div>
                                 )}
                             </div>

                             {/* Total Box */}
                             <div className="mb-8 p-4 bg-[#ff8a00]/5 rounded-xl border border-[#ff8a00]/10">
                                 <div className="flex justify-between items-center">
                                     <span className="text-white font-semibold">Total Price</span>
                                     <div className="text-right">
                                         <span className="text-[#ff8a00] text-3xl font-extrabold">
                                             {Math.max(0, totalPrice * (1 - (roleDiscountPercent + voucherDiscountPercent) / 100)).toLocaleString('vi-VN')}đ
                                         </span>
                                         <p className="text-[10px] text-[#ddc1ae] uppercase tracking-wider mt-0.5">Inclusives of all taxes</p>
                                     </div>
                                 </div>
                             </div>

                            {/* Contact Form */}
                            {!isLoggedIn || isCashierMode ? (
                                <div className="mb-8 p-4 bg-red-950/10 border border-red-900/20 rounded-xl">
                                    <p className="text-xs text-zinc-400 mb-3 leading-relaxed">
                                        {isCashierMode ? (
                                            <>
                                                Bán vé tại quầy. Nhập <span className="text-[#ff8a00] font-bold">thông tin khách hàng</span> (nhập Email để tích điểm/tính giảm giá thành viên).
                                            </>
                                        ) : (
                                            <>
                                                Booking as <span className="text-[#ff8a00] font-bold">Guest</span>. Please fill your details to proceed.
                                            </>
                                        )}
                                    </p>
                                    <div className="space-y-3">
                                        <input
                                            type="text"
                                            placeholder="Full Name *"
                                            value={customerInfo.name}
                                            onChange={e => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                                            className="w-full bg-black/40 text-white text-sm p-3 rounded-lg border border-white/10 outline-none focus:border-[#ff8a00] transition-colors"
                                        />
                                        <div className="grid grid-cols-2 gap-3">
                                            <input
                                                type="email"
                                                placeholder="Email *"
                                                value={customerInfo.email}
                                                onChange={e => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                                                className="w-full bg-black/40 text-white text-sm p-3 rounded-lg border border-white/10 outline-none focus:border-[#ff8a00] transition-colors"
                                            />
                                            <input
                                                type="tel"
                                                placeholder="Phone *"
                                                value={customerInfo.phone}
                                                onChange={e => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                                                className="w-full bg-black/40 text-white text-sm p-3 rounded-lg border border-white/10 outline-none focus:border-[#ff8a00] transition-colors"
                                            />
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Address (Optional)"
                                            value={customerInfo.address}
                                            onChange={e => setCustomerInfo(prev => ({ ...prev, address: e.target.value }))}
                                            className="w-full bg-black/40 text-white text-sm p-3 rounded-lg border border-white/10 outline-none focus:border-[#ff8a00] transition-colors"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="mb-8 p-4 bg-red-950/10 border border-red-900/20 rounded-xl">
                                    <p className="text-xs text-zinc-400 leading-relaxed">
                                        Booking as <span className="text-[#ff8a00] font-bold">{userName}</span>. Your details will be retrieved from your profile.
                                    </p>
                                </div>
                            )}

                            {/* Pay Button */}
                            <button
                                disabled={selectedSeats.length === 0 || bookingLoading}
                                onClick={handleBooking}
                                className="w-full bg-[#ff8a00] text-black h-14 rounded-xl font-bold flex items-center justify-center gap-3 hover:shadow-[0_0_25px_rgba(255,138,0,0.4)] transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group border-none cursor-pointer"
                            >
                                {bookingLoading ? (
                                    <Loader2 className="animate-spin" size={20} />
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">payments</span>
                                        <span className="font-display uppercase tracking-wider text-sm font-extrabold">Proceed to Pay</span>
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Promo Banner */}
                        <div className="mt-6 rounded-2xl overflow-hidden relative group cursor-pointer h-32">
                            <img
                                alt="Promotional background"
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBCf7glp6ITcrfW0hlE9CXfpSZ7AKpilK45LhR60O8k-msYArV6MVcBMije9H5ruQss-UbuC6Gb1YAflcR428UUHyWYRUE37mAUiB7VVcDsku8dh0XkH6TnzJyx6Me9rtBRfmPBYyk05S__h3GC_UA8Zgnje4sA3Shl3oYaIMWBRFe43eWcgqhiiU_iEjv7gWW52Q2ay7rZQda7oW14y08BU8HYg4NYYb7c2oYMFYBIhsC3smbjMPl2266Wx7hu3U6mCtsWUDUQRCE"
                            />
                            <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-transparent flex flex-col justify-center px-6">
                                <p className="text-[#ff8a00] font-bold text-xs tracking-widest uppercase mb-1">Premier Plus</p>
                                <p className="text-white font-bold text-lg font-display">Get 20% off popcorn</p>
                            </div>
                        </div>
                    </aside>
                </div>
            </main>

            {/* Footer */}
            <footer style={{
                width: '100%', padding: '48px 24px',
                maxWidth: 1280, margin: '0 auto',
                borderTop: '1px solid var(--border-color)', marginTop: 80,
            }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 32, alignItems: 'center' }}
                    className="md:flex-row md:justify-between"
                >
                    <div style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 20, fontWeight: 800, color: 'var(--accent, #ff8a00)', opacity: 0.5 }}>
                        CINEMA
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 32, color: 'var(--text-secondary, #a1a1aa)', fontSize: 14 }}>
                        {['Privacy Policy', 'Terms of Service', 'Contact Us', 'Careers'].map(link => (
                            <a key={link} href="#"
                                style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s', whiteSpace: 'nowrap' }}
                                onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary, #fafafa)'; }}
                                onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary, #a1a1aa)'; }}
                            >
                                {link}
                            </a>
                        ))}
                    </div>
                    <div style={{ color: 'var(--text-secondary, #a1a1aa)', fontSize: 12, letterSpacing: '-0.01em', opacity: 0.5 }}>
                        © 2026 CINEMA. ALL RIGHTS RESERVED.
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default BookingPage;
