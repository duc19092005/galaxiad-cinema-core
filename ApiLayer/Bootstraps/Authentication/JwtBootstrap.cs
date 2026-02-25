using System.Text;
using Shared.Exceptions;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;

namespace ApiLayer.Bootstraps.Authentication;

public static class JwtBootstrap
{
    public static IServiceCollection AddJwt(this IServiceCollection services,  IConfiguration configuration)
    {
        services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            })
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters()
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = configuration["JWT_Info:Iss"],
                    ValidAudience = configuration["JWT_Info:Aud"],
                    IssuerSigningKey =
                        new SymmetricSecurityKey(Encoding.UTF8.GetBytes(configuration["JWT_Info:Key"] ?? string.Empty))
                };

                options.Events = new JwtBearerEvents
                {
                    OnMessageReceived = context =>
                    {
                        context.Token = context.Request.Cookies["X-Access-Token"];
                        return Task.CompletedTask;
                    },
                    OnChallenge = async context => 
                    {
                        context.HandleResponse();
                        context.Response.StatusCode = 401;
                        context.Response.ContentType = "application/json";
                        var response = new {
                            StatusCode = 401,
                            ErrorCode = "AuthE01",
                            Message = Shared.Localization.Messages.Auth.Unauthorized,
                            Errors = new List<string> { Shared.Localization.Messages.Auth.Unauthorized },
                            Timestamp = DateTime.Now
                        };
                        await context.Response.WriteAsJsonAsync(response);
                    },
                    OnForbidden = async context => 
                    {
                        context.Response.StatusCode = 403;
                        context.Response.ContentType = "application/json";
                        var response = new {
                            StatusCode = 403,
                            ErrorCode = "AuthE01",
                            Message = Shared.Localization.Messages.Auth.Forbidden,
                            Errors = new List<string> { Shared.Localization.Messages.Auth.Forbidden },
                            Timestamp = DateTime.Now
                        };
                        await context.Response.WriteAsJsonAsync(response);
                    },
                    OnTokenValidated = context => Task.CompletedTask,
                    OnAuthenticationFailed = async context => 
                    {
                        context.Response.StatusCode = 401;
                        context.Response.ContentType = "application/json";
                        var isExpired = context.Exception.GetType() == typeof(SecurityTokenExpiredException);
                        var msg = isExpired ? Shared.Localization.Messages.Auth.TokenExpired : Shared.Localization.Messages.Auth.Unauthorized;
                        var response = new {
                            StatusCode = 401,
                            ErrorCode = "AuthE01",
                            Message = msg,
                            Errors = new List<string> { msg },
                            Timestamp = DateTime.Now
                        };
                        await context.Response.WriteAsJsonAsync(response);
                    }                
                };
            });
        
        return services;
    }
}
