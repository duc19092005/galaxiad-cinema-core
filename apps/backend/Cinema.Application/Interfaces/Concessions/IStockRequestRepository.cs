using Cinema.Domain.Entities.Concessions;
using Cinema.Domain.Enums;

namespace Cinema.Application.Interfaces.Concessions;

public interface IStockRequestRepository
{
    Task<StockRequestEntity?> GetByIdAsync(Guid stockRequestId);
    Task<StockRequestEntity?> GetByIdWithItemsAsync(Guid stockRequestId);
    Task<List<StockRequestEntity>> GetListAsync(Guid? cinemaId, StockRequestStatus? status);
    Task AddAsync(StockRequestEntity stockRequest);
    void Update(StockRequestEntity stockRequest);
}
