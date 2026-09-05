import React from 'react';
import { Bot } from 'lucide-react';
import { motion } from 'framer-motion';
import { theme } from '../theme/chatbotTheme';

export const TypingIndicator: React.FC<{ statusText?: string }> = ({ statusText }) => (
  <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-start' }}>
    <div style={{
      width: 32, height: 32, borderRadius: 12,
      background: 'linear-gradient(145deg, rgba(255,255,255,0.2), rgba(255,159,10,0.16))',
      border: `1px solid ${theme.border}`,
      boxShadow: '0 1px 0 rgba(255,255,255,0.3) inset',
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2,
    }}>
      <Bot size={15} color={theme.accent} />
    </div>
    <div style={{
      padding: '12px 16px', borderRadius: '20px 20px 20px 6px',
      background: 'linear-gradient(160deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.06) 100%)',
      border: `1px solid ${theme.border}`,
      boxShadow: '0 1px 0 rgba(255,255,255,0.2) inset, 0 8px 18px rgba(0,0,0,0.15)',
      backdropFilter: theme.blurSoft,
      WebkitBackdropFilter: theme.blurSoft,
      display: 'flex', alignItems: 'center', gap: 8,
    }}>
      <div style={{ display: 'flex', gap: 4 }}>
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.14, ease: 'easeInOut' }}
            style={{ width: 6, height: 6, borderRadius: '50%', background: theme.accent }}
          />
        ))}
      </div>
      {statusText && <span style={{ fontSize: 11, color: theme.muted, fontWeight: 600 }}>{statusText}</span>}
    </div>
  </div>
);
