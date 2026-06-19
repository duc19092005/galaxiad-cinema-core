namespace Cinema.Api.Bootstraps.Validate;

public static class ValidateBootstrap
{
    public static IServiceCollection TheaterManagerValidate(this IServiceCollection services)
    {
        services.AddScoped<TheaterManagerValidate>();
        return services;
    }
}