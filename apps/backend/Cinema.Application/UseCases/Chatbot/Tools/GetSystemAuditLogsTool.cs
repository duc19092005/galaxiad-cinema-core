using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Cinema.Application.Interfaces.Chatbot;
using Cinema.Application.Interfaces.Admin;
using Cinema.Domain.Constants;

namespace Cinema.Application.UseCases.Chatbot.Tools;

public class GetSystemAuditLogsTool : IChatTool
{
    private readonly IAdminAuditLogRepository _adminRepository;

    public GetSystemAuditLogsTool(IAdminAuditLogRepository adminRepository)
    {
        _adminRepository = adminRepository;
    }

    public string IntentName => ChatbotConstants.Intents.GetSystemAuditLogs;

    public async Task<string> ExecuteAsync(Dictionary<string, string> parameters)
    {
        int limit = 15;
        if (parameters.TryGetValue("limit", out var limitStr) && int.TryParse(limitStr, out var parsedLimit))
        {
            limit = Math.Clamp(parsedLimit, 1, 50);
        }

        var logs = await _adminRepository.GetRecentAuditLogsAsync(limit, null, null);

        var result = logs.Select(l => new
        {
            l.AuditLogId,
            l.Action,
            l.EntityType,
            l.EntityName,
            l.Description,
            l.ActorName,
            l.ActorPrimaryRole,
            l.CreatedAt
        }).ToList();

        return JsonSerializer.Serialize(result);
    }
}
