using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Cinema.Application.Dtos.TheaterManager.Auditoriums.Responses;
using Cinema.Application.Dtos.TheaterManager.MovieSchedules.Responses;
using Cinema.Domain.Entities.CinemaInfos;
using Cinema.Domain.Entities.MovieInfos;
using Cinema.Domain.Interfaces.Persistence;

namespace Cinema.Application.Interfaces.TheaterManager;

public interface IMovieScheduleRepository
{
    // ReadAuditorium queries
    Task<CinemaInfoEntity?> GetCinemaWithDetailsByManagerAsync(Guid managerId, bool isAdmin);
    Task<List<TheaterManagerAuditoriumInfos>> GetAuditoriumsByCinemaIdAsync(Guid cinemaId);

    // ReadMovieSchedules queries
    Task<AuditoriumInfoEntities?> GetAuditoriumWithCinemaAsync(Guid auditoriumId);
    Task<List<TheaterManagerMovieScheduleResDto>> GetSchedulesByAuditoriumIdAsync(Guid auditoriumId);

    // WriteMovieSchedule queries
    Task<bool> AuditoriumExistsAsync(Guid auditoriumId);
    Task<bool> IsAuditoriumExistForManagerAsync(Guid auditoriumId, Guid managerId, bool isAdmin);
    Task<bool> IsAuditoriumExistForTheaterOrFacilitiesManagerAsync(Guid auditoriumId, Guid managerId, bool isAdmin);
    Task<Guid> GetCinemaIdByAuditoriumAsync(Guid auditoriumId);
    Task<Dictionary<Guid, MovieInfoEntity>> GetMoviesByIdsAsync(IEnumerable<Guid> movieIds);
    Task<List<movieFormatMovieInfoEntity>> GetMovieFormatRelationsAsync(IEnumerable<Guid> movieIds);
    Task<List<MovieFormatInfoEntity>> GetAllMovieFormatsAsync();
    Task<List<Guid>> GetAuthorizedMovieIdsAsync(IEnumerable<Guid> movieIds, Guid cinemaId);
    Task<List<MovieScheduleInfoEntity>> GetExistingSchedulesForAuditoriumAsync(Guid auditoriumId, DateTime start, DateTime end);
    Task<List<MovieScheduleInfoEntity>> GetExistingSchedulesExcludeIdsAsync(Guid auditoriumId, DateTime start, DateTime end, IEnumerable<Guid> excludeIds);
    Task<List<MovieScheduleInfoEntity>> GetSchedulesByIdsAsync(IEnumerable<Guid> scheduleIds);
    Task<List<MovieScheduleInfoEntity>> GetSchedulesForUpdateAsync(Guid auditoriumId, IEnumerable<Guid> scheduleIds);
    Task<List<string>> GetMovieNamesForSchedulesAsync(IEnumerable<Guid> scheduleIds);
    Task<bool> HasSuccessfulBookingForSchedulesAsync(IEnumerable<Guid> scheduleIds);
    Task<bool> HasSuccessfulBookingForScheduleAsync(Guid scheduleId);
    Task<MovieScheduleInfoEntity?> GetScheduleByIdWithAuditoriumAsync(Guid scheduleId);
    Task<MovieScheduleInfoEntity?> FindScheduleAsync(Guid scheduleId);

    // Mutations
    void RemoveSchedules(IEnumerable<MovieScheduleInfoEntity> schedules);
    void UpdateSchedule(MovieScheduleInfoEntity schedule);
    Task AddSchedulesAsync(IEnumerable<MovieScheduleInfoEntity> schedules);
    Task SaveChangesAsync();
    Task<IUnitOfWorkTransaction> BeginTransactionAsync();
}
