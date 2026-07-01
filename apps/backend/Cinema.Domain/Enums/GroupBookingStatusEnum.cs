namespace Cinema.Domain.Enums;

public enum GroupBookingStatusEnum
{
    Open = 1,
    SeatsSelected = 2,
    Confirming = 3,
    Paying = 4,
    PaymentFailed = 5,
    Completed = 6,
    Cancelled = 7,
    VotingPaymentMethod = 8,
    Pairing = 9,
    PayingAll = 10,
    PayingIndividual = 11,
    PayingPair = 12,
    PaymentFailedPartial = 13
}
