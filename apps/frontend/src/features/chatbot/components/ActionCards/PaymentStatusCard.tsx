import React from 'react';
import { useTranslation } from 'react-i18next';
import { CreditCard, Loader2 } from 'lucide-react';
import { theme, ghostButton, primaryButton } from '../../theme/chatbotTheme';
import { ActionShell } from '../ActionShell';

export const PaymentStatusCard: React.FC<{
  paymentUrl?: string;
  loading: boolean;
  onOpen: () => void;
  onCheck: () => void;
}> = ({ paymentUrl, loading, onOpen, onCheck }) => {
  const { t } = useTranslation();
  return (
    <ActionShell title={t('chatbot.paymentTitle')} icon={<CreditCard size={13} />}>
      <p style={{ color: theme.muted, fontSize: 12, margin: '0 0 10px' }}>
        {t('chatbot.paymentDesc')}
      </p>
      <div style={{ display: 'grid', gap: 8 }}>
        {paymentUrl && <button onClick={onOpen} style={primaryButton}>{t('chatbot.openPayment')}</button>}
        <button onClick={onCheck} style={ghostButton} disabled={loading}>
          {loading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : t('chatbot.paid')}
        </button>
      </div>
    </ActionShell>
  );
};
