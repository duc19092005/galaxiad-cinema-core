using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Cinema.Application.Dtos.FacilitiesManager.Auditoriums.Responses;
using Cinema.Domain.Entities.CinemaInfos;
using Cinema.Domain.Entities.MovieInfos;

namespace Cinema.Application.Interfaces.Facilities;

public interface IAuditoriumRepository
{
    Task<List<GetResAuditoriumDto>> GetAllAuditoriumsAsync();
    Task<GetResAuditoriumDto?> GetAuditoriumByIdAsync(Guid id, Guid userId);
    Task<List<GetResAuditoriumDtoCinema>> GetAuditoriumsByCinemaIdAsync(Guid cinemaId);
    Task<bool> IsDuplicateAuditoriumNumberAsync(Guid? auditoriumId, string auditoriumNumber, Guid cinemaId);
    Task<AuditoriumInfoEntities?> GetAuditoriumEntityByIdAsync(Guid id);
    Task AddAuditoriumAsync(AuditoriumInfoEntities auditorium);
    Task AddAuditoriumFormatsAsync(IEnumerable<AuditoriumFormatInfos> formats);
    Task AddSeatsAsync(IEnumerable<SeatsInfoEntity> seats);
    Task DeleteAuditoriumFormatsAsync(IEnumerable<AuditoriumFormatInfos> formats);
    Task<List<AuditoriumFormatInfos>> GetFormatsByAuditoriumIdAsync(Guid auditoriumId);
    Task<List<SeatsInfoEntity>> GetSeatsByAuditoriumIdAsync(Guid auditoriumId);
    Task DeleteSeatsAsync(IEnumerable<SeatsInfoEntity> seats);
    Task<bool> HasBookedBookingForAuditoriumAsync(Guid auditoriumId);
    Task<bool> HasAnyBookingForAuditoriumSeatsAsync(Guid auditoriumId);
    Task<List<MovieScheduleInfoEntity>> GetActiveSchedulesByAuditoriumIdAsync(Guid auditoriumId);
    Task CancelPendingOrdersForScheduleAsync(Guid scheduleId);
    Task SaveChangesAsync();
}
