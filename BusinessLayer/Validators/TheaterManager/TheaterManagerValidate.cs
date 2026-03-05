using DataAccess;

public class TheaterManagerValidate
{
    private readonly CinemaDbContext _dbContext;

    public TheaterManagerValidate(CinemaDbContext dbContext)
    {
        _dbContext = dbContext;
    }
    public bool ValidateSchedule(Guid scheduleId)
    {
        // Find Order If there's any order with this scheduleId and the Schedule can not be deleted or edited
        var orderInfo = 
        _dbContext.OrderDetailsInfoEntity.Where
            (x => x.MovieScheduleId.Equals(scheduleId) && x.OrderInfoEntity.OrderStatus == Shared.Enums.OrderStatusEnum.Completed);
        return orderInfo.Any();
    }
}