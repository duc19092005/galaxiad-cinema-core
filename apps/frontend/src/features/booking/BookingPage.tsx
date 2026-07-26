import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Loader2, AlertCircle, Users
} from 'lucide-react';
import { useSeatWs } from '../../hooks/useSeatWs';
import { publicApi } from '../../api/publicApi';
import { bookingApi } from '../../api/bookingApi';
import { concessionApi } from '../../api/concessionApi';
import type { ConcessionMenuItemDto } from '../../types/concession.types';
import type { PublicSeatMap, PublicSeat, PublicPricing } from '../../types/public.types';
import { useTranslation } from 'react-i18next';
import { showError } from '../../utils/ToastUtils';
import Header from '../../components/Header';
import PublicBreadcrumb from '../../components/PublicBreadcrumb';
import { voucherApi, type UserVoucherDto } from '../../api/voucherApi';
import CreateGroupBookingModal from '../socialBooking/CreateGroupBookingModal';
import {
    canAddSeat,
    createsIsolatedEmptySeat,
    normalizeSeatId,
    occupiedIdsFromSeatMap,
} from '../../utils/seatSelectionPolicy';
import SegmentQuantityPicker from '../../components/SegmentQuantityPicker';
import {
    assignSegmentsToSeats,
    emptySegmentCounts,
    totalFromSegmentCounts,
    totalTicketQuantity,
    type SegmentCounts,
} from '../../utils/segmentQuantity';

