using Cinema.Api.Bootstraps.Admin;
using Cinema.Api.Bootstraps.Authentication;
using Cinema.Api.Bootstraps.Common;
using Cinema.Api.Bootstraps.Facilities;
using Cinema.Api.Bootstraps.IdentityAccess;
using Cinema.Api.Bootstraps.MovieInfos;
using Cinema.Api.Bootstraps.Booking;
using Cinema.Api.Bootstraps.Concessions;
using Cinema.Api.Bootstraps.Validate;
using Cinema.Api.Bootstraps.Chatbot;
using Cinema.Api.Hubs;
using Cinema.Api.Middlewares;
using Cinema.Application.Exceptions;
using Cinema.Infrastructure;
using Cinema.Infrastructure.Identity;
using Hangfire;
using Hangfire.Dashboard;
using Hangfire.SqlServer;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;
using Cinema.Infrastructure.BackgroundJobs;
using Cinema.Infrastructure.BackgroundJobs.Recommendations;
using Cinema.Infrastructure.BackgroundJobs.Bookings;
using Cinema.Infrastructure.BackgroundJobs.Tracking;
using Cinema.Application.Interfaces.IThirdPersonServices;
using Cinema.Application.Abstractions.Security;
using Cinema.Infrastructure.ExternalServices.Security;
using Cinema.Infrastructure.ExternalServices.Jobs;
using Cinema.Infrastructure.ExternalServices.Storage;
using Cinema.Infrastructure.ExternalServices.Notifications;
using Cinema.Domain.Entities.UserInfos;
using Microsoft.AspNetCore.RateLimiting;
using System.Security.Claims;
using System.Threading.RateLimiting;

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
builder.Services.AddSingleton<IEncryptionService, AesEncryptionService>();
builder.Services.AddSingleton<UserIdentityCodeConstant>();
builder.Services.AddHttpContextAccessor();
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddPolicy("ChatbotPolicy", context =>
        RateLimitPartition.GetFixedWindowLimiter(GetRateLimitKey(context), _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = 10,
            Window = TimeSpan.FromMinutes(1),
            QueueLimit = 0,
            QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
            AutoReplenishment = true
        }));

    options.AddPolicy("BookingCreatePolicy", context =>
        RateLimitPartition.GetFixedWindowLimiter(GetRateLimitKey(context), _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = 5,
            Window = TimeSpan.FromMinutes(1),
            QueueLimit = 0,
            QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
            AutoReplenishment = true
        }));

    options.AddPolicy("PaymentCallbackPolicy", context =>
        RateLimitPartition.GetFixedWindowLimiter(GetRateLimitKey(context), _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = 60,
            Window = TimeSpan.FromMinutes(1),
            QueueLimit = 0,
            QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
            AutoReplenishment = true
        }));

    options.AddPolicy("AuthPolicy", context =>
        RateLimitPartition.GetFixedWindowLimiter(GetRateLimitKey(context), _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = 5,
            Window = TimeSpan.FromMinutes(1),
            QueueLimit = 0,
            QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
            AutoReplenishment = true
        }));

    options.AddPolicy("VoucherPolicy", context =>
        RateLimitPartition.GetFixedWindowLimiter(GetRateLimitKey(context), _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = 5,
            Window = TimeSpan.FromMinutes(1),
            QueueLimit = 0,
            QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
            AutoReplenishment = true
        }));

    options.AddPolicy("PublicReadPolicy", context =>
        RateLimitPartition.GetFixedWindowLimiter(GetRateLimitKey(context), _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = 60,
            Window = TimeSpan.FromMinutes(1),
            QueueLimit = 0,
            QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
            AutoReplenishment = true
        }));

    options.AddPolicy("CommentPolicy", context =>
        RateLimitPartition.GetFixedWindowLimiter(GetRateLimitKey(context), _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = 10,
            Window = TimeSpan.FromMinutes(1),
            QueueLimit = 0,
            QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
            AutoReplenishment = true
        }));

    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(context =>
        RateLimitPartition.GetFixedWindowLimiter(
            GetRateLimitKey(context),
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 100,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0
            }));
});

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
builder.Services.AddConcessionAndCleaningServices();

// SignalR for real-time notifications
builder.Services.AddSignalR();

// Background safety net for orphaned vote timers (polls every 15s)
builder.Services.AddHostedService<VoteTimerBackgroundService>();
builder.Services.AddIdentityFactories();
builder.Services.AddFacilitiesFactories();
builder.Services.AddMovieFactories();
builder.Services.AddApplicationFactories();
builder.Services.AddAdminBootstrap();
builder.Services.AddChatbotServices();

builder.Services.AddHostedService<MovieStatusSyncBackgroundService>();
builder.Services.AddHostedService<AiMovieEmbeddingStartupService>();
builder.Services.AddHostedService<MovieViewBufferSyncService>();

