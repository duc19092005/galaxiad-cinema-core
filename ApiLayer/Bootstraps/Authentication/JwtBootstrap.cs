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
                    OnChallenge = context => throw new UnauthorizeException(null),
                    OnForbidden = context => throw new ForbiddenException(),
                    OnTokenValidated = context => Task.CompletedTask,
                    OnAuthenticationFailed = context => 
                    {
                        if (context.Exception.GetType() == typeof(SecurityTokenExpiredException))
                        {
                            throw new UnauthorizeException("Token has expired");
                        }
                        throw new UnauthorizeException(null);
                    }                
                };
            });
        
        return services;
    }
}
