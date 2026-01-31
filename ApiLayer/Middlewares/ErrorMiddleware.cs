// ReSharper disable All

using System.Net;
using System.Text.Json;
using ApiLayer.Middlewares;
using Shared.Exceptions;

namespace ApiLayer.Middlewares
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
            List<string> errors = new List<string>();

            if (exception is AppException appEx)
            {
                statusCode = appEx.StatusCode;
                errorCode = appEx.ErrorCode;
                message = exception.Message;
                errors = appEx.Errors ?? new List<string> { exception.Message };
            }
            else
            {
                _logger.LogError(exception, "Unhandled Exception: {Message}", exception.Message);
                
                if (_environment.IsDevelopment())
                {
                    message = exception.Message;
                    errors = new List<string> { exception.Message };
                }
                else
                {
                    errors = new List<string> { message };
                }
            }

            context.Response.StatusCode = statusCode;

            var response = new
            {
                StatusCode = statusCode,
                ErrorCode = errorCode,
                Message = message, 
                Errors = errors,  
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

