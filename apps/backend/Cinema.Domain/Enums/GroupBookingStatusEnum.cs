namespace Cinema.Domain.Enums;

public enum GroupBookingStatusEnum
{
    Open = 1,
    SeatsSelected = 2,
    Confirming = 3,
    Paying = 4,
    PaymentFailed = 5,
    Completed = 6,
    Cancelled = 7
}
