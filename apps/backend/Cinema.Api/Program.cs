using Cinema.Api.Bootstraps.Admin;
using Cinema.Api.Bootstraps.Authentication;
using Cinema.Api.Bootstraps.Common;
using Cinema.Api.Bootstraps.Facilities;
using Cinema.Api.Bootstraps.IdentityAccess;
using Cinema.Api.Bootstraps.MovieInfos;
using Cinema.Api.Bootstraps.Booking;
using Cinema.Api.Bootstraps.Validate;
using Cinema.Api.Bootstraps.Chatbot;
using Cinema.Api.Hubs;
using Cinema.Api.Middlewares;
using Cinema.Application.Exceptions;
using Cinema.Infrastructure;
using Cinema.Infrastructure.Identity;
using Hangfire;
using Hangfire.SqlServer;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;
using Cinema.Infrastructure.BackgroundJobs;
using Cinema.Application.Interfaces.IThirdPersonServices;
using Cinema.Infrastructure.Services;
using Cinema.Application.Abstractions.Security;
using Cinema.Application.Infrastructure.Booking;

var currentDir = Directory.GetCurrentDirectory();
var envPath = Path.Combine(currentDir, ".env");
if (!File.Exists(envPath))
{
    envPath = Path.Combine(currentDir, "apps", "backend", "Cinema.Api", ".env");
}
if (File.Exists(envPath))
{
    foreach (var line in File.ReadAllLines(envPath))
    {
        var parts = line.Split('=', 2);
        if (parts.Length == 2)
        {
            Environment.SetEnvironmentVariable(parts[0].Trim(), parts[1].Trim());
        }
    }
}

var builder = WebApplication.CreateBuilder(args);

// --- SERVICES CONTAINER ---

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddSingleton<IEncryptionService, AesEncryptionService>();
builder.Services.AddSingleton<UserIdentityCodeConstant>();
builder.Services.AddHttpContextAccessor();

// DB Context
builder.Services.AddDbContext<CinemaDbContext>(options => 
    options.UseSqlServer(builder.Configuration.GetConnectionString("DatabaseConnection")));

// Custom Error Message API Response
builder.Services.Configure<ApiBehaviorOptions>(options =>
{
    options.InvalidModelStateResponseFactory = context =>
    {
        var firstError = context.ModelState.Values
            .SelectMany(v => v.Errors)
            .Select(e => e.ErrorMessage)
            .FirstOrDefault();
        
        throw new AppException(firstError ?? "Missing One or more Fields", 400, "Validation error");
    };
});

// Business Services & Factories
builder.Services.AddCommonServices();
builder.Services.AddIdentityServices();
builder.Services.AddFacilitiesServices();
builder.Services.AddMovieServices();
builder.Services.AddBookingServices();
builder.Services.AddIdentityFactories();
builder.Services.AddFacilitiesFactories();
builder.Services.AddMovieFactories();
builder.Services.AddApplicationFactories();
builder.Services.AddAdminBootstrap();
builder.Services.AddChatbotServices();

// Chạy Background Service mỗi 10 phút để cập nhật trạng thái Movie và Schedule
builder.Services.AddHostedService<MovieStatusSyncBackgroundService>();
builder.Services.AddHostedService<AiMovieEmbeddingStartupService>();
builder.Services.AddHostedService<MovieViewBufferSyncService>();

// JWT & Cloudinary
builder.Services.AddJwt(builder.Configuration);
builder.Services.AddScoped<IImageStorageService, CloudinaryImageStorageService>();
builder.Services.AddScoped<IBackgroundJobScheduler, HangfireJobSchedulerService>();
builder.Services.TheaterManagerValidate();

// --- CẤU HÌNH CORS (ĐÃ SỬA LỖI) ---
builder.Services.AddCors(options =>
{
    options.AddPolicy("web", policy =>
    {
        policy.SetIsOriginAllowed(origin => 
              {
                  if (string.IsNullOrWhiteSpace(origin)) return false;
                  var host = new Uri(origin).Host;
                  // Chấp nhận localhost và tất cả các sub-domain của vercel.app
                  return host == "localhost" || host == "127.0.0.1" || host.EndsWith("vercel.app");
              })
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials(); 
    });
});

// Authorization Policies
builder.Services.AddAuthorization(options => {
    options.AddPolicy("FacilitiesManager", policy => policy.RequireRole("FacilitiesManager", "Admin"));
    options.AddPolicy("Admin" , policy => policy.RequireRole("Admin"));
    options.AddPolicy("TheaterManager", policy => policy.RequireRole("TheaterManager", "Admin"));
    options.AddPolicy("MovieManager", policy => policy.RequireRole("MovieManager", "Admin"));
});

