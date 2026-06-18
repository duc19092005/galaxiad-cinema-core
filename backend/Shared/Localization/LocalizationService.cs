using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Http;

namespace Shared.Localization;

public class LocalizationService : ILocalizationService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    // Default language when no header is provided
    private const string DefaultLanguage = "en";
    
    private const string HeaderXLanguage = "X-Language";
    private const string HeaderAcceptLanguage = "Accept-Language";

    // Supported languages
    private static readonly HashSet<string> SupportedLanguages = new() { "en", "vi", "ru" };

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
        (new Regex(@"^Time slot from (.*) to (.*) conflicts with an existing schedule.$", RegexOptions.IgnoreCase), "Ca chiếu từ $1 đến $2 bị trùng với lịch chiếu đã có."),
        
        // Russian Translations
        (new Regex(@"^Error : There's already a cinema named (.*)$", RegexOptions.IgnoreCase), "Ошибка: Кинотеатр с названием $1 уже существует"),
        (new Regex(@"^Error : There's already a cinema Description (.*)$", RegexOptions.IgnoreCase), "Ошибка: Кинотеатр с описанием $1 уже существует"),
        (new Regex(@"^Error : There's already a cinema Location (.*)$", RegexOptions.IgnoreCase), "Ошибка: Кинотеатр в локации $1 уже существует"),
        (new Regex(@"^Error : There's already a cinema hotline Number (.*)$", RegexOptions.IgnoreCase), "Ошибка: Кинотеатр с номером $1 уже существует"),
        (new Regex(@"^Error : There is no cinema with Id : (.*)$", RegexOptions.IgnoreCase), "Ошибка: Кинотеатр с Id: $1 не найден"),
        (new Regex(@"^Movie with Id : (.*) does not exist$", RegexOptions.IgnoreCase), "Фильм с Id: $1 не существует"),
        (new Regex(@"^Movie ID (.*) does not exist or is inactive.$", RegexOptions.IgnoreCase), "Фильм $1 не существует или неактивен."),
        (new Regex(@"^Format invalid or missing for movie '(.*)'.$", RegexOptions.IgnoreCase), "Формат фильма '$1' недействителен или отсутствует."),
        (new Regex(@"^Movie '(.*)' is available from (.*) to (.*).$", RegexOptions.IgnoreCase), "Фильм '$1' доступен с $2 по $3."),
        (new Regex(@"^Time slot from (.*) to (.*) conflicts with an existing schedule.$", RegexOptions.IgnoreCase), "Временной слот с $1 по $2 конфликтует с существующим расписанием.")
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
        { "User Not Found or you're account is banned from the system", "Không tìm thấy người dùng hoặc tài khoản đã bị chăn" },
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
        { "TheaterManager is required", "Quản lý rạp là bắt buộc" } ,
        {"The showtime list must not be left blank." , "Danh sách lịch chiếu không được để trống"} ,
        {"Schedules is not found or it's been deleted or Movie is Inactive" , "Không tìm thấy lịch chiếu hoặc lịch chiếu đã bị xóa hoặc phim không hoạt động."},
        {"Get Required Age Completed" , "Lấy danh sách độ tuổi thành công"},
        
        // Booking Messages
        {"Get cities list successfully", "Lấy danh sách thành phố thành công"},
        {"Get showtimes successfully", "Lấy lịch chiếu thành công"},
        {"Get seat map successfully", "Lấy sơ đồ ghế thành công"},
        {"Get pricing successfully", "Lấy thông tin giá thành công"},
        {"Booking created successfully", "Đặt vé thành công"},
        {"Payment completed successfully", "Thanh toán thành công"},
        {"Schedule not found", "Không tìm thấy lịch chiếu"},
        {"Schedule not found or movie is inactive", "Không tìm thấy lịch chiếu hoặc phim không hoạt động"},
        {"This showtime has already started", "Suất chiếu này đã bắt đầu"},
        {"One or more selected seats are invalid", "Một hoặc nhiều ghế đã chọn không hợp lệ"},
        {"One or more selected seats are already booked", "Một hoặc nhiều ghế đã chọn đã được đặt"},
        {"Payment failed", "Thanh toán thất bại"},
        {"Order not found", "Không tìm thấy đơn hàng"},
        
        // Booking DTO Validations
        {"Schedule Id is required", "Mã lịch chiếu là bắt buộc"},
        {"Seat Ids are required", "Mã ghế là bắt buộc"},
        {"At least one seat must be selected", "Phải chọn ít nhất một ghế"},
        {"Invalid email format", "Định dạng email không hợp lệ"}
    };

    /// <summary>
    /// Dictionary mapping: exact en message -> ru translation
    /// </summary>
    private static readonly Dictionary<string, string> EnToRuTranslations = new(StringComparer.OrdinalIgnoreCase)
    {
        // =============================================
        // SUCCESS MESSAGES (BaseResponse.Message)
        // =============================================

        // Identity Access
        { "Login SuccessFully", "Вход выполнен успешно" },
        { "Register Successfully", "Регистрация прошла успешно" },
        { "Validate Successfully", "Валидация прошла успешно" },
        { "Change Password Completed", "Пароль успешно изменён" },
        { "Logged out successfully", "Выход выполнен успешно" },
        { "Token Has Expired", "Срок действия токена истёк" },

        // Cinema Management
        { "Add Cinema Completed", "Кинотеатр успешно добавлен" },
        { "Update Cinema Completed", "Кинотеатр успешно обновлён" },
        { "Get Cinema List SuccessFully", "Список кинотеатров получен успешно" },
        { "Cinema Infos", "Информация о кинотеатре" },

        // Auditorium Management
        { "Add Auditorium completed", "Зал успешно добавлен" },
        { "Update Auditorium completed", "Зал успешно обновлён" },
        { "Get auditorium completed", "Информация о зале получена успешно" },

        // Movie Management
        { "Add Movie Completed", "Фильм успешно добавлен" },
        { "Edit Movie Completed", "Фильм успешно обновлён" },
        { "Get Movies Info Success", "Информация о фильмах получена успешно" },
        { "Get Movie Info Successfully", "Информация о фильме получена успешно" },

        // Movie Format
        { "Movie Format Datas", "Данные форматов фильмов" },

        // Movie Schedules
        { "Create Movie Schedule Completed", "Расписание сеансов создано успешно" },

        // =============================================
        // ERROR MESSAGES (AppException / Errors)
        // =============================================

        // System Errors
        { "There's an error with the system", "Произошла системная ошибка" },
        { "There's a error with System", "Произошла системная ошибка" },
        { "System Error", "Системная ошибка" },
        { "Database Error", "Ошибка базы данных" },
        { "Method not supported", "Метод не поддерживается" },
        { "Multiple errors occurred", "Произошло несколько ошибок" },
        { "Missing One or more Fields", "Отсутствуют одно или несколько полей" },

        // Auth Errors
        { "User Not Found or you're account is banned from the system", "Пользователь не найден или аккаунт заблокирован" },
        { "Username or password is wrong", "Неверное имя пользователя или пароль" },
        { "User Role Not Found", "Роль пользователя не найдена" },
        { "Unauthorize", "Нет доступа" },
        { "You Don't Have Right To Access This Resources", "У вас нет прав для доступа к этому ресурсу" },
        { "Invalid User Type", "Неверный тип пользователя" },
        { "Cannot Find User Information", "Не удалось найти информацию о пользователе" },
        { "Old Password is Not Match !", "Старый пароль не совпадает!" },
        { "New Password is the same of old password !", "Новый пароль совпадает со старым!" },

        // Registration Errors
        { "Email Already Exits", "Email уже существует" },
        { "Identity Code is already Exits", "Идентификационный код уже существует" },

        // Cinema Errors
        { "Sorry, We can not find the cinema", "Извините, кинотеатр не найден" },

        // Auditorium Errors
        { "Error : Auditorium already exists", "Ошибка: Зал уже существует" },
        { "Duplicate Auditorium Number", "Номер зала дублируется" },
        { "Error : Can not find auditorium", "Ошибка: Зал не найден" },
        { "Auditorium Not Found", "Зал не найден" },

        // Movie Errors
        { "Movie Name is already in use", "Название фильма уже используется" },
        { "Movie Descriptions is already in use", "Описание фильма уже используется" },
        { "Movie Name already exists", "Название фильма уже существует" },
        { "Movie Description already exists", "Описание фильма уже существует" },
        { "Error uploading image to Cloudinary", "Ошибка загрузки изображения в Cloudinary" },
        { "Movie Duration Is Invalid Must be Higher than 0 and Lower than 500", "Длительность фильма должна быть от 1 до 500 минут" },

        // Schedule Errors
        { "Error Auditorium Not Found", "Ошибка: Зал не найден" },
        { "Cannot schedule show times for a past date or time.", "Нельзя назначить сеанс на прошедшую дату или время." },
        { "Overlapping schedules detected within the request.", "Обнаружено пересечение расписаний." },

        // BCrypt / Utility Errors
        { "Hashing password failed", "Ошибка хеширования пароля" },
        { "Validate password failed", "Ошибка валидации пароля" },

        // =============================================
        // VALIDATION MESSAGES (DTO Annotations)
        // =============================================

        // Cinema DTO Validations
        { "Cinema Location is Required", "Местоположение кинотеатра обязательно" },
        { "Cinema Location cannot exceed 50 characters", "Местоположение не должно превышать 50 символов" },
        { "Cinema Name is Required", "Название кинотеатра обязательно" },
        { "Cinema Name cannot exceed 50 characters", "Название не должно превышать 50 символов" },
        { "Cinema Hotline number is required", "Номер горячей линии обязателен" },
        { "Cinema cinemaHotlineNumber cannot exceed 50 characters", "Номер горячей линии не должен превышать 50 символов" },
        { "Cinema Description is Required", "Описание кинотеатра обязательно" },
        { "Release Date is Required", "Дата релиза обязательна" },

        // Auditorium DTO Validations
        { "Error Auditorium Number cannot be empty", "Ошибка: Номер зала не может быть пустым" },
        { "Auditorium Number must be between 3 and 10 characters", "Номер зала должен содержать от 3 до 10 символов" },
        { "Error Movie Format cannot be empty", "Ошибка: Формат фильма не может быть пустым" },
        { "Error Cinema cannot be empty", "Ошибка: Кинотеатр не может быть пустым" },
        { "Auditorium must have at least one seat", "Зал должен иметь хотя бы одно место" },
        { "Error Seat Number cannot be empty", "Ошибка: Номер места не может быть пустым" },
        { "Seat Number must be between 3 and 10 characters", "Номер места должен содержать от 3 до 10 символов" },
        { "coordX must be >= 0", "coordX должен быть >= 0" },
        { "coordY must be >= 0", "coordY должен быть >= 0" },

        // Movie DTO Validations
        { "Movie Required Age is required", "Возрастное ограничение фильма обязательно" },
        { "Movie Name is required", "Название фильма обязательно" },
        { "Movie Name length must be between 1 and 50 characters", "Название фильма должно содержать от 1 до 50 символов" },
        { "Movie Descriptions is required", "Описание фильма обязательно" },
        { "Movie Descriptions length must be between 1 and 200 characters", "Описание фильма должно содержать от 1 до 200 символов" },
        { "Movie Image is required", "Изображение фильма обязательно" },
        { "Movie Ended Date is required", "Дата окончания показа фильма обязательна" },

        // Schedule DTO Validations
        { "Auditorium Id is required", "ID зала обязателен" },
        { "TheaterManager is required", "Менеджер кинотеатра обязателен" },
        {"The showtime list must not be left blank.", "Список сеансов не может быть пустым"},
        {"Schedules is not found or it's been deleted or Movie is Inactive", "Расписание не найдено, удалено или фильм неактивен"},
        {"Get Required Age Completed", "Список возрастных ограничений получен успешно"},

        // Booking Messages
        {"Get cities list successfully", "Список городов получен успешно"},
        {"Get showtimes successfully", "Расписание сеансов получено успешно"},
        {"Get seat map successfully", "Схема мест получена успешно"},
        {"Get pricing successfully", "Информация о ценах получена успешно"},
        {"Booking created successfully", "Бронирование создано успешно"},
        {"Payment completed successfully", "Оплата прошла успешно"},
        {"Schedule not found", "Расписание не найдено"},
        {"Schedule not found or movie is inactive", "Расписание не найдено или фильм неактивен"},
        {"This showtime has already started", "Этот сеанс уже начался"},
        {"One or more selected seats are invalid", "Одно или несколько выбранных мест недействительны"},
        {"One or more selected seats are already booked", "Одно или несколько мест уже забронированы"},
        {"Payment failed", "Оплата не удалась"},
        {"Order not found", "Заказ не найден"},

        // Booking DTO Validations
        {"Schedule Id is required", "ID расписания обязателен"},
        {"Seat Ids are required", "ID мест обязательны"},
        {"At least one seat must be selected", "Необходимо выбрать хотя бы одно место"},
        {"Invalid email format", "Неверный формат email"},

        // Additional common messages
        {"Get user information successfully", "Информация о пользователе получена успешно"},
        {"Get Movie Genres Successfully", "Жанры фильмов получены успешно"},
        {"Get booking history successfully", "История бронирований получена успешно"},
        {"Delete Cinema Completed", "Кинотеатр успешно удалён"},
        {"Delete Auditorium completed", "Зал успешно удалён"},
        {"Google authentication failed", "Ошибка аутентификации Google"},
        {"Account with this email already exists. Please login using your original method.", "Аккаунт с таким email уже существует. Пожалуйста, войдите другим способом."},
        {"Failed to exchange Google authorization code", "Не удалось обменять код авторизации Google"},
        {"Failed to get user information from Google", "Не удалось получить информацию от Google"},
        {"Cannot edit this cinema because it has active Booked bookings. Please wait until all bookings are completed.", "Нельзя редактировать кинотеатр с активными бронированиями."},
        {"Cannot edit this auditorium because it has active Booked bookings. Please wait until all bookings are completed.", "Нельзя редактировать зал с активными бронированиями."},
        {"Cannot edit seat layout because seats have been used in orders.", "Нельзя изменить схему мест, так как места были использованы в заказах."}
    };

    /// <summary>
    /// Reverse dictionary: vi -> en (auto-generated)
    /// </summary>
    private static readonly Dictionary<string, string> ViToEnTranslations;

    /// <summary>
    /// Reverse dictionary: ru -> en (auto-generated)
    /// </summary>
    private static readonly Dictionary<string, string> RuToEnTranslations;

    static LocalizationService()
    {
        ViToEnTranslations = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        foreach (var kvp in EnToViTranslations)
        {
            if (!ViToEnTranslations.ContainsKey(kvp.Value))
            {
                ViToEnTranslations[kvp.Value] = kvp.Key;
            }
        }

        RuToEnTranslations = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        foreach (var kvp in EnToRuTranslations)
        {
            if (!RuToEnTranslations.ContainsKey(kvp.Value))
            {
                RuToEnTranslations[kvp.Value] = kvp.Key;
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

        // If requesting Russian
        if (lang == "ru")
        {
            // Try exact match from EnToRuTranslations (key is English)
            if (EnToRuTranslations.TryGetValue(key, out var ruValue))
                return ruValue;

            // If key is Vietnamese, find English via ViToEnTranslations, then translate to Russian
            if (ViToEnTranslations.TryGetValue(key, out var enViaVi) &&
                EnToRuTranslations.TryGetValue(enViaVi, out var ruViaEn))
                return ruViaEn;

            // Try Regex matches for Russian
            foreach (var regexTemplate in RegexTranslations)
            {
                var match = regexTemplate.Pattern.Match(key);
                if (match.Success)
                {
                    return regexTemplate.Pattern.Replace(key, regexTemplate.Replacement);
                }
            }

            // If key is already Russian, return as-is
            if (RuToEnTranslations.ContainsKey(key))
                return key;

            // No translation found, return original
            return key;
        }

        // If requesting English
        if (lang == "en")
        {
            // Check if it's already English (in our dictionaries)
            if (EnToViTranslations.ContainsKey(key) || EnToRuTranslations.ContainsKey(key))
                return key;

            // If it's Vietnamese, translate back to English
            if (ViToEnTranslations.TryGetValue(key, out var enValue))
                return enValue;

            // If it's Russian, translate back to English
            if (RuToEnTranslations.TryGetValue(key, out var enFromRu))
                return enFromRu;

            // No translation found, return original
            return key;
        }

        return key;
    }

    private string GetLanguageFromHeader()
    {
        var httpContext = _httpContextAccessor.HttpContext;
        if (httpContext == null) return DefaultLanguage;

        // 1. Check custom header X-Language (Highest Priority)
        if (httpContext.Request.Headers.TryGetValue(HeaderXLanguage, out var xLang))
        {
            var langValue = xLang.ToString().Trim().ToLower();
            if (SupportedLanguages.Contains(langValue))
                return langValue;
        }

        // 2. Fallback to standard Accept-Language header
        if (httpContext.Request.Headers.TryGetValue(HeaderAcceptLanguage, out var acceptLang))
        {
            // Parse: "en-US,en;q=0.9,vi;q=0.8" -> take the first one or find "vi" in the list
            var headerValue = acceptLang.ToString().ToLower();
            
            // Split by comma to get individual language preferences
            var languages = headerValue.Split(',')
                .Select(l => l.Split(';')[0].Split('-')[0].Trim())
                .Where(l => !string.IsNullOrEmpty(l));

            foreach (var lang in languages)
            {
                if (SupportedLanguages.Contains(lang))
                {
                    return lang;
                }
            }
        }

        return DefaultLanguage;
    }
}
