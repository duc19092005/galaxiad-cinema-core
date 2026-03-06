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

// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddSingleton<UserIdentityCodeConstant>();

builder.Services.AddHttpContextAccessor();


// DB Context

builder.Services.AddDbContext<CinemaDbContext>(options => options.UseSqlServer(builder.Configuration.GetConnectionString("DatabaseConnection")));

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

// Services


builder.Services.AddCommonServices();


builder.Services.AddIdentityServices();
builder.Services.AddFacilitiesServices();
builder.Services.AddMovieServices();
builder.Services.AddBookingServices();

//  -------------------- Factories Dependency Injections ----------------------------

//  ----------------------- Identity Access

builder.Services.AddIdentityFactories();

builder.Services.AddFacilitiesFactories();

builder.Services.AddMovieFactories();

builder.Services.AddApplicationFactories();

builder.Services.AddAdminBootstrap();

// JWT Config

builder.Services.AddJwt(builder.Configuration);

builder.Services.AddSingleton<cloudinaryHelper>();

builder.Services.TheaterManagerValidate();

// CORS

builder.Services.AddCors(options =>
{
    options.AddPolicy("web", policy =>
    {
        policy.WithOrigins("http://localhost:5173") 
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

// Policy

builder.Services.AddAuthorization
(options =>
    options.AddPolicy("FacilitiesManager", policy =>
        policy.RequireRole("FacilitiesManager")));

builder.Services.AddAuthorization(options => 
    options.AddPolicy("Admin" , policy => policy.RequireRole("Admin")));

builder.Services.AddAuthorization
(options =>
    options.AddPolicy("TheaterManager", policy =>
        policy.RequireRole("TheaterManager")));

builder.Services.AddAuthorization
(options =>
    options.AddPolicy("MovieManager", policy =>
        policy.RequireRole("MovieManager")));

// Swagger Document

builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1-user", new OpenApiInfo { Title = "User API", Version = "v1" });
    c.SwaggerDoc("v1-facilities-manager", new OpenApiInfo { Title = "facilities-manager API", Version = "v1" });
    c.SwaggerDoc("v1-movie-manager", new OpenApiInfo { Title = "movie-manager API", Version = "v1" });
    c.SwaggerDoc("v1-theater-manager", new OpenApiInfo { Title = "Theater-manager API", Version = "v1" });
    c.SwaggerDoc("v1-admin", new OpenApiInfo { Title = "Admin API", Version = "v1" });
});

builder.Services.AddHangfire(config => config
    .SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
    .UseSimpleAssemblyNameTypeSerializer()
    .UseRecommendedSerializerSettings()
    .UseSqlServerStorage(builder.Configuration.GetConnectionString("HangfireConnection")));

builder.Services.AddSignalR();

var app = builder.Build();

// Singleton
app.UseCors("web");

app.UseErrorMiddleware();

app.UseLocalizationMiddleware();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1-user/swagger.json", "User API");
        c.SwaggerEndpoint("/swagger/v1-facilities-manager/swagger.json", "facilities-manager API");
        c.SwaggerEndpoint("/swagger/v1-movie-manager/swagger.json", "movie-manager API");
        c.SwaggerEndpoint("/swagger/v1-theater-manager/swagger.json", "theater-manager API");
        c.SwaggerEndpoint("/swagger/v1-admin/swagger.json", "admin API");
    });
}


app.UseHttpsRedirection();

app.UseAuthentication();

app.UseAuthorization();

app.UseHangfireDashboard();

app.MapControllers();

app.MapHub<SeatHub>("/ws/seat");

app.Run();

