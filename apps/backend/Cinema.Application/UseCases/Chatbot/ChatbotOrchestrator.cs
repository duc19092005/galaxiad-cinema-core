using System;
using System.Collections.Generic;
using System.Diagnostics;
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
    private readonly IChatContextProviderRegistry _contextProviderRegistry;
    private readonly IChatLlmClient _llmClient;
    private readonly IUserContextService _userContextService;

    public ChatbotOrchestrator(
        IChatIntentClassifier intentClassifier,
        IChatPolicyService policyService,
        IChatContextProviderRegistry contextProviderRegistry,
        IChatLlmClient llmClient,
        IUserContextService userContextService)
    {
        _intentClassifier = intentClassifier;
        _policyService = policyService;
        _contextProviderRegistry = contextProviderRegistry;
        _llmClient = llmClient;
        _userContextService = userContextService;
    }

    public async Task<BaseResponse<ChatbotResponseDto>> ExecuteAsync(ChatbotRequestDto requestDto)
    {
        var stopwatch = Stopwatch.StartNew();
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

            var (fastUserRoles, fastUserId) = GetCurrentUserContext();
            var fastSessionId = requestDto.SessionId ?? (fastUserId != "N/A" ? fastUserId : Guid.NewGuid().ToString());

            if (IsStructuredUserSelection(requestDto.Message))
            {
                var fastSupportingContext = BuildAgentSupportingContext(string.Empty, fastUserId, fastUserRoles);
                var fastAssistantResponse = await _llmClient.SendChatRequestAsync(
                    requestDto.Message,
                    fastSupportingContext,
                    fastUserRoles,
                    fastUserId,
                    fastSessionId
                );

                var (cleanFastResponse, fastUiActions) = ParseUiActions(fastAssistantResponse);
                stopwatch.Stop();
                return new BaseResponse<ChatbotResponseDto>
                {
                    IsSuccess = true,
                    Data = new ChatbotResponseDto
                    {
                        Response = cleanFastResponse,
                        Intent = "AgentFastPath",
                        IsAuthorized = true,
                        UiActions = fastUiActions,
                        ProcessingPath = "fastPath",
                        ElapsedMs = stopwatch.ElapsedMilliseconds,
                        IsAuthenticated = fastUserId != "N/A"
                    }
                };
            }

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

            if (intentResult != null && !string.IsNullOrEmpty(intentResult.Intent))
            {
                var isAuthorized = await _policyService.IsAuthorizedAsync(intentResult.Intent);
                if (!isAuthorized)
                {
                    stopwatch.Stop();
                    return new BaseResponse<ChatbotResponseDto>
                    {
                        IsSuccess = true,
                        Data = new ChatbotResponseDto
                        {
                            Response = GetAuthorizationRefusal(intentResult.Intent, userId),
                            Intent = intentResult.Intent,
                            IsAuthorized = false,
                            ProcessingPath = "policyDenied",
                            ElapsedMs = stopwatch.ElapsedMilliseconds,
                            IsAuthenticated = userId != "N/A"
                        }
                    };
                }
            }

            // 2. Resolve deterministic C# context before handing the message to the Python LangChain agent.
            string supportingContext = string.Empty;
            if (intentResult != null && !string.IsNullOrEmpty(intentResult.Intent))
            {
                var provider = _contextProviderRegistry.GetProvider(intentResult.Intent);
                if (provider != null)
                {
                    try
                    {
                        supportingContext = await provider.ExecuteAsync(intentResult.Parameters);
                    }
                    catch (Exception providerEx)
                    {
                        Console.WriteLine($"Error executing chatbot context provider {intentResult.Intent}: {providerEx}");
                    }
                }
            }

            // Gửi trực tiếp tin nhắn sang LangChain Agent ở dịch vụ Python AI
            supportingContext = BuildAgentSupportingContext(supportingContext, userId, userRoles);

            var assistantResponse = await _llmClient.SendChatRequestAsync(
                requestDto.Message, 
                supportingContext, 
                userRoles, 
                userId, 
                sessionId
            );

            // Trích xuất movies và schedules được nhắc đến trong câu trả lời từ context
            var referencedMovies = ExtractMoviesFromContext(supportingContext, assistantResponse);
            var referencedSchedules = ExtractSchedulesFromContext(supportingContext);
            var (cleanResponse, uiActions) = ParseUiActions(assistantResponse);

            return new BaseResponse<ChatbotResponseDto>
            {
                IsSuccess = true,
                Data = new ChatbotResponseDto
                {
                    Response = cleanResponse,
                    Intent = intentResult?.Intent ?? "AgentChat",
                    IsAuthorized = true,
                    ReferencedMovies = referencedMovies,
                    ReferencedSchedules = referencedSchedules,
                    UiActions = uiActions,
                    BookingState = GetBookingStateFromIntent(intentResult),
                    ProcessingPath = "llmPath",
                    ElapsedMs = stopwatch.ElapsedMilliseconds,
                    IsAuthenticated = userId != "N/A"
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
        var stopwatch = Stopwatch.StartNew();
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
            var (fastUserRoles, fastUserId) = GetCurrentUserContext();
            var fastSessionId = requestDto.SessionId ?? (fastUserId != "N/A" ? fastUserId : Guid.NewGuid().ToString());

            if (IsStructuredUserSelection(requestDto.Message))
            {
                await onStatus("Processing your selection...");
                var fastSupportingContext = BuildAgentSupportingContext(string.Empty, fastUserId, fastUserRoles);
                var fastResponseBuilder = new StringBuilder();
                await foreach (var token in _llmClient.StreamChatRequestAsync(
                    requestDto.Message,
                    fastSupportingContext,
                    fastUserRoles,
                    fastUserId,
                    fastSessionId,
                    cancellationToken))
                {
                    fastResponseBuilder.Append(token);
                    await onToken(token);
                }

                var fastAssistantResponse = fastResponseBuilder.ToString();
                var (cleanFastResponse, fastUiActions) = ParseUiActions(fastAssistantResponse);
                stopwatch.Stop();
                return new BaseResponse<ChatbotResponseDto>
                {
                    IsSuccess = true,
                    Data = new ChatbotResponseDto
                    {
                        Response = cleanFastResponse,
                        Intent = "AgentFastPath",
                        IsAuthorized = true,
                        UiActions = fastUiActions,
                        ProcessingPath = "fastPath",
                        ElapsedMs = stopwatch.ElapsedMilliseconds,
                        IsAuthenticated = fastUserId != "N/A"
                    }
                };
            }

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
            var (userRoles, userId) = GetCurrentUserContext();
            var sessionId = requestDto.SessionId ?? (userId != "N/A" ? userId : Guid.NewGuid().ToString());

            if (intentResult != null && !string.IsNullOrEmpty(intentResult.Intent))
            {
                var isAuthorized = await _policyService.IsAuthorizedAsync(intentResult.Intent);
                if (!isAuthorized)
                {
                    var refusal = GetAuthorizationRefusal(intentResult.Intent, userId);
                    await onToken(refusal);
                    stopwatch.Stop();
                    return new BaseResponse<ChatbotResponseDto>
                    {
                        IsSuccess = true,
                        Data = new ChatbotResponseDto
                        {
                            Response = refusal,
                            Intent = intentResult.Intent,
                            IsAuthorized = false,
                            ProcessingPath = "policyDenied",
                            ElapsedMs = stopwatch.ElapsedMilliseconds,
                            IsAuthenticated = userId != "N/A"
                        }
                    };
                }
            }

            string supportingContext = string.Empty;
            if (intentResult != null && !string.IsNullOrEmpty(intentResult.Intent))
            {
                await onStatus($"Đang tìm kiếm thông tin: {intentResult.Intent}...");
                var provider = _contextProviderRegistry.GetProvider(intentResult.Intent);
                if (provider != null)
                {
                    try
                    {
                        supportingContext = await provider.ExecuteAsync(intentResult.Parameters);
                    }
                    catch (Exception providerEx)
                    {
                        Console.WriteLine($"Error executing chatbot context provider {intentResult.Intent}: {providerEx}");
                    }
                }
            }

            await onStatus("AI đang xử lý yêu cầu...");

            supportingContext = BuildAgentSupportingContext(supportingContext, userId, userRoles);

            var responseBuilder = new StringBuilder();
            await foreach (var token in _llmClient.StreamChatRequestAsync(
                requestDto.Message,
                supportingContext,
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
            var referencedMovies = ExtractMoviesFromContext(supportingContext, assistantResponse);
            var referencedSchedules = ExtractSchedulesFromContext(supportingContext);
            var (cleanResponse, uiActions) = ParseUiActions(assistantResponse);

            return new BaseResponse<ChatbotResponseDto>
            {
                IsSuccess = true,
                Data = new ChatbotResponseDto
                {
                    Response = cleanResponse,
                    Intent = intentResult?.Intent ?? "AgentChat",
                    IsAuthorized = true,
                    ReferencedMovies = referencedMovies,
                    ReferencedSchedules = referencedSchedules,
                    UiActions = uiActions,
                    BookingState = GetBookingStateFromIntent(intentResult),
                    ProcessingPath = "llmPath",
                    ElapsedMs = stopwatch.ElapsedMilliseconds,
                    IsAuthenticated = userId != "N/A"
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

    private static string GetAuthorizationRefusal(string intent, string userId)
    {
        if (userId == "N/A" &&
            (intent == ChatbotConstants.Intents.GetMyBookings ||
             intent == ChatbotConstants.Intents.GetBookingStatus))
        {
            return ChatbotResponseMessages.Refusals.RequireLogin;
        }

        return ChatbotResponseMessages.Refusals.Unauthorized;
    }

    private static bool IsStructuredUserSelection(string message)
    {
        return message.TrimStart().StartsWith("[USER_SELECTION]", StringComparison.Ordinal);
    }

    private string BuildAgentSupportingContext(string deterministicContext, string userId, string userRoles)
    {
        var currentUser = new
        {
            IsAuthenticated = userId != "N/A",
            UserId = userId == "N/A" ? null : userId,
            Roles = userRoles,
            Email = _userContextService.GetEmail(),
            Name = _userContextService.GetUserName()
        };

        var envelope = new
        {
            CurrentUser = currentUser,
            DeterministicContext = string.IsNullOrWhiteSpace(deterministicContext) ? null : deterministicContext
        };

        return JsonSerializer.Serialize(envelope, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });
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
            // Ignore JSON parsing errors from supporting context.
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

    private (string CleanResponse, List<ChatbotUiActionDto> UiActions) ParseUiActions(string rawResponse)
    {
        var uiActions = new List<ChatbotUiActionDto>();
        var cleanBuilder = new StringBuilder();
        var cursor = 0;

        while (cursor < rawResponse.Length)
        {
            var tagStart = rawResponse.IndexOf("[UI_ACTION:", cursor, StringComparison.Ordinal);
            if (tagStart < 0)
            {
                cleanBuilder.Append(rawResponse[cursor..]);
                break;
            }

            cleanBuilder.Append(rawResponse[cursor..tagStart]);
            var jsonStart = rawResponse.IndexOf('{', tagStart);
            if (jsonStart < 0)
            {
                cleanBuilder.Append(rawResponse[tagStart..]);
                break;
            }

            var jsonEnd = FindJsonObjectEnd(rawResponse, jsonStart);
            if (jsonEnd < 0)
            {
                cleanBuilder.Append(rawResponse[tagStart..]);
                break;
            }

            var tagEnd = rawResponse.IndexOf(']', jsonEnd);
            cursor = tagEnd >= 0 ? tagEnd + 1 : jsonEnd + 1;

            try
            {
                var jsonStr = rawResponse.Substring(jsonStart, jsonEnd - jsonStart + 1);
                using var doc = JsonDocument.Parse(jsonStr);
                var root = doc.RootElement;

                var type = root.TryGetProperty("type", out var typeEl) ? typeEl.GetString() ?? string.Empty : string.Empty;
                if (!string.IsNullOrWhiteSpace(type))
                {
                    uiActions.Add(new ChatbotUiActionDto
                    {
                        ActionId = $"action-{Guid.NewGuid()}",
                        Type = type,
                        Title = root.TryGetProperty("title", out var titleEl) ? titleEl.GetString() ?? string.Empty : string.Empty,
                        Options = ParseUiOptions(root),
                        Payload = root.TryGetProperty("payload", out var payloadEl) ? payloadEl.Clone() : null
                    });
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine("Error parsing UI Action tag: " + ex.Message);
            }
        }

        return (cleanBuilder.ToString().Trim(), uiActions);
    }

    private static int FindJsonObjectEnd(string value, int start)
    {
        var depth = 0;
        var inString = false;
        var escaping = false;

        for (var index = start; index < value.Length; index++)
        {
            var current = value[index];
            if (inString)
            {
                if (escaping)
                {
                    escaping = false;
                }
                else if (current == '\\')
                {
                    escaping = true;
                }
                else if (current == '"')
                {
                    inString = false;
                }

                continue;
            }

            if (current == '"')
            {
                inString = true;
                continue;
            }

            if (current == '{')
            {
                depth++;
            }
            else if (current == '}')
            {
                depth--;
                if (depth == 0)
                {
                    return index;
                }
            }
        }

        return -1;
    }

    private static List<ChatbotUiOptionDto> ParseUiOptions(JsonElement root)
    {
        var options = new List<ChatbotUiOptionDto>();
        if (!root.TryGetProperty("options", out var optionsEl) || optionsEl.ValueKind != JsonValueKind.Array)
        {
            return options;
        }

        foreach (var optionEl in optionsEl.EnumerateArray())
        {
            options.Add(new ChatbotUiOptionDto
            {
                Label = optionEl.TryGetProperty("label", out var labelEl) ? labelEl.GetString() ?? string.Empty : string.Empty,
                Value = optionEl.TryGetProperty("value", out var valueEl) ? valueEl.GetString() ?? string.Empty : string.Empty,
                Payload = optionEl.TryGetProperty("payload", out var payloadEl) ? payloadEl.Clone() : null
            });
        }

        return options;
    }

    private static JsonElement? GetBookingStateFromIntent(ChatIntentResult? intentResult)
    {
        if (intentResult?.Parameters == null || intentResult.Parameters.Count == 0)
        {
            return null;
        }

        var stateDict = new Dictionary<string, object>();
        if (intentResult.Parameters.TryGetValue("date", out var dVal) && !string.IsNullOrEmpty(dVal))
        {
            stateDict["date"] = dVal;
        }
        if (intentResult.Parameters.TryGetValue("movieId", out var mVal) && !string.IsNullOrEmpty(mVal))
        {
            stateDict["movie"] = new { movieId = mVal };
        }
        if (intentResult.Parameters.TryGetValue("cinemaId", out var cVal) && !string.IsNullOrEmpty(cVal))
        {
            stateDict["cinema"] = new { cinemaId = cVal };
        }
        if (intentResult.Parameters.TryGetValue("format", out var fVal) && !string.IsNullOrEmpty(fVal))
        {
            stateDict["formatName"] = fVal;
        }

        if (stateDict.Count == 0)
        {
            return null;
        }

        try
        {
            var serialized = JsonSerializer.Serialize(stateDict);
            return JsonDocument.Parse(serialized).RootElement;
        }
        catch
        {
            return null;
        }
    }
}
