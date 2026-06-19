using Cinema.Application.UseCases.TheaterManager;
using Cinema.Application.UseCases.TheaterManager.MovieSchedules;

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

        // ----------------------------------------------------------------
        // |              Use Cases - Facilities Manager                   |
        // ----------------------------------------------------------------

        services.AddScoped<Cinema.Application.UseCases.FacilitiesManager.Cinemas.FacilitiesManagerReadCinemaUseCase>();
        services.AddScoped<Cinema.Application.UseCases.FacilitiesManager.Cinemas.FacilitiesManagerWriteCinemaUseCase>();
        services.AddScoped<Cinema.Application.UseCases.FacilitiesManager.MovieFormat.FacilitiesManagerReadMovieFormatUseCase>();
        services.AddScoped<Cinema.Application.UseCases.FacilitiesManager.Cinemas.GetDepartmentsUseCase>();
        services.AddScoped<Cinema.Application.UseCases.FacilitiesManager.Cinemas.CreateDepartmentUseCase>();
        services.AddScoped<Cinema.Application.UseCases.FacilitiesManager.Cinemas.UpdateDepartmentUseCase>();
        services.AddScoped<Cinema.Application.UseCases.FacilitiesManager.Cinemas.DeleteDepartmentUseCase>();

        // Auditorium Use Cases
        services.AddScoped<Cinema.Application.UseCases.FacilitiesManager.Auditoriums.FacilitiesManagerReadAuditoriumUseCase>();
        services.AddScoped<Cinema.Application.UseCases.FacilitiesManager.Auditoriums.FacilitiesManagerWriteAuditoriumUseCase>();

        // ----------------------------------------------------------------
        // |              Use Cases - Theater Manager                      |
        // ----------------------------------------------------------------

        services.AddScoped<WriteMovieSchedulesUseCase>();
        services.AddScoped<ReadMovieSchedules>();
        services.AddScoped<GetMoviesWithFormatsUseCase>();
        services.AddScoped<GetMyAuditoriumsUseCase>();

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
