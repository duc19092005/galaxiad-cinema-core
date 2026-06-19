using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Cinema.Application.Dtos.FacilitiesManager.Cinemas.Responses;
using Cinema.Domain.Entities.CinemaInfos;
using Cinema.Domain.Entities.MovieInfos;

namespace Cinema.Application.Interfaces.Facilities;

public interface ICinemaRepository
{
    Task<List<ResFacilitiesManagerCinema>> GetAllCinemasAsync(Guid userId, bool isAdmin, bool isFacilitiesManager, bool isTheaterManager);
    Task<ResFacilitiesManagerCinema?> GetCinemaByIdAsync(Guid id, Guid userId, bool isAdmin, bool isFacilitiesManager, bool isTheaterManager);
    Task<CinemaInfoEntity?> GetCinemaEntityByIdAsync(Guid id, Guid userId, bool isAdmin);
    Task<bool> IsDuplicateCinemaNameAsync(Guid? cinemaId, string name);
    Task<bool> IsDuplicateCinemaDescriptionAsync(Guid? cinemaId, string description);
    Task<bool> IsDuplicateCinemaLocationAsync(Guid? cinemaId, string location);
    Task<bool> IsDuplicateCinemaHotlineAsync(Guid? cinemaId, string hotline);
    Task<bool> HasBookedBookingForCinemaAsync(Guid cinemaId);
    Task<List<AuditoriumInfoEntities>> GetActiveAuditoriumsByCinemaIdAsync(Guid cinemaId);
    Task<List<MovieScheduleInfoEntity>> GetActiveSchedulesByAuditoriumIdAsync(Guid auditoriumId);
    Task CancelPendingOrdersForScheduleAsync(Guid scheduleId);
    Task AddCinemaAsync(CinemaInfoEntity cinema);
    Task SaveChangesAsync();
}
