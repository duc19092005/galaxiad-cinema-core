using System.ComponentModel.DataAnnotations;

namespace Cinema.Application.Dtos.IdentityAccess.Requests;

public class ReqChangePasswordDto
{
    [Required(ErrorMessage = "Old Password is required")]
    public string? OldPassword { get; set; }
    
    [Required(ErrorMessage = "New Password is required")]
    [StringLength(50 , ErrorMessage = "New Password length is invalid can't be more than 50 characters")]
    [MinLength(8, ErrorMessage = "New Password length is invalid must be at least 8 characters")]
    [RegularExpression(@"^(?=.*[A-Z])(?=.*[\W_]).{8,}$", ErrorMessage = "Password must be at least 8 characters long, contain at least one uppercase letter and one special character.")]
    public string? NewPassword { get; set; }
    
    [Required(ErrorMessage = "Confirm new password is required")]
    [Compare("NewPassword", ErrorMessage = "New Password and Confirm new password do not match")]
    public string? RenewPassword { get; set; }
}
