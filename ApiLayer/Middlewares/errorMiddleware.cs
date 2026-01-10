using System.Net;
using System.Text.Json;
using Backend.Exceptions;
using Backend.Middlewares;

namespace Backend.Middlewares
{
    public class errorMiddleware
    {
        private readonly RequestDelegate _next;
        
        private readonly ILogger<errorMiddleware> _logger;
        
        private readonly IHostEnvironment _environment;

        public errorMiddleware(RequestDelegate next , ILogger<errorMiddleware> logger , IHostEnvironment environment)
        {
            _next = next;
            _logger = logger;
            _environment = environment;
        }

        public async Task Invoke(HttpContext httpContext)
        {
            try
            {
                await _next(httpContext);
            }
            catch(Exception ex)
            {
                await HandleExceptionAsync(httpContext, ex);
            }
        }
        
        private async Task HandleExceptionAsync(HttpContext context, Exception exception)
        {
            context.Response.ContentType = "application/json";
            
            int statusCode = (int)HttpStatusCode.InternalServerError;
            string errorCode = "INTERNAL_SERVER_ERROR";
            string message = "Đã có lỗi hệ thống xảy ra.";

            if (exception is app_exception appEx)
            {
                statusCode = appEx.statusCode;
                errorCode = appEx.errorCode;
                message = exception.Message;
            }
            else
            {
                _logger.LogError(exception, "Unhandled Exception: {Message}", exception.Message);
                
                if (_environment.IsDevelopment())
                {
                    message = exception.Message;
                }
            }

            context.Response.StatusCode = statusCode;

            var response = new
            {
                StatusCode = statusCode,
                ErrorCode = errorCode,
                Message = message,
                Timestamp = DateTime.Now
            };

            await context.Response.WriteAsJsonAsync(response);
        }
    }
    }

    // Extension method used to add the middleware to the HTTP request pipeline.
    public static class ErrorMiddlewareExtensions
    {
        public static IApplicationBuilder UseErrorMiddleware(this IApplicationBuilder builder)
        {
            return builder.UseMiddleware<errorMiddleware>();
        }
    }