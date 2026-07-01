import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { UserPlus, X, Loader2, Check } from 'lucide-react';
import type { GroupMemberDto } from '../../types/socialBooking.types';

interface Props {
  members: GroupMemberDto[];
  currentUserId: string;
  onCreatePair: (targetMemberId: string) => Promise<void>;
  onClose: () => void;
}

export default function PairRequestModal({ members, currentUserId, onCreatePair, onClose }: Props) {
  const { t } = useTranslation();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const availableMembers = members.filter(
    m => m.userId !== currentUserId && !m.pairId && m.status !== 'Removed'
  );

  const handleSend = async () => {
    if (!selectedId || sending) return;
    setSending(true);
    try {
      await onCreatePair(selectedId);
      setSent(true);
      setTimeout(onClose, 1500);
    } finally { setSending(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />
      <div className="relative bg-[#1a1b1f]/95 backdrop-blur-2xl border border-[#554334]/30 rounded-2xl w-full max-w-sm p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[#e3e2e7] font-bold text-[15px]">{t('socialBooking.pair.selectPartner', 'Chọn người để ghép đôi')}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10">
            <X className="w-4 h-4 text-[#dbc2ad]" />
          </button>
        </div>

        {sent ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 rounded-full bg-[#34C759]/20 flex items-center justify-center mx-auto mb-3">
              <Check className="w-6 h-6 text-[#34C759]" />
            </div>
            <p className="text-[#e3e2e7] text-sm">{t('socialBooking.pair.requestSent', 'Đã gửi yêu cầu')}</p>
          </div>
        ) : (
          <>
            <div className="space-y-2 max-h-60 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
              {availableMembers.length === 0 && (
                <p className="text-[#dbc2ad]/40 text-sm text-center py-6">Không có ai khả dụng để ghép đôi</p>
              )}
              {availableMembers.map(m => (
                <button
                  key={m.memberId}
                  onClick={() => setSelectedId(m.memberId)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    selectedId === m.memberId
                      ? 'border-[#ff9500]/50 bg-[#ff9500]/10'
                      : 'border-[#554334]/20 bg-[#343539]/30 hover:border-[#554334]/40'
                  }`}
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#ff9500] to-[#ffbd7f] flex items-center justify-center text-[#4b2800] font-bold text-sm">
                    {m.userName?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-[#e3e2e7] text-sm font-medium">{m.userName}</p>
                    <p className="text-[#dbc2ad]/40 text-[10px]">
                      {m.selectedSeats?.length || 0} ghế · {m.amountToPay?.toLocaleString()}đ
                    </p>
                  </div>
                  {selectedId === m.memberId && <Check className="w-4 h-4 text-[#ff9500]" />}
                </button>
              ))}
            </div>

            <button
              onClick={handleSend}
              disabled={!selectedId || sending}
              className="w-full mt-4 py-2.5 bg-[#ff9500] text-[#4b2800] rounded-xl font-bold text-sm hover:bg-[#ffbd7f] transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              {t('socialBooking.pair.sendRequest', 'Gửi yêu cầu ghép đôi')}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
