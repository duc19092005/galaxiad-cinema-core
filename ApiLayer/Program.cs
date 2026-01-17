using Backend.Bootstraps;
using Backend.Bootstraps.FactoryBootstrap;
using Backend.Bootstraps.AuthBootstrap;
using Backend.Bootstraps.FactoryBootstrap.Facilities_manager;
using Backend.Bootstraps.FactoryBootstrap.Identity_access;
using Backend.Bootstraps.FactoryBootstrap.Movie_Manager;
using Backend.Shard.Exceptions;
using DataAccess;
using DataAccess.Constants;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;
using Backend.Bootstraps.ServiceBootstrap;
using Shared.Ultis;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddSingleton<user_identity_code_constant>();

builder.Services.AddHttpContextAccessor();


// DB Context

builder.Services.AddDbContext<cinemaDbContext>(options => options.UseSqlServer(builder.Configuration.GetConnectionString("DatabaseConnection")));

// Custom Error Message API Response

builder.Services.Configure<ApiBehaviorOptions>(options =>
{
    options.InvalidModelStateResponseFactory = context =>
    {
        var firstError = context.ModelState.Values
            .SelectMany(v => v.Errors)
            .Select(e => e.ErrorMessage)
            .FirstOrDefault();
        
        throw new appException(firstError ?? "Missing One or more Fields", 400, "Validation error");
    };
});

// Services

builder.Services.AddServices();

//  -------------------- Factories Dependency Injections ----------------------------

//  ----------------------- Identity Access

builder.Services.AddRegisterFactory();

builder.Services.LoginFactoryBootstrap();

builder.Services.AddApplicationFactories();

builder.Services.AddReadObjectsFactoryFacilitiesManager();

builder.Services.FacilitiesManagerCinemaAddWriteFactory();

builder.Services.MovieManagerWriteFactory();

builder.Services.MovieManagerReadMovieFactory();

// JWT Config

builder.Services.AddJwt(builder.Configuration);

builder.Services.AddSingleton<cloudinaryHelper>();


// CORS

builder.Services.AddCors(options =>
{
    options.AddPolicy("web", policy =>
    {
        policy.WithOrigins("http://localhost:5173") // Không được để "*"
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials() // Bắt buộc cho "include" credentials
            .SetPreflightMaxAge(TimeSpan.FromMinutes(10)); // Cache kết quả check CORS
    });
});

// Policy

builder.Services.AddAuthorization
(options =>
    options.AddPolicy("FacilitiesManager", policy =>
        policy.RequireRole("FacilitiesManager")));

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
});

var app = builder.Build();

// Singleton
app.UseCors("web");


app.UseErrorMiddleware();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1-user/swagger.json", "User API");
        c.SwaggerEndpoint("/swagger/v1-facilities-manager/swagger.json", "facilities-manager API");
        c.SwaggerEndpoint("/swagger/v1-movie-manager/swagger.json", "movie-manager API");
    });
}


app.UseHttpsRedirection();

app.UseAuthentication();

app.UseAuthorization();

app.MapControllers();

app.Run();