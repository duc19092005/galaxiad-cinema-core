using Cinema.Application.UseCases.TheaterManager;
using Cinema.Application.UseCases.TheaterManager.MovieSchedules;
using Cinema.Application.UseCases.TheaterManager.ShiftManagement;
using Cinema.Application.UseCases.TheaterManager.ShowtimeRecommendations;
using Cinema.Application.Services.TheaterManager.ShowtimeRecommendations;

namespace Cinema.Api.Bootstraps.Facilities;

public static class FacilitiesServicesBootstrap
{
    public static IServiceCollection AddFacilitiesServices(this IServiceCollection services)
    {
        // ----------------------------------------------------------------
        // |                 Repositories                                  |
        // ----------------------------------------------------------------

        services.AddScoped<Cinema.Application.Interfaces.Facilities.IAuditoriumRepository, Cinema.Infrastructure.Repositories.AuditoriumRepository>();
        services.AddScoped<Cinema.Application.Interfaces.Facilities.ICinemaRepository, Cinema.Infrastructure.Repositories.CinemaRepository>();
        services.AddScoped<Cinema.Application.Interfaces.Facilities.IDepartmentRepository, Cinema.Infrastructure.Repositories.DepartmentRepository>();
        services.AddScoped<Cinema.Application.Interfaces.Facilities.IMovieFormatRepository, Cinema.Infrastructure.Repositories.MovieFormatRepository>();
        services.AddScoped<Cinema.Application.Interfaces.Facilities.ITheaterManagerDataRepository, Cinema.Infrastructure.Repositories.TheaterManagerDataRepository>();
        services.AddScoped<Cinema.Application.Interfaces.Facilities.IShiftManagerRepository, Cinema.Infrastructure.Repositories.ShiftManagerRepository>();
        services.AddScoped<Cinema.Application.Interfaces.Facilities.IStaffShiftRepository, Cinema.Infrastructure.Repositories.StaffShiftRepository>();
        services.AddScoped<Cinema.Application.Interfaces.TheaterManager.IMovieScheduleRepository, Cinema.Infrastructure.Repositories.MovieScheduleRepository>();
        services.AddScoped<Cinema.Application.Interfaces.TheaterManager.IShowtimeRecommendationRepository, Cinema.Infrastructure.Repositories.ShowtimeRecommendationRepository>();


        // ----------------------------------------------------------------
        // |              Use Cases - Facilities Manager                   |
        // ----------------------------------------------------------------

        services.AddScoped<Cinema.Application.UseCases.FacilitiesManager.Cinemas.CreateCinemaUseCase>();
        services.AddScoped<Cinema.Application.UseCases.FacilitiesManager.Cinemas.UpdateCinemaUseCase>();
        services.AddScoped<Cinema.Application.UseCases.FacilitiesManager.Cinemas.DeleteCinemaUseCase>();
        services.AddScoped<Cinema.Application.UseCases.FacilitiesManager.Cinemas.GetAllCinemasUseCase>();
        services.AddScoped<Cinema.Application.UseCases.FacilitiesManager.Cinemas.GetCinemaByIdUseCase>();
        services.AddScoped<Cinema.Application.UseCases.FacilitiesManager.MovieFormat.FacilitiesManagerReadMovieFormatUseCase>();
        services.AddScoped<Cinema.Application.UseCases.FacilitiesManager.Cinemas.GetDepartmentsUseCase>();
        services.AddScoped<Cinema.Application.UseCases.FacilitiesManager.Cinemas.CreateDepartmentUseCase>();
        services.AddScoped<Cinema.Application.UseCases.FacilitiesManager.Cinemas.UpdateDepartmentUseCase>();
        services.AddScoped<Cinema.Application.UseCases.FacilitiesManager.Cinemas.DeleteDepartmentUseCase>();

        // Auditorium Use Cases
        services.AddScoped<Cinema.Application.UseCases.FacilitiesManager.Auditoriums.CreateAuditoriumUseCase>();
        services.AddScoped<Cinema.Application.UseCases.FacilitiesManager.Auditoriums.UpdateAuditoriumUseCase>();
        services.AddScoped<Cinema.Application.UseCases.FacilitiesManager.Auditoriums.DeleteAuditoriumUseCase>();
        services.AddScoped<Cinema.Application.UseCases.FacilitiesManager.Auditoriums.GetAllAuditoriumsUseCase>();
        services.AddScoped<Cinema.Application.UseCases.FacilitiesManager.Auditoriums.GetAuditoriumByIdUseCase>();
        services.AddScoped<Cinema.Application.UseCases.FacilitiesManager.Auditoriums.GetAuditoriumsByCinemaIdUseCase>();

        // ----------------------------------------------------------------
        // |              Use Cases - Theater Manager                      |
        // ----------------------------------------------------------------

        services.AddScoped<CreateMovieScheduleUseCase>();
        services.AddScoped<UpdateMovieScheduleUseCase>();
        services.AddScoped<DeleteMovieScheduleUseCase>();
        services.AddScoped<SetScheduleActiveUseCase>();
        services.AddScoped<SetScheduleInactiveUseCase>();
        services.AddScoped<ReadMovieSchedules>();
        services.AddScoped<GetMoviesWithFormatsUseCase>();
        services.AddScoped<GetMyAuditoriumsUseCase>();
        services.AddScoped<ShowtimeRecommendationAccessGuard>();
        services.AddScoped<ShowtimeRecommendationPreviewService>();
        services.AddScoped<ShowtimeRecommendationApplyService>();
        services.AddScoped<GenerateShowtimeRecommendationsUseCase>();
        services.AddScoped<PreviewShowtimeRecommendationsUseCase>();
        services.AddScoped<ApplyShowtimeRecommendationsUseCase>();
        services.AddScoped<DismissShowtimeRecommendationUseCase>();
        services.AddScoped<GetShowtimeRecommendationHistoryUseCase>();

        // Shift management use cases (manager-side)
        services.AddScoped<CreateShiftTemplateUseCase>();
        services.AddScoped<GetShiftTemplatesUseCase>();
        services.AddScoped<GetShiftRegistrationsUseCase>();
        services.AddScoped<GetStaffProfilesUseCase>();
        services.AddScoped<UpdateStaffProfileUseCase>();
        services.AddScoped<GetStaffPayrollUseCase>();
        services.AddScoped<GetCinemaPayrollUseCase>();

        // ----------------------------------------------------------------
        // |              Use Cases - Staff Self-Service                   |
        // ----------------------------------------------------------------

        services.AddScoped<Cinema.Application.UseCases.Staff.GetAvailableShiftsUseCase>();
        services.AddScoped<Cinema.Application.UseCases.Staff.GetMyRegistrationsUseCase>();
        services.AddScoped<Cinema.Application.UseCases.Staff.CancelPendingRegistrationUseCase>();
        services.AddScoped<Cinema.Application.UseCases.Staff.BulkCancelPendingRegistrationsUseCase>();
        services.AddScoped<Cinema.Application.UseCases.Staff.GetMyWorkingHistoryUseCase>();
        services.AddScoped<Cinema.Application.UseCases.Staff.GetMyPayrollUseCase>();


        return services;
    }
}
