// ReSharper disable All

using System.Text;
using Backend.Shard.Exceptions;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;

namespace Backend.Bootstraps.AuthBootstrap;

public static class jwt_bootstrap
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
                    OnChallenge = context => { throw new app_exception("Authentication failed", 401, "AUTH05"); },
                    OnForbidden = context => { throw new app_exception("Forbidden", 403, "AUTH03"); },
                    OnTokenValidated = context => { return Task.CompletedTask; },
                    OnAuthenticationFailed = context => 
                    {
                        if (context.Exception.GetType() == typeof(SecurityTokenExpiredException))
                        {
                            throw new app_exception("Token has expired", 401, "AUTH04");
                        }
                        throw new app_exception("Authentication failed", 401, "AUTH05");
                    }                
                };
            });
        
        return services;
    }
}