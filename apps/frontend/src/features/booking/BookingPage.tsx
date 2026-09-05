import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { showError } from '../../utils/ToastUtils';
import Header from '../../components/Header';
import PublicBreadcrumb from '../../components/PublicBreadcrumb';
import SegmentQuantityPicker from '../../components/SegmentQuantityPicker';
import CreateGroupBookingModal from '../socialBooking/CreateGroupBookingModal';
import { useSeatWs } from '../../hooks/useSeatWs';
import { bookingApi } from '../../api/bookingApi';
import type { PublicSeat } from '../../types/public.types';
import {
  canAddSeat,
  createsIsolatedEmptySeat,
  requiresContiguousSelection,
  normalizeSeatId,
  occupiedIdsFromSeatMap,
} from '../../utils/seatSelectionPolicy';
import {
  assignSegmentsToSeats,
  emptySegmentCounts,
  totalFromSegmentCounts,
  totalTicketQuantity,
  type SegmentCounts,
} from '../../utils/segmentQuantity';
import { useBookingData } from './hooks/useBookingData';
import BookingHeader from './components/BookingHeader';
import BookingSeatMap from './components/BookingSeatMap';
import BookingConcessions from './components/BookingConcessions';
import BookingSummarySidebar from './components/BookingSummarySidebar';

