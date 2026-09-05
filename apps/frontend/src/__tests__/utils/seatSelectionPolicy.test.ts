import { describe, it, expect } from 'vitest';
import {
  canAddSeat,
  requiresContiguousSelection,
  createsIsolatedEmptySeat,
  findIsolatedEmptySeats,
  MAX_SEATS_PER_ORDER,
} from '@/utils/seatSelectionPolicy';

function buildRow(count: number, rowIndex = 0) {
  return Array.from({ length: count }, (_, col) => ({
    seatId: `r${rowIndex}-c${col + 1}`,
    rowIndex,
    colIndex: col,
  }));
}

const id = (col: number, row = 0) => `r${row}-c${col}`;

describe('seatSelectionPolicy', () => {
  it('allows solo middle seat on empty row', () => {
    const seats = buildRow(8);
    expect(createsIsolatedEmptySeat(seats, [id(4)], [])).toBe(false);
    expect(canAddSeat(seats, id(4), [], []).ok).toBe(true);
  });

  it('allows solo edge seat', () => {
    const seats = buildRow(8);
    expect(canAddSeat(seats, id(1), [], []).ok).toBe(true);
    expect(canAddSeat(seats, id(8), [], []).ok).toBe(true);
  });

  it('allows adjacent pair', () => {
    const seats = buildRow(8);
    expect(createsIsolatedEmptySeat(seats, [id(4), id(5)], [])).toBe(false);
  });

  it('allows leaving single empty at row edge', () => {
    const seats = buildRow(8);
    const selected = [2, 3, 4, 5, 6, 7, 8].map((c) => id(c));
    expect(createsIsolatedEmptySeat(seats, selected, [])).toBe(false);
  });

  it('rejects selection that creates X _ X gap', () => {
    const seats = buildRow(8);
    expect(createsIsolatedEmptySeat(seats, [id(1), id(3)], [])).toBe(true);
    expect(canAddSeat(seats, id(3), [id(1)], []).reason).toBe('isolated');
  });

  it('rejects gap against occupied seats', () => {
    const seats = buildRow(8);
    expect(createsIsolatedEmptySeat(seats, [id(3)], [id(1)])).toBe(true);
  });

  it('allows filling an existing orphan', () => {
    const seats = buildRow(8);
    expect(createsIsolatedEmptySeat(seats, [id(2)], [id(1), id(3)])).toBe(false);
    expect(canAddSeat(seats, id(2), [], [id(1), id(3)]).ok).toBe(true);
  });

  it('allows gap of two or more', () => {
    const seats = buildRow(8);
    expect(createsIsolatedEmptySeat(seats, [id(5), id(6)], [id(1), id(2)])).toBe(false);
  });

  it('does not block other row when orphan exists elsewhere', () => {
    const seats = [...buildRow(8, 0), ...buildRow(8, 1)];
    expect(createsIsolatedEmptySeat(seats, [id(1, 1)], [id(1, 0), id(3, 0)])).toBe(false);
  });

  it('findIsolatedEmptySeats only returns sandwiched empties', () => {
    const seats = buildRow(5);
    const isolated = findIsolatedEmptySeats(seats, [id(1), id(3)]);
    expect(isolated.map((x) => x.toLowerCase())).toEqual([id(2)]);
  });

  it('enforces max seats', () => {
    const seats = buildRow(12);
    const selected = Array.from({ length: MAX_SEATS_PER_ORDER }, (_, i) => id(i + 1));
    expect(canAddSeat(seats, id(11), selected, []).reason).toBe('max');
  });
});

describe('contiguous checkout rule', () => {
  it('rejects distant seats when a legal block exists', () => {
    expect(requiresContiguousSelection(buildRow(8), [id(1), id(6)], [])).toBe(true);
  });
  it('accepts a contiguous block even when input order is reversed', () => {
    expect(requiresContiguousSelection(buildRow(8), [id(5), id(4)], [])).toBe(false);
  });
  it('accepts a single ticket', () => {
    expect(requiresContiguousSelection(buildRow(8), [id(4)], [])).toBe(false);
  });
  it('accepts remaining scattered seats when no pair remains', () => {
    expect(requiresContiguousSelection(buildRow(5), [id(1), id(5)], [id(2), id(3), id(4)])).toBe(false);
  });
  it('does not offer an occupied or held block as an alternative', () => {
    expect(requiresContiguousSelection(buildRow(8), [id(1), id(8)],
      [2,3,4,5,6,7].map(c => id(c)))).toBe(false);
  });
  it('does not offer a block that creates an orphan', () => {
    // free run 3-5 between occupied 2 and 6: either pair strands a new orphan.
    expect(requiresContiguousSelection(buildRow(7), [id(1), id(7)], [id(2), id(6)])).toBe(false);
  });
  it('checks all rows for an available block', () => {
    const seats = [...buildRow(2, 0), ...buildRow(2, 1)];
    expect(requiresContiguousSelection(seats, [id(1), id(1, 1)], [])).toBe(true);
  });
  it('does not count seats across an aisle as contiguous', () => {
    const seats = buildRow(3).filter(s => s.colIndex !== 1);
    expect(requiresContiguousSelection(seats, [id(1), id(3)], [])).toBe(false);
    expect(requiresContiguousSelection([...seats, ...buildRow(2, 1)], [id(1), id(3)], [])).toBe(true);
  });
  it('does not create phantom orphans across an aisle', () => {
    const seats = buildRow(5).filter(s => s.colIndex !== 1);
    expect(findIsolatedEmptySeats(seats, [id(1), id(4)])).toEqual([]);
  });
  it('normalizes mixed-case ids', () => {
    expect(requiresContiguousSelection(buildRow(8), [id(1).toUpperCase(), id(8)], [])).toBe(true);
  });
});
