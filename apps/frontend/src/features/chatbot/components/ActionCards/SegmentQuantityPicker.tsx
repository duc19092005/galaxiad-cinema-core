import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Ticket } from 'lucide-react';
import type { PublicPricing, PublicSegmentPrice } from '../../../../types/public.types';
import { theme, optionButtonStyle, ghostButton, primaryButton } from '../../theme/chatbotTheme';
import { ActionShell } from '../ActionShell';
import { formatCurrency, MAX_TICKETS } from '../../utils/chatbotHelpers';

export const SegmentQuantityPicker: React.FC<{
  pricing: PublicPricing;
  ageRestriction?: string;
  onPick: (segment: PublicSegmentPrice, quantity: number) => void;
}> = ({ pricing, ageRestriction, onPick }) => {
  const { t } = useTranslation();

  const filteredSegments = useMemo(() => {
    const age = ageRestriction?.trim();
    if (!age || age === 'P' || age === 'K') return pricing.segmentPrices;
    if (age === 'T13' || age === 'T16' || age === 'T18') {
      return pricing.segmentPrices.filter(s => s.segmentName !== 'Child');
    }
    return pricing.segmentPrices;
  }, [pricing.segmentPrices, ageRestriction]);

  const [segmentId, setSegmentId] = useState(filteredSegments[0]?.userSegmentId || '');
  const [quantity, setQuantity] = useState(1);
  const segment = filteredSegments.find(item => item.userSegmentId === segmentId) || filteredSegments[0];

  return (
    <ActionShell title={t('chatbot.segmentPicker')} icon={<Ticket size={13} />}>
      <div style={{ display: 'grid', gap: 8 }}>
        {filteredSegments.map(item => (
          <button
            key={item.userSegmentId}
            onClick={() => setSegmentId(item.userSegmentId)}
            style={{
              ...optionButtonStyle,
              borderColor: item.userSegmentId === segmentId ? theme.accent : theme.border,
              background: item.userSegmentId === segmentId ? theme.accentSoft : 'rgba(255,255,255,0.05)',
            }}
          >
            <span style={{ textAlign: 'left' }}>
              <span style={{ display: 'block', fontWeight: 900 }}>{item.segmentName}</span>
              <span style={{ display: 'block', color: theme.muted, fontSize: 11 }}>{item.description || t('chatbot.segmentDesc')}</span>
            </span>
            <span style={{ color: theme.accent, fontWeight: 900 }}>{formatCurrency(item.finalPrice)}</span>
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
        <button onClick={() => setQuantity(Math.max(1, quantity - 1))} style={{ ...ghostButton, width: 40, padding: 9 }}>-</button>
        <input
          type="number"
          min={1}
          max={MAX_TICKETS}
          value={quantity}
          onChange={event => setQuantity(Math.max(1, Math.min(MAX_TICKETS, Number(event.target.value) || 1)))}
          style={{
            flex: 1,
            minWidth: 0,
            background: theme.surface,
            color: theme.text,
            border: `1px solid ${theme.border}`,
            borderRadius: 10,
            padding: '10px 12px',
            textAlign: 'center',
            fontWeight: 900,
          }}
        />
        <button onClick={() => setQuantity(Math.min(MAX_TICKETS, quantity + 1))} style={{ ...ghostButton, width: 40, padding: 9 }}>+</button>
      </div>
      <button
        disabled={!segment}
        onClick={() => segment && onPick(segment, quantity)}
        style={{ ...primaryButton, width: '100%', marginTop: 10, opacity: segment ? 1 : 0.5 }}
      >
        {t('chatbot.suggestSeats', { count: quantity })}
      </button>
    </ActionShell>
  );
};
