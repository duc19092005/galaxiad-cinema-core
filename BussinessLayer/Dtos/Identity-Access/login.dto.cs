// ReSharper disable All

using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace BussinessLayer.Dtos.Identity_Access;

public class reqRegularLoginDto
{
    [Required(ErrorMessage = "Email is required")]
    [EmailAddress(ErrorMessage = "Email is invalid")]
    public string email { get; set; } = string.Empty;
    
    [Required(ErrorMessage = "Password is required")]
    public string password { get; set; } = string.Empty;
}


public class resRegularLoginDto
{
    public Guid userId { get; set; }
    public string? username { get; set; } = string.Empty;
    public string[] roles { get; set; } = [];
    
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? access_token { get; set; }

}