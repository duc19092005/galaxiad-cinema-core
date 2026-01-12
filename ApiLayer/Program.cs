using Backend.Bootstraps;
using Backend.Shard.Exceptions;
using DataAccess;
using DataAccess.Constants;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddSingleton<user_identity_code_constant>();

builder.Services.AddHttpContextAccessor();


// DB Context

builder.Services.AddDbContext<dbContext>(options => options.UseSqlServer(builder.Configuration.GetConnectionString("DatabaseConnection")));

// Custom Error Message API Response

builder.Services.Configure<ApiBehaviorOptions>(options =>
{
    options.InvalidModelStateResponseFactory = context =>
    {
        var firstError = context.ModelState.Values
            .SelectMany(v => v.Errors)
            .Select(e => e.ErrorMessage)
            .FirstOrDefault();
        
        throw new app_exception(firstError ?? "Missing One or more Fields", 400, "Validation error");
    };
});

// Services

builder.Services.AddServices();

// Factories Dependency Injections

builder.Services.addRegisterObjectsFactory();
builder.Services.addWriteObjectsFactory();
builder.Services.addApplicationFactories();
builder.Services.addReadObjectsFactoryFacilitiesManager();

// JWT Config

builder.Services.AddJwt(builder.Configuration);

// CORS

builder.Services.AddCors(options =>
{
    options.AddPolicy(name: "web",
        policy =>
        {
            policy.WithOrigins("https://www.example.com", 
                    "http://localhost:5174") 
                .AllowAnyHeader()
                .AllowAnyMethod();
        });
});

// Policy

builder.Services.AddAuthorization
(options =>
    options.AddPolicy("FacilitiesManager", policy =>
        policy.RequireRole("FacilitiesManager")));

// Swagger Document

builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1-user", new OpenApiInfo { Title = "User API", Version = "v1" });
    c.SwaggerDoc("v1-facilities-manager", new OpenApiInfo { Title = "facilities-manager API", Version = "v1" });
});

var app = builder.Build();

// Singleton


app.UseErrorMiddleware();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1-user/swagger.json", "User API");
        c.SwaggerEndpoint("/swagger/v1-facilities-manager/swagger.json", "facilities-manager API");
    });
}

app.UseCors("web");

app.UseHttpsRedirection();

app.UseAuthentication();

app.UseAuthorization();

app.MapControllers();

app.Run();