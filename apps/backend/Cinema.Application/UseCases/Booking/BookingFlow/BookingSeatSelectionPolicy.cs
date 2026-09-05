using Cinema.Domain.Entities.CinemaInfos;
using Cinema.Domain.Localization;

namespace Cinema.Application.UseCases.Booking.BookingFlow;

/// <summary>
/// Seat selection rules for booking (BS26–BS30).
/// R1: Solo (1 seat) is always allowed from an isolation standpoint when it does not create a new gap.
/// R2: Reject only when the selection creates a NEW single-seat gap (X _ X) on a row.
///     Pre-existing orphans do not block bookings on other seats/rows; filling an orphan is allowed.
///     Edge empties and gaps ≥ 2 are allowed. Aisles break adjacency.
/// R3: At checkout require contiguous seats when a valid block of that size remains.
/// </summary>
public static class BookingSeatSelectionPolicy
{
    public const int MaxSeatsPerOrder = 10;

    public static List<string> ValidateSeatSelection(
        IEnumerable<SeatsInfoEntity> auditoriumSeats,
        IEnumerable<Guid> selectedSeatIds,
        IEnumerable<Guid> occupiedSeatIds,
        bool requireContiguousSelection = true)
    {
        var errors = new List<string>();
        var selectedList = selectedSeatIds.ToList();

        if (selectedList.Count == 0)
        {
            errors.Add(Messages.Booking.AtLeastOneSeatMustBeSelected);
            return errors;
        }

        if (selectedList.Count > MaxSeatsPerOrder)
        {
            errors.Add(Messages.Booking.MaxTenTicketsPerOrder);
        }

        if (selectedList.Count != selectedList.Distinct().Count())
        {
            errors.Add(Messages.Booking.DuplicateSelectedSeats);
        }

        if (errors.Count > 0)
        {
            return errors;
        }

        var seatList = auditoriumSeats.ToList();
        var seatIds = seatList.Select(seat => seat.SeatId).ToHashSet();

        if (!selectedList.All(seatIds.Contains))
        {
            errors.Add(Messages.Booking.InvalidSeats);
            return errors;
        }

        var occupied = occupiedSeatIds.ToHashSet();
        if (CreatesIsolatedEmptySeat(seatList, selectedList, occupied))
        {
            errors.Add(Messages.Booking.SelectionLeavesIsolatedSeat);
        }

        if (requireContiguousSelection && RequiresContiguousSelection(seatList, selectedList, occupied))
            errors.Add(Messages.Booking.SelectionMustBeContiguous);

        return errors;
    }

    /// <summary>
    /// Require one block per order/member while a legal block of the requested size
    /// remains. Allow split seating when stock is fragmented. Missing columns are aisles.
    /// </summary>
    public static bool RequiresContiguousSelection(
        IEnumerable<SeatsInfoEntity> auditoriumSeats,
        IEnumerable<Guid> selectedSeatIds,
        IEnumerable<Guid> occupiedSeatIds)
    {
        var seats = auditoriumSeats.ToList();
        var selected = selectedSeatIds.ToHashSet();
        if (selected.Count < 2) return false;
        var picked = seats.Where(s => selected.Contains(s.SeatId)).OrderBy(s => s.ColIndex).ToList();
        if (picked.Count != selected.Count) return false; // Validated separately.
        if (picked.All(s => s.RowIndex == picked[0].RowIndex)
            && picked.Zip(picked.Skip(1)).All(pair => pair.Second.ColIndex == pair.First.ColIndex + 1))
            return false;

        var occupied = occupiedSeatIds.ToHashSet();
        foreach (var row in seats.GroupBy(s => s.RowIndex))
        {
            var ordered = row.OrderBy(s => s.ColIndex).ToList();
            for (var start = 0; start + selected.Count <= ordered.Count; start++)
            {
                var block = ordered.Skip(start).Take(selected.Count).ToList();
                if (block.Any(s => occupied.Contains(s.SeatId))) continue;
                if (block[^1].ColIndex - block[0].ColIndex != selected.Count - 1) continue;
                if (!CreatesIsolatedEmptySeat(seats, block.Select(s => s.SeatId), occupied)) return true;
            }
        }
        return false;
    }

    /// <summary>
    /// Returns empty seats that form a single-seat gap between two unavailable seats
    /// on the same row (immediate neighbors: X _ X). Edge empties are not included.
    /// </summary>
    public static List<SeatsInfoEntity> FindIsolatedEmptySeats(
        IEnumerable<SeatsInfoEntity> auditoriumSeats,
        ISet<Guid> unavailableSeatIds)
    {
        var isolated = new List<SeatsInfoEntity>();

        foreach (var rowGroup in auditoriumSeats.GroupBy(seat => seat.RowIndex))
        {
            var rowSeats = rowGroup
                .OrderBy(seat => seat.ColIndex)
                .ToList();

            for (var i = 1; i < rowSeats.Count - 1; i++)
            {
                var seat = rowSeats[i];
                if (unavailableSeatIds.Contains(seat.SeatId))
                {
                    continue;
                }

                var leftTaken = unavailableSeatIds.Contains(rowSeats[i - 1].SeatId);
                var rightTaken = unavailableSeatIds.Contains(rowSeats[i + 1].SeatId);

                if (leftTaken && rightTaken
                    && seat.ColIndex == rowSeats[i - 1].ColIndex + 1
                    && rowSeats[i + 1].ColIndex == seat.ColIndex + 1)
                {
                    isolated.Add(seat);
                }
            }
        }

        return isolated;
    }

    /// <summary>
    /// True when the selection introduces at least one NEW isolated empty seat
    /// that did not already exist with occupied seats alone.
    /// </summary>
    public static bool CreatesIsolatedEmptySeat(
        IEnumerable<SeatsInfoEntity> auditoriumSeats,
        IEnumerable<Guid> selectedSeatIds,
        IEnumerable<Guid> occupiedSeatIds)
    {
        var seatList = auditoriumSeats as IList<SeatsInfoEntity> ?? auditoriumSeats.ToList();
        var occupiedSet = occupiedSeatIds.ToHashSet();
        var afterSet = occupiedSet.Concat(selectedSeatIds).ToHashSet();

        var beforeIsolated = FindIsolatedEmptySeats(seatList, occupiedSet)
            .Select(s => s.SeatId)
            .ToHashSet();
        var afterIsolated = FindIsolatedEmptySeats(seatList, afterSet)
            .Select(s => s.SeatId)
            .ToHashSet();

        return afterIsolated.Any(id => !beforeIsolated.Contains(id));
    }
}
