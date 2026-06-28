using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Text.Json;
using System.Threading.Tasks;
using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Chatbot;
using Cinema.Application.Interfaces;
using Cinema.Application.Interfaces.Chatbot;
using Cinema.Domain.Constants;
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
            // 1. PhÃ¢n loáº¡i Ã½ Ä‘á»‹nh (Intent Classification)
            var classification = await _intentClassifier.ClassifyIntentAsync(requestDto.Message);
            var intent = classification.Intent;

            // 2. Kiá»ƒm tra quyá»n truy cáº­p (Policy Enforcement)
            var isAuthorized = await _policyService.IsAuthorizedAsync(intent);
            if (!isAuthorized)
            {
                return new BaseResponse<ChatbotResponseDto>
                {
                    IsSuccess = true,
                    Data = new ChatbotResponseDto
                    {
                        Response = ChatbotConstants.RefusalMessages.Unauthorized,
                        Intent = intent,
                        IsAuthorized = false
                    }
                };
            }

            // 3. Thá»±c thi Tool náº¿u cÃ³ Ä‘á»ƒ láº¥y Context
            string toolContext = string.Empty;
            var tool = _toolRegistry.GetTool(intent);
            if (tool != null)
            {
                try
                {
                    toolContext = await tool.ExecuteAsync(classification.Parameters);
                }
                catch (Exception ex)
                {
                    toolContext = $"[Error executing tool {intent}: {ex.Message}]";
                }
            }

            // 4. Láº¥y thÃ´ng tin ngá»¯ cáº£nh ngÆ°á»i dÃ¹ng hiá»‡n táº¡i
            string userRoles = "Guest (ChÆ°a Ä‘Äƒng nháº­p)";
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

            // 5. XÃ¢y dá»±ng Prompt vÃ  sinh cÃ¢u tráº£ lá»i báº±ng LLM
            var systemPrompt = $$"""
Báº¡n lÃ  CinemaPro AI, trá»£ lÃ½ áº£o thÃ´ng minh cá»§a há»‡ thá»‘ng ráº¡p chiáº¿u phim Galaxiad Cinema.
Nhiá»‡m vá»¥ cá»§a báº¡n lÃ  tráº£ lá»i cÃ¡c cÃ¢u há»i cá»§a khÃ¡ch hÃ ng hoáº·c nhÃ¢n viÃªn má»™t cÃ¡ch lá»‹ch sá»±, há»¯u Ã­ch vÃ  chÃ­nh xÃ¡c báº±ng tiáº¿ng Viá»‡t.

Há»† THá»NG ÄÃƒ TRÃCH XUáº¤T THÃ”NG TIN PHÃ™ Há»¢P Cá»¦A Há»† THá»NG Äá»‚ CUNG Cáº¤P CHO Báº N (Xem pháº§n [Context] bÃªn dÆ°á»›i).
Báº N CHá»ˆ ÄÆ¯á»¢C PHÃ‰P TRáº¢ Lá»œI Dá»°A TRÃŠN THÃ”NG TIN TRONG PHáº¦N [Context]. KhÃ´ng tá»± Ã½ bá»‹a Ä‘áº·t hoáº·c giáº£ Ä‘á»‹nh thÃ´ng tin khÃ´ng cÃ³.
Náº¿u thÃ´ng tin trong [Context] trá»‘ng, khÃ´ng Ä‘á»§ Ä‘á»ƒ tráº£ lá»i hoáº·c khÃ´ng chá»©a cÃ¢u tráº£ lá»i, hÃ£y lá»‹ch sá»± thÃ´ng bÃ¡o cho ngÆ°á»i dÃ¹ng ráº±ng báº¡n khÃ´ng tÃ¬m tháº¥y dá»¯ liá»‡u phÃ¹ há»£p liÃªn quan Ä‘áº¿n cÃ¢u há»i cá»§a há», hoáº·c hÆ°á»›ng dáº«n há» Ä‘áº·t cÃ¢u há»i rÃµ rÃ ng hÆ¡n.

Quy Ä‘á»‹nh an toÃ n:
1. Tuyá»‡t Ä‘á»‘i khÃ´ng tiáº¿t lá»™ thÃ´ng tin cÃ¡ nhÃ¢n cá»§a ngÆ°á»i dÃ¹ng khÃ¡c.
2. KhÃ´ng tiáº¿t lá»™ máº­t kháº©u, token báº£o máº­t, hoáº·c thÃ´ng tin thanh toÃ¡n.
3. KhÃ´ng tráº£ lá»i cÃ¡c cÃ¢u há»i ngoÃ i pháº¡m vi cá»§a há»‡ thá»‘ng ráº¡p chiáº¿u phim Galaxiad Cinema.

ThÃ´ng tin Ä‘á»‹nh danh ngÆ°á»i dÃ¹ng gá»­i cÃ¢u há»i:
- Vai trÃ²: {{userRoles}}
- Id tÃ i khoáº£n: {{userId}}

[Context]:
{{(string.IsNullOrWhiteSpace(toolContext) ? "KhÃ´ng cÃ³ dá»¯ liá»‡u ngá»¯ cáº£nh há»— trá»£." : toolContext)}}
""";

            var assistantResponse = await _llmClient.SendPromptAsync(systemPrompt, requestDto.Message);

            var referencedMovies = ExtractMoviesFromContext(toolContext, assistantResponse);
            var referencedSchedules = ExtractSchedulesFromContext(toolContext);

            return new BaseResponse<ChatbotResponseDto>
            {
                IsSuccess = true,
                Data = new ChatbotResponseDto
                {
                    Response = assistantResponse,
                    Intent = intent,
                    IsAuthorized = true,
                    ReferencedMovies = referencedMovies,
                    ReferencedSchedules = referencedSchedules
                }
            };
        }
        catch (Exception ex)
        {
            return new BaseResponse<ChatbotResponseDto>
            {
                IsSuccess = true,
                Data = new ChatbotResponseDto
                {
                    Response = ChatbotConstants.RefusalMessages.SystemError,
                    Intent = "Error",
                    IsAuthorized = true
                }
            };
        }
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
                        result.Add(new ReferencedScheduleDto
                        {
                            ScheduleId = scheduleId,
                            MovieId = movieId,
                            MovieName = movieName,
                            ShowTime = showTime,
                            CinemaName = cinemaName,
                            FormatName = formatName
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

