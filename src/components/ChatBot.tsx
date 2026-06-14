// src/components/ChatBot.tsx
import React, { useState, useRef } from 'react';
import { MessageCircle, X, Send, Bot, User } from 'lucide-react';

interface ChatMessage {
  role: 'bot' | 'user';
  text: string;
}

const INITIAL_MESSAGES: ChatMessage[] = [
  { role: 'bot', text: '👋 Xin chào! Tôi là trợ lý ảo của CinemaPro. Tôi có thể giúp gì cho bạn?' },
];

const AUTO_REPLIES: Record<string, string> = {
  'hi': 'Chào bạn! Bạn cần hỗ trợ gì về đặt vé, khuyến mãi hay thông tin rạp?',
  'hello': 'Hello! How can I assist you today?',
  'xin chào': 'Chào bạn! Bạn cần hỗ trợ gì ạ?',
  'help': 'Tôi có thể giúp bạn:\n- Đặt vé xem phim 🎬\n- Xem khuyến mãi 🎁\n- Thông tin rạp 🏢\n- Hỗ trợ tài khoản 👤\nBạn muốn tìm hiểu gì?',
  'vé': 'Để đặt vé, bạn vào trang chủ, chọn phim, rạp và suất chiếu nhé! 🎫',
  'phim': 'Bạn có thể xem danh sách phim đang chiếu và sắp chiếu ngay trên trang chủ! 🍿',
  'giá': 'Giá vé tùy theo rạp, suất chiếu và loại ghế. Bạn có thể xem chi tiết khi đặt vé.',
  'cảm ơn': 'Rất vui được giúp bạn! Có gì cần hỗ trợ thêm cứ hỏi nhé 😊',
  'thank': "You're welcome! Feel free to ask if you need anything else 😊",
};

const getAutoReply = (msg: string): string | null => {
  const lower = msg.toLowerCase().trim();
  for (const [key, reply] of Object.entries(AUTO_REPLIES)) {
    if (lower.includes(key)) return reply;
  }
  return null;
};

const ChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    setInput('');

    // Add user message
    const userMsg: ChatMessage = { role: 'user', text };
    setMessages(prev => [...prev, userMsg]);

    // Auto reply after short delay
    setTimeout(() => {
      const reply = getAutoReply(text);
      const botMsg: ChatMessage = {
        role: 'bot',
        text: reply || 'Cảm ơn bạn đã liên hệ! Nhân viên hỗ trợ sẽ phản hồi sớm nhất. Bạn có thể gọi hotline 1800-123-456 để được hỗ trợ nhanh hơn.',
      };
      setMessages(prev => [...prev, botMsg]);
    }, 600);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="interactive"
        style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
          width: 56, height: 56, borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--accent, #ff8a00), #ea580c)',
          border: 'none', cursor: 'pointer', boxShadow: '0 8px 32px rgba(255,138,0,0.35)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          transform: isOpen ? 'scale(0.9)' : 'scale(1)',
        }}
        aria-label="Chat với chúng tôi"
      >
        {isOpen ? (
          <X size={24} color="#fff" />
        ) : (
          <MessageCircle size={24} color="#fff" />
        )}
      </button>

      {/* Chat Panel */}
      <div
        style={{
          position: 'fixed', bottom: 92, right: 24, zIndex: 9998,
          width: 360, maxWidth: 'calc(100vw - 32px)',
          maxHeight: 520, borderRadius: 'var(--radius-xl)',
          backgroundColor: 'var(--bg-elevated, #18181b)',
          border: '1px solid var(--border-color, #27272a)',
          boxShadow: '0 16px 60px rgba(0,0,0,0.5)',
          display: 'flex', flexDirection: 'column',
          transform: isOpen ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.95)',
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
          transition: 'all 0.25s ease',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          background: 'linear-gradient(135deg, rgba(255,138,0,0.12), rgba(255,138,0,0.04))',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--accent), #ea580c)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Bot size={18} color="#000" />
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>CinemaBot</p>
            <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: '2px 0 0' }}>Online • Trả lời ngay</p>
          </div>
        </div>

        {/* Messages */}
        <div style={{
          flex: 1, overflowY: 'auto', padding: 16,
          display: 'flex', flexDirection: 'column', gap: 12,
          minHeight: 280, maxHeight: 340,
          backgroundColor: 'var(--bg-base, #111114)',
        }}>
          {messages.map((msg, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                gap: 8,
              }}
            >
              {msg.role === 'bot' && (
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                  background: 'rgba(255,138,0,0.1)', color: 'var(--accent)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12,
                }}>
                  <Bot size={14} />
                </div>
              )}
              <div
                style={{
                  maxWidth: '80%', padding: '10px 14px', borderRadius: 16,
                  fontSize: 13, lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                  backgroundColor: msg.role === 'user'
                    ? 'var(--accent, #ff8a00)'
                    : 'var(--bg-surface, #1a1a1e)',
                  color: msg.role === 'user' ? '#000' : 'var(--text-primary)',
                  borderBottomRightRadius: msg.role === 'user' ? 4 : 16,
                  borderBottomLeftRadius: msg.role === 'bot' ? 4 : 16,
                }}
              >
                {msg.text}
              </div>
              {msg.role === 'user' && (
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, color: 'var(--text-secondary)',
                }}>
                  <User size={14} />
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div style={{
          padding: '12px 16px',
          borderTop: '1px solid var(--border-color)',
          display: 'flex', gap: 8,
          backgroundColor: 'var(--bg-elevated)',
        }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Nhập tin nhắn..."
            style={{
              flex: 1, padding: '10px 14px', borderRadius: 24, fontSize: 13,
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-base)',
              color: 'var(--text-primary)',
              outline: 'none',
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            style={{
              width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
              background: input.trim() ? 'var(--accent)' : 'var(--bg-surface)',
              border: 'none', cursor: input.trim() ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: input.trim() ? '#000' : 'var(--text-secondary)',
              transition: 'all 0.2s ease',
            }}
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </>
  );
};

export default ChatBot;
