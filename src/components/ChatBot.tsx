// src/components/ChatBot.tsx
import React, { useState, useRef } from 'react';
import { MessageCircle, X, Send, Bot, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ChatMessage {
  role: 'bot' | 'user';
  text: string;
}

const ChatBot: React.FC = () => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'bot', text: t('chatbot.greeting') },
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getAutoReply = (msg: string): string => {
    const lower = msg.toLowerCase().trim();
    if (lower.includes('hi') || lower.includes('hello') || lower.includes('xin chào')) return t('chatbot.replyHi');
    if (lower.includes('help') || lower.includes('giúp') || lower.includes('hỗ trợ')) return t('chatbot.replyHelp');
    if (lower.includes('vé') || lower.includes('ticket')) return t('chatbot.replyTicket');
    if (lower.includes('phim') || lower.includes('movie')) return t('chatbot.replyMovie');
    if (lower.includes('giá') || lower.includes('price') || lower.includes('cost')) return t('chatbot.replyPrice');
    if (lower.includes('cảm ơn') || lower.includes('thank')) return t('chatbot.replyThanks');
    return t('chatbot.replyDefault');
  };

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    setInput('');

    // Add user message
    const userMsg: ChatMessage = { role: 'user', text };
    setMessages(prev => [...prev, userMsg]);

    // Auto reply after short delay
    setTimeout(() => {
      const botMsg: ChatMessage = {
        role: 'bot',
        text: getAutoReply(text),
      };
      setMessages(prev => [...prev, botMsg]);
    }, 600);
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label={t('chatbot.ariaLabel')}
        style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
          width: 56, height: 56, borderRadius: '50%',
          border: 'none', cursor: 'pointer',
          background: 'linear-gradient(135deg, #6366f1, #a855f7)',
          color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 32px rgba(99,102,241,0.4)',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          transform: isOpen ? 'scale(0.9)' : 'scale(1)',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = isOpen ? 'scale(0.9)' : 'scale(1)'; }}
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div
          style={{
            position: 'fixed', bottom: 92, right: 24, zIndex: 9998,
            width: 360, maxWidth: 'calc(100vw - 32px)',
            background: 'var(--bg-card, #1e1b2e)',
            borderRadius: 16, border: '1px solid var(--border-color, rgba(255,255,255,0.08))',
            display: 'flex', flexDirection: 'column',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            transform: 'translateY(0) scale(1)',
            opacity: 1,
            transition: 'all 0.25s ease',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div style={{
            padding: '16px 20px',
            background: 'linear-gradient(135deg, #6366f1, #a855f7)',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <Bot size={20} color="#fff" />
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#fff' }}>CinemaPro AI</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>{t('chatbot.subtitle')}</div>
            </div>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1, overflowY: 'auto', padding: 16,
            display: 'flex', flexDirection: 'column', gap: 12,
            minHeight: 280, maxHeight: 340,
          }}>
            {messages.map((msg, i) => (
              <div key={i} style={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              }}>
                <div style={{
                  maxWidth: '80%',
                  padding: '10px 14px',
                  borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  background: msg.role === 'user'
                    ? 'linear-gradient(135deg, #6366f1, #a855f7)'
                    : 'var(--bg-surface-elevated, rgba(255,255,255,0.06))',
                  color: msg.role === 'user' ? '#fff' : 'var(--text-primary, #e2e8f0)',
                  fontSize: 13, lineHeight: 1.5, whiteSpace: 'pre-wrap',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    {msg.role === 'bot' ? <Bot size={12} /> : <User size={12} />}
                    <span style={{ fontSize: 10, opacity: 0.6 }}>
                      {msg.role === 'bot' ? 'AI' : t('chatbot.you')}
                    </span>
                  </div>
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={{
            padding: '12px 16px',
            borderTop: '1px solid var(--border-color, rgba(255,255,255,0.08))',
            display: 'flex', gap: 8,
          }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) handleSend(); }}
              placeholder={t('chatbot.placeholder')}
              style={{
                flex: 1, padding: '10px 14px', borderRadius: 12,
                border: '1px solid var(--border-color, rgba(255,255,255,0.1))',
                background: 'var(--bg-base, rgba(0,0,0,0.2))',
                color: 'var(--text-primary, #e2e8f0)', fontSize: 13,
                outline: 'none',
              }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              style={{
                width: 40, height: 40, borderRadius: 12,
                border: 'none', cursor: input.trim() ? 'pointer' : 'default',
                background: input.trim()
                  ? 'linear-gradient(135deg, #6366f1, #a855f7)'
                  : 'var(--border-color, rgba(255,255,255,0.08))',
                color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s ease',
                opacity: input.trim() ? 1 : 0.5,
              }}
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatBot;
