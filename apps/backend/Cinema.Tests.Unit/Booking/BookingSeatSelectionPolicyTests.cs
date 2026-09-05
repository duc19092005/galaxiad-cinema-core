using Cinema.Application.UseCases.Booking.BookingFlow;
using Cinema.Domain.Entities.CinemaInfos;
using Cinema.Domain.Localization;
using FluentAssertions;
using Xunit;

namespace Cinema.Tests.Unit.Booking;

public class BookingSeatSelectionPolicyTests
{
    private static readonly Guid AuditoriumId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");

    /// <summary>Builds one row of N seats with sequential col indexes 0..n-1.</summary>
    private static List<SeatsInfoEntity> BuildRow(int seatCount, int rowIndex = 0)
    {
        var seats = new List<SeatsInfoEntity>();
        for (var col = 0; col < seatCount; col++)
        {
            seats.Add(new SeatsInfoEntity
            {
                SeatId = Guid.Parse($"00000000-0000-0000-0000-{col + 1:D12}"),
                SeatNumber = $"{(char)('A' + rowIndex)}{col + 1}",
                RowIndex = rowIndex,
                ColIndex = col,
                AuditoriumId = AuditoriumId
            });
        }

        return seats;
    }

    private static Guid Seat(int oneBasedCol) =>
        Guid.Parse($"00000000-0000-0000-0000-{oneBasedCol:D12}");

    private static List<string> Validate(
        List<SeatsInfoEntity> seats,
        IEnumerable<int> selectedCols,
        IEnumerable<int> occupiedCols) =>
        BookingSeatSelectionPolicy.ValidateSeatSelection(
            seats,
            selectedCols.Select(Seat),
            occupiedCols.Select(Seat));

    [Fact]
    public void DistantSelection_WhenValidBlockExists_IsRejected()
    {
        Validate(BuildRow(8), [1, 6], []).Should().Contain(Messages.Booking.SelectionMustBeContiguous);
    }

    [Fact]
    public void IntermediateDistantSelection_IsAllowed()
    {
        BookingSeatSelectionPolicy.ValidateSeatSelection(BuildRow(8), [Seat(1), Seat(6)], [], false)
            .Should().BeEmpty();
    }

    [Fact]
    public void FragmentedRemainingStock_AllowsSplitSelection()
    {
        Validate(BuildRow(5), [1, 5], [2, 3, 4]).Should().BeEmpty();
    }

    [Fact]
    public void ContiguousPair_InEmptyRow_IsValid()
    {
        Validate(BuildRow(8), [3, 4], []).Should().BeEmpty();
    }

    [Fact]
    public void SingleSeatAtEdge_IsValid()
    {
        Validate(BuildRow(8), [1], []).Should().BeEmpty();
        Validate(BuildRow(8), [8], []).Should().BeEmpty();
    }

    [Fact]
    public void LeavingSingleSeatAtRowEdge_DoesNotCreateIsolatedGap()
    {
        // Edge empties (at row boundaries) are not surrounded by two unavailable seats
        Validate(BuildRow(8), [2, 3], []).Should().BeEmpty();
        Validate(BuildRow(8), [6, 7], []).Should().BeEmpty();
    }

    [Fact]
    public void LeavingSingleSeatBetweenSelectedAndOccupied_IsRejected()
    {
        Validate(BuildRow(8), [3, 4], [1]).Should().Contain(Messages.Booking.SelectionLeavesIsolatedSeat);
    }

    [Fact]
    public void LeavingTwoSeatsAtEdge_IsValid()
    {
        Validate(BuildRow(8), [3, 4], []).Should().BeEmpty();
    }

    [Fact]
    public void SelectingAllRemainingSeatsInBlock_IsValid()
    {
        Validate(BuildRow(6), [2, 3, 4, 5], [1, 6]).Should().BeEmpty();
    }

    [Fact]
    public void EmptySelection_RequiresAtLeastOneSeat()
    {
        Validate(BuildRow(8), [], []).Should().Contain(Messages.Booking.AtLeastOneSeatMustBeSelected);
    }
}
