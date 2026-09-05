import React from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { PublicSeatMap, PublicSeat } from '../../../types/public.types';
import type { ConcessionMenuItemDto } from '../../../types/concession.types';
import type { UserVoucherDto } from '../../../api/voucherApi';

interface BookingSummarySidebarProps {
  seatMap: PublicSeatMap;
  ageSymbol?: string;
  selectedSeats: PublicSeat[];
  ticketQuantity: number;
  selectedConcessionLines: Array<{ item: ConcessionMenuItemDto; quantity: number }>;
  isLoggedIn: boolean;
  isCashierMode: boolean;
  myVouchers: UserVoucherDto[];
  selectedVoucherId: string;
  onSelectVoucher: (voucherId: string) => void;
  customerInfo: { name: string; email: string; phone: string; address: string };
  onCustomerInfoChange: React.Dispatch<
    React.SetStateAction<{ name: string; email: string; phone: string; address: string }>
  >;
  totalPrice: number;
  bookingLoading: boolean;
  selectionCreatesIsolation: boolean;
  onProceedBooking: () => void;
}

export const BookingSummarySidebar: React.FC<BookingSummarySidebarProps> = ({
  seatMap,
  ageSymbol,
  selectedSeats,
  ticketQuantity,
  selectedConcessionLines,
  isLoggedIn,
  isCashierMode,
  myVouchers,
  selectedVoucherId,
  onSelectVoucher,
  customerInfo,
  onCustomerInfoChange,
  totalPrice,
  bookingLoading,
  selectionCreatesIsolation,
  onProceedBooking,
}) => {
  const { t } = useTranslation();

  return (
    <aside className="lg:col-span-4 sticky top-28 w-full">
      <div className="glass-card rounded-2xl p-7 shadow-2xl overflow-hidden relative border border-white/10">
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#ff8a00]/10 blur-[100px] rounded-full pointer-events-none"></div>

        <div className="flex items-center gap-3 mb-6">
          <span
            className="material-symbols-outlined text-[#ff8a00]"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            shopping_cart
          </span>
          <h2 className="text-xl font-bold text-white m-0">Booking Summary</h2>
        </div>

        <div className="space-y-4 mb-6">
          <div className="flex justify-between items-start">
            <span className="text-zinc-400 text-xs uppercase tracking-wider font-semibold">
              Movie
            </span>
            <span className="text-white font-bold text-right break-words max-w-[60%]">
              {seatMap.movieName}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400 text-xs uppercase tracking-wider font-semibold">
              Venue
            </span>
            <span className="text-white font-semibold text-sm">{seatMap.auditoriumName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400 text-xs uppercase tracking-wider font-semibold">
              Format
            </span>
            <span className="text-white font-semibold text-sm">
              {seatMap.movieVisualFormatName || '2D'}
            </span>
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
              <span
                className={`text-xs font-bold ${
                  selectedSeats.length === ticketQuantity && ticketQuantity > 0
                    ? 'text-emerald-400'
                    : 'text-[#ff8a00]'
                }`}
              >
                {selectedSeats.length}/{ticketQuantity || 0}
              </span>
            </div>
            {ticketQuantity === 0 ? (
              <span className="text-zinc-500 italic text-xs">
                {t('booking.pickTicketsFirst', 'Hãy chọn số lượng loại vé trước')}
              </span>
            ) : selectedSeats.length === 0 ? (
              <span className="text-zinc-500 italic text-xs">
                {t('booking.pickSeatsOnMap', 'Chọn ghế trên sơ đồ ({{count}} ghế)', {
                  count: ticketQuantity,
                })}
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
                  <span className="text-white truncate font-medium">
                    {item.productName} × {quantity}
                  </span>
                  <span className="font-bold text-white shrink-0">
                    {(item.unitPrice * quantity).toLocaleString('vi-VN')}đ
                  </span>
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
              onChange={(e) => onSelectVoucher(e.target.value)}
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
                <>
                  Bán vé tại quầy. Nhập{' '}
                  <span className="text-[#ff8a00] font-bold">thông tin khách hàng</span>
                </>
              ) : (
                <>
                  Booking as <span className="text-[#ff8a00] font-bold">Guest</span>
                </>
              )}
            </p>
            <input
              type="text"
              placeholder="Full Name *"
              value={customerInfo.name}
              onChange={(e) =>
                onCustomerInfoChange((prev) => ({ ...prev, name: e.target.value }))
              }
              className="w-full bg-black/40 text-white text-xs p-2.5 rounded-lg border border-white/10 outline-none focus:border-[#ff8a00]"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="email"
                placeholder={isCashierMode ? 'Email (Optional)' : 'Email *'}
                value={customerInfo.email}
                onChange={(e) =>
                  onCustomerInfoChange((prev) => ({ ...prev, email: e.target.value }))
                }
                className="w-full bg-black/40 text-white text-xs p-2.5 rounded-lg border border-white/10 outline-none focus:border-[#ff8a00]"
              />
              <input
                type="tel"
                placeholder="Phone *"
                value={customerInfo.phone}
                onChange={(e) =>
                  onCustomerInfoChange((prev) => ({ ...prev, phone: e.target.value }))
                }
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
            ticketQuantity <= 0 ||
            selectedSeats.length !== ticketQuantity ||
            bookingLoading ||
            selectionCreatesIsolation
          }
          onClick={onProceedBooking}
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
  );
};

export default BookingSummarySidebar;
