using BussinessLayer.Dtos;
using BussinessLayer.Dtos.Identity_Access;

namespace BussinessLayer.Interfaces.i_identity_access;

public interface IProfileBehavior
{
    Task<base_reponse<string>> ChangePassword(req_change_password_dto request);
    Task<base_reponse<res_get_user_profile_dto>> GetUserProfile();
}