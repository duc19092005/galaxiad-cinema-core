import { useTranslation } from 'react-i18next';
import { AlertTriangle, Shield, UserCheck, X } from 'lucide-react';
import type { GroupPaymentActionResponse } from '../../types/socialBooking.types';

interface Props {
  paymentAction: GroupPaymentActionResponse;
  isHost: boolean;
  onAction: (action: 'Cover' | 'TakeOverAll' | 'CancelGroup') => Promise<void>;
  onClose: () => void;
}

export default function GroupPaymentModal({ paymentAction, isHost, onAction, onClose }: Props) {
  const { t } = useTranslation();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#1a1a20] border border-white/10 rounded-2xl p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-400" />
            <h3 className="font-bold text-white">{t('socialBooking.paymentActionTitle', 'Payment Issue')}</h3>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-white/60 mb-6">{paymentAction.message}</p>

        {isHost ? (
          <div className="space-y-3">
            <button
              onClick={() => onAction('Cover')}
              className="w-full flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors text-left"
            >
              <Shield className="w-5 h-5 text-blue-400" />
              <div>
                <p className="text-sm font-medium text-white">{t('socialBooking.coverAction', 'Cover Payment')}</p>
                <p className="text-xs text-white/40">{t('socialBooking.coverDesc', 'Pay for the failed member')}</p>
              </div>
            </button>

            <button
              onClick={() => onAction('TakeOverAll')}
              className="w-full flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors text-left"
            >
              <UserCheck className="w-5 h-5 text-[#ff8a00]" />
              <div>
                <p className="text-sm font-medium text-white">{t('socialBooking.takeOverAction', 'Take Over All')}</p>
                <p className="text-xs text-white/40">{t('socialBooking.takeOverDesc', 'Pay remaining balance, others refunded')}</p>
              </div>
            </button>

            <button
              onClick={() => onAction('CancelGroup')}
              className="w-full flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl hover:bg-red-500/20 transition-colors text-left"
            >
              <X className="w-5 h-5 text-red-400" />
              <div>
                <p className="text-sm font-medium text-red-400">{t('socialBooking.cancelGroup', 'Cancel Group')}</p>
                <p className="text-xs text-white/40">{t('socialBooking.cancelGroupDesc', 'Dissolve group, refund via credits')}</p>
              </div>
            </button>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-white/40">
              {t('socialBooking.waitingHost', 'Waiting for host to decide...')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
