import type { PublicSegmentPrice } from '../types/public.types';
import { MAX_SEATS_PER_ORDER } from './seatSelectionPolicy';

export type SegmentCounts = Record<string, number>;

export function emptySegmentCounts(segments: PublicSegmentPrice[]): SegmentCounts {
  const counts: SegmentCounts = {};
  for (const s of segments) {
    counts[s.userSegmentId] = 0;
  }
  return counts;
}

export function totalTicketQuantity(counts: SegmentCounts): number {
  return Object.values(counts).reduce((sum, n) => sum + (n || 0), 0);
}

/**
 * Expand segment counts into a queue of segment ids (stable segment order).
 * Example: Adult×2, Student×1 → [adult, adult, student]
 */
export function expandSegmentQueue(
  segments: PublicSegmentPrice[],
  counts: SegmentCounts
): string[] {
  const queue: string[] = [];
  for (const seg of segments) {
    const n = counts[seg.userSegmentId] || 0;
    for (let i = 0; i < n; i++) {
      queue.push(seg.userSegmentId);
    }
  }
  return queue;
}

/** Assign segment ids to selected seats by order of selection. */
export function assignSegmentsToSeats(
  seatIds: string[],
  segments: PublicSegmentPrice[],
  counts: SegmentCounts
): Record<string, string> {
  const queue = expandSegmentQueue(segments, counts);
  const map: Record<string, string> = {};
  seatIds.forEach((seatId, index) => {
    map[seatId] = queue[index] || segments[0]?.userSegmentId || '';
  });
  return map;
}

export function canIncrementSegment(
  counts: SegmentCounts,
  _segmentId: string,
  maxTotal: number = MAX_SEATS_PER_ORDER
): boolean {
  void _segmentId;
  return totalTicketQuantity(counts) < maxTotal;
}

export interface SegmentLineSummary {
  userSegmentId: string;
  segmentName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  appliedPromotionTitles: string[];
}

export function buildSegmentLineSummaries(
  segments: PublicSegmentPrice[],
  counts: SegmentCounts
): SegmentLineSummary[] {
  return segments
    .map((seg) => {
      const quantity = counts[seg.userSegmentId] || 0;
      const promoTitles = (seg.appliedPromotions || [])
        .filter((p) => p.promotionTypeName !== 'Surcharge' && p.amountChanged < 0)
        .map((p) => p.title);
      return {
        userSegmentId: seg.userSegmentId,
        segmentName: seg.segmentName,
        quantity,
        unitPrice: seg.finalPrice || 0,
        lineTotal: quantity * (seg.finalPrice || 0),
        appliedPromotionTitles: promoTitles,
      };
    })
    .filter((line) => line.quantity > 0);
}

export function totalFromSegmentCounts(
  segments: PublicSegmentPrice[],
  counts: SegmentCounts
): number {
  return buildSegmentLineSummaries(segments, counts).reduce((s, line) => s + line.lineTotal, 0);
}

/** Group ticket seats by segment for history/detail views. */
export function groupTicketSeatsBySegment(
  seats: Array<{ seatNumber: string; segmentName: string; priceEach: number }>
): Array<{
  segmentName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  seatNumbers: string[];
}> {
  const map = new Map<string, {
    segmentName: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    seatNumbers: string[];
  }>();

  for (const seat of seats) {
    const key = seat.segmentName || 'Ticket';
    const existing = map.get(key);
    if (existing) {
      existing.quantity += 1;
      existing.lineTotal += seat.priceEach || 0;
      existing.seatNumbers.push(seat.seatNumber);
    } else {
      map.set(key, {
        segmentName: key,
        quantity: 1,
        unitPrice: seat.priceEach || 0,
        lineTotal: seat.priceEach || 0,
        seatNumbers: [seat.seatNumber],
      });
    }
  }

  return Array.from(map.values());
}
