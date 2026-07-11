using Cinema.Application.UseCases.Booking.BookingFlow;
using Cinema.Domain.Entities.CinemaInfos;
using Cinema.Domain.Localization;
using FluentAssertions;

namespace Cinema.Tests.UnitTests.Booking;

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
    public void Solo_MiddleSeat_OnEmptyRow_IsAllowed()
    {
        var seats = BuildRow(8);
        var errors = Validate(seats, selectedCols: [4], occupiedCols: []);
        errors.Should().BeEmpty();
    }

    [Fact]
    public void Solo_EdgeSeat_OnEmptyRow_IsAllowed()
    {
        var seats = BuildRow(8);
        Validate(seats, [1], []).Should().BeEmpty();
        Validate(seats, [8], []).Should().BeEmpty();
    }

    [Fact]
    public void TwoAdjacentSeats_IsAllowed()
    {
        var seats = BuildRow(8);
        Validate(seats, [4, 5], []).Should().BeEmpty();
    }

    [Fact]
    public void ContiguousBlock_IsAllowed()
    {
        var seats = BuildRow(8);
        Validate(seats, [1, 2, 3, 4], []).Should().BeEmpty();
    }

    [Fact]
    public void ExtendExistingOccupiedBlock_IsAllowed()
    {
        var seats = BuildRow(8);
        // occupied 1-2, select 3 → XXX_____
        Validate(seats, [3], [1, 2]).Should().BeEmpty();
    }

    [Fact]
    public void FillExistingOrphanGap_IsAllowed()
    {
        var seats = BuildRow(8);
        // occupied 1 and 3 (orphan at 2), select 2 → fill gap
        Validate(seats, [2], [1, 3]).Should().BeEmpty();
    }

    [Fact]
    public void LeaveSingleEmptyAtRowEdge_IsAllowed()
    {
        var seats = BuildRow(8);
        // select 2-8, leave seat 1 empty at edge
        Validate(seats, [2, 3, 4, 5, 6, 7, 8], []).Should().BeEmpty();
    }

    [Fact]
    public void GapOfTwoOrMore_IsAllowed()
    {
        var seats = BuildRow(8);
        // occupied 1-2, select 5-6 → XX__XX__
        Validate(seats, [5, 6], [1, 2]).Should().BeEmpty();
    }

    [Fact]
    public void SelectWithGapOne_CreatesIsolation_IsRejected()
    {
        var seats = BuildRow(8);
        // select 1 and 3 → X_X_____
        var errors = Validate(seats, [1, 3], []);
        errors.Should().Contain(Messages.Booking.SelectionLeavesIsolatedSeat);
    }

    [Fact]
    public void SelectSeatThatCreatesGapAgainstOccupied_IsRejected()
    {
        var seats = BuildRow(8);
        // occupied 1, select 3 → X_X_____
        var errors = Validate(seats, [3], [1]);
        errors.Should().Contain(Messages.Booking.SelectionLeavesIsolatedSeat);
    }

    [Fact]
    public void SkipOneAfterOccupiedBlock_IsRejected()
    {
        var seats = BuildRow(8);
        // occupied 1-3, select 5 → XXX_X___
        var errors = Validate(seats, [5], [1, 2, 3]);
        errors.Should().Contain(Messages.Booking.SelectionLeavesIsolatedSeat);
    }

    [Fact]
    public void PreExistingOrphan_SelectElsewhereOnSameRow_CreatingNewGap_IsRejected()
    {
        var seats = BuildRow(8);
        // occupied 1 and 3 (orphan 2), select 5 → new gap at 4: X_X_X___
        var errors = Validate(seats, [5], [1, 3]);
        errors.Should().Contain(Messages.Booking.SelectionLeavesIsolatedSeat);
    }

    [Fact]
    public void PreExistingOrphan_SelectFarOnSameRow_WithoutNewGap_IsAllowed()
    {
        var seats = BuildRow(8);
        // occupied 1 and 3 (orphan 2), select 7-8 → no NEW isolation
        Validate(seats, [7, 8], [1, 3]).Should().BeEmpty();
    }

    [Fact]
    public void CrossUser_SecondBookingCreatingGap_IsRejected()
    {
        var seats = BuildRow(8);
        // User A already booked seat 1; User B tries seat 3
        var errors = Validate(seats, [3], [1]);
        errors.Should().Contain(Messages.Booking.SelectionLeavesIsolatedSeat);
    }

    [Fact]
    public void PreExistingOrphan_OnOtherRow_DoesNotBlockValidSelection()
    {
        var row0 = BuildRow(8, rowIndex: 0);
        var row1 = BuildRow(8, rowIndex: 1);
        for (var i = 0; i < row1.Count; i++)
        {
            row1[i].SeatId = Guid.Parse($"11111111-1111-1111-1111-{i + 1:D12}");
        }

        var seats = row0.Concat(row1).ToList();
        var occupied = new[] { Seat(1), Seat(3) }; // orphan on row0
        var selected = new[] { Guid.Parse("11111111-1111-1111-1111-000000000001") };

        BookingSeatSelectionPolicy.ValidateSeatSelection(seats, selected, occupied)
            .Should().BeEmpty();
    }

    [Fact]
    public void EmptySelection_IsRejected()
    {
        var seats = BuildRow(8);
        var errors = Validate(seats, [], []);
        errors.Should().Contain(Messages.Booking.AtLeastOneSeatMustBeSelected);
    }

    [Fact]
    public void MoreThanTenSeats_IsRejected()
    {
        var seats = BuildRow(12);
        var errors = Validate(seats, Enumerable.Range(1, 11), []);
        errors.Should().Contain(Messages.Booking.MaxTenTicketsPerOrder);
    }

    [Fact]
    public void DuplicateSelectedSeats_IsRejected()
    {
        var seats = BuildRow(8);
        var errors = BookingSeatSelectionPolicy.ValidateSeatSelection(
            seats,
            [Seat(1), Seat(1)],
            []);
        errors.Should().Contain(Messages.Booking.DuplicateSelectedSeats);
    }

    [Fact]
    public void InvalidSeatNotInAuditorium_IsRejected()
    {
        var seats = BuildRow(8);
        var errors = BookingSeatSelectionPolicy.ValidateSeatSelection(
            seats,
            [Guid.NewGuid()],
            []);
        errors.Should().Contain(Messages.Booking.InvalidSeats);
    }

    [Fact]
    public void FindIsolatedEmptySeats_DetectsMiddleGapOnly()
    {
        var seats = BuildRow(5);
        // X _ X _ _  → seat 2 isolated; seat 4 not (edge-ish gap not kẹp if seat 5 empty)
        var unavailable = new HashSet<Guid> { Seat(1), Seat(3) };
        var isolated = BookingSeatSelectionPolicy.FindIsolatedEmptySeats(seats, unavailable);
        isolated.Select(s => s.SeatId).Should().BeEquivalentTo([Seat(2)]);
    }

    [Fact]
    public void FindIsolatedEmptySeats_EdgeEmpty_NotIsolated()
    {
        var seats = BuildRow(5);
        // _ X X X X
        var unavailable = new HashSet<Guid> { Seat(2), Seat(3), Seat(4), Seat(5) };
        var isolated = BookingSeatSelectionPolicy.FindIsolatedEmptySeats(seats, unavailable);
        isolated.Should().BeEmpty();
    }
}
