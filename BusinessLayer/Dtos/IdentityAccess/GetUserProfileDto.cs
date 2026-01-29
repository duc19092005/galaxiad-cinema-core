namespace BusinessLayer.Dtos.IdentityAccess;

public class ResGetUserInfo
{
    public string UserName { get; set; } = null!;
            
    public string IdentityCode { get; set; } = null!;

    public DateTime DateOfBirth { get; set; }

    public string PhoneNumber { get; set; } = null!;

    public string[] Roles { get; set; } = [];
}
