namespace Cinema.Domain.Localization;

/// <summary>
/// Centralized message constants for the entire application.
/// Instead of hardcoding strings like "User Not Found",
/// use Messages.Auth.UserNotFound to avoid typos and ensure translation support.
///
/// USAGE EXAMPLE:
///   throw new AppException(Messages.Auth.UserNotFound, 404, "UN01");
///   return new BaseResponse&lt;string&gt;() { Message = Messages.Cinema.AddCompleted };
///
/// DYNAMIC MESSAGES (with parameters):
///   throw new AppException(Messages.Cinema.AlreadyExistsName("CGV"), 400, "C01");
///   → English: "Error : There's already a cinema named CGV"
///   → Vietnamese (auto): "Lỗi: Đã có rạp chiếu phim có tên CGV"
/// </summary>
public static class Messages
{
    // =============================================================
    //  SYSTEM
    // =============================================================
    public static class System
    {
        public const string Error = "System Error";
        public const string GeneralError = "There's an error with the system";
        public const string DatabaseError = "Database Error";
        public const string MethodNotSupported = "Method not supported";
        public const string MissingFields = "Missing One or more Fields";
        public const string MultipleErrors = "Multiple errors occurred";
    }

    // =============================================================
    //  AUTHENTICATION & IDENTITY ACCESS
    // =============================================================
    public static class Auth
    {
        // Success
        public const string LoginSuccess = "Login SuccessFully";
        public const string RegisterSuccess = "Register Successfully";
        public const string ValidateSuccess = "Validate Successfully";
        public const string ChangePasswordCompleted = "Change Password Completed";
        public const string LogoutSuccess = "Logged out successfully";
        public const string GetInfoSuccess = "Get user information successfully";

        // Errors
        public const string UserNotFound = "User Not Found or you're account is banned from the system";
        public const string WrongCredentials = "Username or password is wrong";
        public const string RoleNotFound = "User Role Not Found";
        public const string Unauthorized = "Unauthorize";
        public const string Forbidden = "You Don't Have Right To Access This Resources";
        public const string InvalidUserType = "Invalid User Type";
        public const string UserInfoNotFound = "Cannot Find User Information";
        public const string OldPasswordNotMatch = "Old Password is Not Match !";
        public const string NewPasswordSameAsOld = "New Password is the same of old password !";
        public const string TokenExpired = "Token Has Expired";

        // Registration Errors
        public const string EmailAlreadyExists = "Email Already Exits";
        public const string IdentityCodeAlreadyExists = "Identity Code is already Exits";
        
        // Google OAuth Errors
        public const string GoogleAuthFailed = "Google authentication failed";
        public const string GoogleAccountExists = "Account with this email already exists. Please login using your original method.";
        public const string GoogleTokenExchangeFailed = "Failed to exchange Google authorization code";
        public const string GoogleUserInfoFailed = "Failed to get user information from Google";
    }

    // =============================================================
    //  CINEMA
    // =============================================================
    public static class Cinema
    {
        // Success
        public const string AddCompleted = "Add Cinema Completed";
        public const string UpdateCompleted = "Update Cinema Completed";
        public const string DeleteCompleted = "Delete Cinema Completed";
        public const string GetListSuccess = "Get Cinema List SuccessFully";
        public const string GetInfoSuccess = "Cinema Infos";

        // Errors
        public const string NotFound = "Sorry, We can not find the cinema";
        public const string CannotEditActiveBookings = "Cannot edit this cinema because it has active Booked bookings. Please wait until all bookings are completed.";

        // Dynamic errors (with parameters)
        public static string AlreadyExistsName(string name) =>
            $"Error : There's already a cinema named {name}";

        public static string AlreadyExistsDescription(string desc) =>
            $"Error : There's already a cinema Description {desc}";

        public static string AlreadyExistsLocation(string location) =>
            $"Error : There's already a cinema Location {location}";

        public static string AlreadyExistsHotline(string hotline) =>
            $"Error : There's already a cinema hotline Number {hotline}";

        public static string NotFoundById(Guid id) =>
            $"Error : There is no cinema with Id : {id}";
    }

    // =============================================================
    //  AUDITORIUM
    // =============================================================
    public static class Auditorium
    {
        // Success
        public const string AddCompleted = "Add Auditorium completed";
        public const string UpdateCompleted = "Update Auditorium completed";
        public const string DeleteCompleted = "Delete Auditorium completed";
        public const string GetCompleted = "Get auditorium completed";
        