const BookingPage: React.FC = () => {
  const { scheduleId } = useParams<{ scheduleId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [selectedSeats, setSelectedSeats] = useState<PublicSeat[]>([]);
  const [segmentCounts, setSegmentCounts] = useState<SegmentCounts>({});
  const [bookingLoading, setBookingLoading] = useState(false);
  const [concessionQuantities, setConcessionQuantities] = useState<Record<string, number>>({});
  const [concessionTab, setConcessionTab] = useState<'all' | 'products' | 'combos'>('all');

  const [userName, setUserName] = useState<string>('Guest');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isCashierMode, setIsCashierMode] = useState<boolean>(false);
  const [selectedVoucherId, setSelectedVoucherId] = useState<string>('');
  const [customerInfo, setCustomerInfo] = useState({ name: '', email: '', phone: '', address: '' });
  const [showGroupModal, setShowGroupModal] = useState(false);

  // Real-time seat lock websocket
  const {
    lockedSeats,
    unavailableSeats,
    lockSeat,
    unlockSeat,
    clientId: seatLockOwnerToken,
  } = useSeatWs(scheduleId || null);

  // User auth state detection
  useEffect(() => {
    const storedUser = localStorage.getItem('user_info');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setUserName(user.username || user.userName || 'Guest');
        const roles: string[] = user.roles || [];
        setIsCashierMode(roles.includes('Cashier'));
        setIsLoggedIn(true);
      } catch {
        setUserName('Guest');
        setIsLoggedIn(false);
        setIsCashierMode(false);
      }
    } else {
      setUserName('Guest');
      setIsLoggedIn(false);
      setIsCashierMode(false);
    }
  }, []);

  // Encapsulated data loading
  const {
    seatMap,
    pricing,
    concessionMenu,
    myVouchers,
    loading,
    concessionsLoading,
    error,
  } = useBookingData(scheduleId, isLoggedIn);

  // Cashier customer auto-lookup by email
  useEffect(() => {
    if (!isCashierMode) return;
    const email = customerInfo.email.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        const response = await bookingApi.lookupCustomerByEmail(email);
        if (cancelled) return;
        if (response.data) {
          setCustomerInfo((prev) => ({
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
    return pricing.segmentPrices.filter((s) => {
      const name = s.segmentName.toLowerCase();
      if (ageSymbol === 'T13' || ageSymbol === 'T16' || ageSymbol === 'T18') {
        return !name.includes('child') && !name.includes('trẻ em');
      }
      return true;
    });
  }, [pricing?.segmentPrices, ageSymbol]);

  // Sync segment counters when allowed segments change
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
    () =>
      (seatMap?.seatMap || []).map((s) => ({
        seatId: s.seatId,
        rowIndex: s.rowIndex,
        colIndex: s.colIndex,
      })),
    [seatMap]
  );

  const occupiedSeatIds = useMemo(() => {
    const booked = occupiedIdsFromSeatMap(seatMap?.seatMap || []);
    const lockedByOthers = Object.keys(lockedSeats).filter(
      (id) => !selectedSeats.some((s) => normalizeSeatId(s.seatId) === normalizeSeatId(id))
    );
    const unavailable = Object.keys(unavailableSeats);
    return [...booked, ...lockedByOthers, ...unavailable];
  }, [seatMap, lockedSeats, unavailableSeats, selectedSeats]);

  const selectionCreatesIsolation = useMemo(
    () =>
      createsIsolatedEmptySeat(
        layoutSeats,
        selectedSeats.map((s) => s.seatId),
        occupiedSeatIds
      ),
    [layoutSeats, selectedSeats, occupiedSeatIds]
  );

  const selectedConcessionLines = useMemo(
    () =>
      concessionMenu
        .map((item) => ({ item, quantity: concessionQuantities[item.productId] || 0 }))
        .filter((line) => line.quantity > 0),
    [concessionMenu, concessionQuantities]
  );

  const concessionSubtotal = useMemo(
    () =>
      selectedConcessionLines.reduce(
        (sum, line) => sum + line.item.unitPrice * line.quantity,
        0
      ),
    [selectedConcessionLines]
  );

  const updateConcessionQuantity = (productId: string, delta: number) => {
    setConcessionQuantities((current) => ({
      ...current,
      [productId]: Math.max(0, Math.min(10, (current[productId] || 0) + delta)),
    }));
  };

  const toggleSeat = async (seat: PublicSeat) => {
    if (seat.isBooked || unavailableSeats[seat.seatId.toLowerCase()]) return;
    const isCurrentlySelected = selectedSeats.find((s) => s.seatId === seat.seatId);
    if (!isCurrentlySelected && lockedSeats[seat.seatId.toLowerCase()]) return;

    if (isCurrentlySelected) {
      setSelectedSeats((prev) => prev.filter((s) => s.seatId !== seat.seatId));
      await unlockSeat(seat.seatId);
      return;
    }

    if (ticketQuantity <= 0) {
      showError(
        t('toast.selectTicketTypesFirst', 'Vui lòng chọn số lượng loại vé trước khi chọn ghế.')
      );
      return;
    }
    if (selectedSeats.length >= ticketQuantity) {
      showError(
        t('toast.seatQuotaFull', 'Bạn đã chọn đủ {{count}} ghế theo số vé đã chọn.', {
          count: ticketQuantity,
        })
      );
      return;
    }

    const check = canAddSeat(
      layoutSeats,
      seat.seatId,
      selectedSeats.map((s) => s.seatId),
      occupiedSeatIds
    );
    if (!check.ok) {
      if (check.reason === 'max') {
        showError(t('toast.maxSeats', 'You can select up to 10 tickets per order.'));
      } else if (check.reason === 'isolated') {
        showError(
          t(
            'toast.isolatedSeat',
            'Không được để trống 1 ghế lẻ giữa hai ghế đã bán/đã chọn trong cùng hàng. Hãy chọn ghế liền kề hoặc chọn đúng ghế lẻ đó.'
          )
        );
      }
      return;
    }

    setSelectedSeats((prev) => [...prev, seat]);
    const success = await lockSeat(seat.seatId, userName);
    if (!success) {
      setSelectedSeats((prev) => prev.filter((s) => s.seatId !== seat.seatId));
      showError(
        t('toast.seatLockFailed', 'Không thể chọn ghế này. Ghế đã bị chọn hoặc thao tác quá nhanh.')
      );
    }
  };

  const handleBooking = async () => {
    if (ticketQuantity <= 0) {
      showError(
        t('toast.selectTicketTypesFirst', 'Vui lòng chọn số lượng loại vé trước khi chọn ghế.')
      );
      return;
    }
    if (selectedSeats.length === 0) {
      showError(t('toast.selectSeat'));
      return;
    }
    if (selectedSeats.length !== ticketQuantity) {
      showError(
        t(
          'toast.seatCountMismatch',
          'Bạn đã chọn {{selected}}/{{required}} ghế. Vui lòng chọn đúng số ghế theo số vé.',
          { selected: selectedSeats.length, required: ticketQuantity }
        )
      );
      return;
    }
    if (
      requiresContiguousSelection(
        layoutSeats,
        selectedSeats.map((s) => s.seatId),
        occupiedSeatIds
      )
    ) {
      showError(
        t(
          'toast.contiguousSeats',
          'Vui lòng chọn các ghế liền nhau trong cùng hàng để giữ chỗ cho nhóm khách khác. Bạn có thể chọn ghế rời khi không còn cụm ghế phù hợp với số vé.'
        )
      );
      return;
    }
    if (selectionCreatesIsolation) {
      showError(
        t(
          'toast.isolatedSeat',
          'Không được để trống 1 ghế lẻ giữa hai ghế đã bán/đã chọn trong cùng hàng. Hãy chọn ghế liền kề hoặc chọn đúng ghế lẻ đó.'
        )
      );
      return;
    }
    if (!isLoggedIn || isCashierMode) {
      if (isCashierMode && (!customerInfo.name.trim() || !customerInfo.phone.trim())) {
        showError('Vui lòng nhập tên và số điện thoại khách hàng. Email có thể để trống.');
        return;
      }
      if (
        !isCashierMode &&
        (!customerInfo.name.trim() || !customerInfo.email.trim() || !customerInfo.phone.trim())
      ) {
        showError(t('toast.fillContactInfo'));
        return;
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
        } catch {
          // ignore
        }
      }

      const seatSegmentMap = assignSegmentsToSeats(
        selectedSeats.map((s) => s.seatId),
        allowedSegments,
        segmentCounts
      );

      const payload = {
        scheduleId: scheduleId!.trim(),
        seatSelections: selectedSeats.map((s) => ({
          seatId: s.seatId,
          userSegmentId: seatSegmentMap[s.seatId],
        })),
        concessionItems: selectedConcessionLines.map(({ item, quantity }) => ({
          productId: item.productId,
          quantity,
        })),
        customerName: isLoggedIn && !isCashierMode ? undefined : customerInfo.name.trim(),
        customerEmail:
          isLoggedIn && !isCashierMode
            ? undefined
            : customerInfo.email.trim() || undefined,
        customerPhone: isLoggedIn && !isCashierMode ? undefined : customerInfo.phone.trim(),
        customerAddress:
          isLoggedIn && !isCashierMode ? undefined : customerInfo.address.trim(),
        voucherId: selectedVoucherId ? selectedVoucherId : undefined,
        staffId: staffIdFromSession,
        seatLockOwnerToken,
      };

      const res = await bookingApi.createBooking(payload);
      if (res.data.paymentUrl) {
        window.location.href = res.data.paymentUrl;
      } else {
        showError(t('toast.paymentUrlError'));
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || t('toast.scheduleSaveFailed');
      showError(errorMsg);
    } finally {
      setBookingLoading(false);
    }
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
        <button
          onClick={() => navigate('/home')}
          className="px-6 py-3 rounded-xl font-bold text-black bg-[#ff8a00]"
        >
          Go Home
        </button>
      </div>
    );
  }

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
        <BookingHeader
          seatMap={seatMap}
          ageSymbol={ageSymbol}
          onOpenGroupModal={() => setShowGroupModal(true)}
          onBack={() => navigate(-1)}
        />

        {/* Booking Canvas Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left Column: Booking Steps */}
          <div className="lg:col-span-8 flex flex-col gap-8">
            {/* Step 1: Select Ticket Types */}
            <section className="glass-card rounded-2xl p-6 border border-white/10">
              <div className="flex justify-between items-center border-b border-white/10 pb-4 mb-4">
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#ff8a00] text-black font-extrabold text-xs">
                    1
                  </span>
                  <h2 className="text-lg md:text-xl font-bold text-white m-0">
                    {t('booking.selectTicketTypes', 'Chọn loại vé')}
                  </h2>
                </div>
                <span
                  className={`text-xs font-bold px-3 py-1 rounded-full ${
                    ticketQuantity > 0 ? 'bg-[#ff8a00]/15 text-[#ff8a00]' : 'bg-white/5 text-zinc-500'
                  }`}
                >
                  {ticketQuantity > 0
                    ? t('booking.pickSeatsOnMap', 'Chọn ghế trên sơ đồ ({{count}} ghế)', {
                        count: ticketQuantity,
                      })
                    : t('booking.pickTicketsFirst', 'Hãy chọn số lượng loại vé trước')}
                </span>
              </div>
              <SegmentQuantityPicker
                segments={allowedSegments}
                counts={segmentCounts}
                onChange={(next) => {
                  void trimSeatsToQuantity(next);
                }}
                title=""
                layout="grid"
                showTotalBadge
                compact
              />
            </section>

            {/* Step 2: Select Seats */}
            <BookingSeatMap
              seatMap={seatMap}
              selectedSeats={selectedSeats}
              lockedSeats={lockedSeats}
              unavailableSeats={unavailableSeats}
              ticketQuantity={ticketQuantity}
              onToggleSeat={toggleSeat}
            />

            {/* Step 3: Concessions (Bắp nước) */}
            <BookingConcessions
              concessionMenu={concessionMenu}
              concessionQuantities={concessionQuantities}
              concessionsLoading={concessionsLoading}
              concessionTab={concessionTab}
              onTabChange={setConcessionTab}
              onUpdateQuantity={updateConcessionQuantity}
            />
          </div>

          {/* Right Column: Order Summary Sidebar */}
          <BookingSummarySidebar
            seatMap={seatMap}
            ageSymbol={ageSymbol}
            selectedSeats={selectedSeats}
            ticketQuantity={ticketQuantity}
            selectedConcessionLines={selectedConcessionLines}
            isLoggedIn={isLoggedIn}
            isCashierMode={isCashierMode}
            myVouchers={myVouchers}
            selectedVoucherId={selectedVoucherId}
            onSelectVoucher={setSelectedVoucherId}
            customerInfo={customerInfo}
            onCustomerInfoChange={setCustomerInfo}
            totalPrice={totalPrice}
            bookingLoading={bookingLoading}
            selectionCreatesIsolation={selectionCreatesIsolation}
            onProceedBooking={handleBooking}
          />
        </div>
      </main>

      {/* System Footer */}
      <footer
        style={{
          width: '100%',
          padding: '48px 24px',
          maxWidth: 1280,
          margin: '0 auto',
          borderTop: '1px solid var(--border-color, #2e2e38)',
          marginTop: 80,
        }}
      >
        <div
          style={{ display: 'flex', flexDirection: 'column', gap: 32, alignItems: 'center' }}
          className="md:flex-row md:justify-between"
        >
          <div
            style={{
              fontFamily: "'Montserrat', sans-serif",
              fontSize: 20,
              fontWeight: 800,
              color: 'var(--accent, #ff8a00)',
              opacity: 0.8,
            }}
          >
            CINEMA
          </div>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: 32,
              color: 'var(--text-secondary, #a1a1aa)',
              fontSize: 14,
            }}
          >
            {[
              { label: t('booking.privacyPolicy', 'Privacy Policy'), path: '/privacy-policy' },
              { label: t('booking.termsOfService', 'Terms of Service'), path: '/terms-of-service' },
              { label: t('booking.contactUs', 'Contact Support'), path: '/contact-us' },
              { label: t('booking.careers', 'Careers'), path: '/careers' },
            ].map((item) => (
              <button
                key={item.label}
                onClick={() => navigate(item.path)}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  color: 'inherit',
                  fontFamily: 'inherit',
                  fontSize: 'inherit',
                  transition: 'color 0.2s',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--text-primary, #fafafa)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--text-secondary, #a1a1aa)';
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div
            style={{
              color: 'var(--text-secondary, #a1a1aa)',
              fontSize: 12,
              letterSpacing: '-0.01em',
              opacity: 0.5,
            }}
          >
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
