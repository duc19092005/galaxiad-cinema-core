using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Chatbot;
using Cinema.Application.Interfaces;
using Cinema.Application.Interfaces.Chatbot;
using Cinema.Domain.Constants;
using Cinema.Application.Constants;
using Cinema.Domain.Localization;

namespace Cinema.Application.UseCases.Chatbot;

public class ChatbotOrchestrator
{
    private readonly IChatIntentClassifier _intentClassifier;
    private readonly IChatPolicyService _policyService;
    private readonly IChatToolRegistry _toolRegistry;
    private readonly IChatLlmClient _llmClient;
    private readonly IUserContextService _userContextService;

    public ChatbotOrchestrator(
        IChatIntentClassifier intentClassifier,
        IChatPolicyService policyService,
        IChatToolRegistry toolRegistry,
        IChatLlmClient llmClient,
        IUserContextService userContextService)
    {
        _intentClassifier = intentClassifier;
        _policyService = policyService;
        _toolRegistry = toolRegistry;
        _llmClient = llmClient;
        _userContextService = userContextService;
    }

    public async Task<BaseResponse<ChatbotResponseDto>> ExecuteAsync(ChatbotRequestDto requestDto)
    {
        if (string.IsNullOrWhiteSpace(requestDto.Message))
        {
            return new BaseResponse<ChatbotResponseDto>
            {
                IsSuccess = false,
                Message = Messages.Chatbot.MessageRequired
            };
        }

        try
        {
            // 0. Kiểm tra an toàn ngôn ngữ qua Python /guard
            var guardResult = await _llmClient.CheckMessageSafetyAsync(requestDto.Message);
            if (guardResult.IsBlocked)
            {
                return new BaseResponse<ChatbotResponseDto>
                {
                    IsSuccess = true,
                    Data = new ChatbotResponseDto
                    {
                        Response     = guardResult.Reason,
                        Intent       = "Blocked",
                        IsAuthorized = false
                    }
                };
            }

            var (userRoles, userId) = GetCurrentUserContext();
            var sessionId = requestDto.SessionId ?? (userId != "N/A" ? userId : Guid.NewGuid().ToString());

            // 1. Phân loại ý định (Intent Classification)
            var intentResult = await _intentClassifier.ClassifyIntentAsync(requestDto.Message);

            // 2. Tìm và thực thi tool trong C# để lấy thông tin DB làm toolContext
            string toolContext = string.Empty;
            if (intentResult != null && !string.IsNullOrEmpty(intentResult.Intent))
            {
                var tool = _toolRegistry.GetTool(intentResult.Intent);
                if (tool != null)
                {
                    try
                    {
                        toolContext = await tool.ExecuteAsync(intentResult.Parameters);
                    }
                    catch (Exception toolEx)
                    {
                        Console.WriteLine($"Error executing chatbot tool {intentResult.Intent}: {toolEx}");
                    }
                }
            }

            // Gửi trực tiếp tin nhắn sang LangChain Agent ở dịch vụ Python AI
            var assistantResponse = await _llmClient.SendChatRequestAsync(
                requestDto.Message, 
                toolContext, 
                userRoles, 
                userId, 
                sessionId
            );

            // Trích xuất movies và schedules được nhắc đến trong câu trả lời từ context
            var referencedMovies = ExtractMoviesFromContext(toolContext, assistantResponse);
            var referencedSchedules = ExtractSchedulesFromContext(toolContext);

            return new BaseResponse<ChatbotResponseDto>
            {
                IsSuccess = true,
                Data = new ChatbotResponseDto
                {
                    Response = assistantResponse,
                    Intent = intentResult?.Intent ?? "AgentChat",
                    IsAuthorized = true,
                    ReferencedMovies = referencedMovies,
                    ReferencedSchedules = referencedSchedules
                }
            };
        }
        catch (Exception ex)
        {
            Console.WriteLine("CHATBOT ERROR: " + ex);
            return new BaseResponse<ChatbotResponseDto>
            {
                IsSuccess = true,
                Data = new ChatbotResponseDto
                {
                    Response = ChatbotResponseMessages.Refusals.SystemError,
                    Intent = "Error",
                    IsAuthorized = true
                }
            };
        }
    }

