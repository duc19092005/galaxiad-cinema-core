import React from 'react';
import { useTranslation } from 'react-i18next';
import { ShoppingCart, Banknote, CreditCard, Loader2, CheckCircle2 } from 'lucide-react';
import type { PublicSeatMap, PublicSeat, PublicSegmentPrice } from '../../../types/public.types';
import type { SegmentCounts } from '../../../utils/segmentQuantity';
import SegmentQuantityPicker from '../../../components/SegmentQuantityPicker';

interface SegmentLine {
  userSegmentId: string;
  segmentName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

interface CashierOrderSummaryProps {
  seatMap: PublicSeatMap | null;
  allowedSegments: PublicSegmentPrice[];
  segmentCounts: SegmentCounts;
  onSegmentCountsChange: (next: SegmentCounts) => void;
  ticketQuantity: number;
  selectedSeats: PublicSeat[];
  segmentLines: SegmentLine[];
  customerEmail: string;
  onCustomerEmailChange: (val: string) => void;
  onCustomerLookup: () => void;
  customerLookupStatus: 'idle' | 'loading' | 'found' | 'not-found';
  customerName: string;
  onCustomerNameChange: (val: string) => void;
  customerPhone: string;
  onCustomerPhoneChange: (val: string) => void;
  paymentMethod: number;
  onPaymentMethodChange: (val: number) => void;
  totalPrice: number;
  bookingLoading: boolean;
  onCheckout: () => void;
}

export const CashierOrderSummary: React.FC<CashierOrderSummaryProps> = ({
  seatMap,
  allowedSegments,
  segmentCounts,
  onSegmentCountsChange,
  ticketQuantity,
  selectedSeats,
  segmentLines,
  customerEmail,
  onCustomerEmailChange,
  onCustomerLookup,
  customerLookupStatus,
  customerName,
  onCustomerNameChange,
  customerPhone,
  onCustomerPhoneChange,
  paymentMethod,
  onPaymentMethodChange,
  totalPrice,
  bookingLoading,
  onCheckout,
}) => {
  const { t } = useTranslation();

  return (
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
                {new Date(seatMap.startTime).toLocaleTimeString('vi-VN', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}{' '}
                ({new Date(seatMap.startTime).toLocaleDateString('vi-VN')})
              </span>
            </div>
            <div className="flex justify-between">
              <span>{t('cashierSales.auditorium')}:</span>
              <span className="font-semibold text-white">{seatMap.auditoriumName}</span>
            </div>
          </div>
        )}

        {/* Ticket types first */}
        {seatMap && (
          <div className="p-3 bg-[#161622] border border-white/5 rounded-xl">
            <SegmentQuantityPicker
              segments={allowedSegments}
              counts={segmentCounts}
              onChange={onSegmentCountsChange}
              title={t('booking.selectTicketTypes', 'Chọn loại vé')}
              hint={t(
                'booking.selectTicketTypesHint',
                'Chọn số lượng từng loại vé trước, sau đó chọn đúng số ghế trên sơ đồ.'
              )}
            />
          </div>
        )}

        {/* Selected seats + segment breakdown */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block m-0">
              {t('booking.selectedSeats', 'Ghế đã chọn')}
            </label>
            <span
              className={`text-[11px] font-bold ${
                selectedSeats.length === ticketQuantity && ticketQuantity > 0
                  ? 'text-emerald-400'
                  : 'text-[#ff8a00]'
              }`}
            >
              {selectedSeats.length}/{ticketQuantity || 0}
            </span>
          </div>
          {ticketQuantity === 0 ? (
            <div className="text-center py-6 border border-dashed border-white/5 rounded-xl text-zinc-500 text-xs italic">
              {t('booking.pickTicketsFirst', 'Hãy chọn số lượng loại vé trước')}
            </div>
          ) : selectedSeats.length === 0 ? (
            <div className="text-center py-6 border border-dashed border-white/5 rounded-xl text-zinc-500 text-xs italic">
              {t('booking.pickSeatsOnMap', 'Chọn ghế trên sơ đồ ({{count}} ghế)', {
                count: ticketQuantity,
              })}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 mb-3">
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
          {segmentLines.length > 0 && (
            <div className="space-y-1.5 mt-2 pt-2 border-t border-white/5">
              {segmentLines.map((line) => (
                <div key={line.userSegmentId} className="flex justify-between text-xs gap-2">
                  <span className="text-zinc-300 truncate">
                    {line.segmentName} × {line.quantity}
                    <span className="text-zinc-500">
                      {' '}
                      · {line.unitPrice.toLocaleString('vi-VN')}đ
                    </span>
                  </span>
                  <span className="font-bold text-white shrink-0">
                    {line.lineTotal.toLocaleString('vi-VN')}đ
                  </span>
                </div>
              ))}
              <div className="flex justify-between text-[11px] text-zinc-400 pt-1">
                <span>{t('booking.totalSeats', 'Tổng số ghế')}</span>
                <span className="text-white font-semibold">{ticketQuantity}</span>
              </div>
            </div>
          )}
        </div>

        {/* Customer Lookup Info */}
        <div className="p-4 bg-[#161622]/45 border border-white/5 rounded-xl space-y-3.5">
          <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
            {t('cashierSales.memberAccountOptional')}
          </label>

          <div className="flex gap-2">
            <input
              type="email"
              placeholder={t('cashierSales.memberEmailPlaceholder')}
              value={customerEmail}
              onChange={(e) => onCustomerEmailChange(e.target.value)}
              className="flex-1 bg-black/40 text-xs text-white px-3 py-2 rounded-lg border border-white/5 outline-none focus:border-[#ff8a00]/30"
            />
            <button
              type="button"
              onClick={onCustomerLookup}
              className="px-3 py-2 rounded-lg bg-zinc-800 text-xs font-bold text-white border border-white/5 hover:bg-zinc-700 active:scale-95 transition-all cursor-pointer"
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
              <label className="text-[9px] text-zinc-400 block mb-1">
                {t('cashierSales.customerName')} *
              </label>
              <input
                type="text"
                placeholder={t('cashierSales.customerNamePlaceholder')}
                value={customerName}
                onChange={(e) => onCustomerNameChange(e.target.value)}
                className="w-full bg-black/40 text-xs text-white px-2.5 py-2 rounded-lg border border-white/5 outline-none focus:border-[#ff8a00]/30"
              />
            </div>
            <div>
              <label className="text-[9px] text-zinc-400 block mb-1">
                {t('cashierSales.phoneNumber')} *
              </label>
              <input
                type="tel"
                placeholder={t('cashierSales.phoneNumberPlaceholder')}
                value={customerPhone}
                onChange={(e) => onCustomerPhoneChange(e.target.value)}
                className="w-full bg-black/40 text-xs text-white px-2.5 py-2 rounded-lg border border-white/5 outline-none focus:border-[#ff8a00]/30"
              />
            </div>
          </div>
        </div>

        {/* Payment Method Selector */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
            {t('cashierSales.paymentMethod')}
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => onPaymentMethodChange(2)}
              className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all cursor-pointer ${
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
              onClick={() => onPaymentMethodChange(0)}
              className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all cursor-pointer ${
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
          onClick={onCheckout}
          disabled={
            ticketQuantity <= 0 ||
            selectedSeats.length !== ticketQuantity ||
            bookingLoading
          }
          className={`w-full h-12 rounded-xl font-bold flex items-center justify-center gap-2 border-none transition-all active:scale-98 ${
            ticketQuantity <= 0 || selectedSeats.length !== ticketQuantity
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
  );
};

export default CashierOrderSummary;