const BookingPage: React.FC = () => {
    const { scheduleId } = useParams<{ scheduleId: string }>();
    const navigate = useNavigate();
    const { t } = useTranslation();

    const [seatMap, setSeatMap] = useState<PublicSeatMap | null>(null);
    const [selectedSeats, setSelectedSeats] = useState<PublicSeat[]>([]);
    const [segmentCounts, setSegmentCounts] = useState<SegmentCounts>({});
    const [loading, setLoading] = useState(true);
    const [bookingLoading, setBookingLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pricing, setPricing] = useState<PublicPricing | null>(null);
    const [concessionMenu, setConcessionMenu] = useState<ConcessionMenuItemDto[]>([]);
    const [concessionQuantities, setConcessionQuantities] = useState<Record<string, number>>({});
    const [concessionsLoading, setConcessionsLoading] = useState(false);
    const [concessionTab, setConcessionTab] = useState<'all' | 'products' | 'combos'>('all');

    const [userName, setUserName] = useState<string>('Guest');
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
    const [isCashierMode, setIsCashierMode] = useState<boolean>(false);
    const [myVouchers, setMyVouchers] = useState<UserVoucherDto[]>([]);
    const [selectedVoucherId, setSelectedVoucherId] = useState<string>('');
    const [customerInfo, setCustomerInfo] = useState({ name: '', email: '', phone: '', address: '' });

    // Group Booking Modal
    const [showGroupModal, setShowGroupModal] = useState(false);

    const { lockedSeats, unavailableSeats, lockSeat, unlockSeat, clientId: seatLockOwnerToken } = useSeatWs(scheduleId || null);

    useEffect(() => {
        const storedUser = localStorage.getItem('user_info');
        if (storedUser) {
            const user = JSON.parse(storedUser);
            setUserName(user.username || user.userName || 'Guest');

            const roles: string[] = user.roles || [];
            const isCashier = roles.includes('Cashier');
            setIsCashierMode(isCashier);

            setIsLoggedIn(true);
        } else {
            setUserName('Guest');
            setIsLoggedIn(false);
            setIsCashierMode(false);
        }

        if (scheduleId) {
            fetchData();
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

    useEffect(() => {
        if (!isCashierMode) return;
        const email = customerInfo.email.trim();
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return;
        }

        let cancelled = false;
        const timer = window.setTimeout(async () => {
            try {
                const response = await bookingApi.lookupCustomerByEmail(email);
                if (cancelled) return;
                if (response.data) {
                    setCustomerInfo(prev => ({
                        ...prev,
                        name: response.data?.userName || prev.name,
                        phone: response.data?.phoneNumber || prev.phone,
                    }));
                }
            } catch {
                // Ignore lookup errors
            }
        }, 450);

        return () => {
            cancelled = true;
            window.clearTimeout(timer);
        };
    }, [customerInfo.email, isCashierMode]);

    const ageSymbol = seatMap?.movieRequiredAgeSymbol?.trim();
    const allowedSegments = useMemo(() => {
        if (!pricing?.segmentPrices) return [];
        if (!ageSymbol || ageSymbol === 'P' || ageSymbol === 'K') return pricing.segmentPrices;
        return pricing.segmentPrices.filter(s => {
            const name = s.segmentName.toLowerCase();
            // T13, T16, T18: Block Child only
            if (ageSymbol === 'T13' || ageSymbol === 'T16' || ageSymbol === 'T18') {
                return !name.includes('child') && !name.includes('trẻ em');
            }
            return true;
        });
    }, [pricing?.segmentPrices, ageSymbol]);

    // Init / sync segment counters when pricing loads
    useEffect(() => {
        if (allowedSegments.length === 0) {
            setSegmentCounts({});
            return;
        }
        setSegmentCounts((prev) => {
            const next = emptySegmentCounts(allowedSegments);
            for (const seg of allowedSegments) {
                next[seg.userSegmentId] = prev[seg.userSegmentId] || 0;
            }
            return next;
        });
    }, [allowedSegments]);

    const ticketQuantity = totalTicketQuantity(segmentCounts);

    const fetchData = async () => {
        setLoading(true); setError(null);
        try {
            const seatRes = await publicApi.getSeatMap(scheduleId!);
            setSeatMap(seatRes.data);

            setConcessionsLoading(true);
            const [priceResult, menuResult] = await Promise.allSettled([
                publicApi.getPricing(scheduleId!),
                seatRes.data.cinemaId
                    ? concessionApi.getPublicMenu(seatRes.data.cinemaId)
                    : Promise.resolve({ isSuccess: true, message: '', data: [] as ConcessionMenuItemDto[] }),
            ]);

            if (priceResult.status === 'fulfilled') setPricing(priceResult.value.data);
            else console.warn('Pricing not found, skipping for now');

            if (menuResult.status === 'fulfilled') setConcessionMenu(menuResult.value.data || []);
            else {
                console.warn('Concession menu not found, skipping for now');
                setConcessionMenu([]);
            }
            setConcessionsLoading(false);
        } catch (err) { setError('Failed to load booking information.'); }
        finally { setLoading(false); }
    };

    const trimSeatsToQuantity = async (nextCounts: SegmentCounts) => {
        const maxSeats = totalTicketQuantity(nextCounts);
        setSegmentCounts(nextCounts);
        if (selectedSeats.length <= maxSeats) return;

        const keep = selectedSeats.slice(0, maxSeats);
        const remove = selectedSeats.slice(maxSeats);
        setSelectedSeats(keep);
        await Promise.all(remove.map((s) => unlockSeat(s.seatId)));
    };

    const layoutSeats = useMemo(
        () => (seatMap?.seatMap || []).map(s => ({
            seatId: s.seatId,
            rowIndex: s.rowIndex,
            colIndex: s.colIndex,
        })),
        [seatMap]
    );

    const occupiedSeatIds = useMemo(() => {
        const booked = occupiedIdsFromSeatMap(seatMap?.seatMap || []);
        const lockedByOthers = Object.keys(lockedSeats).filter(
            id => !selectedSeats.some(s => normalizeSeatId(s.seatId) === normalizeSeatId(id))
        );
        const unavailable = Object.keys(unavailableSeats);
        return [...booked, ...lockedByOthers, ...unavailable];
    }, [seatMap, lockedSeats, unavailableSeats, selectedSeats]);

    const selectionCreatesIsolation = useMemo(
        () => createsIsolatedEmptySeat(
            layoutSeats,
            selectedSeats.map(s => s.seatId),
            occupiedSeatIds
        ),
        [layoutSeats, selectedSeats, occupiedSeatIds]
    );
    const selectedConcessionLines = useMemo(() => concessionMenu
        .map((item) => ({ item, quantity: concessionQuantities[item.productId] || 0 }))
        .filter((line) => line.quantity > 0), [concessionMenu, concessionQuantities]);

    const concessionSubtotal = useMemo(() => selectedConcessionLines.reduce(
        (sum, line) => sum + line.item.unitPrice * line.quantity,
        0
    ), [selectedConcessionLines]);

    const updateConcessionQuantity = (productId: string, delta: number) => {
        setConcessionQuantities((current) => ({
            ...current,
            [productId]: Math.max(0, Math.min(10, (current[productId] || 0) + delta)),
        }));
    };

    const toggleSeat = async (seat: PublicSeat) => {
        if (seat.isBooked || unavailableSeats[seat.seatId.toLowerCase()]) return;
        const isCurrentlySelected = selectedSeats.find(s => s.seatId === seat.seatId);
        if (!isCurrentlySelected && lockedSeats[seat.seatId.toLowerCase()]) return;

        if (isCurrentlySelected) {
            setSelectedSeats(prev => prev.filter(s => s.seatId !== seat.seatId));
            await unlockSeat(seat.seatId);
            return;
        }

        if (ticketQuantity <= 0) {
            showError(t('toast.selectTicketTypesFirst', 'Vui lòng chọn số lượng loại vé trước khi chọn ghế.'));
            return;
        }
        if (selectedSeats.length >= ticketQuantity) {
            showError(t('toast.seatQuotaFull', 'Bạn đã chọn đủ {{count}} ghế theo số vé đã chọn.', { count: ticketQuantity }));
            return;
        }

        const check = canAddSeat(
            layoutSeats,
            seat.seatId,
            selectedSeats.map(s => s.seatId),
            occupiedSeatIds
        );
        if (!check.ok) {
            if (check.reason === 'max') {
                showError(t('toast.maxSeats', 'You can select up to 10 tickets per order.'));
            } else if (check.reason === 'isolated') {
                showError(t(
                    'toast.isolatedSeat',
                    'Không được để trống 1 ghế lẻ giữa hai ghế đã bán/đã chọn trong cùng hàng. Hãy chọn ghế liền kề hoặc chọn đúng ghế lẻ đó.'
                ));
            }
            return;
        }

        setSelectedSeats(prev => [...prev, seat]);
        const success = await lockSeat(seat.seatId, userName);
        if (!success) {
            setSelectedSeats(prev => prev.filter(s => s.seatId !== seat.seatId));
            showError(t('toast.seatLockFailed', 'Không thể chọn ghế này. Ghế đã bị chọn hoặc thao tác quá nhanh.'));
        }
    };

    const handleBooking = async () => {
        if (ticketQuantity <= 0) {
            showError(t('toast.selectTicketTypesFirst', 'Vui lòng chọn số lượng loại vé trước khi chọn ghế.'));
            return;
        }
        if (selectedSeats.length === 0) { showError(t('toast.selectSeat')); return; }
        if (selectedSeats.length !== ticketQuantity) {
            showError(t(
                'toast.seatCountMismatch',
                'Bạn đã chọn {{selected}}/{{required}} ghế. Vui lòng chọn đúng số ghế theo số vé.',
                { selected: selectedSeats.length, required: ticketQuantity }
            ));
            return;
        }
        if (selectionCreatesIsolation) {
            showError(t(
                'toast.isolatedSeat',
                'Không được để trống 1 ghế lẻ giữa hai ghế đã bán/đã chọn trong cùng hàng. Hãy chọn ghế liền kề hoặc chọn đúng ghế lẻ đó.'
            ));
            return;
        }
        if (!isLoggedIn || isCashierMode) {
            if (isCashierMode && (!customerInfo.name.trim() || !customerInfo.phone.trim())) {
                showError('Vui lòng nhập tên và số điện thoại khách hàng. Email có thể để trống.'); return;
            }
            if (!isCashierMode && (!customerInfo.name.trim() || !customerInfo.email.trim() || !customerInfo.phone.trim())) {
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

            const seatSegmentMap = assignSegmentsToSeats(
                selectedSeats.map(s => s.seatId),
                allowedSegments,
                segmentCounts
            );
            const payload: any = {
                scheduleId: scheduleId!.trim(),
                seatSelections: selectedSeats.map(s => ({ seatId: s.seatId, userSegmentId: seatSegmentMap[s.seatId] })),
                concessionItems: selectedConcessionLines.map(({ item, quantity }) => ({ productId: item.productId, quantity })),
                customerName: (isLoggedIn && !isCashierMode) ? undefined : customerInfo.name.trim(),
                customerEmail: (isLoggedIn && !isCashierMode) ? undefined : (customerInfo.email.trim() || undefined),
                customerPhone: (isLoggedIn && !isCashierMode) ? undefined : customerInfo.phone.trim(),
                customerAddress: (isLoggedIn && !isCashierMode) ? undefined : customerInfo.address.trim(),
                voucherId: selectedVoucherId ? selectedVoucherId : undefined,
                staffId: staffIdFromSession,
                seatLockOwnerToken
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

    const ticketTotalPrice = totalFromSegmentCounts(allowedSegments, segmentCounts);
    const totalPrice = ticketTotalPrice + concessionSubtotal;

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
    const maxRow = Math.max(...(seatMap.seatMap?.map(s => s.rowIndex) || [0])) + 1;

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
                .glass-panel {
                    background: rgba(255, 255, 255, 0.03);
                    backdrop-filter: blur(16px);
                    -webkit-backdrop-filter: blur(16px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }
                .orange-glow:hover {
                    box-shadow: 0 0 15px rgba(255, 138, 0, 0.3);
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 3px;
                    height: 3px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(255, 255, 255, 0.02);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 138, 0, 0.75);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #ff8a00;
                }
                .seat-selected {
                    background-color: #ff8a00 !important;
                    color: #000 !important;
                    border-color: #ff8a00 !important;
                    box-shadow: 0 0 15px rgba(255, 138, 0, 0.4);
                }
                .screen-curve {
                    height: 4px;
                    width: 100%;
                    background: linear-gradient(90deg, transparent 0%, #ff8a00 50%, transparent 100%);
                    border-radius: 50%;
                    filter: blur(1px) drop-shadow(0 0 8px #ff8a00);
                }
            `}</style>

            {/* System Header */}
            <Header />

            {/* Main Content Layout */}
            <main className="pt-28 pb-24 px-4 md:px-12 max-w-7xl mx-auto min-h-screen">
                <PublicBreadcrumb
                    items={[
                        { label: t('breadcrumb.home', 'Home'), path: '/home' },
                        { label: t('breadcrumb.movies', 'Phim'), path: '/movies' },
                        { label: seatMap.movieName },
                        { label: t('breadcrumb.booking', 'Đặt vé') },
                    ]}
                />

                {/* Hero / Header Section */}
                <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6 border-l-4 border-[#ff8a00] pl-6">
                    <div>
                        <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-2 leading-tight">{seatMap.movieName}</h1>
                        <div className="flex flex-wrap items-center gap-4 text-[#ddc1ae] text-sm font-semibold">
                            <span className="flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-[#ff8a00] text-[18px]">theaters</span>
                                {seatMap.auditoriumName} ({seatMap.movieVisualFormatName || '2D'})
                            </span>
                            <span className="w-1.5 h-1.5 rounded-full bg-white/20"></span>
                            <span className="flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-[#ff8a00] text-[18px]">calendar_today</span>
                                {new Date(seatMap.startTime).toLocaleDateString('vi-VN', { month: 'long', day: 'numeric', year: 'numeric' })}
                            </span>
                            <span className="w-1.5 h-1.5 rounded-full bg-white/20"></span>
                            <span className="flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-[#ff8a00] text-[18px]">schedule</span>
                                {new Date(seatMap.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {ageSymbol && (
                                <span className="px-2.5 py-0.5 bg-red-900/60 text-red-200 border border-red-700/40 rounded text-[11px] uppercase font-bold tracking-wider ml-2">
                                    {ageSymbol}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Action buttons: Group Booking & Change Session */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowGroupModal(true)}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 border border-white/10 text-white/90 hover:bg-[#ff8a00]/20 hover:border-[#ff8a00]/40 hover:text-[#ff8a00] transition-all duration-200 cursor-pointer font-semibold text-sm"
                        >
                            <Users size={16} />
                            {t('socialBooking.groupBookingBtn', 'Đặt vé nhóm')}
                        </button>
                        <button
                            onClick={() => navigate(-1)}
                            className="flex items-center gap-2 text-[#ff8a00] hover:gap-3 transition-all duration-200 bg-transparent border-none cursor-pointer font-bold text-sm"
                        >
                            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                            Change Session
                        </button>
                    </div>
                </div>

                {/* Booking Canvas Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                    {/* Left Column: Booking Steps */}
                    <div className="lg:col-span-8 flex flex-col gap-8">
                        {/* Step 1: Select Ticket Types */}
                        <section className="glass-card rounded-2xl p-6 border border-white/10">
                            <div className="flex justify-between items-center border-b border-white/10 pb-4 mb-4">
                                <div className="flex items-center gap-3">
                                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#ff8a00] text-black font-extrabold text-xs">1</span>
                                    <h2 className="text-lg md:text-xl font-bold text-white m-0">{t('booking.selectTicketTypes', 'Chọn loại vé')}</h2>
                                </div>
                                <span className={`text-xs font-bold px-3 py-1 rounded-full ${ticketQuantity > 0 ? 'bg-[#ff8a00]/15 text-[#ff8a00]' : 'bg-white/5 text-zinc-500'}`}>
                                    {ticketQuantity > 0
                                        ? t('booking.pickSeatsOnMap', 'Chọn ghế trên sơ đồ ({{count}} ghế)', { count: ticketQuantity })
                                        : t('booking.pickTicketsFirst', 'Hãy chọn số lượng loại vé trước')}
                                </span>
                            </div>
                            <SegmentQuantityPicker
                                segments={allowedSegments}
                                counts={segmentCounts}
                                onChange={(next) => { void trimSeatsToQuantity(next); }}
                                title=""
                                layout="grid"
                                showTotalBadge
                                compact
                            />
                        </section>

                        {/* Step 2: Select Seats */}
                        <section className="glass-card rounded-2xl p-6 border border-white/10 flex flex-col items-center">
                            <div className="w-full flex justify-between items-center border-b border-white/10 pb-4 mb-6">
                                <div className="flex items-center gap-3">
                                    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-extrabold ${ticketQuantity > 0 ? 'bg-[#ff8a00] text-black' : 'bg-zinc-800 text-zinc-500'}`}>2</span>
                                    <h2 className={`text-lg md:text-xl font-bold m-0 ${ticketQuantity > 0 ? 'text-white' : 'text-zinc-500'}`}>
                                        {t('booking.selectSeatsStep', 'Chọn ghế')}
                                    </h2>
                                </div>
                                <span className={`text-xs font-bold ${selectedSeats.length === ticketQuantity && ticketQuantity > 0 ? 'text-emerald-400' : 'text-[#ff8a00]'}`}>
                                    {selectedSeats.length}/{ticketQuantity || 0}
                                </span>
                            </div>

                            {/* Screen Curve */}
                            <div className={`w-full max-w-2xl mb-10 relative transition-opacity ${ticketQuantity > 0 ? 'opacity-100' : 'opacity-50'}`}>
                                <div className="screen-curve"></div>
                                <p className="text-center text-[#ddc1ae] text-[10px] tracking-[0.4em] uppercase mt-3 font-semibold">SCREEN</p>
                            </div>

                            {/* Seat Grid */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: `repeat(${maxCol}, minmax(0, 1fr))`,
                                gridTemplateRows: `repeat(${maxRow}, minmax(0, 1fr))`,
                                gap: 'clamp(4px, 1.5vw, 8px)',
                                padding: 'clamp(8px, 2vw, 16px)',
                                borderRadius: 16,
                                backgroundColor: 'rgba(255,255,255,0.02)',
                                width: '100%',
                                maxWidth: `min(${maxCol * 60}px, 100%)`,
                                justifyContent: 'center',
                                placeItems: 'center',
                            }} className="mb-8">
                                {seatMap.centerRowStart !== undefined &&
                                 seatMap.centerRowEnd !== undefined &&
                                 seatMap.centerColStart !== undefined &&
                                 seatMap.centerColEnd !== undefined &&
                                 seatMap.centerRowStart > 0 &&
                                 seatMap.centerColStart > 0 && (
                                    <div style={{
                                        gridRowStart: seatMap.centerRowStart + 1,
                                        gridRowEnd: seatMap.centerRowEnd + 2,
                                        gridColumnStart: seatMap.centerColStart + 1,
                                        gridColumnEnd: seatMap.centerColEnd + 2,
                                        border: '2px dashed rgba(255, 138, 0, 0.45)',
                                        backgroundColor: 'rgba(255, 138, 0, 0.02)',
                                        borderRadius: '16px',
                                        pointerEvents: 'none',
                                        zIndex: 0,
                                        boxShadow: '0 0 15px rgba(255, 138, 0, 0.05)',
                                        margin: '-6px',
                                    }} />
                                )}

                                {seatMap.seatMap?.map((seat) => {
                                    const isSelected = selectedSeats.find(s => s.seatId === seat.seatId);
                                    const seatUnavailable = unavailableSeats[seat.seatId.toLowerCase()];
                                    const lockedBy = lockedSeats[seat.seatId.toLowerCase()];
                                    const isLockedByOther = lockedBy && !isSelected;

                                    const isCenterSeat =
                                        seatMap.centerRowStart !== undefined &&
                                        seatMap.centerRowEnd !== undefined &&
                                        seatMap.centerColStart !== undefined &&
                                        seatMap.centerColEnd !== undefined &&
                                        seat.rowIndex >= seatMap.centerRowStart &&
                                        seat.rowIndex <= seatMap.centerRowEnd &&
                                        seat.colIndex >= seatMap.centerColStart &&
                                        seat.colIndex <= seatMap.centerColEnd;

                                    const title = isLockedByOther
                                        ? `Selected by ${lockedBy}`
                                        : seat.seatName;

                                    return (
                                        <button
                                            key={seat.seatId}
                                            disabled={seat.isBooked || seatUnavailable || !!isLockedByOther}
                                            onClick={() => toggleSeat(seat)}
                                            style={{
                                                gridColumnStart: seat.colIndex + 1,
                                                gridRowStart: seat.rowIndex + 1,
                                            }}
                                            className={`w-full aspect-square max-w-[42px] md:max-w-[48px] rounded-lg flex items-center justify-center font-bold text-xs transition-all duration-200 active:scale-90 border ${
                                                seat.isBooked || seatUnavailable
                                                    ? 'bg-zinc-900/50 text-zinc-700 border-zinc-800/40 opacity-40 cursor-not-allowed'
                                                    : isLockedByOther
                                                    ? 'bg-red-500/20 text-[#ef4444] border-red-500/40 cursor-not-allowed'
                                                    : isSelected
                                                    ? 'seat-selected'
                                                    : isCenterSeat
                                                    ? 'bg-zinc-800 text-[#ff8a00] hover:bg-zinc-700 hover:text-white border-[#ff8a00]/60 shadow-[0_0_6px_rgba(255,138,0,0.25)] cursor-pointer'
                                                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white cursor-pointer border-zinc-700/50'
                                            }`}
                                            title={title}
                                        >
                                            {seat.seatName}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Legend */}
                            <div className="flex flex-wrap justify-center gap-6 px-6 py-3.5 rounded-full glass-card">
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded-sm bg-zinc-800 border border-zinc-700/50"></div>
                                    <span className="text-xs text-[#ddc1ae]">{t('booking.available', 'Available')}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded-sm bg-zinc-800 border border-[#ff8a00]/60 shadow-[0_0_6px_rgba(255,138,0,0.25)]"></div>
                                    <span className="text-xs text-[#ddc1ae]">{t('booking.center', 'Vùng trung tâm (Góc đẹp)')}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded-sm bg-[#ff8a00] shadow-[0_0_8px_rgba(255,138,0,0.5)] border border-[#ff8a00]"></div>
                                    <span className="text-xs text-[#ddc1ae]">{t('booking.selected', 'Selected')}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded-sm bg-red-500/20 border border-red-500/40"></div>
                                    <span className="text-xs text-[#ddc1ae]">{t('booking.locked', 'Locked (by others)')}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded-sm bg-zinc-900/50 border border-zinc-800/40 opacity-40"></div>
                                    <span className="text-xs text-[#ddc1ae]">{t('booking.occupied', 'Occupied')}</span>
                                </div>
                            </div>
                        </section>

                        {/* Step 3: Concessions (Bắp nước) */}
                        <section className="glass-card rounded-2xl p-6 border border-white/10">
                            <div className="flex justify-between items-center border-b border-white/10 pb-4 mb-4">
                                <div className="flex items-center gap-3">
                                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-zinc-800 text-zinc-300 font-extrabold text-xs">3</span>
                                    <h2 className="text-lg md:text-xl font-bold text-white m-0">
                                        Thêm bắp nước <span className="text-xs text-zinc-500 font-normal ml-2">(Tuỳ chọn)</span>
                                    </h2>
                                </div>
                            </div>

                            {/* Centered Segmented Category Tabs */}
                            <div className="flex justify-center my-4">
                                <div className="inline-flex p-1 bg-white/5 border border-white/10 rounded-xl gap-1">
                                    <button
                                        type="button"
                                        onClick={() => setConcessionTab('all')}
                                        className={`px-5 py-2 rounded-lg text-xs font-bold transition-all border-none cursor-pointer ${
                                            concessionTab === 'all'
                                                ? 'bg-[#ff8a00] text-black shadow-[0_0_12px_rgba(255,138,0,0.4)] font-extrabold'
                                                : 'bg-transparent text-zinc-400 hover:text-white'
                                        }`}
                                    >
                                        Tất cả ({concessionMenu.length})
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setConcessionTab('products')}
                                        className={`px-5 py-2 rounded-lg text-xs font-bold transition-all border-none cursor-pointer ${
                                            concessionTab === 'products'
                                                ? 'bg-[#ff8a00] text-black shadow-[0_0_12px_rgba(255,138,0,0.4)] font-extrabold'
                                                : 'bg-transparent text-zinc-400 hover:text-white'
                                        }`}
                                    >
                                        Sản phẩm ({concessionMenu.filter(i => !i.isCombo).length})
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setConcessionTab('combos')}
                                        className={`px-5 py-2 rounded-lg text-xs font-bold transition-all border-none cursor-pointer ${
                                            concessionTab === 'combos'
                                                ? 'bg-[#ff8a00] text-black shadow-[0_0_12px_rgba(255,138,0,0.4)] font-extrabold'
                                                : 'bg-transparent text-zinc-400 hover:text-white'
                                        }`}
                                    >
                                        Combo ({concessionMenu.filter(i => i.isCombo).length})
                                    </button>
                                </div>
                            </div>

                            {/* FIXED HEIGHT Scrollable Container max-h-[480px] with inner padding to prevent top/bottom hover clipping */}
                            <div className="overflow-y-auto max-h-[480px] custom-scrollbar p-1.5">
                                {concessionsLoading ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {[1, 2, 3, 4].map(k => (
                                            <div key={k} className="h-20 bg-white/5 animate-pulse rounded-xl" />
                                        ))}
                                    </div>
                                ) : concessionMenu.length === 0 ? (
                                    <div className="p-8 text-center text-xs text-zinc-500">
                                        Hiện tại rạp chưa mở bán bắp nước online.
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {concessionMenu
                                            .filter(item => {
                                                if (concessionTab === 'products') return !item.isCombo;
                                                if (concessionTab === 'combos') return item.isCombo;
                                                return true;
                                            })
                                            .map((item) => {
                                                const quantity = concessionQuantities[item.productId] || 0;
                                                const outOfStock = item.isOutOfStock || item.availableToSell <= 0;
                                                return (
                                                    <div
                                                        key={item.productId}
                                                        className={`group bg-zinc-950/70 p-4 rounded-xl border ${
                                                            quantity > 0 ? 'border-[#ff8a00] shadow-[0_0_15px_rgba(255,138,0,0.2)]' : 'border-white/10 hover:border-[#ff8a00]'
                                                        } flex gap-4 items-center transition-all duration-200 hover:shadow-[0_0_20px_rgba(255,138,0,0.25)] hover:bg-zinc-900/90 cursor-pointer`}
                                                    >
                                                        <div className="w-20 h-20 sm:w-22 sm:h-22 bg-zinc-900 rounded-xl flex-shrink-0 overflow-hidden flex items-center justify-center relative border border-white/5 group-hover:border-[#ff8a00]/40 transition-colors">
                                                            {item.imageUrl ? (
                                                                <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out" />
                                                            ) : (
                                                                <span className="material-symbols-outlined text-[#ff8a00] text-4xl group-hover:scale-110 transition-transform duration-300">
                                                                    {item.category === 'Drink' ? 'local_cafe' : 'fastfood'}
                                                                </span>
                                                            )}
                                                            {item.isCombo && (
                                                                <span className="absolute top-1 left-1 bg-[#ff8a00] text-black text-[10px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider shadow-sm z-10">
                                                                    COMBO
                                                                </span>
                                                            )}
                                                        </div>

                                                        <div className="flex-1 min-w-0 pr-1">
                                                            <h3 className="font-bold text-sm text-white group-hover:text-[#ff8a00] transition-colors leading-snug break-words m-0">
                                                                {item.productName}
                                                            </h3>
                                                            <p className="text-xs font-semibold text-[#ff8a00] mt-1.5 m-0">
                                                                {item.unitPrice.toLocaleString('vi-VN')}đ
                                                            </p>
                                                        </div>

                                                        <div className="flex items-center gap-1.5 bg-zinc-900/90 px-2.5 py-1.5 rounded-lg border border-white/10 group-hover:border-[#ff8a00]/40 transition-colors shadow-inner flex-shrink-0">
                                                            <button
                                                                type="button"
                                                                onClick={(e) => { e.stopPropagation(); updateConcessionQuantity(item.productId, -1); }}
                                                                disabled={quantity === 0}
                                                                className="text-zinc-400 hover:text-white hover:bg-white/10 active:scale-85 disabled:opacity-20 transition-all rounded-md border-none bg-transparent cursor-pointer p-1 flex items-center justify-center"
                                                                title="Giảm"
                                                            >
                                                                <span className="material-symbols-outlined text-[16px]">remove</span>
                                                            </button>
                                                            <span className="font-bold w-5 text-center text-xs text-white select-none">{quantity}</span>
                                                            <button
                                                                type="button"
                                                                onClick={(e) => { e.stopPropagation(); updateConcessionQuantity(item.productId, 1); }}
                                                                disabled={outOfStock || quantity >= 10}
                                                                className="text-[#ff8a00] hover:text-black hover:bg-[#ff8a00] active:scale-85 disabled:opacity-20 transition-all rounded-md border-none bg-transparent cursor-pointer p-1 flex items-center justify-center shadow-sm"
                                                                title="Thêm"
                                                            >
                                                                <span className="material-symbols-outlined text-[16px]">add</span>
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>

                    {/* Right Column: Order Summary Sidebar */}
                    <aside className="lg:col-span-4 sticky top-28 w-full">
                        <div className="glass-card rounded-2xl p-7 shadow-2xl overflow-hidden relative border border-white/10">
                            <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#ff8a00]/10 blur-[100px] rounded-full pointer-events-none"></div>

                            <div className="flex items-center gap-3 mb-6">
                                <span className="material-symbols-outlined text-[#ff8a00]" style={{ fontVariationSettings: "'FILL' 1" }}>shopping_cart</span>
                                <h2 className="text-xl font-bold text-white m-0">Booking Summary</h2>
                            </div>

                            <div className="space-y-4 mb-6">
                                <div className="flex justify-between items-start">
                                    <span className="text-zinc-400 text-xs uppercase tracking-wider font-semibold">Movie</span>
                                    <span className="text-white font-bold text-right break-words max-w-[60%]">{seatMap.movieName}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-zinc-400 text-xs uppercase tracking-wider font-semibold">Venue</span>
                                    <span className="text-white font-semibold text-sm">{seatMap.auditoriumName}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-zinc-400 text-xs uppercase tracking-wider font-semibold">Format</span>
                                    <span className="text-white font-semibold text-sm">{seatMap.movieVisualFormatName || '2D'}</span>
                                </div>
                                {ageSymbol && ageSymbol !== 'P' && ageSymbol !== 'K' && (
                                    <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                                        <AlertCircle size={16} className="text-amber-400 mt-0.5 flex-shrink-0" />
                                        <span className="text-amber-200 text-xs leading-relaxed">
                                            {ageSymbol === 'T18'
                                                ? `Phim ${ageSymbol} — Không bán vé cho trẻ em. Sinh viên phải trình CCCD khi vào rạp.`
                                                : `Phim ${ageSymbol} — Không bán vé cho trẻ em.`}
                                        </span>
                                    </div>
                                )}

                                {/* Selected seats summary */}
                                <div className="pt-4 border-t border-white/10">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[#ddc1ae] text-xs uppercase tracking-wider font-bold">
                                            {t('booking.selectedSeats', 'Ghế đã chọn')}
                                        </span>
                                        <span className={`text-xs font-bold ${selectedSeats.length === ticketQuantity && ticketQuantity > 0 ? 'text-emerald-400' : 'text-[#ff8a00]'}`}>
                                            {selectedSeats.length}/{ticketQuantity || 0}
                                        </span>
                                    </div>
                                    {ticketQuantity === 0 ? (
                                        <span className="text-zinc-500 italic text-xs">
                                            {t('booking.pickTicketsFirst', 'Hãy chọn số lượng loại vé trước')}
                                        </span>
                                    ) : selectedSeats.length === 0 ? (
                                        <span className="text-zinc-500 italic text-xs">
                                            {t('booking.pickSeatsOnMap', 'Chọn ghế trên sơ đồ ({{count}} ghế)', { count: ticketQuantity })}
                                        </span>
                                    ) : (
                                        <div className="flex flex-wrap gap-2">
                                            {selectedSeats.map((seat) => (
                                                <span
                                                    key={seat.seatId}
                                                    className="px-2.5 py-1 rounded-lg bg-[#ff8a00]/15 border border-[#ff8a00]/40 text-[#ff8a00] text-xs font-bold"
                                                >
                                                    {seat.seatName}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Concessions Summary */}
                                {selectedConcessionLines.length > 0 && (
                                    <div className="space-y-1.5 border-t border-white/10 pt-4">
                                        <span className="block text-xs font-bold uppercase tracking-wider text-[#ddc1ae]">
                                            Bắp nước
                                        </span>
                                        {selectedConcessionLines.map(({ item, quantity }) => (
                                            <div key={item.productId} className="flex justify-between gap-3 text-xs">
                                                <span className="text-white truncate font-medium">{item.productName} × {quantity}</span>
                                                <span className="font-bold text-white shrink-0">{(item.unitPrice * quantity).toLocaleString('vi-VN')}đ</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Voucher Selector Dropdown */}
                            {isLoggedIn && !isCashierMode && (
                                <div className="mb-5">
                                    <label className="text-zinc-400 text-xs uppercase tracking-wider block mb-1.5 font-semibold">
                                        Apply Voucher
                                    </label>
                                    <select
                                        value={selectedVoucherId}
                                        onChange={(e) => setSelectedVoucherId(e.target.value)}
                                        className="w-full bg-zinc-900 text-zinc-300 text-xs p-2.5 rounded-lg border border-white/10 outline-none cursor-pointer focus:border-[#ff8a00] transition-colors"
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

                            {/* Contact Form */}
                            {!isLoggedIn || isCashierMode ? (
                                <div className="mb-5 p-3.5 bg-zinc-950/50 border border-white/10 rounded-xl space-y-2.5">
                                    <p className="text-xs text-zinc-400 leading-relaxed m-0 font-medium">
                                        {isCashierMode ? (
                                            <>Bán vé tại quầy. Nhập <span className="text-[#ff8a00] font-bold">thông tin khách hàng</span></>
                                        ) : (
                                            <>Booking as <span className="text-[#ff8a00] font-bold">Guest</span></>
                                        )}
                                    </p>
                                    <input
                                        type="text"
                                        placeholder="Full Name *"
                                        value={customerInfo.name}
                                        onChange={e => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                                        className="w-full bg-black/40 text-white text-xs p-2.5 rounded-lg border border-white/10 outline-none focus:border-[#ff8a00]"
                                    />
                                    <div className="grid grid-cols-2 gap-2">
                                        <input
                                            type="email"
                                            placeholder={isCashierMode ? 'Email (Optional)' : 'Email *'}
                                            value={customerInfo.email}
                                            onChange={e => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                                            className="w-full bg-black/40 text-white text-xs p-2.5 rounded-lg border border-white/10 outline-none focus:border-[#ff8a00]"
                                        />
                                        <input
                                            type="tel"
                                            placeholder="Phone *"
                                            value={customerInfo.phone}
                                            onChange={e => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                                            className="w-full bg-black/40 text-white text-xs p-2.5 rounded-lg border border-white/10 outline-none focus:border-[#ff8a00]"
                                        />
                                    </div>
                                </div>
                            ) : null}

                            {/* Total Box */}
                            <div className="mb-6 p-4 bg-[#ff8a00]/10 rounded-xl border border-[#ff8a00]/20 flex justify-between items-center">
                                <span className="text-white font-bold text-sm">Total Price</span>
                                <span className="text-[#ff8a00] text-2xl font-extrabold">
                                    {Math.max(0, totalPrice).toLocaleString('vi-VN')}đ
                                </span>
                            </div>

                            {/* Pay Button */}
                            <button
                                disabled={
                                    ticketQuantity <= 0
                                    || selectedSeats.length !== ticketQuantity
                                    || bookingLoading
                                    || selectionCreatesIsolation
                                }
                                onClick={handleBooking}
                                className="w-full bg-[#ff8a00] text-black h-13 rounded-xl font-bold flex items-center justify-center gap-2 hover:shadow-[0_0_25px_rgba(255,138,0,0.4)] transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed border-none cursor-pointer text-sm uppercase tracking-wider"
                            >
                                {bookingLoading ? (
                                    <Loader2 className="animate-spin" size={18} />
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined text-[20px]">payments</span>
                                        {t('booking.proceedToPay', 'THANH TOÁN')}
                                    </>
                                )}
                            </button>
                        </div>
                    </aside>
                </div>
            </main>

            {/* System Footer */}
            <footer style={{
                width: '100%', padding: '48px 24px',
                maxWidth: 1280, margin: '0 auto',
                borderTop: '1px solid var(--border-color, #2e2e38)', marginTop: 80,
            }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 32, alignItems: 'center' }}
                    className="md:flex-row md:justify-between"
                >
                    <div style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 20, fontWeight: 800, color: 'var(--accent, #ff8a00)', opacity: 0.8 }}>
                        CINEMA
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 32, color: 'var(--text-secondary, #a1a1aa)', fontSize: 14 }}>
                        {[
                            { label: t('booking.privacyPolicy', 'Privacy Policy'), path: '/privacy-policy' },
                            { label: t('booking.termsOfService', 'Terms of Service'), path: '/terms-of-service' },
                            { label: t('booking.contactUs', 'Contact Support'), path: '/contact-us' },
                            { label: t('booking.careers', 'Careers'), path: '/careers' }
                        ].map(item => (
                            <button key={item.label} onClick={() => navigate(item.path)}
                                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'inherit', fontFamily: 'inherit', fontSize: 'inherit', transition: 'color 0.2s', whiteSpace: 'nowrap' }}
                                onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary, #fafafa)'; }}
                                onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary, #a1a1aa)'; }}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>
                    <div style={{ color: 'var(--text-secondary, #a1a1aa)', fontSize: 12, letterSpacing: '-0.01em', opacity: 0.5 }}>
                        © 2026 {t('booking.cinema', 'CINEMA')}. ALL RIGHTS RESERVED.
                    </div>
                </div>
            </footer>

            <CreateGroupBookingModal
                isOpen={showGroupModal}
                onClose={() => setShowGroupModal(false)}
                scheduleId={scheduleId || ''}
            />
        </div>
    );
};

export default BookingPage;