// JWT & Cloudinary
builder.Services.AddJwt(builder.Configuration);
builder.Services.AddScoped<IImageStorageService, CloudinaryImageStorageService>();
builder.Services.AddScoped<IBackgroundJobScheduler, HangfireJobSchedulerService>();
builder.Services.TheaterManagerValidate();

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("web", policy =>
    {
        var configuredOrigins = builder.Configuration.GetSection("AllowedOrigins").Get<string[]>() ?? [];
        var allowedOrigins = configuredOrigins
            .Where(origin => !string.IsNullOrWhiteSpace(origin))
            .Select(origin => origin.Trim().TrimEnd('/'))
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        policy.SetIsOriginAllowed(origin =>
            {
                if (string.IsNullOrWhiteSpace(origin)) return false;
                if (!builder.Environment.IsProduction()) return true;
                return allowedOrigins.Contains(origin.Trim().TrimEnd('/'));
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
    options.AddPolicy("WarehouseManager", policy => policy.RequireRole("WarehouseManager", "Admin"));
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
    var startupLogger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("Startup");
    var autoMigrate = app.Configuration.GetValue("Database:AutoMigrate", true);
    if (autoMigrate)
    {
        await dbContext.Database.MigrateAsync();
        await EnsureAuditLogTableAsync(dbContext);
    }
    else
    {
        startupLogger.LogInformation("Database auto-migration is disabled.");
    }

    await NormalizeProductionSeedAccountsAsync(dbContext, app.Environment, app.Configuration, startupLogger);

    var scheduleJobsService = scope.ServiceProvider.GetRequiredService<IScheduleJobsService>();
    await scheduleJobsService.SyncSeededJobs();
}

app.UseRouting();

app.UseCors("web");

app.UseLocalizationMiddleware();
app.UseErrorMiddleware();

app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

// Disable rate limiting in Development/Docker to avoid 429 errors during development, unless explicitly enabled for testing
var envName = app.Environment.EnvironmentName;
var rateLimitTestingMode = app.Configuration.GetValue<bool>("RateLimiting:TestingMode", false);
if ((envName != "Development" && envName != "Docker") || rateLimitTestingMode)
{
    app.UseRateLimiter();
}

if (app.Environment.IsProduction())
{
    app.Use(async (context, next) =>
    {
        if (context.Request.Path.StartsWithSegments("/swagger") && !IsAdmin(context.User))
        {
            context.Response.StatusCode = StatusCodes.Status404NotFound;
            return;
        }

        await next();
    });
}

app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1-user/swagger.json", "User API");
    c.SwaggerEndpoint("/swagger/v1-facilities-manager/swagger.json", "facilities-manager API");
    c.SwaggerEndpoint("/swagger/v1-movie-manager/swagger.json", "movie-manager API");
    c.SwaggerEndpoint("/swagger/v1-theater-manager/swagger.json", "theater-manager API");
    c.SwaggerEndpoint("/swagger/v1-admin/swagger.json", "admin API");
});

app.UseHangfireDashboard("/hangfire", new DashboardOptions
{
    Authorization = app.Environment.IsProduction()
        ? [new AdminDashboardAuthorizationFilter()]
        : []
});

// Register recurring jobs if enabled
var backgroundJobsEnabled = app.Configuration.GetValue<bool>("BackgroundJobs:Enabled", true);
if (backgroundJobsEnabled)
{
    var recurringJobManager = app.Services.GetRequiredService<IRecurringJobManager>();
    recurringJobManager.AddPendingOrderCancellationRecurringJob(intervalMinutes: 5, expireAfterMinutes: 15);
    recurringJobManager.AddBannerCleanupRecurringJob(intervalMinutes: 30);
    recurringJobManager.AddMovieInterestSyncRecurringJob(intervalMinutes: 10);

    // Auto-generate banners for all cinemas on startup + every 6 hours
    var backgroundJobClient = app.Services.GetRequiredService<IBackgroundJobClient>();
    recurringJobManager.AddAutoGenerateBannersJob(backgroundJobClient);
}

// Health checks endpoints for Docker/K8s liveness and readiness probes
app.MapGet("/health/live", () => Results.Ok(new { status = "Live", timestamp = DateTime.UtcNow }));
app.MapGet("/health/ready", async (CinemaDbContext dbContext) =>
{
    try
    {
        var canConnect = await dbContext.Database.CanConnectAsync();
        return canConnect
            ? Results.Ok(new { status = "Ready", database = "Connected", timestamp = DateTime.UtcNow })
            : Results.Problem("Database connection unavailable", statusCode: StatusCodes.Status503ServiceUnavailable);
    }
    catch (Exception ex)
    {
        return Results.Problem($"Readiness check failed: {ex.Message}", statusCode: StatusCodes.Status503ServiceUnavailable);
    }
});

app.MapControllers();
app.MapHub<CinemaHub>("/hubs/cinema");

app.Run();

static string GetRateLimitKey(HttpContext context)
{
    var userId = context.User.FindFirstValue(ClaimTypes.NameIdentifier)
                 ?? context.User.FindFirstValue(ClaimTypes.Sid);
    if (!string.IsNullOrWhiteSpace(userId))
    {
        return $"user:{userId}";
    }

    return $"ip:{context.Connection.RemoteIpAddress?.ToString() ?? "unknown"}";
}

static bool IsAdmin(ClaimsPrincipal user)
{
    return user.Identity?.IsAuthenticated == true && user.IsInRole("Admin");
}

static async Task NormalizeProductionSeedAccountsAsync(
    CinemaDbContext dbContext,
    IHostEnvironment environment,
    IConfiguration configuration,
    ILogger logger)
{
    if (!environment.IsProduction())
    {
        return;
    }

    var productionHash = configuration["SeedAccounts:ProductionManagerPasswordHash"];
    if (string.IsNullOrWhiteSpace(productionHash))
    {
        throw new InvalidOperationException("Missing production seed password hash: SeedAccounts:ProductionManagerPasswordHash.");
    }

    var managerEmails = new[]
    {
        "admin@cinema.com",
        "movie.manager@cinema.com",
        "theater.manager@cinema.com",
        "facilities.manager@cinema.com"
    };

    var users = await dbContext.Set<UserInfoEntity>()
        .Where(user => managerEmails.Contains(user.UserEmail))
        .ToListAsync();

    var changed = 0;
    foreach (var user in users)
    {
        if (user.Password == productionHash)
        {
            continue;
        }

        user.Password = productionHash;
        changed++;
    }

    if (changed > 0)
    {
        await dbContext.SaveChangesAsync();
    }

    logger.LogInformation(
        "Production seed account password normalization completed. Updated {Count} admin/manager account(s).",
        changed);
}

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
