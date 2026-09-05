import React from 'react';
import { Bot, User } from 'lucide-react';
import type { ChatMessage } from '../types/chatbot.types';
import { theme } from '../theme/chatbotTheme';
import { renderMarkdown } from '../utils/chatbotHelpers';

export const ChatMessageBubble: React.FC<{
  message: ChatMessage;
  children?: React.ReactNode;
}> = ({ message, children }) => {
  const isUser = message.role === 'user';
  return (
    <div style={{ display: 'flex', gap: 10, justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
      {!isUser && (
        <div className="liquid-glass-avatar" style={{
          width: 32,
          height: 32,
          borderRadius: 12,
          background: 'linear-gradient(145deg, rgba(255,255,255,0.22), rgba(255,159,10,0.18))',
          border: `1px solid ${theme.border}`,
          boxShadow: '0 1px 0 rgba(255,255,255,0.35) inset, 0 6px 14px rgba(0,0,0,0.2)',
          backdropFilter: theme.blurSoft,
          WebkitBackdropFilter: theme.blurSoft,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          marginTop: 2,
        }}>
          <Bot size={15} color={theme.accent} />
        </div>
      )}
      <div style={{
        maxWidth: isUser ? '78%' : '86%',
        minWidth: 0,
        overflow: 'hidden',
        color: theme.text,
      }}>
        <div className={isUser ? 'liquid-glass-bubble-user' : 'liquid-glass-bubble-bot'} style={{
          padding: '12px 14px',
          borderRadius: isUser ? '20px 20px 6px 20px' : '20px 20px 20px 6px',
          background: isUser
            ? `linear-gradient(145deg, rgba(232,137,11,0.82), rgba(200,110,8,0.78))`
            : 'linear-gradient(160deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.04) 100%)',
          border: isUser ? '1px solid rgba(255,255,255,0.16)' : `1px solid ${theme.borderSoft}`,
          boxShadow: isUser
            ? '0 1px 0 rgba(255,255,255,0.12) inset, 0 6px 14px rgba(0,0,0,0.16)'
            : '0 1px 0 rgba(255,255,255,0.08) inset, 0 4px 12px rgba(0,0,0,0.12)',
          backdropFilter: isUser ? undefined : theme.blurSoft,
          WebkitBackdropFilter: isUser ? undefined : theme.blurSoft,
          color: isUser ? '#1c1c1e' : theme.text,
          fontSize: 12,
          lineHeight: 1.6,
          wordBreak: 'break-word',
          overflowWrap: 'break-word',
          whiteSpace: 'pre-wrap',
        }}>
          {isUser ? message.text : renderMarkdown(message.text)}
        </div>
        {children}
      </div>
      {isUser && (
        <div style={{
          width: 32,
          height: 32,
          borderRadius: 12,
          background: 'rgba(255,255,255,0.12)',
          border: `1px solid ${theme.borderSoft}`,
          boxShadow: '0 1px 0 rgba(255,255,255,0.25) inset',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          marginTop: 2,
        }}>
          <User size={15} color="#fff" />
        </div>
      )}
    </div>
  );
};
