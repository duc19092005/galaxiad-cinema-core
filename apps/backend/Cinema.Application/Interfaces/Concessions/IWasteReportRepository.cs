using Cinema.Domain.Entities.Concessions;
using Cinema.Domain.Enums;

namespace Cinema.Application.Interfaces.Concessions;

public interface IWasteReportRepository
{
    Task<WasteReportEntity?> GetByIdAsync(Guid wasteReportId);
    Task<List<WasteReportEntity>> GetListAsync(Guid? cinemaId, WasteReportStatus? status);
    Task AddAsync(WasteReportEntity wasteReport);
    void Update(WasteReportEntity wasteReport);
}
