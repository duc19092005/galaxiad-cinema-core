import React from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, CreditCard, QrCode, Check, Copy, LogOut } from 'lucide-react';
import type { GroupBookingState } from '../../types/socialBooking.types';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import CountdownTimer from './CountdownTimer';

interface SocialBookingHeaderProps {
  groupState: GroupBookingState;
  canPay: boolean;
  isProcessingPayment: boolean;
  copied: boolean;
  onPayGroup: () => void;
  onOpenQrModal: () => void;
  onCopyInviteLink: () => void;
  onLeaveGroup: () => void;
  onRefreshGroupState: () => void;
}

export const SocialBookingHeader: React.FC<SocialBookingHeaderProps> = ({
  groupState,
  canPay,
  isProcessingPayment,
  copied,
  onPayGroup,
  onOpenQrModal,
  onCopyInviteLink,
  onLeaveGroup,
  onRefreshGroupState,
}) => {
  const { t } = useTranslation();

  return (
    <header className="fixed top-0 w-full z-40 flex justify-between items-center px-4 md:px-8 py-3 bg-[#121317]/80 backdrop-blur-xl border-b border-[#554334]/20 shadow-lg shadow-black/10">
      <div className="flex items-center gap-3">
        <div className="flex flex-col">
          <h1 className="text-[14px] md:text-[18px] font-bold text-[#ffbd7f] tracking-tight leading-tight">
            {groupState.groupName}
          </h1>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="bg-[#ff9500]/20 text-[#ffbd7f] text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest font-mono">
              {groupState.groupCode}
            </span>
            <span className="text-[11px] text-[#dbc2ad]/60 hidden md:block font-medium truncate max-w-[200px]">
              {groupState.movieName}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 md:gap-2.5">
        {canPay && (
          <button
            onClick={onPayGroup}
            disabled={isProcessingPayment}
            className="flex items-center gap-1.5 bg-[#ff9500] text-[#4b2800] px-3.5 py-2 rounded-xl font-bold text-xs hover:bg-[#ffbd7f] transition-all duration-200 disabled:opacity-60 shadow-md shadow-[#ff9500]/10 hover:scale-[1.02] cursor-pointer"
          >
            {isProcessingPayment ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <CreditCard className="w-3.5 h-3.5" />
            )}
            <span className="hidden md:inline">{t('socialBooking.header.pay', 'Thanh toán')}</span>
            <span className="md:hidden">{t('socialBooking.header.payMobile', 'Pay')}</span>
          </button>
        )}

        <button
          onClick={onOpenQrModal}
          className="flex items-center gap-1.5 bg-[#292a2e]/80 border border-[#554334]/15 px-3 py-2 rounded-xl hover:bg-[#343539] hover:border-[#ff9500]/30 transition-all duration-200 cursor-pointer"
          title="QR Code"
        >
          <QrCode className="w-3.5 h-3.5 text-[#ff9500]" />
          <span className="text-xs font-bold text-[#e3e2e7] hidden md:block">
            {t('socialBooking.header.qr', 'QR')}
          </span>
        </button>

        <button
          onClick={onCopyInviteLink}
          className="flex items-center gap-1.5 bg-[#292a2e]/80 border border-[#554334]/15 px-3 py-2 rounded-xl hover:bg-[#343539] hover:border-[#ff9500]/30 transition-all duration-200 min-w-[70px] justify-center cursor-pointer"
        >
          {copied ? (
            <Check className="w-3.5 h-3.5 text-[#34C759]" />
          ) : (
            <Copy className="w-3.5 h-3.5 text-[#dbc2ad]" />
          )}
          <span className="text-xs font-bold text-[#e3e2e7] hidden md:block">
            {copied
              ? t('socialBooking.header.copied', 'Đã copy!')
              : t('socialBooking.header.copyLink', 'Sao chép link')}
          </span>
        </button>

        <button
          onClick={onLeaveGroup}
          className="p-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all duration-200 cursor-pointer"
          title={t('socialBooking.header.leave', 'Rời phòng')}
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>

        <div className="w-px h-5 bg-[#554334]/20 mx-0.5" />

        <LanguageSwitcher />

        {groupState.status !== 'Cancelled' && groupState.status !== 'Completed' && (
          <CountdownTimer
            expiresAt={groupState.paymentDeadlineAt || groupState.expiresAt}
            onExpire={onRefreshGroupState}
          />
        )}
      </div>
    </header>
  );
};

export default SocialBookingHeader;
