using System.Security.Claims;
using System.Text.Json;
using Cinema.Application.Dtos;
using Cinema.Application.Dtos.AiResearch;
using Cinema.Application.Interfaces.AiResearch;
using Cinema.Infrastructure.ExternalServices.Ai;
using Hangfire;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Cinema.Api.Controllers.Admin;

[ApiController]
[Authorize(Roles = "Admin,TheaterManager")]
[Route("api/v1/admin/ai-research/jobs")]
[Tags("Admin - AI Business Research")]
[ApiExplorerSettings(GroupName = "v1-admin")]
public sealed class AiResearchController : ControllerBase
{
    private static readonly JsonSerializerOptions SseJsonOptions = new(JsonSerializerDefaults.Web);
    private readonly IAiResearchService _service;
    private readonly IBackgroundJobClient _backgroundJobs;

    public AiResearchController(IAiResearchService service, IBackgroundJobClient backgroundJobs)
    {
        _service = service;
        _backgroundJobs = backgroundJobs;
    }

    [HttpPost]
    public async Task<IActionResult> Create(
        [FromBody] CreateAiResearchJobRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var job = await _service.CreateAsync(request, GetUserId(), cancellationToken);
            _backgroundJobs.Enqueue<AiResearchService>(runner => runner.RunAsync(job.JobId));
            return Accepted(new BaseResponse<AiResearchJobSummaryDto>
            {
                IsSuccess = true,
                Message = "AI research job created.",
                Data = job
            });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new BaseResponse<object>
            {
                IsSuccess = false,
                Message = ex.Message
            });
        }
    }

    [HttpGet]
    public async Task<IActionResult> List(CancellationToken cancellationToken)
    {
        var jobs = await _service.ListAsync(GetUserId(), User.IsInRole("Admin"), cancellationToken);
        return Ok(new BaseResponse<IReadOnlyList<AiResearchJobSummaryDto>>
        {
            IsSuccess = true,
            Message = "Success",
            Data = jobs
        });
    }

    [HttpGet("{jobId:guid}")]
    public async Task<IActionResult> Get(Guid jobId, CancellationToken cancellationToken)
    {
        var job = await _service.GetAsync(jobId, GetUserId(), User.IsInRole("Admin"), cancellationToken);
        return job is null
            ? NotFound(new BaseResponse<object> { IsSuccess = false, Message = "Research job not found." })
            : Ok(new BaseResponse<AiResearchJobDetailDto> { IsSuccess = true, Message = "Success", Data = job });
    }

    [HttpPost("{jobId:guid}/cancel")]
    public async Task<IActionResult> Cancel(Guid jobId, CancellationToken cancellationToken)
    {
        var cancelled = await _service.CancelAsync(jobId, GetUserId(), User.IsInRole("Admin"), cancellationToken);
        return cancelled
            ? Ok(new BaseResponse<object> { IsSuccess = true, Message = "Research job cancelled." })
            : BadRequest(new BaseResponse<object> { IsSuccess = false, Message = "Job cannot be cancelled." });
    }

    [HttpGet("{jobId:guid}/events")]
    public async Task Events(Guid jobId, [FromQuery] long afterEventId = 0)
    {
        Response.StatusCode = StatusCodes.Status200OK;
        Response.ContentType = "text/event-stream; charset=utf-8";
        Response.Headers.CacheControl = "no-cache, no-transform";
        Response.Headers.Connection = "keep-alive";
        Response.Headers["X-Accel-Buffering"] = "no";

        // Prevent Kestrel/middleware from buffering SSE frames.
        var bufferingFeature = HttpContext.Features.Get<Microsoft.AspNetCore.Http.Features.IHttpResponseBodyFeature>();
        bufferingFeature?.DisableBuffering();

        var lastEventId = afterEventId;
        var lastHeartbeatAt = DateTime.UtcNow;
        var idleRounds = 0;
        try
        {
            // Immediate hello so the client can show "connected" without waiting for the first DB poll.
            await Response.WriteAsync("event: connected\n", HttpContext.RequestAborted);
            await Response.WriteAsync(
                $"data: {JsonSerializer.Serialize(new { jobId, status = "connected", message = "SSE connected" }, SseJsonOptions)}\n\n",
                HttpContext.RequestAborted);
            await Response.Body.FlushAsync(HttpContext.RequestAborted);

            while (!HttpContext.RequestAborted.IsCancellationRequested)
            {
                var events = await _service.GetEventsAfterAsync(
                    jobId,
                    lastEventId,
                    GetUserId(),
                    User.IsInRole("Admin"),
                    HttpContext.RequestAborted);
                if (events.Count == 0)
                {
                    idleRounds++;
                }
                else
                {
                    idleRounds = 0;
                }

                foreach (var item in events)
                {
                    lastEventId = item.EventId;
                    // Payload is already a JSON object (JsonElement). Write raw text to avoid double-encoding quirks.
                    var dataJson = item.Payload.ValueKind is JsonValueKind.Object or JsonValueKind.Array
                        ? item.Payload.GetRawText()
                        : JsonSerializer.Serialize(item.Payload, SseJsonOptions);
                    await Response.WriteAsync($"id: {item.EventId}\n", HttpContext.RequestAborted);
                    await Response.WriteAsync($"event: {item.EventType}\n", HttpContext.RequestAborted);
                    await Response.WriteAsync($"data: {dataJson}\n\n", HttpContext.RequestAborted);
                    await Response.Body.FlushAsync(HttpContext.RequestAborted);
                    if (item.EventType is "done" or "failed" or "cancelled")
                    {
                        return;
                    }
                }

                if ((DateTime.UtcNow - lastHeartbeatAt).TotalSeconds >= 10)
                {
                    await Response.WriteAsync($": heartbeat {DateTime.UtcNow:O}\n\n", HttpContext.RequestAborted);
                    await Response.Body.FlushAsync(HttpContext.RequestAborted);
                    lastHeartbeatAt = DateTime.UtcNow;
                }

                // Poll faster while the pipeline is active; ease off after long idle.
                var delayMs = idleRounds > 40 ? 1500 : 400;
                await Task.Delay(delayMs, HttpContext.RequestAborted);
            }
        }
        catch (OperationCanceledException)
        {
            // Client disconnected.
        }
    }

    private Guid GetUserId()
    {
        var raw = User.FindFirstValue(ClaimTypes.NameIdentifier)
                  ?? User.FindFirstValue(ClaimTypes.Sid);
        if (!Guid.TryParse(raw, out var userId))
        {
            throw new UnauthorizedAccessException("Authenticated user id is missing.");
        }
        return userId;
    }
}
