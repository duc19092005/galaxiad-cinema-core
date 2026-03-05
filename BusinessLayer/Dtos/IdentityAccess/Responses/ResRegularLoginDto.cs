using System.Text.Json.Serialization;

namespace BusinessLayer.Dtos.IdentityAccess.Responses;

public class ResRegularLoginDto
{
    public Guid UserId { get; set; }
    public string? Username { get; set; } = string.Empty;
    public string[] Roles { get; set; } = [];
    
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? AccessToken { get; set; }

}
