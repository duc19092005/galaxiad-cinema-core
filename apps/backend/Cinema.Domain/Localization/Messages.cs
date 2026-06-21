namespace Cinema.Domain.Localization;

/// <summary>
/// Centralized message constants for the entire application.
/// Instead of hardcoding strings like "User Not Found",
/// use Messages.Auth.UserNotFound to avoid typos and ensure translation support.
///
/// USAGE EXAMPLE:
///   throw new DomainException(Messages.Auth.UserNotFound, "UN01");
///   return new BaseResponse<string>() { Message = Messages.Cinema.AddCompleted };
///
/// DYNAMIC MESSAGES (with parameters):
///   throw new DomainException(Messages.Cinema.AlreadyExistsName("CGV"), "C01");
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
        public const string GetCinemasListSuccess = "Get cinemas list successfully";

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
    //  STAFF / SHIFTS
    // =============================================================
    public static class Staff
    {
        public const string AccountNotLinkedToCinema = "Your account is not linked to any specific cinema branch or has been deactivated.";
        public const string StaffProfileNotFound = "Staff profile not found or account has been locked.";
        public const string ShiftTemplateNotFound = "Shift template not found or has been deactivated.";
        public const string CannotRegisterPastShifts = "Cannot register shifts in the past.";
        public const string StartDateAfterEndDate = "Start date cannot be after end date.";
        public const string CinemaMismatch = "Can only register shifts at the cinema you work for.";
        public const string FaceNotRegistered = "Staff has not registered facial recognition. Please contact Admin/Manager.";
        public const string FaceVectorInvalid = "Face vector data is invalid (requires array of 128 floats).";
        public const string FaceVectorEncryptionError = "System error while decrypting staff face data.";
        public const string FaceVectorSampleInvalid = "System error: Stored face template data is invalid.";
        public const string FaceMismatch = "Facial verification failed (Distance: {0} > 0.6).";
        public const string NoApprovedShiftToday = "No approved shift schedules for today.";
        public const string AlreadyClockedIn = "Already clocked in for this shift and have not clocked out.";
        public const string MissingAESConfig = "System configuration error: Missing AES-256 key.";
        public const string MissingJWTConfig = "System configuration error: Missing JWT configuration.";
        public const string CannotGenerateToken = "System error: Unable to generate Access Token.";
        public const string ClockOutNotAllowed = "Clock-out time must be after clock-in time.";
        public const string NoActiveShiftToClockOut = "No active shift found to clock-out.";
        public const string AlreadyRegisteredForShift = "Staff has already been assigned to this shift.";
        public const string OverlappingShiftExists = "Staff has another shift overlapping this time slot.";
        public const string ShiftRegistrationNotFound = "Shift registration request not found.";
        public const string CannotCancelNonPending = "Can only cancel shifts that are in Pending status.";
        public const string RegistrationListInvalid = "Shift registration ID list is invalid.";
        public const string NoRegistrationsFound = "No registration requests found in the list.";
        public const string ShiftAlreadyFull = "This shift has reached maximum staff capacity.";
        public const string CannotAssignToDifferentCinema = "Cannot assign staff to a shift at a different cinema.";
        public const string SystemBusyProcessingShift = "System is busy processing this shift, try again later.";
        public const string NoPermissionShiftManage = "No permission to perform this management action.";
        public const string NoPermissionBranchStaffOnly = "Can only manage staff in your cinema branch.";
        public const string NoPermissionFaceRegister = "No permission to register face for this staff.";
        public const string NoPermissionBranchFaceOnly = "Can only register face for staff in your cinema branch.";
        public const string ClockInShiftTimeWindow = "Clock-in time is outside your shift window. Shift is {0} - {1}.";
        public const string ClockInSuccess = "Clock-in successful! Welcome {0} to your shift.";
        public const string ClockOutSuccess = "Clock-out successful! Hours: {0}h, Salary: {1:N0} VND.";
        public const string RegisterShiftSuccess = "Registered for {0} day(s), pending Manager approval.";
        public const string RegisterShiftPartialSuccess = "Registered: {0}. Failed: {1}.";
        public const string RegisterShiftAllFailed = "Registration failed for all selected days: {0}";
        public const string CancelShiftSuccess = "Cancelled shift request successfully.";
        public const string CancelBulkShiftSuccess = "Cancelled {0} shift requests successfully.";
        public const string RegisterFaceSuccess = "Facial recognition registered successfully.";
        public const string PayrollNotFound = "Payroll record not found.";
        public const string PayrollAlreadyPaid = "This payroll has already been paid.";
        public const string PayrollNoPermission = "No permission to manage payroll.";
        public const string PayrollBranchOnly = "Can only manage payroll at your cinema branch.";
    }

    // =============================================================
    //  COMMENTS / REVIEWS
    // =============================================================
    public static class Comment
    {
        public const string ShowtimeNotFinished = "You can comment after the showtime has ended.";
        public const string NoPaidTicket = "You need a paid ticket for this movie to comment.";
        public const string AlreadyReviewed = "You have already reviewed this movie.";
        public const string UnderModeration = "Your comment is pending moderation.";
        public const string ReplyUnderModeration = "Your reply is pending moderation.";
        public const string CommentDeleted = "Comment deleted successfully.";
        public const string GetListSuccess = "Get comments successfully.";
        public const string GetNotificationsSuccess = "Get notifications successfully.";
        public const string GetTopRatedSuccess = "Get top rated movies successfully.";
        public const string GetTrendingSuccess = "Get trending movies successfully.";
        public const string MarkReadSuccess = "Notification marked as read.";
        public const string CreateError = "Error saving comment.";
    }

    // =============================================================
    //  VOUCHER
    // =============================================================
    public static class Voucher
    {
        public const string NameAlreadyExists = "Voucher name already exists";
        public const string RoleDoesNotExist = "Role does not exist";
        public const string NotFound = "Voucher not found";
        public const string ExpiredOrNotActive = "Voucher has expired or is not yet active";
        public const string UserNotFound = "User not found";
        public const string NotEligible = "User is not eligible for this voucher (role mismatch)";
        public const string GuestsCannotApply = "Guests cannot apply vouchers.";
        public const string InvalidOrUsed = "Voucher is invalid or has already been used.";
        public const string ExpiredOrInactive = "Voucher has expired or is not active yet.";
    }

    // =============================================================
    //  CATALOG
    // =============================================================
    public static class Catalog
    {
        public const string Success = "Success";
        public const string GetMoviesSuccess = "Get movies list successfully";
        public const string GetCinemasSuccess = "Get cinemas list successfully";
        public const string GetNearestCinemasSuccess = "Get nearest cinemas successfully.";
        public const string GetDatesSuccess = "Get dates successfully";
        public const string GetScheduleDatesSuccess = "Get schedule dates successfully";
        public const string GetScheduleDetailsSuccess = "Get schedule details successfully";
        public const string GetMovieDetailSuccess = "Get movie detail successfully";
        public const string GetAuditoriumDetailSuccess = "Get auditorium detail successfully";
        public const string AuditoriumNotFound = "Auditorium info not found for this schedule.";
        public const string GetSearchResultsSuccess = "Search results retrieved";
        public const string FilterSchedulesSuccess = "Filter movies and schedules successfully";
    }

    // =============================================================
    //  ADMIN - USER MANAGEMENT
    // =============================================================
    public static class Admin
    {
        public const string UserNotFound = "User not found.";
        public const string CinemaNotFound = "Cinema not found.";
        public const string UserMustBeStaff = "User must be a staff member or manager.";
        public const string AssignedCinemaSuccess = "Assigned cinema successfully.";
        public const string PortraitRequired = "Portrait image is required.";
        public const string PortraitUpdated = "Portrait image updated successfully.";
        public const string UserAccountCreated = "User account created successfully.";
        public const string GetAllUsersSuccess = "Get all users successfully.";
        public const string RoleNotFound = "Role not found.";
        public const string StaffRolesUpdated = "Staff roles updated successfully.";
        public const string GetScheduleJobsSuccess = "Get schedule jobs list successfully";
        public const string GetAuditLogsSuccess = "Get audit logs successfully.";
        public const string GetDashboardSuccess = "Get management dashboard successfully.";
        public const string GetManagedItemsSuccess = "Get managed items list successfully.";
        public const string PermissionNotAllowed = "ApproveShift can only be assigned to Admin or TheaterManager.";
        public const string PermissionsUpdated = "Permissions updated for role {0}.";
        public const string PermissionsInvalid = "One or more permissions are invalid.";
    }

    // =============================================================
    //  VALIDATION
    // =============================================================
    public static class Validation
    {
        public const string AgeMustBeBetween16And80 = "Age must be between 16 and 80.";
        public const string UpdateProfileSuccess = "Update personal information successfully.";
        public const string UserMustBeAtLeastYearsOld = "User must be at least {0} years old.";
        public const string StaffMustBeAtLeastYearsOld = "Staff must be at least {0} years old.";
        public const string InvalidUserType = "Invalid user type.";
        public const string InvalidCustomerType = "Invalid customer type.";
        public const string GuestBookingRequiresInfo = "Guest booking requires Customer Name and Email.";
    }

    // =============================================================
    //  PLATFORM
    // =============================================================
    public static class Platform
    {
        public const string GoogleLoginUrlGenerated = "Google login URL generated successfully";
        public const string InvalidPlatform = "Invalid platform. Use 'web' or 'mobile'";
        public const string BannerUploadFailed = "Failed to upload banner image";
    }

    // =============================================================
    //  RECOMMENDATION
    // =============================================================
    public static class Recommendation
    {
        public const string PopularRecommendations = "Popular recommendations";
        public const string BehaviorBased = "Behavior-based recommendations";
        public const string SurveyNotCompleted = "Survey not completed";
        public const string SurveyCompleted = "Survey completed";
        public const string SavedPreferences = "Saved recommendation preferences";
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