        // Errors
        public const string AlreadyExists = "Error : Auditorium already exists";
        public const string DuplicateNumber = "Duplicate Auditorium Number";
        public const string NotFound = "Auditorium Not Found";
        public const string CannotFind = "Error : Can not find auditorium";
        public const string CannotEditActiveBookings = "Cannot edit this auditorium because it has active Booked bookings. Please wait until all bookings are completed.";
        public const string CannotEditHasOrderHistory = "Cannot edit seat layout because seats have been used in orders.";
    }

    // =============================================================
    //  MOVIE
    // =============================================================
    public static class Movie
    {
        // Success
        public const string AddCompleted = "Add Movie Completed";
        public const string EditCompleted = "Edit Movie Completed";
        public const string GetListSuccess = "Get Movies Info Success";
        public const string GetInfoSuccess = "Get Movie Info Successfully";
        public const string GetGenresSuccess = "Get Movie Genres Successfully";

        // Errors
        public const string NameAlreadyInUse = "Movie Name is already in use";
        public const string DescriptionAlreadyInUse = "Movie Descriptions is already in use";
        public const string NameAlreadyExists = "Movie Name already exists";
        public const string DescriptionAlreadyExists = "Movie Description already exists";
        public const string ImageUploadError = "Error uploading image to Cloudinary";
        public const string InvalidDuration = "Movie Duration Is Invalid Must be Higher than 0 and Lower than 500";

        // Dynamic errors (with parameters)
        public static string NotFoundById(Guid id) =>
            $"Movie with Id : {id} does not exist";

        public static string IdNotExistOrInactive(Guid id) =>
            $"Movie ID {id} does not exist or is inactive.";
    }

    // =============================================================
    //  MOVIE FORMAT
    // =============================================================
    public static class MovieFormat
    {
        // Success
        public const string GetDataSuccess = "Movie Format Datas";

        // Dynamic errors
        public static string InvalidFormatForMovie(string movieName, string formatName) =>
            $"Movie '{movieName}' does not support the format '{formatName}'.";
    }

    // =============================================================
    //  MOVIE SCHEDULE
    // =============================================================
    public static class Schedule
    {
        // Success
        public const string CreateCompleted = "Create Movie Schedule Completed";

        // Errors
        public const string AuditoriumNotFound = "Error Auditorium Not Found";
        public const string PastDateNotAllowed = "Cannot schedule show times for a past date or time.";
        public const string OverlappingSchedules = "Overlapping schedules detected within the request.";
        public const string ScheduleListCannotBeEmpty = "The showtime list must not be left blank.";

        public const string SchedulesIsNotFoundOrMovieIsInactivated =
            "Schedules is not found or it's has been deleted or Movie is Inactivated";
        // Dynamic errors
        public static string MovieAvailability(string movieName, string from, string to) =>
            $"Movie '{movieName}' is available from {from} to {to}.";

        public static string TimeSlotConflict(string startTime, string endTime) =>
            $"Time slot from {startTime} to {endTime} conflicts with an existing schedule.";
    }

    // =============================================================
    //  BOOKING
    // =============================================================
    public static class Booking
    {
        // Success
        public const string GetCitiesSuccess = "Get cities list successfully";
        public const string GetShowtimesSuccess = "Get showtimes successfully";
        public const string GetSeatMapSuccess = "Get seat map successfully";
        public const string GetPricingSuccess = "Get pricing successfully";
        public const string CreateBookingSuccess = "Booking created successfully";
        public const string PaymentSuccess = "Payment completed successfully";
        public const string GetHistorySuccess = "Get booking history successfully";

        // Errors
        public const string ScheduleNotFound = "Schedule not found";
        public const string ScheduleNotFoundOrInactive = "Schedule not found or movie is inactive";
        public const string ShowtimeAlreadyStarted = "This showtime has already started";
        public const string InvalidSeats = "One or more selected seats are invalid";
        public const string SeatsAlreadyBooked = "One or more selected seats are already booked";
        public const string PaymentFailed = "Payment failed";
        public const string OrderNotFound = "Order not found";
    }

    public static class RequiredAge
    {
        public const string GetRequiredAgeCompleted = "Get Required Age Completed";
    }

    // =============================================================
    //  UTILITY ERRORS
    // =============================================================
    public static class Utility
    {
        public const string HashingPasswordFailed = "Hashing password failed";
        public const string ValidatePasswordFailed = "Validate password failed";
    }
}
