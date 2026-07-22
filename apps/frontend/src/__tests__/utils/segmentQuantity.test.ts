import { describe, it, expect } from 'vitest';
import {
  assignSegmentsToSeats,
  buildSegmentLineSummaries,
  emptySegmentCounts,
  expandSegmentQueue,
  groupTicketSeatsBySegment,
  totalTicketQuantity,
} from '@/utils/segmentQuantity';
import type { PublicSegmentPrice } from '@/types/public.types';

const segments: PublicSegmentPrice[] = [
  {
    userSegmentId: 'adult',
    segmentName: 'Adult',
    description: '',
    basePrice: 90000,
    priceBeforePromotion: 90000,
    promotionAdjustmentAmount: 0,
    finalPrice: 90000,
    appliedPromotions: [],
  },
  {
    userSegmentId: 'student',
    segmentName: 'Student',
    description: '',
    basePrice: 70000,
    priceBeforePromotion: 70000,
    promotionAdjustmentAmount: 0,
    finalPrice: 70000,
    appliedPromotions: [],
  },
];

describe('segmentQuantity', () => {
  it('starts counts at zero for all segments', () => {
    expect(emptySegmentCounts(segments)).toEqual({ adult: 0, student: 0 });
  });

  it('expands segment queue in stable order', () => {
    expect(expandSegmentQueue(segments, { adult: 2, student: 1 })).toEqual([
      'adult',
      'adult',
      'student',
    ]);
  });

  it('assigns segments to seats by selection order', () => {
    const map = assignSegmentsToSeats(['s1', 's2', 's3'], segments, {
      adult: 2,
      student: 1,
    });
    expect(map).toEqual({ s1: 'adult', s2: 'adult', s3: 'student' });
  });

  it('builds line summaries for non-zero counts', () => {
    const lines = buildSegmentLineSummaries(segments, { adult: 2, student: 1 });
    expect(lines).toHaveLength(2);
    expect(lines[0]).toMatchObject({ quantity: 2, lineTotal: 180000 });
    expect(lines[1]).toMatchObject({ quantity: 1, lineTotal: 70000 });
    expect(totalTicketQuantity({ adult: 2, student: 1 })).toBe(3);
  });

  it('groups ticket seats by segment for history/detail', () => {
    const groups = groupTicketSeatsBySegment([
      { seatNumber: 'A1', segmentName: 'Adult', priceEach: 90000 },
      { seatNumber: 'A2', segmentName: 'Adult', priceEach: 90000 },
      { seatNumber: 'B1', segmentName: 'Student', priceEach: 70000 },
    ]);
    expect(groups).toHaveLength(2);
    expect(groups.find((g) => g.segmentName === 'Adult')).toMatchObject({
      quantity: 2,
      lineTotal: 180000,
      seatNumbers: ['A1', 'A2'],
    });
  });
});
