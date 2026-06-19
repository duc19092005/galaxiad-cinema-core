FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
USER $APP_UID
WORKDIR /app
EXPOSE 8080
EXPOSE 8081

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src
COPY ["ApiLayer/ApiLayer.csproj", "ApiLayer/"]
COPY ["BusinessLayer/BusinessLayer.csproj", "BusinessLayer/"]
COPY ["DataAccess/DataAccess.csproj", "DataAccess/"]
COPY ["Shared/Shared.csproj", "Shared/"]
RUN dotnet restore "ApiLayer/ApiLayer.csproj"
COPY . .
WORKDIR "/src/ApiLayer"
RUN dotnet build "./ApiLayer.csproj" -c $BUILD_CONFIGURATION -o /app/build

FROM build AS development
CMD ["dotnet", "watch", "run", "--no-launch-profile", "--non-interactive"]

FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "./ApiLayer.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "ApiLayer.dll"]
