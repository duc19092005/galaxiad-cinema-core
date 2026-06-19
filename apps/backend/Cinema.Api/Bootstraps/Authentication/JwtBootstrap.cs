using System.Text;
using Cinema.Domain.Exceptions;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;

namespace Cinema.Api.Bootstraps.Authentication;

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
                        
                        var statusCode = 401;
                        var errorCode = "AuthE01";
                        var msg = Cinema.Domain.Localization.Messages.Auth.Unauthorized;

                        // Check if the challenge was caused by an expired token
                        if (context.AuthenticateFailure is SecurityTokenExpiredException)
                        {
                            msg = Cinema.Domain.Localization.Messages.Auth.TokenExpired;
                        }
                        else if (context.Error == "forbidden" || context.Response.StatusCode == 403)
                        {
                            statusCode = 403;
                            msg = Cinema.Domain.Localization.Messages.Auth.Forbidden;
                        }

                        context.Response.StatusCode = statusCode;
                        context.Response.ContentType = "application/json";
                        
                        var response = new {
                            StatusCode = statusCode,
                            ErrorCode = errorCode,
                            Message = msg,
                            Errors = new List<string> { msg },
                            Timestamp = DateTime.UtcNow
                        };
                        
                        await context.Response.WriteAsJsonAsync(response);
                    },
                    OnForbidden = async context => 
                    {
                        // OnForbidden is typically called AFTER OnChallenge or directly if roles don't match
                        context.Response.StatusCode = 403;
                        context.Response.ContentType = "application/json";
                        var response = new {
                            StatusCode = 403,
                            ErrorCode = "AuthE01",
                            Message = Cinema.Domain.Localization.Messages.Auth.Forbidden,
                            Errors = new List<string> { Cinema.Domain.Localization.Messages.Auth.Forbidden },
                            Timestamp = DateTime.UtcNow
                        };
                        await context.Response.WriteAsJsonAsync(response);
                    },
                    OnTokenValidated = context => Task.CompletedTask,
                    OnAuthenticationFailed = context => Task.CompletedTask // Do not block request here
                };
            });
        
        return services;
    }
}
