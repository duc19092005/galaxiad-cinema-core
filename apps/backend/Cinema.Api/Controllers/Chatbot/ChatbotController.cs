using System;
using System.Text.Json;
using System.Threading.Tasks;
using Cinema.Application.Dtos.Chatbot;
using Cinema.Application.UseCases.Chatbot;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Cinema.Api.Controllers.Chatbot;

[ApiController]
[Route("api/chatbot")]
[Route("api/v1/chatbot")]
[Tags("Chatbot - AI Assistant")]
[ApiExplorerSettings(GroupName = "v1-user")]
public class ChatbotController : ControllerBase
{
    private readonly ChatbotOrchestrator _chatbotOrchestrator;
    private static readonly JsonSerializerOptions SseJsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    public ChatbotController(ChatbotOrchestrator chatbotOrchestrator)
    {
        _chatbotOrchestrator = chatbotOrchestrator;
    }

    [HttpPost("chat")]
    [AllowAnonymous]
    public async Task<IActionResult> Chat([FromBody] ChatbotRequestDto request)
    {
        var result = await _chatbotOrchestrator.ExecuteAsync(request);
        return result.IsSuccess ? Ok(result) : BadRequest(result);
    }

    [HttpPost("chat/stream")]
    [AllowAnonymous]
    public async Task ChatStream([FromBody] ChatbotRequestDto request)
    {
        Response.StatusCode = StatusCodes.Status200OK;
        Response.ContentType = "text/event-stream; charset=utf-8";
        Response.Headers.CacheControl = "no-cache";
        Response.Headers.Connection = "keep-alive";
        Response.Headers["X-Accel-Buffering"] = "no";

        try
        {
            await WriteSseAsync("status", new { message = "Đã nhận câu hỏi của bạn..." });

            var result = await _chatbotOrchestrator.ExecuteStreamAsync(
                request,
                status => WriteSseAsync("status", new { message = status }),
                token => WriteSseAsync("token", new { text = token }),
                HttpContext.RequestAborted);

            if (result.IsSuccess)
            {
                await WriteSseAsync("metadata", new
                {
                    result.Data?.Intent,
                    result.Data?.IsAuthorized,
                    result.Data?.ReferencedMovies,
                    result.Data?.ReferencedSchedules
                });
            }
            else
            {
                await WriteSseAsync("error", new { message = result.Message ?? "Không thể xử lý câu hỏi lúc này." });
            }

            await WriteSseAsync("done", new { ok = result.IsSuccess });
        }
        catch (OperationCanceledException)
        {
            // Client disconnected.
        }
        catch
        {
            if (!HttpContext.RequestAborted.IsCancellationRequested)
            {
                await WriteSseAsync("error", new { message = "Chatbot đang bận, bạn thử lại sau ít phút nhé." });
                await WriteSseAsync("done", new { ok = false });
            }
        }
    }

    private async Task WriteSseAsync(string eventName, object? data)
    {
        await Response.WriteAsync($"event: {eventName}\n", HttpContext.RequestAborted);
        await Response.WriteAsync($"data: {JsonSerializer.Serialize(data, SseJsonOptions)}\n\n", HttpContext.RequestAborted);
        await Response.Body.FlushAsync(HttpContext.RequestAborted);
    }
}