// Swagger Config
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1-user", new OpenApiInfo { Title = "User API", Version = "v1" });
    c.SwaggerDoc("v1-facilities-manager", new OpenApiInfo { Title = "facilities-manager API", Version = "v1" });
    c.SwaggerDoc("v1-movie-manager", new OpenApiInfo { Title = "movie-manager API", Version = "v1" });
    c.SwaggerDoc("v1-theater-manager", new OpenApiInfo { Title = "Theater-manager API", Version = "v1" });
    c.SwaggerDoc("v1-admin", new OpenApiInfo { Title = "Admin API", Version = "v1" });
});

// Hangfire
builder.Services.AddHangfire(config => config
    .SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
    .UseSimpleAssemblyNameTypeSerializer()
    .UseRecommendedSerializerSettings()
    .UseSqlServerStorage(
        builder.Configuration.GetConnectionString("HangfireConnection"),
        new SqlServerStorageOptions
        {
            PrepareSchemaIfNecessary = true
        }));

builder.Services.AddHangfireServer();

// Register PendingOrderCancellationJob for DI
builder.Services.AddScoped<PendingOrderCancellationJob>();
builder.Services.AddScoped<Cinema.Application.Interfaces.Booking.IPendingOrderCancellationJob, PendingOrderCancellationJob>();
builder.Services.AddScoped<Cinema.Application.Interfaces.Booking.ISeatLockerNotificationService, Cinema.Api.Hubs.SeatLockerNotificationService>();

var app = builder.Build();

// Migrations & Seed Jobs
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<CinemaDbContext>();
    await dbContext.Database.MigrateAsync();
    await EnsureAuditLogTableAsync(dbContext);

    var scheduleJobsService = scope.ServiceProvider.GetRequiredService<IScheduleJobsService>();
    await scheduleJobsService.SyncSeededJobs();
}

app.UseCors("web");

app.UseLocalizationMiddleware();
app.UseErrorMiddleware();

app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1-user/swagger.json", "User API");
    c.SwaggerEndpoint("/swagger/v1-facilities-manager/swagger.json", "facilities-manager API");
    c.SwaggerEndpoint("/swagger/v1-movie-manager/swagger.json", "movie-manager API");
    c.SwaggerEndpoint("/swagger/v1-theater-manager/swagger.json", "theater-manager API");
    c.SwaggerEndpoint("/swagger/v1-admin/swagger.json", "admin API");
});

app.UseWebSockets();
app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

app.UseHangfireDashboard();

// Register recurring job for auto-canceling pending orders
var recurringJobManager = app.Services.GetRequiredService<IRecurringJobManager>();
recurringJobManager.AddPendingOrderCancellationRecurringJob(intervalMinutes: 5, expireAfterMinutes: 15);

app.MapControllers();

app.Run();

static async Task EnsureAuditLogTableAsync(CinemaDbContext dbContext)
{
    await dbContext.Database.ExecuteSqlRawAsync("""
IF OBJECT_ID(N'[dbo].[AuditLogEntity]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[AuditLogEntity] (
        [AuditLogId] uniqueidentifier NOT NULL,
        [Action] varchar(50) NOT NULL,
        [EntityType] varchar(80) NOT NULL,
        [EntityId] uniqueidentifier NULL,
        [EntityName] nvarchar(300) NOT NULL,
        [Description] nvarchar(1000) NOT NULL,
        [ActorUserId] uniqueidentifier NOT NULL,
        [ActorName] nvarchar(100) NOT NULL,
        [ActorPrimaryRole] varchar(50) NOT NULL,
        [IsAdminAction] bit NOT NULL,
        [CinemaId] uniqueidentifier NULL,
        [CreatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_AuditLogEntity] PRIMARY KEY ([AuditLogId])
    );
END;

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE [name] = N'IX_AuditLogEntity_ActorUserId' AND [object_id] = OBJECT_ID(N'[dbo].[AuditLogEntity]'))
    CREATE INDEX [IX_AuditLogEntity_ActorUserId] ON [dbo].[AuditLogEntity] ([ActorUserId]);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE [name] = N'IX_AuditLogEntity_CinemaId' AND [object_id] = OBJECT_ID(N'[dbo].[AuditLogEntity]'))
    CREATE INDEX [IX_AuditLogEntity_CinemaId] ON [dbo].[AuditLogEntity] ([CinemaId]);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE [name] = N'IX_AuditLogEntity_CreatedAt' AND [object_id] = OBJECT_ID(N'[dbo].[AuditLogEntity]'))
    CREATE INDEX [IX_AuditLogEntity_CreatedAt] ON [dbo].[AuditLogEntity] ([CreatedAt]);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE [name] = N'IX_AuditLogEntity_EntityType_EntityId' AND [object_id] = OBJECT_ID(N'[dbo].[AuditLogEntity]'))
    CREATE INDEX [IX_AuditLogEntity_EntityType_EntityId] ON [dbo].[AuditLogEntity] ([EntityType], [EntityId]);
""");
}
