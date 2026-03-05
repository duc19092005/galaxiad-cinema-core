using System.ComponentModel.DataAnnotations;

namespace BusinessLayer.Dtos.IdentityAccess.Requests;

public class ReqRegularRegisterDto
{
    [Required(ErrorMessage = "Email is required")]
    [EmailAddress(ErrorMessage = "Email is invalid")]
    [Length(10, 50, ErrorMessage = "Email length is invalid")]
    public string UserEmail { get; set; } = string.Empty;

    [Required(ErrorMessage = "Password is required")]
    [Length(8, 50, ErrorMessage = "Password length is invalid must between 8 and 50 characters")]
    public string UserPassword { get; set; }= string.Empty;

    [Compare("userPassword", ErrorMessage = "Passwords do not match")]
    public string UserRepassword { get; set; }= string.Empty;

    [Required(ErrorMessage = "User Name is required")]
    [Length(3, 50, ErrorMessage = "User Name is invalid")]
    public string UserName { get; set; }= string.Empty;

    [Required(ErrorMessage = "Identity Code is required")]
    [Length(12, 12, ErrorMessage = "Identity Code is invalid must be 12 characters")]
    public string IdentityCode { get; set; }= string.Empty;

    [Required(ErrorMessage = "Phone number is required")]
    [RegularExpression("^[0-9]*$", ErrorMessage = "Phone number is invalid")]
    [Length(10, 10, ErrorMessage = "Phone Number Is Not Valid")]
    public string PhoneNumber { get; set; }= string.Empty;

    [Required(ErrorMessage = "Date of birth is required")]
    public DateTime DateOfBirth { get; set; }
}
