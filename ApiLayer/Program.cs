using Backend.Bootstraps;
using Backend.Shard.Exceptions;
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

builder.Services.AddServices();
builder.Services.addApplicationFactories();

// Factories Dependency Injections

builder.Services.addRegisterObjectsFactory();

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

var app = builder.Build();


app.UseErrorMiddleware();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("web");

app.UseHttpsRedirection();

app.UseAuthentication();

app.UseAuthorization();

app.MapControllers();

app.Run();