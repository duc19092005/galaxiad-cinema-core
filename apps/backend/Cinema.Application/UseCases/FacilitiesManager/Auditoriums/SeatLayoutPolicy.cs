using Cinema.Application.Dtos.FacilitiesManager.Auditoriums.Requests;
using Cinema.Domain.Localization;

namespace Cinema.Application.UseCases.FacilitiesManager.Auditoriums;

public static class SeatLayoutPolicy
{
    public static List<string> ValidateFullRectangularGrid(IEnumerable<ReqSeatsAuditoriumDto> seats)
    {
        var errors = new List<string>();
        var seatList = seats.ToList();

        if (seatList.Count == 0)
        {
            errors.Add(Messages.Auditorium.SeatLayoutMustHaveSeats);
            return errors;
        }

        if (seatList.Any(seat => seat.RowIndex < 0 || seat.ColIndex < 0))
        {
            errors.Add(Messages.Auditorium.SeatLayoutIndexesMustBeNonNegative);
        }

        var duplicateCoordinates = seatList
            .GroupBy(seat => new { seat.RowIndex, seat.ColIndex })
            .Where(group => group.Count() > 1)
            .Select(group => $"{group.Key.RowIndex}:{group.Key.ColIndex}")
            .ToList();

        if (duplicateCoordinates.Count > 0)
        {
            errors.Add(Messages.Auditorium.SeatLayoutDuplicateCoordinates);
        }

        var duplicateSeatNumbers = seatList
            .GroupBy(seat => seat.SeatNumber.Trim(), StringComparer.OrdinalIgnoreCase)
            .Where(group => group.Count() > 1)
            .Select(group => group.Key)
            .ToList();

        if (duplicateSeatNumbers.Count > 0)
        {
            errors.Add(Messages.Auditorium.SeatLayoutDuplicateSeatNumbers);
        }

        if (errors.Count > 0)
        {
            return errors;
        }

        var maxRow = seatList.Max(seat => seat.RowIndex);
        var maxCol = seatList.Max(seat => seat.ColIndex);
        var expectedSeatCount = (maxRow + 1) * (maxCol + 1);

        if (seatList.Count != expectedSeatCount)
        {
            errors.Add(Messages.Auditorium.SeatLayoutMustBeFullRectangle);
            return errors;
        }

        var coordinates = seatList
            .Select(seat => (seat.RowIndex, seat.ColIndex))
            .ToHashSet();

        for (var row = 0; row <= maxRow; row++)
        {
            for (var col = 0; col <= maxCol; col++)
            {
                if (!coordinates.Contains((row, col)))
                {
                    errors.Add(Messages.Auditorium.SeatLayoutMustBeFullRectangle);
                    return errors;
                }
            }
        }

        return errors;
    }
}
