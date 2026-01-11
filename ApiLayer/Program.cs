
using System.Text;
using Backend.Bootstraps;
using Backend.Shard.Exceptions;
using BussinessLayer.Dtos.Identity_Access;
using BussinessLayer.Factories;
using BussinessLayer.Factories.Identity_access;
using BussinessLayer.Interfaces;
using BussinessLayer.Services.Identity_access;
using BussinessLayer.Use_cases.Identity_access;
using DataAccess;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddDbContext<dbContext>(options => options.UseSqlServer(builder.Configuration.GetConnectionString("DatabaseConnection")));

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

builder.Services.AddServices();
builder.Services.addApplicationFactories();

// Factories Dependency Injections

builder.Services.addRegisterObjectsFactory();

// JWT Config

builder.Services.AddJwt(builder.Configuration);

var app = builder.Build();


app.UseErrorMiddleware();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseAuthentication();

app.UseAuthorization();

app.MapControllers();

app.Run();