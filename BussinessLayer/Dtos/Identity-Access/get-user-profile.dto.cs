namespace BussinessLayer.Dtos.Identity_Access;

public class res_get_user_profile_dto
{
    public string UserName { get; set; } = null!;
            
    public string IdentityCode { get; set; } = null!;

    public DateTime DateOfBirth { get; set; }

    public string PhoneNumber { get; set; } = null!;
}