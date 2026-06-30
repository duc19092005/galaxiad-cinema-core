using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Cinema.Application.Interfaces.Chatbot;
using Cinema.Application.Interfaces.PricingPromotions;
using Cinema.Domain.Constants;
using Cinema.Domain.Localization;

namespace Cinema.Infrastructure.Chatbot.Tools;

public class GetPromotionsTool : IChatTool
{
    private readonly IPricingPromotionRepository _promotionRepository;

    public GetPromotionsTool(IPricingPromotionRepository promotionRepository)
    {
        _promotionRepository = promotionRepository;
    }

    public string IntentName => ChatbotConstants.Intents.GetPromotions;

    public async Task<string> ExecuteAsync(Dictionary<string, string> parameters)
    {
        var promotions = await _promotionRepository.GetActivePublicPromotionsAsync();

        if (promotions.Count == 0)
        {
            return JsonSerializer.Serialize(new { Message = Messages.Chatbot.NoActivePromotions });
        }

        // Chỉ trả về thông tin công khai — không lộ AdjustmentValue chi tiết hay rule nội bộ
        var result = promotions.Select(p => new
        {
            p.Title,
            p.ShortDescription,
            StartDate = p.StartDate.HasValue ? p.StartDate.Value.ToString("dd/MM/yyyy") : null,
            EndDate   = p.EndDate.HasValue   ? p.EndDate.Value.ToString("dd/MM/yyyy")   : null
        });

        return JsonSerializer.Serialize(result);
    }
}
