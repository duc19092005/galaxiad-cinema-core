/**
 * Seat selection policy (mirrors backend BookingSeatSelectionPolicy).
 *
 * R1: Solo seat is fine when it does not create a new X _ X gap.
 * R2: Reject only when selection creates a NEW single-seat gap between two
 *     taken seats on the same row. Edge empties and gaps ≥ 2 are allowed.
 */

export const MAX_SEATS_PER_ORDER = 10;

export interface SeatLayoutItem {
  seatId: string;
  rowIndex: number;
  colIndex: number;
}

export function normalizeSeatId(seatId: string): string {
  return seatId.toLowerCase();
}

/** Empty seats that form an immediate X _ X gap on a row. */
export function findIsolatedEmptySeats(
  seats: SeatLayoutItem[],
  unavailableSeatIds: Iterable<string>
): string[] {
  const unavailable = new Set(
    Array.from(unavailableSeatIds, (id) => normalizeSeatId(id))
  );
  const isolated: string[] = [];

  const byRow = new Map<number, SeatLayoutItem[]>();
  for (const seat of seats) {
    const row = byRow.get(seat.rowIndex) ?? [];
    row.push(seat);
    byRow.set(seat.rowIndex, row);
  }

  for (const rowSeats of byRow.values()) {
    const ordered = [...rowSeats].sort((a, b) => a.colIndex - b.colIndex);
    for (let i = 1; i < ordered.length - 1; i++) {
      const seat = ordered[i];
      const seatKey = normalizeSeatId(seat.seatId);
      if (unavailable.has(seatKey)) continue;

      const leftTaken = unavailable.has(normalizeSeatId(ordered[i - 1].seatId));
      const rightTaken = unavailable.has(normalizeSeatId(ordered[i + 1].seatId));
      if (leftTaken && rightTaken) {
        isolated.push(seat.seatId);
      }
    }
  }

  return isolated;
}

/** True when applying selected on top of occupied creates at least one NEW isolated seat. */
export function createsIsolatedEmptySeat(
  seats: SeatLayoutItem[],
  selectedSeatIds: Iterable<string>,
  occupiedSeatIds: Iterable<string>
): boolean {
  const occupied = new Set(Array.from(occupiedSeatIds, normalizeSeatId));
  const after = new Set(occupied);
  for (const id of selectedSeatIds) {
    after.add(normalizeSeatId(id));
  }

  const beforeIsolated = new Set(
    findIsolatedEmptySeats(seats, occupied).map(normalizeSeatId)
  );
  const afterIsolated = findIsolatedEmptySeats(seats, after).map(normalizeSeatId);

  return afterIsolated.some((id) => !beforeIsolated.has(id));
}

/**
 * Whether adding `seatId` to the current selection is allowed under isolation rules.
 * Unselecting is always allowed from a policy standpoint.
 */
export function canAddSeat(
  seats: SeatLayoutItem[],
  seatId: string,
  selectedSeatIds: Iterable<string>,
  occupiedSeatIds: Iterable<string>
): { ok: boolean; reason?: 'max' | 'isolated' | 'already-selected' } {
  const selected = Array.from(selectedSeatIds, normalizeSeatId);
  const key = normalizeSeatId(seatId);

  if (selected.includes(key)) {
    return { ok: false, reason: 'already-selected' };
  }

  if (selected.length >= MAX_SEATS_PER_ORDER) {
    return { ok: false, reason: 'max' };
  }

  const nextSelected = [...selected, key];
  if (createsIsolatedEmptySeat(seats, nextSelected, occupiedSeatIds)) {
    return { ok: false, reason: 'isolated' };
  }

  return { ok: true };
}

/**
 * Isolated empty seats visible for the current map state (occupied only),
 * useful for highlighting "fill this gap" seats.
 */
export function getHighlightIsolatedSeats(
  seats: SeatLayoutItem[],
  occupiedSeatIds: Iterable<string>,
  selectedSeatIds: Iterable<string> = []
): Set<string> {
  const unavailable = new Set([
    ...Array.from(occupiedSeatIds, normalizeSeatId),
    ...Array.from(selectedSeatIds, normalizeSeatId),
  ]);
  return new Set(
    findIsolatedEmptySeats(seats, unavailable).map(normalizeSeatId)
  );
}

/** Occupied seat ids from a seat map's isBooked flags. */
export function occupiedIdsFromSeatMap(
  seats: Array<{ seatId: string; isBooked?: boolean }>
): string[] {
  return seats.filter((s) => s.isBooked).map((s) => s.seatId);
}
