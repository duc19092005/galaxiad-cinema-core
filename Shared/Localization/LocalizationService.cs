using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Http;

namespace Shared.Localization;

public class LocalizationService : ILocalizationService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    // Default language when no header is provided
    private const string DefaultLanguage = "en";

    // Supported languages
    private static readonly HashSet<string> SupportedLanguages = new() { "en", "vi" };

    /// <summary>
    /// Regex-based dictionary mapping: en message pattern -> vi translation template
    /// Use $1, $2, etc. to represent the captured groups.
    /// </summary>
    private static readonly List<(Regex Pattern, string Replacement)> RegexTranslations = new()
    {
        // Cinema Dynamic Messages
        (new Regex(@"^Error : There's already a cinema named (.*)$", RegexOptions.IgnoreCase), "Lỗi: Đã có rạp chiếu phim có tên $1"),
        (new Regex(@"^Error : There's already a cinema Description (.*)$", RegexOptions.IgnoreCase), "Lỗi: Đã có rạp chiếu phim có mô tả $1"),
        (new Regex(@"^Error : There's already a cinema Location (.*)$", RegexOptions.IgnoreCase), "Lỗi: Đã có rạp chiếu phim ở vị trí $1"),
        (new Regex(@"^Error : There's already a cinema hotline Number (.*)$", RegexOptions.IgnoreCase), "Lỗi: Đã có rạp chiếu phim có số hotline $1"),
        (new Regex(@"^Error : There is no cinema with Id : (.*)$", RegexOptions.IgnoreCase), "Lỗi: Không tìm thấy rạp chiếu phim với Id: $1"),
        
        // Movie Dynamic Messages
        (new Regex(@"^Movie with Id : (.*) does not exist$", RegexOptions.IgnoreCase), "Không tìm thấy phim với mã: $1"),
        (new Regex(@"^Movie ID (.*) does not exist or is inactive.$", RegexOptions.IgnoreCase), "Phim có mã $1 không tồn tại hoặc đã bị ẩn."),
        
        // Schedule Dynamic Messages
        (new Regex(@"^Format invalid or missing for movie '(.*)'.$", RegexOptions.IgnoreCase), "Định dạng phim '$1' không hợp lệ hoặc bị thiếu."),
        (new Regex(@"^Movie '(.*)' is available from (.*) to (.*).$", RegexOptions.IgnoreCase), "Phim '$1' chỉ được chiếu từ $2 đến $3."),
        (new Regex(@"^Time slot from (.*) to (.*) conflicts with an existing schedule.$", RegexOptions.IgnoreCase), "Ca chiếu từ $1 đến $2 bị trùng với lịch chiếu đã có.")
    };

    /// <summary>
    /// Dictionary mapping: exact en message -> vi translation
    /// </summary>
    private static readonly Dictionary<string, string> EnToViTranslations = new(StringComparer.OrdinalIgnoreCase)
    {
        // =============================================
        // SUCCESS MESSAGES (BaseResponse.Message)
        // =============================================

        // Identity Access
        { "Login SuccessFully", "Đăng nhập thành công" },
        { "Register Successfully", "Đăng ký thành công" },
        { "Validate Successfully", "Xác thực thành công" },
        { "Change Password Completed", "Đổi mật khẩu thành công" },
        { "Logged out successfully", "Đăng xuất thành công" },
        
        {"Token Has Expired" , "Token đã hết hạn"},

        // Cinema Management
        { "Add Cinema Completed", "Thêm rạp chiếu phim thành công" },
        { "Update Cinema Completed", "Cập nhật rạp chiếu phim thành công" },
        { "Get Cinema List SuccessFully", "Lấy danh sách rạp chiếu phim thành công" },
        { "Cinema Infos", "Thông tin rạp chiếu phim" },

        // Auditorium Management
        { "Add Auditorium completed", "Thêm phòng chiếu thành công" },
        { "Update Auditorium completed", "Cập nhật phòng chiếu thành công" },
        { "Get auditorium completed", "Lấy thông tin phòng chiếu thành công" },

        // Movie Management
        { "Add Movie Completed", "Thêm phim thành công" },
        { "Edit Movie Completed", "Chỉnh sửa phim thành công" },
        { "Get Movies Info Success", "Lấy thông tin phim thành công" },
        { "Get Movie Info Successfully", "Lấy thông tin phim thành công" },

        // Movie Format
        { "Movie Format Datas", "Dữ liệu định dạng phim" },

        // Movie Schedules
        { "Create Movie Schedule Completed", "Tạo lịch chiếu phim thành công" },

        // =============================================
        // ERROR MESSAGES (AppException / Errors)
        // =============================================

        // System Errors
        { "There's an error with the system", "Đã có lỗi hệ thống xảy ra" },
        { "There's a error with System", "Đã có lỗi hệ thống xảy ra" },
        { "System Error", "Lỗi hệ thống" },
        { "Database Error", "Lỗi cơ sở dữ liệu" },
        { "Method not supported", "Phương thức không được hỗ trợ" },
        { "Multiple errors occurred", "Đã xảy ra nhiều lỗi" },
        { "Đã có lỗi hệ thống xảy ra.", "Đã có lỗi hệ thống xảy ra." }, // Already Vietnamese
        { "Missing One or more Fields", "Thiếu một hoặc nhiều trường dữ liệu" },

        // Auth Errors
        { "User Not Found", "Không tìm thấy người dùng" },
        { "Username or password is wrong", "Tên đăng nhập hoặc mật khẩu không đúng" },
        { "User Role Not Found", "Không tìm thấy vai trò người dùng" },
        { "Unauthorize", "Không có quyền truy cập" },
        { "You Don't Have Right To Access This Resources", "Bạn không có quyền truy cập tài nguyên này" },
        { "Invalid User Type", "Loại người dùng không hợp lệ" },
        { "Cannot Find User Information", "Không tìm thấy thông tin người dùng" },
        { "Old Password is Not Match !", "Mật khẩu cũ không khớp!" },
        { "New Password is the same of old password !", "Mật khẩu mới giống với mật khẩu cũ!" },

        // Registration Errors
        { "Email Already Exits", "Email đã tồn tại" },
        { "Identity Code is already Exits", "Mã chứng minh nhân dân đã tồn tại" },

        // Cinema Errors
        { "Sorry, We can not find the cinema", "Xin lỗi, chúng tôi không tìm thấy rạp chiếu phim" },

        // Auditorium Errors
        { "Error : Auditorium already exists", "Lỗi: Phòng chiếu đã tồn tại" },
        { "Duplicate Auditorium Number", "Số phòng chiếu bị trùng" },
        { "Error : Can not find auditorium", "Lỗi: Không tìm thấy phòng chiếu" },
        { "Auditorium Not Found", "Không tìm thấy phòng chiếu" },

        // Movie Errors
        { "Movie Name is already in use", "Tên phim đã được sử dụng" },
        { "Movie Descriptions is already in use", "Mô tả phim đã được sử dụng" },
        { "Movie Name already exists", "Tên phim đã tồn tại" },
        { "Movie Description already exists", "Mô tả phim đã tồn tại" },
        { "Error uploading image to Cloudinary", "Lỗi tải ảnh lên Cloudinary" },
        { "Movie Duration Is Invalid Must be Higher than 0 and Lower than 500", "Thời lượng phim không hợp lệ, phải lớn hơn 0 và nhỏ hơn 500" },

        // Schedule Errors
        { "Error Auditorium Not Found", "Lỗi: Không tìm thấy phòng chiếu" },
        { "Cannot schedule show times for a past date or time.", "Không thể lên lịch chiếu cho ngày hoặc giờ đã qua." },
        { "Overlapping schedules detected within the request.", "Phát hiện lịch chiếu bị trùng lặp trong yêu cầu." },

        // BCrypt / Utility Errors
        { "Hashing password failed", "Mã hóa mật khẩu thất bại" },
        { "Validate password failed", "Xác thực mật khẩu thất bại" },

        // =============================================
        // VALIDATION MESSAGES (DTO Annotations)
        // =============================================

        // Cinema DTO Validations
        { "Cinema Location is Required", "Vị trí rạp chiếu phim là bắt buộc" },
        { "Cinema Location cannot exceed 50 characters", "Vị trí rạp chiếu phim không được vượt quá 50 ký tự" },
        { "Cinema Name is Required", "Tên rạp chiếu phim là bắt buộc" },
        { "Cinema Name cannot exceed 50 characters", "Tên rạp chiếu phim không được vượt quá 50 ký tự" },
        { "Cinema Hotline number is required", "Số hotline rạp chiếu phim là bắt buộc" },
        { "Cinema cinemaHotlineNumber cannot exceed 50 characters", "Số hotline rạp không được vượt quá 50 ký tự" },
        { "Cinema Description is Required", "Mô tả rạp chiếu phim là bắt buộc" },
        { "Release Date is Required", "Ngày phát hành là bắt buộc" },

        // Auditorium DTO Validations
        { "Error Auditorium Number cannot be empty", "Lỗi: Số phòng chiếu không được để trống" },
        { "Auditorium Number must be between 3 and 10 characters", "Số phòng chiếu phải từ 3 đến 10 ký tự" },
        { "Error Movie Format cannot be empty", "Lỗi: Định dạng phim không được để trống" },
        { "Error Cinema cannot be empty", "Lỗi: Rạp chiếu phim không được để trống" },
        { "Auditorium must have at least one seat", "Phòng chiếu phải có ít nhất một ghế" },
        { "Error Seat Number cannot be empty", "Lỗi: Số ghế không được để trống" },
        { "Seat Number must be between 3 and 10 characters", "Số ghế phải từ 3 đến 10 ký tự" },
        { "coordX must be >= 0", "Tọa độ X phải >= 0" },
        { "coordY must be >= 0", "Tọa độ Y phải >= 0" },

        // Movie DTO Validations
        { "Movie Required Age is required", "Nhóm tuổi yêu cầu của phim là bắt buộc" },
        { "Movie Name is required", "Tên phim là bắt buộc" },
        { "Movie Name length must be between 1 and 50 characters", "Tên phim phải từ 1 đến 50 ký tự" },
        { "Movie Descriptions is required", "Mô tả phim là bắt buộc" },
        { "Movie Descriptions length must be between 1 and 200 characters", "Mô tả phim phải từ 1 đến 200 ký tự" },
        { "Movie Image is required", "Hình ảnh phim là bắt buộc" },
        { "Movie Ended Date is required", "Ngày kết thúc phim là bắt buộc" },

        // Schedule DTO Validations
        { "Auditorium Id is required", "Mã phòng chiếu là bắt buộc" },
        { "TheaterManager is required", "Quản lý rạp là bắt buộc" }
    };

    /// <summary>
    /// Reverse dictionary: vi -> en (auto-generated)
    /// </summary>
    private static readonly Dictionary<string, string> ViToEnTranslations;

    static LocalizationService()
    {
        ViToEnTranslations = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        foreach (var kvp in EnToViTranslations)
        {
            // Avoid duplicate keys; en is the primary source
            if (!ViToEnTranslations.ContainsKey(kvp.Value))
            {
                ViToEnTranslations[kvp.Value] = kvp.Key;
            }
        }
    }

    public LocalizationService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public string CurrentLanguage
    {
        get
        {
            var lang = GetLanguageFromHeader();
            return SupportedLanguages.Contains(lang) ? lang : DefaultLanguage;
        }
    }

    public string Translate(string key)
    {
        if (string.IsNullOrEmpty(key)) return key;

        var lang = CurrentLanguage;

        // If requesting Vietnamese
        if (lang == "vi")
        {
            // Try exact match first
            if (EnToViTranslations.TryGetValue(key, out var viValue))
                return viValue;

            // Try Regex matches for dynamic templates (like "Movie with Id: 123... not exist")
            foreach (var regexTemplate in RegexTranslations)
            {
                var match = regexTemplate.Pattern.Match(key);
                if (match.Success)
                {
                    // Use $1, $2 inside the replacement string to replace captured groups
                    return regexTemplate.Pattern.Replace(key, regexTemplate.Replacement);
                }
            }

            // No translation found, return original
            return key;
        }

        // If requesting English
        if (lang == "en")
        {
            // Check if it's already English (in our dictionary)
            if (EnToViTranslations.ContainsKey(key))
                return key;

            // If it's Vietnamese, translate back to English
            if (ViToEnTranslations.TryGetValue(key, out var enValue))
                return enValue;

            // No translation found, return original
            return key;
        }

        return key;
    }

    private string GetLanguageFromHeader()
    {
        var httpContext = _httpContextAccessor.HttpContext;
        if (httpContext == null) return DefaultLanguage;

        // Check custom header first: X-Language
        if (httpContext.Request.Headers.TryGetValue("X-Language", out var xLang))
        {
            var langValue = xLang.ToString().Trim().ToLower();
            if (SupportedLanguages.Contains(langValue))
                return langValue;
        }

        // Fallback to standard Accept-Language header
        if (httpContext.Request.Headers.TryGetValue("Accept-Language", out var acceptLang))
        {
            var langValue = acceptLang.ToString().Trim().ToLower();

            // Parse: "vi", "vi-VN", "en-US,en;q=0.9,vi;q=0.8"
            var primaryLang = langValue.Split(',')[0].Split(';')[0].Split('-')[0].Trim();

            if (SupportedLanguages.Contains(primaryLang))
                return primaryLang;
        }

        return DefaultLanguage;
    }
}
