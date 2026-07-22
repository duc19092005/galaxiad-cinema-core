using System.Text;
using System.Text.Json;
using Cinema.Domain.Localization;

namespace Cinema.Api.Middlewares;

public class LocalizationMiddleware
{
    private readonly RequestDelegate _next;

    public LocalizationMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task Invoke(HttpContext httpContext)
    {
        // SSE / long-lived streams must write directly to the network.
        // Buffering into MemoryStream would hold frames until the action ends
        // (which for Events/Notifications is often "never" while a job is live).
        if (IsStreamingRequest(httpContext))
        {
            await _next(httpContext);
            return;
        }

        var localizationService = httpContext.RequestServices.GetRequiredService<ILocalizationService>();

        // Capture the original response body
        var originalBodyStream = httpContext.Response.Body;

        using var memoryStream = new MemoryStream();
        httpContext.Response.Body = memoryStream;

        try
        {
            await _next(httpContext);

            // If the action switched to a streaming content type, flush the buffer as-is.
            // (Prefer IsStreamingRequest above; this is a safety net.)
            if (IsStreamingContentType(httpContext.Response.ContentType))
            {
                httpContext.Response.Body = originalBodyStream;
                memoryStream.Seek(0, SeekOrigin.Begin);
                await memoryStream.CopyToAsync(originalBodyStream);
                return;
            }

            // Only translate JSON responses
            if (httpContext.Response.ContentType?.Contains("application/json") == true && !httpContext.Response.HasStarted)
            {
                memoryStream.Seek(0, SeekOrigin.Begin);
                using var reader = new StreamReader(memoryStream, Encoding.UTF8, detectEncodingFromByteOrderMarks: true, bufferSize: 1024, leaveOpen: true);
                var responseBody = await reader.ReadToEndAsync();

                if (!string.IsNullOrEmpty(responseBody))
                {
                    try
                    {
                        var translatedBody = TranslateJsonResponse(responseBody, localizationService);
                        var bytes = Encoding.UTF8.GetBytes(translatedBody);

                        httpContext.Response.Body = originalBodyStream;
                        
                        // Fix content-length mismatch which causes browser protocol/parsing errors
                        httpContext.Response.ContentLength = bytes.Length;
                        
                        await originalBodyStream.WriteAsync(bytes, 0, bytes.Length);
                        return;
                    }
                    catch
                    {
                        // If translation fails, fallback to original
                    }
                }
            }

            // Fallback: write original response if no translation was done
            if (originalBodyStream == httpContext.Response.Body) return; // Already written
            
            httpContext.Response.Body = originalBodyStream;
            memoryStream.Seek(0, SeekOrigin.Begin);
            await memoryStream.CopyToAsync(originalBodyStream);
        }
        finally
        {
            httpContext.Response.Body = originalBodyStream;
        }
    }

    private static bool IsStreamingRequest(HttpContext context)
    {
        var accept = context.Request.Headers.Accept.ToString();
        if (accept.Contains("text/event-stream", StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        var path = context.Request.Path.Value ?? string.Empty;
        return path.EndsWith("/events", StringComparison.OrdinalIgnoreCase)
               || path.EndsWith("/sse", StringComparison.OrdinalIgnoreCase)
               || path.Contains("/stream", StringComparison.OrdinalIgnoreCase)
               || path.Contains("/chat/stream", StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsStreamingContentType(string? contentType) =>
        !string.IsNullOrEmpty(contentType)
        && contentType.Contains("text/event-stream", StringComparison.OrdinalIgnoreCase);

    private static string TranslateJsonResponse(string jsonBody, ILocalizationService localizationService)
    {
        using var document = JsonDocument.Parse(jsonBody);
        using var stream = new MemoryStream();
        using (var writer = new Utf8JsonWriter(stream, new JsonWriterOptions
               {
                   Indented = false,
                   Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping
               }))
        {
            TranslateJsonElement(document.RootElement, writer, localizationService);
        }

        return Encoding.UTF8.GetString(stream.ToArray());
    }

    private static readonly HashSet<string> TranslatableFields = new(StringComparer.OrdinalIgnoreCase)
    {
        "message",
        "errors",
        "response"
    };

    private static void TranslateJsonElement(JsonElement element, Utf8JsonWriter writer,
        ILocalizationService localizationService, string? propertyName = null)
    {
        switch (element.ValueKind)
        {
            case JsonValueKind.Object:
                writer.WriteStartObject();
                foreach (var property in element.EnumerateObject())
                {
                    writer.WritePropertyName(property.Name);
                    TranslateJsonElement(property.Value, writer, localizationService, property.Name);
                }
                writer.WriteEndObject();
                break;

            case JsonValueKind.Array:
                writer.WriteStartArray();
                foreach (var item in element.EnumerateArray())
                {
                    // Translate string items in Errors array
                    if (propertyName != null && 
                        TranslatableFields.Contains(propertyName) && 
                        item.ValueKind == JsonValueKind.String)
                    {
                        var translated = localizationService.Translate(item.GetString()!);
                        writer.WriteStringValue(translated);
                    }
                    else
                    {
                        TranslateJsonElement(item, writer, localizationService);
                    }
                }
                writer.WriteEndArray();
                break;

            case JsonValueKind.String:
                if (propertyName != null && TranslatableFields.Contains(propertyName))
                {
                    var translated = localizationService.Translate(element.GetString()!);
                    writer.WriteStringValue(translated);
                }
                else
                {
                    writer.WriteStringValue(element.GetString());
                }
                break;

            case JsonValueKind.Number:
                if (element.TryGetInt64(out var longVal))
                    writer.WriteNumberValue(longVal);
                else
                    writer.WriteNumberValue(element.GetDouble());
                break;

            case JsonValueKind.True:
                writer.WriteBooleanValue(true);
                break;

            case JsonValueKind.False:
                writer.WriteBooleanValue(false);
                break;

            case JsonValueKind.Null:
                writer.WriteNullValue();
                break;

            default:
                writer.WriteRawValue(element.GetRawText());
                break;
        }
    }
}

public static class LocalizationMiddlewareExtensions
{
    public static IApplicationBuilder UseLocalizationMiddleware(this IApplicationBuilder builder)
    {
        return builder.UseMiddleware<LocalizationMiddleware>();
    }
}
