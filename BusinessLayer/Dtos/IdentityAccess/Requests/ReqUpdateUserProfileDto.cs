using System.ComponentModel.DataAnnotations;

namespace BusinessLayer.Dtos.IdentityAccess.Requests;

public class ReqUpdateUserProfileDto
{
    [RegularExpression(@"^[a-zA-Z0-9\sÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂưăạảấầẩẫậắằẳẵặẹẻẽềềểỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳỵỷỹ]*$", ErrorMessage = "Tên không được chứa ký tự đặc biệt.")]
    public string? UserName { get; set; }

    [RegularExpression(@"^\d{10}$", ErrorMessage = "Số điện thoại phải đúng 10 chữ số.")]
    public string? PhoneNumber { get; set; }

    [RegularExpression(@"^\d{12}$", ErrorMessage = "Mã định danh phải đúng 12 chữ số.")]
    public string? IdentityCode { get; set; }

    public DateTime? DateOfBirth { get; set; }
}
