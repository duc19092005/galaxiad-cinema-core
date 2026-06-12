using BusinessLayer.Entities.UserInfos;
using Shared.Enums;
using Shared.Interfaces.Persistence;

public class TheaterManagerValidate
{
    private readonly IUnitOfWork _unitOfWork;

    public TheaterManagerValidate(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }
    public bool ValidateSchedule(Guid scheduleId)
    {
        // Find Order If there's any order with this scheduleId and the Schedule can not be deleted or edited
        var orderInfo = 
        _unitOfWork.Repository<OrderDetailsInfo>().Query().Where
            (x => x.MovieScheduleId.Equals(scheduleId) && x.OrderInfoEntity.OrderStatus == OrderStatusEnum.Completed);
        return orderInfo.Any();
    }
}
