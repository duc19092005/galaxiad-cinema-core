import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { publicApi } from '../../api/publicApi';
import { useSeatWs } from '../../hooks/useSeatWs';
import { bookingApi } from '../../api/bookingApi';
import { staffShiftApi, CASHIER_SHIFT_SESSION_KEY, readCashierShiftSession } from '../../api/staffShiftApi';
import { authApi } from '../../api/authApi';
import Cookies from 'js-cookie';
import type { SearchScheduleResult, PublicSeatMap, PublicSeat, PublicPricing } from '../../types/public.types';
import type { CashierShiftSession } from '../../types/shift.types';
import { showError, showSuccess } from '../../utils/ToastUtils';
import {
  canAddSeat,
  createsIsolatedEmptySeat,
  requiresContiguousSelection,
  normalizeSeatId,
  occupiedIdsFromSeatMap,
} from '../../utils/seatSelectionPolicy';
import ConcessionPosPanel from './components/ConcessionPosPanel';
import CashierHeader from './components/CashierHeader';
import CashierScheduleCatalog from './components/CashierScheduleCatalog';
import CashierSeatGrid from './components/CashierSeatGrid';
import CashierOrderSummary from './components/CashierOrderSummary';
import CashierReceiptModal, { type CompletedOrderData } from './components/CashierReceiptModal';
import {
  assignSegmentsToSeats,
  buildSegmentLineSummaries,
  emptySegmentCounts,
  totalFromSegmentCounts,
  totalTicketQuantity,
  type SegmentCounts,
} from '../../utils/segmentQuantity';

const CashierSalesPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Cashier Shift Session
  const [session, setSession] = useState<CashierShiftSession | null>(() => readCashierShiftSession());
  const [cinemaName, setCinemaName] = useState<string>('');
  const [cinemaId, setCinemaId] = useState<string>('');
  const [showConcessionPanel, setShowConcessionPanel] = useState(false);

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
  const [segmentCounts, setSegmentCounts] = useState<SegmentCounts>({});

  // Checkout State
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerLookupStatus, setCustomerLookupStatus] = useState<
    'idle' | 'loading' | 'found' | 'not-found'
  >('idle');

  const [voucherId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<number>(2); // Default to CASH (2)
  const [bookingLoading, setBookingLoading] = useState(false);

  // Success Modal State
  const [completedOrder, setCompletedOrder] = useState<CompletedOrderData | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // WS Seat Lock
  const {
    lockedSeats,
    unavailableSeats,
    lockSeat,
    unlockSeat,
    clientId: seatLockOwnerToken,
  } = useSeatWs(selectedScheduleId);

  // Parse cinemaName from session
  useEffect(() => {
    if (!session) {
      navigate('/cashier', { replace: true });
      return;
    }
    const storedUser = localStorage.getItem('user_info');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setCinemaName(user.cinemaName || 'Cinema Branch');
        setCinemaId(user.cinemaId || (user.managedCinemas && user.managedCinemas[0]?.cinemaId) || '');
      } catch {
        setCinemaName('Cinema Branch');
      }
    }
  }, [session, navigate]);

  // Fetch Schedules Catalog
  const fetchSchedulesCatalog = useCallback(async () => {
    const storedUser = localStorage.getItem('user_info');
    let cid = '';
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        cid = user.cinemaId || (user.managedCinemas && user.managedCinemas[0]?.cinemaId) || '';
      } catch {
        // ignore
      }
    }

    if (!cid) return;

    setLoadingCatalog(true);
    try {
      const response = await publicApi.searchSchedules(selectedDate, undefined, cid);
      setSchedules(response.data || []);
    } catch {
      showError(t('cashierSales.errorLoadingSchedule'));
    } finally {
      setLoadingCatalog(false);
    }
  }, [selectedDate, t]);

  useEffect(() => {
    fetchSchedulesCatalog();
  }, [fetchSchedulesCatalog]);

  // Fetch Seat Map & Pricing
  const fetchSeatData = useCallback(
    async (scheduleId: string) => {
      setLoadingSeats(true);
      setSelectedSeats([]);
      setSegmentCounts({});
      try {
        const [seatRes, pricingRes] = await Promise.all([
          publicApi.getSeatMap(scheduleId),
          publicApi.getPricing(scheduleId),
        ]);
        setSeatMap(seatRes.data);
        setPricing(pricingRes.data);
        if (pricingRes.data?.segmentPrices?.length > 0) {
          setSegmentCounts(emptySegmentCounts(pricingRes.data.segmentPrices));
        }
      } catch {
        showError(t('cashierSales.errorLoadingSeatMap'));
        setSeatMap(null);
        setPricing(null);
      } finally {
        setLoadingSeats(false);
      }
    },
    [t]
  );

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

  const allowedSegments = useMemo(() => pricing?.segmentPrices || [], [pricing?.segmentPrices]);
  const ticketQuantity = totalTicketQuantity(segmentCounts);
  const segmentLines = useMemo(
    () => buildSegmentLineSummaries(allowedSegments, segmentCounts),
    [allowedSegments, segmentCounts]
  );

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

  const trimSeatsToQuantity = async (nextCounts: SegmentCounts) => {
    const maxSeats = totalTicketQuantity(nextCounts);
    setSegmentCounts(nextCounts);
    if (selectedSeats.length <= maxSeats) return;
    const keep = selectedSeats.slice(0, maxSeats);
    const remove = selectedSeats.slice(maxSeats);
    setSelectedSeats(keep);
    await Promise.all(remove.map((s) => unlockSeat(s.seatId)));
  };

  // Toggle seat selection
  const toggleSeat = async (seat: PublicSeat) => {
    if (seat.isBooked || unavailableSeats[seat.seatId.toLowerCase()]) return;
    const isCurrentlySelected = selectedSeats.find((s) => s.seatId === seat.seatId);
    const isLockedByOther = lockedSeats[seat.seatId] && !isCurrentlySelected;
    if (isLockedByOther) return;

    const cashierName = session?.staffName || 'Cashier';

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
        showError(t('cashierSales.errorMaxSeats'));
      } else if (check.reason === 'isolated') {
        showError(
          t(
            'toast.isolatedSeat',
            'Không được để trống 1 ghế lẻ giữa hai ghế đã bán/đã chọn trong cùng hàng.'
          )
        );
      }
      return;
    }

    setSelectedSeats((prev) => [...prev, seat]);
    const success = await lockSeat(seat.seatId, cashierName);
    if (!success) {
      setSelectedSeats((prev) => prev.filter((s) => s.seatId !== seat.seatId));
      showError(
        t('toast.seatLockFailed', 'Không thể chọn ghế này. Ghế đã bị chọn hoặc thao tác quá nhanh.')
      );
    }
  };

  const totalPrice = useMemo(
    () => totalFromSegmentCounts(allowedSegments, segmentCounts),
    [allowedSegments, segmentCounts]
  );

  // Handle Checkout / Booking
  const handleCheckout = async () => {
    if (!selectedScheduleId) return;
    if (ticketQuantity <= 0) {
      showError(
        t('toast.selectTicketTypesFirst', 'Vui lòng chọn số lượng loại vé trước khi chọn ghế.')
      );
      return;
    }
    if (selectedSeats.length === 0) {
      showError(t('cashierSales.errorSelectAtLeastOneSeat'));
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
    if (
      createsIsolatedEmptySeat(
        layoutSeats,
        selectedSeats.map((s) => s.seatId),
        occupiedSeatIds
      )
    ) {
      showError(
        t(
          'toast.isolatedSeat',
          'Không được để trống 1 ghế lẻ giữa hai ghế đã bán/đã chọn trong cùng hàng.'
        )
      );
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
      const seatSegmentMap = assignSegmentsToSeats(
        selectedSeats.map((s) => s.seatId),
        allowedSegments,
        segmentCounts
      );
      const payload = {
        scheduleId: selectedScheduleId,
        seatSelections: selectedSeats.map((s) => ({
          seatId: s.seatId,
          userSegmentId: seatSegmentMap[s.seatId],
        })),
        customerName: name,
        customerEmail: customerEmail.trim() || undefined,
        customerPhone: phone,
        voucherId: voucherId || undefined,
        staffId: session?.staffId,
        paymentMethod,
        seatLockOwnerToken,
      };

      const res = await bookingApi.createBooking(payload);

      if (paymentMethod === 2) {
        // Cash payment succeeded instantly
        setCompletedOrder({
          bookingCode: res.data.bookingCode || `GXD-${res.data.orderId.substring(0, 8).toUpperCase()}`,
          movieName: seatMap?.movieName || '',
          auditoriumName: seatMap?.auditoriumName || '',
          showTime: seatMap?.startTime || '',
          seats: selectedSeats.map((s) => s.seatName).join(', '),
          totalPrice: res.data.totalPrice || totalPrice,
          customerName: name,
          customerPhone: phone,
          orderDate: res.data.orderDate || new Date().toISOString(),
        });
        showSuccess(t('cashierSales.cashPaymentSuccess'));
        setShowSuccessModal(true);

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
    } catch {
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
        } catch {
          // ignore
        }
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
    setSegmentCounts(emptySegmentCounts(allowedSegments));
    setCustomerEmail('');
    setCustomerName('');
    setCustomerPhone('');
    setCustomerLookupStatus('idle');
    setPaymentMethod(2);
    setShowSuccessModal(false);
    setCompletedOrder(null);
  };

  // Filter schedules based on keyword search
  const filteredSchedules = useMemo(() => {
    if (!searchKeyword.trim()) return schedules;
    const kw = searchKeyword.toLowerCase();
    return schedules.filter(
      (s) =>
        s.movieName.toLowerCase().includes(kw) ||
        s.movieGenres.some((g) => g.toLowerCase().includes(kw))
    );
  }, [schedules, searchKeyword]);

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
      <CashierHeader
        cinemaName={cinemaName}
        session={session}
        bookingLoading={bookingLoading}
        onOpenConcessionPanel={() => setShowConcessionPanel(true)}
        onClockOut={handleClockOut}
        onLogout={handleWebsiteLogout}
      />

      {/* Main Dashboard Workspace split */}
      <main className="flex-1 grid grid-cols-12 overflow-hidden h-[calc(100vh-64px)]">
        {/* Left Column: Movie list and showtimes (Col span 3) */}
        <CashierScheduleCatalog
          searchKeyword={searchKeyword}
          onSearchChange={setSearchKeyword}
          selectedDate={selectedDate}
          loadingCatalog={loadingCatalog}
          filteredSchedules={filteredSchedules}
          selectedMovieId={selectedMovieId}
          onSelectMovieId={setSelectedMovieId}
          selectedScheduleId={selectedScheduleId}
          onSelectScheduleId={setSelectedScheduleId}
        />

        {/* Middle Column: Seat Map Grid (Col span 5) */}
        <CashierSeatGrid
          loadingSeats={loadingSeats}
          selectedScheduleId={selectedScheduleId}
          seatMap={seatMap}
          selectedSeats={selectedSeats}
          lockedSeats={lockedSeats}
          unavailableSeats={unavailableSeats}
          onReloadSeats={() => selectedScheduleId && fetchSeatData(selectedScheduleId)}
          onToggleSeat={toggleSeat}
        />

        {/* Right Column: Order Summary, Customer Lookup & Checkout (Col span 4) */}
        <CashierOrderSummary
          seatMap={seatMap}
          allowedSegments={allowedSegments}
          segmentCounts={segmentCounts}
          onSegmentCountsChange={(next) => {
            void trimSeatsToQuantity(next);
          }}
          ticketQuantity={ticketQuantity}
          selectedSeats={selectedSeats}
          segmentLines={segmentLines}
          customerEmail={customerEmail}
          onCustomerEmailChange={setCustomerEmail}
          onCustomerLookup={handleCustomerLookup}
          customerLookupStatus={customerLookupStatus}
          customerName={customerName}
          onCustomerNameChange={setCustomerName}
          customerPhone={customerPhone}
          onCustomerPhoneChange={setCustomerPhone}
          paymentMethod={paymentMethod}
          onPaymentMethodChange={setPaymentMethod}
          totalPrice={totalPrice}
          bookingLoading={bookingLoading}
          onCheckout={handleCheckout}
        />
      </main>

      {/* POS Success modal print preview popup */}
      {showSuccessModal && (
        <CashierReceiptModal
          completedOrder={completedOrder}
          onNewTransaction={handleNewTransaction}
        />
      )}

      {showConcessionPanel && (
        <ConcessionPosPanel
          cinemaId={cinemaId || null}
          onClose={() => setShowConcessionPanel(false)}
        />
      )}
    </div>
  );
};

export default CashierSalesPage;
