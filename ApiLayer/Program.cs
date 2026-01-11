
using Backend.Shard.Exceptions;
using BussinessLayer.Dtos.Identity_Access;
using BussinessLayer.Factories;
using BussinessLayer.Interfaces;
using BussinessLayer.Services.Identity_access;
using BussinessLayer.Use_cases.Identity_access;
using DataAccess;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

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
builder.Services.AddScoped<register_service>();
builder.Services.AddScoped<register_factory>();

// Factories Dependency Injections

builder.Services.AddScoped<IAddBehavior<regular_register_request_dto, string>, regular_register_use_case>();

var app = builder.Build();


app.UseErrorMiddleware();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseAuthorization();

app.MapControllers();

app.Run();