import React from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, Printer, ChevronRight } from 'lucide-react';

export interface CompletedOrderData {
  bookingCode: string;
  movieName: string;
  auditoriumName: string;
  showTime: string;
  seats: string;
  totalPrice: number;
  customerName: string;
  customerPhone: string;
  orderDate: string;
}

interface CashierReceiptModalProps {
  completedOrder: CompletedOrderData | null;
  onNewTransaction: () => void;
}

export const CashierReceiptModal: React.FC<CashierReceiptModalProps> = ({
  completedOrder,
  onNewTransaction,
}) => {
  const { t } = useTranslation();

  if (!completedOrder) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 z-50 animate-fadeIn">
      <div className="w-full max-w-md bg-[#101017] border border-[#ff8a00]/30 rounded-2xl p-6 shadow-2xl space-y-5 text-center">
        <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
          <CheckCircle2 size={24} />
        </div>

        <div className="space-y-1">
          <h2 className="text-lg font-extrabold text-white">
            {t('cashierSales.paymentComplete')}
          </h2>
          <p className="text-xs text-zinc-400">{t('cashierSales.cashOrderRecorded')}</p>
        </div>

        {/* Simulated ticket paper box style */}
        <div className="p-4 bg-white text-black rounded-xl text-left font-mono text-xs shadow-inner space-y-3 relative overflow-hidden border border-zinc-200">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-red-500 via-[#ff8a00] to-violet-600"></div>

          <div className="text-center font-bold text-sm tracking-wider border-b border-dashed border-zinc-300 pb-2">
            CINEMA TICKET
          </div>

          <div className="space-y-1.5 pt-1">
            <div>
              <span className="opacity-70">{t('cashierSales.bookingCode')}:</span>{' '}
              <strong className="float-right text-sm">{completedOrder.bookingCode}</strong>
            </div>
            <div>
              <span className="opacity-70">{t('cashierSales.movie')}:</span>{' '}
              <strong className="float-right text-right truncate max-w-[70%]">
                {completedOrder.movieName}
              </strong>
            </div>
            <div>
              <span className="opacity-70">{t('cashierSales.room')}:</span>{' '}
              <strong className="float-right">{completedOrder.auditoriumName}</strong>
            </div>
            <div>
              <span className="opacity-70">{t('cashierSales.showTime')}:</span>{' '}
              <strong className="float-right">
                {new Date(completedOrder.showTime).toLocaleTimeString('vi-VN', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}{' '}
                ({new Date(completedOrder.showTime).toLocaleDateString('vi-VN')})
              </strong>
            </div>
            <div>
              <span className="opacity-70">{t('cashierSales.seats')}:</span>{' '}
              <strong className="float-right">{completedOrder.seats}</strong>
            </div>
            <div className="border-t border-dashed border-zinc-300 pt-2 font-bold text-sm mt-2">
              <span>{t('cashierSales.totalAmount')}:</span>
              <span className="float-right">
                {completedOrder.totalPrice.toLocaleString('vi-VN')} đ
              </span>
            </div>
          </div>

          <div className="border-t border-dashed border-zinc-300 pt-2 space-y-1">
            <div>
              <span className="opacity-70">{t('cashierSales.customer')}:</span>{' '}
              <span className="float-right">{completedOrder.customerName}</span>
            </div>
            <div>
              <span className="opacity-70">{t('cashierSales.phone')}:</span>{' '}
              <span className="float-right">{completedOrder.customerPhone}</span>
            </div>
            <div>
              <span className="opacity-70">{t('cashierSales.printTime')}:</span>{' '}
              <span className="float-right">
                {new Date(completedOrder.orderDate).toLocaleTimeString('vi-VN')}
              </span>
            </div>
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
            onClick={onNewTransaction}
            className="w-full h-11 rounded-xl bg-[#ff8a00] text-black font-bold flex items-center justify-center gap-2 hover:bg-[#ff8a00]/95 hover:shadow-lg hover:shadow-[#ff8a00]/10 transition-all cursor-pointer border-none"
          >
            <span>{t('cashierSales.newTransaction')}</span>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CashierReceiptModal;
