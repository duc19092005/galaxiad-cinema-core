FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
USER $APP_UID
WORKDIR /app
EXPOSE 8080
EXPOSE 8081

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src
COPY ["Cinema.Api/Cinema.Api.csproj", "Cinema.Api/"]
COPY ["Cinema.Application/Cinema.Application.csproj", "Cinema.Application/"]
COPY ["Cinema.Domain/Cinema.Domain.csproj", "Cinema.Domain/"]
COPY ["Cinema.Infrastructure/Cinema.Infrastructure.csproj", "Cinema.Infrastructure/"]
RUN dotnet restore "Cinema.Api/Cinema.Api.csproj"
COPY . .
WORKDIR "/src/Cinema.Api"
RUN dotnet build "./Cinema.Api.csproj" -c $BUILD_CONFIGURATION -o /app/build

FROM build AS development
CMD ["dotnet", "watch", "run", "--no-launch-profile", "--non-interactive"]

FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "./Cinema.Api.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "Cinema.Api.dll"]
