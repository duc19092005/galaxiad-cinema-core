using System.ComponentModel.DataAnnotations;

namespace BussinessLayer.Dtos.Identity_Access;

public class regular_register_request_dto
{
    [Required(ErrorMessage = "Email is required")]
    [EmailAddress(ErrorMessage = "Email is invalid")]
    public string userEmail { get; set; }

    [Required(ErrorMessage = "Password is required")]
    [Length(8, 50, ErrorMessage = "Password length is invalid must between 8 and 50 characters")]
    public string userPassword { get; set; }

    [Compare("userPassword", ErrorMessage = "Passwords do not match")]
    public string userRepassword { get; set; }

    [Required(ErrorMessage = "User Name is required")]
    [Length(3, 50, ErrorMessage = "User Name is invalid")]
    public string userName { get; set; }

    [Required(ErrorMessage = "Identity Code is required")]
    [Length(12, 12, ErrorMessage = "Identity Code is invalid must be 12 characters")]
    public string identityCode { get; set; }

    [Required(ErrorMessage = "Phone number is required")]
    [RegularExpression("^[0-9]*$", ErrorMessage = "Phone number is invalid")]
    [Length(10, 10, ErrorMessage = "Phone Number Is Not Valid")]
    public string phoneNumber { get; set; }

    [Required(ErrorMessage = "Date of birth is required")]
    public DateTime dateOfBirth { get; set; }
}

public class register_response_dto
{
    
}