using Cinema.Domain.Entities.CinemaInfos;
using Cinema.Domain.Localization;

namespace Cinema.Application.UseCases.Booking;

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

        var unavailableSeatIds = occupiedSeatIds
            .Concat(selectedList)
            .ToHashSet();

        var createsIsolatedEmptySeat = seatList
            .GroupBy(seat => seat.RowIndex)
            .Any(rowGroup =>
            {
                var rowSeats = rowGroup
                    .OrderBy(seat => seat.ColIndex)
                    .ToList();

                var currentEmptyRun = 0;
                foreach (var seat in rowSeats)
                {
                    if (!unavailableSeatIds.Contains(seat.SeatId))
                    {
                        currentEmptyRun++;
                        continue;
                    }

                    if (currentEmptyRun == 1)
                    {
                        return true;
                    }

                    currentEmptyRun = 0;
                }

                return currentEmptyRun == 1;
            });

        if (createsIsolatedEmptySeat)
        {
            errors.Add(Messages.Booking.SelectionLeavesIsolatedSeat);
        }

        return errors;
    }
}