    public async Task<BaseResponse<ChatbotResponseDto>> ExecuteStreamAsync(
        ChatbotRequestDto requestDto,
        Func<string, Task> onStatus,
        Func<string, Task> onToken,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(requestDto.Message))
        {
            return new BaseResponse<ChatbotResponseDto>
            {
                IsSuccess = false,
                Message = Messages.Chatbot.MessageRequired
            };
        }

        try
        {
            await onStatus("Đang kiểm tra an toàn...");
            var guardResult = await _llmClient.CheckMessageSafetyAsync(requestDto.Message);
            if (guardResult.IsBlocked)
            {
                await onToken(guardResult.Reason);
                return new BaseResponse<ChatbotResponseDto>
                {
                    IsSuccess = true,
                    Data = new ChatbotResponseDto
                    {
                        Response = guardResult.Reason,
                        Intent = "Blocked",
                        IsAuthorized = false
                    }
                };
            }

            await onStatus("Phân loại ý định...");
            var intentResult = await _intentClassifier.ClassifyIntentAsync(requestDto.Message);

            string toolContext = string.Empty;
            if (intentResult != null && !string.IsNullOrEmpty(intentResult.Intent))
            {
                await onStatus($"Đang tìm kiếm thông tin: {intentResult.Intent}...");
                var tool = _toolRegistry.GetTool(intentResult.Intent);
                if (tool != null)
                {
                    try
                    {
                        toolContext = await tool.ExecuteAsync(intentResult.Parameters);
                    }
                    catch (Exception toolEx)
                    {
                        Console.WriteLine($"Error executing chatbot tool {intentResult.Intent}: {toolEx}");
                    }
                }
            }

            var (userRoles, userId) = GetCurrentUserContext();
            var sessionId = requestDto.SessionId ?? (userId != "N/A" ? userId : Guid.NewGuid().ToString());

            await onStatus("AI đang xử lý yêu cầu...");

            var responseBuilder = new StringBuilder();
            await foreach (var token in _llmClient.StreamChatRequestAsync(
                requestDto.Message,
                toolContext,
                userRoles,
                userId,
                sessionId,
                cancellationToken))
            {
                responseBuilder.Append(token);
                await onToken(token);
            }

            var assistantResponse = responseBuilder.ToString();

            // Trích xuất movies và schedules được nhắc đến trong câu trả lời từ context
            var referencedMovies = ExtractMoviesFromContext(toolContext, assistantResponse);
            var referencedSchedules = ExtractSchedulesFromContext(toolContext);

            return new BaseResponse<ChatbotResponseDto>
            {
                IsSuccess = true,
                Data = new ChatbotResponseDto
                {
                    Response = assistantResponse,
                    Intent = intentResult?.Intent ?? "AgentChat",
                    IsAuthorized = true,
                    ReferencedMovies = referencedMovies,
                    ReferencedSchedules = referencedSchedules
                }
            };
        }
        catch (Exception ex)
        {
            Console.WriteLine("CHATBOT STREAM ERROR: " + ex);
            await onToken(ChatbotResponseMessages.Refusals.SystemError);
            return new BaseResponse<ChatbotResponseDto>
            {
                IsSuccess = true,
                Data = new ChatbotResponseDto
                {
                    Response = ChatbotResponseMessages.Refusals.SystemError,
                    Intent = "Error",
                    IsAuthorized = true
                }
            };
        }
    }


    private (string UserRoles, string UserId) GetCurrentUserContext()
    {
        string userRoles = "Guest (Chưa đăng nhập)";
        string userId = "N/A";
        try
        {
            var guid = _userContextService.GetUserId();
            if (guid != Guid.Empty)
            {
                userId = guid.ToString();
                var roles = new List<string>();
                if (_userContextService.IsInRole("Admin")) roles.Add("Admin");
                if (_userContextService.IsInRole("TheaterManager")) roles.Add("TheaterManager");
                if (_userContextService.IsInRole("FacilitiesManager")) roles.Add("FacilitiesManager");
                if (_userContextService.IsInRole("MovieManager")) roles.Add("MovieManager");
                if (_userContextService.IsInRole("Cashier")) roles.Add("Cashier");
                if (roles.Count == 0) roles.Add("Customer");
                userRoles = string.Join(", ", roles);
            }
        }
        catch
        {
            // Guest user
        }

        return (userRoles, userId);
    }

    private List<ReferencedMovieDto> ExtractMoviesFromContext(string jsonContext, string llmResponse)
    {
        var referencedMovies = new List<ReferencedMovieDto>();
        if (string.IsNullOrWhiteSpace(jsonContext) || string.IsNullOrWhiteSpace(llmResponse))
        {
            return referencedMovies;
        }

        try
        {
            using var doc = JsonDocument.Parse(jsonContext);
            var foundMovies = new Dictionary<string, string>(); // MovieId -> MovieName
            
            FindMoviesInJson(doc.RootElement, foundMovies);

            foreach (var kvp in foundMovies)
            {
                var movieId = kvp.Key;
                var movieName = kvp.Value;

                // Check if the movie name is mentioned in the LLM's response (case-insensitive)
                if (llmResponse.Contains(movieName, StringComparison.OrdinalIgnoreCase))
                {
                    referencedMovies.Add(new ReferencedMovieDto
                    {
                        MovieId = movieId,
                        MovieName = movieName
                    });
                }
            }
        }
        catch
        {
            // Ignore JSON parsing errors from toolContext
        }

        return referencedMovies;
    }

    private void FindMoviesInJson(JsonElement element, Dictionary<string, string> foundMovies)
    {
        if (element.ValueKind == JsonValueKind.Array)
        {
            foreach (var item in element.EnumerateArray())
            {
                FindMoviesInJson(item, foundMovies);
            }
        }
        else if (element.ValueKind == JsonValueKind.Object)
        {
            string id = string.Empty;
            string name = string.Empty;

            foreach (var prop in element.EnumerateObject())
            {
                var propName = prop.Name.ToLower();
                if (propName == "movieid" && prop.Value.ValueKind == JsonValueKind.String)
                {
                    id = prop.Value.GetString() ?? string.Empty;
                }
                else if (propName == "moviename" && prop.Value.ValueKind == JsonValueKind.String)
                {
                    name = prop.Value.GetString() ?? string.Empty;
                }
                else
                {
                    // Recurse into nested structures
                    FindMoviesInJson(prop.Value, foundMovies);
                }
            }

            if (!string.IsNullOrWhiteSpace(id) && !string.IsNullOrWhiteSpace(name))
            {
                foundMovies[id] = name;
            }
        }
    }
    private List<ReferencedScheduleDto> ExtractSchedulesFromContext(string jsonContext)
    {
        var result = new List<ReferencedScheduleDto>();
        if (string.IsNullOrWhiteSpace(jsonContext)) return result;

        try
        {
            using var doc = JsonDocument.Parse(jsonContext);
            var root = doc.RootElement;

            // Expect structure: { "Date": "...", "Schedules": [ ... ] }
            if (root.ValueKind == JsonValueKind.Object && root.TryGetProperty("Schedules", out var schedulesEl) && schedulesEl.ValueKind == JsonValueKind.Array)
            {
                foreach (var item in schedulesEl.EnumerateArray())
                {
                    var scheduleId = item.TryGetProperty("ScheduleId", out var sid) ? sid.GetString() ?? "" : "";
                    var movieId = item.TryGetProperty("MovieId", out var mid) ? mid.GetString() ?? "" : "";
                    var movieName = item.TryGetProperty("MovieName", out var mn) ? mn.GetString() ?? "" : "";
                    var showTime = item.TryGetProperty("ShowTime", out var st) ? st.GetString() ?? "" : "";
                    var cinemaName = item.TryGetProperty("CinemaName", out var cn) ? cn.GetString() ?? "" : "";
                    var formatName = item.TryGetProperty("FormatName", out var fn) ? fn.GetString() ?? "" : "";

                    if (!string.IsNullOrWhiteSpace(scheduleId))
                    {
                        double? lat = null;
                        if (item.TryGetProperty("Latitude", out var latEl) && latEl.ValueKind == JsonValueKind.Number)
                            lat = latEl.GetDouble();
                        double? lng = null;
                        if (item.TryGetProperty("Longitude", out var lngEl) && lngEl.ValueKind == JsonValueKind.Number)
                            lng = lngEl.GetDouble();

                        result.Add(new ReferencedScheduleDto
                        {
                            ScheduleId = scheduleId,
                            MovieId = movieId,
                            MovieName = movieName,
                            ShowTime = showTime,
                            CinemaName = cinemaName,
                            FormatName = formatName,
                            CinemaLatitude = lat,
                            CinemaLongitude = lng
                        });
                    }
                }
            }
        }
        catch
        {
            // Ignore JSON parsing errors
        }

        return result;
    }
}
