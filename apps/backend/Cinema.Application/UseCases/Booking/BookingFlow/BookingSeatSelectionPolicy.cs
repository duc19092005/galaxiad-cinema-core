using Cinema.Domain.Entities.CinemaInfos;
using Cinema.Domain.Localization;

namespace Cinema.Application.UseCases.Booking.BookingFlow;

/// <summary>
/// Seat selection rules for booking (BS26–BS30).
/// R1: Solo (1 seat) is always allowed from an isolation standpoint when it does not create a new gap.
/// R2: Reject only when the selection creates a NEW single-seat gap (X _ X) on a row.
///     Pre-existing orphans do not block bookings on other seats/rows; filling an orphan is allowed.
///     Edge empties and gaps ≥ 2 are allowed.
/// </summary>
public static class BookingSeatSelectionPolicy
{
    public const int MaxSeatsPerOrder = 10;

    public static List<string> ValidateSeatSelection(
        IEnumerable<SeatsInfoEntity> auditoriumSeats,
        IEnumerable<Guid> selectedSeatIds,
        IEnumerable<Guid> occupiedSeatIds)
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

        if (CreatesIsolatedEmptySeat(seatList, selectedList, occupiedSeatIds))
        {
            errors.Add(Messages.Booking.SelectionLeavesIsolatedSeat);
        }

        return errors;
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

                if (leftTaken && rightTaken)
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
