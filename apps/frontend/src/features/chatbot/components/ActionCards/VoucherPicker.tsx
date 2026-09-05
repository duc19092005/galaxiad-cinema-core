import React from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Tag } from 'lucide-react';
import type { UserVoucherDto, VoucherDto } from '../../../../api/voucherApi';
import { theme, optionButtonStyle, ghostButton } from '../../theme/chatbotTheme';
import { ActionShell } from '../ActionShell';

export const VoucherPicker: React.FC<{
  mode: 'mode' | 'owned' | 'redeem';
  vouchers: UserVoucherDto[];
  redeemableVouchers: VoucherDto[];
  rewardPoints: number;
  onChooseMode: (mode: 'owned' | 'redeem' | 'skip') => void;
  onPickOwned: (voucher: UserVoucherDto) => void;
  onRedeem: (voucher: VoucherDto) => void;
}> = ({ mode, vouchers, redeemableVouchers, rewardPoints, onChooseMode, onPickOwned, onRedeem }) => {
  const { t } = useTranslation();
  return (
    <ActionShell title={t('chatbot.voucherTitle')} icon={<Tag size={13} />}>
      {mode === 'mode' && (
        <div style={{ display: 'grid', gap: 8 }}>
          <button onClick={() => onChooseMode('owned')} style={optionButtonStyle}>{t('chatbot.useVoucher')}</button>
          <button onClick={() => onChooseMode('redeem')} style={optionButtonStyle}>{t('chatbot.buyVoucher')}</button>
          <button onClick={() => onChooseMode('skip')} style={ghostButton}>{t('chatbot.skipVoucher')}</button>
        </div>
      )}
      {mode === 'owned' && (
        <div style={{ display: 'grid', gap: 8 }}>
          {vouchers.length === 0 && <p style={{ color: theme.muted, fontSize: 12, margin: 0 }}>{t('chatbot.noVoucherAvailable')}</p>}
          {vouchers.map(voucher => (
            <button key={voucher.userVoucherId} onClick={() => onPickOwned(voucher)} style={optionButtonStyle}>
              <span style={{ textAlign: 'left' }}>
                <span style={{ display: 'block', fontWeight: 900 }}>{voucher.voucherName}</span>
                <span style={{ display: 'block', color: theme.muted, fontSize: 11 }}>{t('chatbot.discountPercent', { percent: voucher.voucherDiscountPercent })}</span>
              </span>
              <Check size={14} />
            </button>
          ))}
          <button onClick={() => onChooseMode('skip')} style={ghostButton}>{t('chatbot.skipVoucher')}</button>
        </div>
      )}
      {mode === 'redeem' && (
        <div style={{ display: 'grid', gap: 8 }}>
          <div style={{ color: theme.muted, fontSize: 12, fontWeight: 800 }}>{t('chatbot.rewardPoints', { points: rewardPoints.toLocaleString('vi-VN') })}</div>
          {redeemableVouchers.length === 0 && <p style={{ color: theme.muted, fontSize: 12, margin: 0 }}>{t('chatbot.noRedeemableVouchers')}</p>}
          {redeemableVouchers.map(voucher => (
            <button key={voucher.voucherId} onClick={() => onRedeem(voucher)} style={optionButtonStyle}>
              <span style={{ textAlign: 'left' }}>
                <span style={{ display: 'block', fontWeight: 900 }}>{voucher.voucherName}</span>
                <span style={{ display: 'block', color: theme.muted, fontSize: 11 }}>{t('chatbot.discountPercent', { percent: voucher.voucherDiscountPercent })}</span>
              </span>
              <span style={{ color: theme.accent, fontWeight: 900 }}>{t('chatbot.pointsCost', { points: voucher.voucherPointsCost })}</span>
            </button>
          ))}
          <button onClick={() => onChooseMode('skip')} style={ghostButton}>{t('chatbot.skipVoucher')}</button>
        </div>
      )}
    </ActionShell>
  );
};
