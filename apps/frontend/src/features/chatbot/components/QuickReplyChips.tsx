import React from 'react';
import type { QuickReply } from '../types/chatbot.types';
import { ghostButton, theme } from '../theme/chatbotTheme';

export const QuickReplyChips: React.FC<{
  replies: QuickReply[];
  onSelect: (value: string) => void;
}> = ({ replies, onSelect }) => {
  if (!replies.length) return null;
  return (
    <div style={{
      display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8, paddingLeft: 40,
    }}>
      {replies.map(reply => (
        <button
          key={reply.label}
          onClick={() => onSelect(reply.value)}
          style={{
            ...ghostButton,
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '6px 10px', fontSize: 11, fontWeight: 700,
            background: 'rgba(255,255,255,0.06)', color: theme.text,
            border: `1px solid ${theme.border}`, borderRadius: 8,
            whiteSpace: 'nowrap', cursor: 'pointer',
          }}
        >
          {reply.icon}
          {reply.label}
        </button>
      ))}
    </div>
  );
};
