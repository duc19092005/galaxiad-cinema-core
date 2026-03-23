using ApiLayer.Bootstraps.Admin;
using ApiLayer.Bootstraps.Authentication;
using ApiLayer.Bootstraps.Common;
using ApiLayer.Bootstraps.Facilities;
using ApiLayer.Bootstraps.IdentityAccess;
using ApiLayer.Bootstraps.MovieInfos;
using ApiLayer.Bootstraps.Booking;
using ApiLayer.Bootstraps.Validate;
using ApiLayer.Hubs;
using ApiLayer.Middlewares;
using Shared.Exceptions;
using DataAccess;
using DataAccess.Constants;
using Hangfire;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;
using BusinessLayer.Services.ThirdPersonServices;

var builder = WebApplication.CreateBuilder(args);

// --- SERVICES CONTAINER ---

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
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

// JWT & Cloudinary
builder.Services.AddJwt(builder.Configuration);
builder.Services.AddSingleton<cloudinaryHelper>();
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
    options.AddPolicy("FacilitiesManager", policy => policy.RequireRole("FacilitiesManager"));
    options.AddPolicy("Admin" , policy => policy.RequireRole("Admin"));
    options.AddPolicy("TheaterManager", policy => policy.RequireRole("TheaterManager"));
    options.AddPolicy("MovieManager", policy => policy.RequireRole("MovieManager"));
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

// Hangfire & SignalR
builder.Services.AddHangfire(config => config
    .SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
    .UseSimpleAssemblyNameTypeSerializer()
    .UseRecommendedSerializerSettings()
    .UseSqlServerStorage(builder.Configuration.GetConnectionString("HangfireConnection")));

builder.Services.AddHangfireServer();

builder.Services.AddSignalR();

var app = builder.Build();

app.UseCors("web");

app.UseErrorMiddleware();
app.UseLocalizationMiddleware();

app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1-user/swagger.json", "User API");
    c.SwaggerEndpoint("/swagger/v1-facilities-manager/swagger.json", "facilities-manager API");
    c.SwaggerEndpoint("/swagger/v1-movie-manager/swagger.json", "movie-manager API");
    c.SwaggerEndpoint("/swagger/v1-theater-manager/swagger.json", "theater-manager API");
    c.SwaggerEndpoint("/swagger/v1-admin/swagger.json", "admin API");
});

app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

app.UseHangfireDashboard();

app.MapControllers();
app.MapHub<SeatHub>("/ws/seat");

// Migrations & Seed Jobs
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<CinemaDbContext>();
    await dbContext.Database.MigrateAsync();

    var scheduleJobsService = scope.ServiceProvider.GetRequiredService<BusinessLayer.Services.ApplicationServices.IScheduleJobsService>();
    await scheduleJobsService.SyncSeededJobs();
}

app.Run();