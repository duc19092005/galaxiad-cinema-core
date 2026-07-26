using Cinema.Application.Interfaces.Cleaning;
using Cinema.Application.Interfaces.Concessions;
using Cinema.Application.UseCases.Cleaning;
using Cinema.Application.UseCases.Concessions;
using Cinema.Infrastructure.ExternalServices.Concessions;
using Cinema.Infrastructure.Persistence.Repositories.Cleaning;
using Cinema.Infrastructure.Persistence.Repositories.Concessions;

namespace Cinema.Api.Bootstraps.Concessions;

public static class ConcessionServicesBootstrap
{
    public static IServiceCollection AddConcessionAndCleaningServices(this IServiceCollection services)
    {
        // Repositories
        services.AddScoped<IConcessionRepository, ConcessionRepository>();
        services.AddScoped<IInventoryRepository, InventoryRepository>();
        services.AddScoped<IStockRequestRepository, StockRequestRepository>();
        services.AddScoped<IWasteReportRepository, WasteReportRepository>();
        services.AddScoped<ICleaningRepository, CleaningRepository>();

        // Core stock service
        services.AddScoped<IInventoryStockService, InventoryStockService>();

        // Concession Use Cases
        services.AddScoped<CreateConcessionProductUseCase>();
        services.AddScoped<CreateComboUseCase>();
        services.AddScoped<UpdateConcessionProductUseCase>();
        services.AddScoped<ToggleConcessionProductStatusUseCase>();
        services.AddScoped<GetConcessionMenuUseCase>();
        services.AddScoped<GetConcessionProductsUseCase>();
        services.AddScoped<CheckConcessionStockUseCase>();
        services.AddScoped<SellConcessionPosUseCase>();

        // Stock Request Use Cases
        services.AddScoped<Cinema.Application.UseCases.Concessions.StockRequests.CreateStockRequestUseCase>();
        services.AddScoped<Cinema.Application.UseCases.Concessions.StockRequests.ApproveStockRequestUseCase>();
        services.AddScoped<Cinema.Application.UseCases.Concessions.StockRequests.RejectStockRequestUseCase>();
        services.AddScoped<Cinema.Application.UseCases.Concessions.StockRequests.ShipStockRequestUseCase>();
        services.AddScoped<Cinema.Application.UseCases.Concessions.StockRequests.ReceiveStockRequestUseCase>();
        services.AddScoped<Cinema.Application.UseCases.Concessions.StockRequests.GetStockRequestsUseCase>();

        // Waste Report Use Cases
        services.AddScoped<Cinema.Application.UseCases.Concessions.WasteReports.CreateWasteReportUseCase>();
        services.AddScoped<Cinema.Application.UseCases.Concessions.WasteReports.ReviewWasteReportUseCase>();
        services.AddScoped<Cinema.Application.UseCases.Concessions.WasteReports.GetWasteReportsUseCase>();

        // Inventory Use Cases
        services.AddScoped<RestockInventoryUseCase>();
        services.AddScoped<AdjustInventoryUseCase>();
        services.AddScoped<StockCountInventoryUseCase>();
        services.AddScoped<GetInventoryStatusUseCase>();
        services.AddScoped<GetInventoryHistoryUseCase>();

        // Cleaning Use Cases
        services.AddScoped<GetCleaningBoardUseCase>();
        services.AddScoped<GetMyCleaningTasksUseCase>();
        services.AddScoped<AssignCleaningTaskUseCase>();
        services.AddScoped<StartCleaningTaskUseCase>();
        services.AddScoped<CompleteCleaningTaskUseCase>();
        services.AddScoped<VerifyCleaningTaskUseCase>();
        services.AddScoped<GenerateCleaningTasksForShowtimesUseCase>();

        return services;
    }
}
