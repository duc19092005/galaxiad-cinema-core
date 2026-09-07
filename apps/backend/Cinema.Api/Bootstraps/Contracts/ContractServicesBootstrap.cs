using Cinema.Application.Interfaces.Contracts;
using Cinema.Application.UseCases.MovieManager.Contracts;
using Cinema.Application.UseCases.MovieManager.ContractTemplates;
using Cinema.Application.UseCases.MovieManager.MovieChangeRequests;
using Cinema.Infrastructure.ExternalServices.Contracts;
using Cinema.Infrastructure.Persistence.Repositories.Contracts;

namespace Cinema.Api.Bootstraps.Contracts;

public static class ContractServicesBootstrap
{
    public static IServiceCollection AddContractServices(this IServiceCollection services)
    {
        // Repository & Queue Service & Jobs
        services.AddScoped<IContractRepository, ContractRepository>();
        services.AddScoped<IContractExtractionQueueService, ContractExtractionQueueService>();
        services.AddScoped<ContractExtractionJob>();

        // Contracts Use Cases
        services.AddScoped<ListContractsUseCase>();
        services.AddScoped<AssignContractUseCase>();
        services.AddScoped<GetContractDetailUseCase>();
        services.AddScoped<CreateContractUseCase>();
        services.AddScoped<UploadContractDocumentUseCase>();
        services.AddScoped<DownloadContractDocumentUseCase>();
        services.AddScoped<TriggerContractExtractionUseCase>();
        services.AddScoped<ReviewContractExtractionUseCase>();
        services.AddScoped<SubmitContractForReviewUseCase>();
        services.AddScoped<ReturnContractUseCase>();
        services.AddScoped<ApproveContractUseCase>();
        services.AddScoped<SignContractUseCase>();
        services.AddScoped<ActivateContractUseCase>();
        services.AddScoped<SuspendContractUseCase>();
        services.AddScoped<ResumeContractUseCase>();
        services.AddScoped<TerminateContractUseCase>();
        services.AddScoped<GetMovieRevenueReconciliationUseCase>();

        // Contract Templates Use Cases
        services.AddScoped<ListContractTemplatesUseCase>();
        services.AddScoped<CreateContractTemplateUseCase>();
        services.AddScoped<UpdateContractTemplateDraftUseCase>();
        services.AddScoped<PublishContractTemplateUseCase>();
        services.AddScoped<RetireContractTemplateUseCase>();

        // Movie Change Requests Use Cases
        services.AddScoped<CreateMovieChangeRequestUseCase>();
        services.AddScoped<ListMovieChangeRequestsUseCase>();
        services.AddScoped<SubmitMovieChangeRequestUseCase>();
        services.AddScoped<ReturnMovieChangeRequestUseCase>();
        services.AddScoped<RejectMovieChangeRequestUseCase>();
        services.AddScoped<ApproveMovieChangeRequestUseCase>();

        return services;
    }
}
