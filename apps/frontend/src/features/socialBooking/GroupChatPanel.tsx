import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Send, X } from 'lucide-react';
import type { ChatMessage, GroupMemberDto } from '../../types/socialBooking.types';

interface Props {
  messages: ChatMessage[];
  onSend: (content: string) => Promise<void>;
  members: GroupMemberDto[];
  isOpen: boolean;
  onClose: () => void;
}

export default function GroupChatPanel({ messages, onSend, isOpen, onClose }: Props) {
  const { t } = useTranslation();
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const currentUserId = JSON.parse(localStorage.getItem('user_info') || '{}').userId;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    setSending(true);
    try {
      await onSend(input.trim());
      setInput('');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    } catch {
      return '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm h-full bg-[#1a1b1f]/95 backdrop-blur-2xl border-l border-[#554334]/30 flex flex-col shadow-2xl animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#554334]/20">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#ff9500]/20 flex items-center justify-center">
              <Send className="w-4 h-4 text-[#ff9500]" />
            </div>
            <h3 className="font-semibold text-[#e3e2e7] text-sm">{t('socialBooking.chat.title', 'Nhóm Chat')}</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4 text-[#dbc2ad]" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {messages.length === 0 && (
            <div className="text-center text-[#dbc2ad]/40 py-8 text-sm">
              {t('socialBooking.chat.empty', 'Chưa có tin nhắn. Bắt đầu chat nào!')}
            </div>
          )}
          {messages.map((msg) => {
            const isMe = msg.senderId === currentUserId;
            const isSystem = msg.messageType !== 'Text';

            if (isSystem) {
              return (
                <div key={msg.messageId} className="text-center">
                  <span className="text-[10px] text-[#dbc2ad]/40 bg-[#343539]/60 px-3 py-1 rounded-full">
                    {msg.content}
                  </span>
                </div>
              );
            }

            return (
              <div key={msg.messageId} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className="max-w-[80%]">
                  {!isMe && (
                    <div className="flex items-center gap-1.5 mb-1 ml-1">
                      <span className="text-[11px] text-[#ffbd7f] font-semibold">{msg.senderName}</span>
                      <span className="text-[10px] text-[#dbc2ad]/30">{formatTime(msg.createdAt)}</span>
                    </div>
                  )}
                  {isMe && (
                    <div className="flex items-center justify-end gap-1.5 mb-1 mr-1">
                      <span className="text-[10px] text-[#dbc2ad]/30">{formatTime(msg.createdAt)}</span>
                    </div>
                  )}
                  <div
                    className={`px-3.5 py-2 rounded-2xl text-[13px] leading-relaxed ${
                      isMe
                        ? 'bg-[#ff9500] text-[#4b2800] rounded-br-md font-medium'
                        : 'bg-[#343539]/80 text-[#e3e2e7] rounded-bl-md'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t border-[#554334]/20">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('socialBooking.chat.placeholder', 'Nhập tin nhắn...')}
              className="flex-1 bg-[#343539]/60 border border-[#554334]/30 rounded-xl px-4 py-2.5 text-[#e3e2e7] text-sm placeholder-[#dbc2ad]/30 focus:outline-none focus:border-[#ff9500]/50 transition-colors"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || sending}
              className="w-10 h-10 bg-[#ff9500] text-[#4b2800] rounded-xl flex items-center justify-center hover:bg-[#ffbd7f] transition-colors disabled:opacity-40"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
