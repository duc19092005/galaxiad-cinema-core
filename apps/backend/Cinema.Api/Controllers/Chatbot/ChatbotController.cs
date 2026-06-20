using System.Threading.Tasks;
using Cinema.Application.Dtos.Chatbot;
using Cinema.Application.UseCases.Chatbot;
using Microsoft.AspNetCore.Authorization;
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
}
