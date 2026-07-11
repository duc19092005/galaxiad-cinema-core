import React from 'react';
import { Minus, Plus } from 'lucide-react';
import type { PublicSegmentPrice } from '../types/public.types';
import {
  canIncrementSegment,
  totalTicketQuantity,
  type SegmentCounts,
} from '../utils/segmentQuantity';
import { MAX_SEATS_PER_ORDER } from '../utils/seatSelectionPolicy';

interface Props {
  segments: PublicSegmentPrice[];
  counts: SegmentCounts;
  onChange: (next: SegmentCounts) => void;
  maxTotal?: number;
  /** Pass empty string to hide the built-in title row */
  title?: string;
  hint?: string;
  disabled?: boolean;
  compact?: boolean;
  /** Horizontal card grid — best above seat map */
  layout?: 'stack' | 'grid';
  showTotalBadge?: boolean;
}

const SegmentQuantityPicker: React.FC<Props> = ({
  segments,
  counts,
  onChange,
  maxTotal = MAX_SEATS_PER_ORDER,
  title = 'Chọn loại vé',
  hint,
  disabled = false,
  compact = false,
  layout = 'stack',
  showTotalBadge = true,
}) => {
  const total = totalTicketQuantity(counts);

  const setCount = (segmentId: string, nextCount: number) => {
    if (disabled) return;
    const safe = Math.max(0, nextCount);
    const without = { ...counts, [segmentId]: 0 };
    const otherTotal = totalTicketQuantity(without);
    const capped = Math.min(safe, Math.max(0, maxTotal - otherTotal));
    onChange({ ...counts, [segmentId]: capped });
  };

  if (segments.length === 0) {
    return (
      <div className="text-xs text-zinc-500 italic py-2">
        Chưa có thông tin giá / loại vé
      </div>
    );
  }

  const showHeader = Boolean(title) || showTotalBadge;

  return (
    <div className={compact ? 'space-y-2' : 'space-y-3'}>
      {showHeader && (
        <div className="flex items-center justify-between gap-2">
          {title ? (
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
              {title}
            </span>
          ) : (
            <span />
          )}
          {showTotalBadge && (
            <span className="text-[11px] font-semibold text-[#ff8a00]">
              {total}/{maxTotal} vé
            </span>
          )}
        </div>
      )}
      {hint && (
        <p className="text-[11px] text-zinc-500 leading-relaxed m-0">{hint}</p>
      )}
      <div
        className={
          layout === 'grid'
            ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3'
            : 'space-y-2'
        }
      >
        {segments.map((seg) => {
          const count = counts[seg.userSegmentId] || 0;
          const canPlus = canIncrementSegment(counts, seg.userSegmentId, maxTotal) && !disabled;
          const active = count > 0;
          return (
            <div
              key={seg.userSegmentId}
              className={`flex items-center justify-between gap-3 p-3 rounded-xl border transition-colors ${
                active
                  ? 'bg-[#ff8a00]/10 border-[#ff8a00]/40'
                  : 'bg-white/5 border-white/10'
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="font-bold text-sm text-white truncate">{seg.segmentName}</div>
                <div className="text-[11px] text-zinc-400 mt-0.5">
                  {(seg.finalPrice || 0).toLocaleString('vi-VN')}đ / vé
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  disabled={disabled || count <= 0}
                  onClick={() => setCount(seg.userSegmentId, count - 1)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center border border-white/10 bg-zinc-900 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:border-[#ff8a00]/50 transition-colors cursor-pointer"
                  aria-label={`Giảm ${seg.segmentName}`}
                >
                  <Minus size={14} />
                </button>
                <span className="w-7 text-center font-extrabold text-white tabular-nums text-base">
                  {count}
                </span>
                <button
                  type="button"
                  disabled={!canPlus}
                  onClick={() => setCount(seg.userSegmentId, count + 1)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center border border-[#ff8a00]/40 bg-[#ff8a00]/15 text-[#ff8a00] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#ff8a00]/25 transition-colors cursor-pointer"
                  aria-label={`Tăng ${seg.segmentName}`}
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SegmentQuantityPicker;
