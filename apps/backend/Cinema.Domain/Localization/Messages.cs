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
        public const string LoginSuccess = "Login successfully";
        public const string RegisterSuccess = "Registration completed successfully";
        public const string ValidateSuccess = "Validation completed successfully";
        public const string ChangePasswordCompleted = "Password changed successfully";
        public const string LogoutSuccess = "Logged out successfully";
        public const string GetInfoSuccess = "User information retrieved successfully";

        // Errors
        public const string UserNotFound = "User not found or the account has been banned.";
        public const string WrongCredentials = "Username or password is incorrect.";
        public const string RoleNotFound = "User role not found.";
        public const string Unauthorized = "Unauthorized";
        public const string Forbidden = "You do not have permission to access this resource.";
        public const string CannotDetermineIdentity = "Cannot determine user identity.";
        public const string InvalidUserType = "Invalid user type.";
        public const string UserInfoNotFound = "User information not found.";
        public const string OldPasswordNotMatch = "The old password is incorrect.";
        public const string NewPasswordSameAsOld = "The new password must be different from the old password.";
        public const string TokenExpired = "Token Has Expired";

        // Registration Errors
        public const string EmailAlreadyExists = "Email already exists.";
        public const string IdentityCodeAlreadyExists = "Identity code already exists.";
        
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
        public const string AddCompleted = "Auditorium created successfully.";
        public const string UpdateCompleted = "Auditorium updated successfully.";
        public const string DeleteCompleted = "Auditorium deleted successfully.";
        public const string GetCompleted = "Auditorium retrieved successfully.";
        
        // Errors
        public const string AlreadyExists = "Auditorium already exists.";
        public const string DuplicateNumber = "Auditorium number already exists.";
        public const string NotFound = "Auditorium not found.";
        public const string CannotFind = "Auditorium not found.";
        public const string CannotEditActiveBookings = "Cannot edit this auditorium because it has active Booked bookings. Please wait until all bookings are completed.";
        public const string CannotEditHasOrderHistory = "Cannot edit seat layout because seats have been used in orders.";
        public const string SeatLayoutMustHaveSeats = "The auditorium must have at least one seat.";
        public const string SeatLayoutIndexesMustBeNonNegative = "Seat row and column indexes must be non-negative.";
        public const string SeatLayoutDuplicateCoordinates = "Seat layout contains duplicate row and column coordinates.";
        public const string SeatLayoutDuplicateSeatNumbers = "Seat layout contains duplicate seat numbers.";
        public const string SeatLayoutMustBeFullRectangle = "The auditorium seat layout must be a full rectangular grid.";
        public const string NotFoundOrNoPermission = "Cinema not found or you do not have permission to manage it.";
        public const string NoManagedCinemaAssigned = "Your account is not assigned to manage any cinema.";
        public const string GetSelectionDataSuccess = "Auditorium selection data retrieved successfully.";
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
        public const string GetSelectionDataSuccess = "Movie selection data retrieved successfully.";

        // Errors
        public const string NameAlreadyInUse = "Movie Name is already in use";
        public const string DescriptionAlreadyInUse = "Movie Descriptions is already in use";
        public const string NameAlreadyExists = "Movie Name already exists";
        public const string DescriptionAlreadyExists = "Movie Description already exists";
        public const string ImageUploadError = "Error uploading image to Cloudinary";
        public const string InvalidDuration = "Movie Duration Is Invalid Must be Higher than 0 and Lower than 500";
        public const string AlreadyDeleted = "This movie has already been deleted.";
        public const string DeletedSuccessfully = "Movie deleted successfully.";
        public const string CannotEditActiveShowtimes = "Cannot edit movie when there are active showtimes or bookings.";
        public const string BannerUploadError = "Failed to upload banner image";

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
        public const string MovieScheduleUpdated = "Movie schedule updated successfully.";
        public const string MovieScheduleDeleted = "Movie schedule deleted successfully.";
        public const string MovieScheduleListRetrieved = "Movie schedule list retrieved successfully.";
        public const string NoNewSchedulesToAdd = "No new schedules to add.";

        // Errors
        public const string AuditoriumNotFound = "Error Auditorium Not Found";
        public const string PastDateNotAllowed = "Cannot schedule show times for a past date or time.";
        public const string OverlappingSchedules = "Overlapping schedules detected within the request.";
        public const string ScheduleListCannotBeEmpty = "The showtime list must not be left blank.";
        public const string CannotEditBookedShowtimes = "Cannot edit showtimes that already have paid bookings.";
        public const string CannotDeleteBookedShowtime = "Cannot delete a showtime that already has paid bookings.";
        public const string ScheduleAlreadyDeleted = "This showtime has already been deleted.";
        public const string CleaningGapRequired = "There must be at least 15 minutes between showtimes for auditorium cleanup.";
        public const string ShowtimeConflictWithCleanup = "This showtime conflicts with another showtime, including the 15-minute cleanup buffer.";
        public const string NoPermissionCinemaView = "You do not have permission to view this cinema.";

        public const string SchedulesIsNotFoundOrMovieIsInactivated =
            "Schedules is not found or it's has been deleted or Movie is Inactivated";

        // Dynamic errors
        public static string MovieAvailability(string movieName, string from, string to) =>
            $"Movie '{movieName}' is available from {from} to {to}.";

        public static string TimeSlotConflict(string startTime, string endTime) =>
            $"Time slot from {startTime} to {endTime} conflicts with an existing schedule.";

        public static string MovieNotAuthorizedForCinema(string movieName) =>
            $"Movie '{movieName}' is not authorized for this cinema.";
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
        public const string GetTicketSuccess = "Ticket information retrieved successfully.";

        // Errors
        public const string ScheduleNotFound = "Schedule not found";
        public const string ScheduleNotFoundOrInactive = "Schedule not found or movie is inactive";
        public const string ShowtimeAlreadyStarted = "This showtime has already started";
        public const string InvalidSeats = "One or more selected seats are invalid";
        public const string SeatsAlreadyBooked = "One or more selected seats are already booked";
        public const string AtLeastOneSeatMustBeSelected = "At least one seat must be selected.";
        public const string MaxTenTicketsPerOrder = "You can select up to 10 tickets per order.";
        public const string DuplicateSelectedSeats = "Duplicate selected seats are not allowed.";
        public const string SelectionLeavesIsolatedSeat = "Your seat selection leaves an isolated empty seat. Please choose an adjacent seat or select another row.";
        public const string PaymentFailed = "Payment failed";
        public const string OrderNotFound = "Order not found";
        public const string TicketNotFoundOrNotPaid = "Ticket not found or order has not been paid successfully.";
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
        public const string NoPermissionManageCinema = "You do not have permission to manage this cinema.";
        public const string NoPermissionManageWorkSchedule = "You do not have permission to manage work schedules for this cinema.";
        public const string NoPermissionPerformAction = "You do not have permission to perform this action.";
        public const string NoPermissionViewBranchStaff = "You do not have permission to view staff information in this cinema branch.";
        public const string NoPermissionManageBranchStaff = "You do not have permission to manage staff in this cinema branch.";
        public const string NoPermissionUpdateBranchStaff = "You can only update staff in your cinema branch.";
        public const string NoPermissionViewBranchPayroll = "You can only view payroll information for staff in your cinema branch.";
        public const string WorkScheduleNotFound = "Work schedule not found.";
        public const string ShiftDeletionRequestNotFound = "Shift deletion request not found.";
        public const string ShiftDeletionApprovalRequested = "This shift already has staff registrations. A deletion request has been sent to Admin for approval.";
        public const string ShiftScheduleDeleted = "Work schedule deleted successfully.";
        public const string StaffNotFound = "Staff member not found.";
        public const string CinemaOperatingHours = "Cinema working hours are from 06:00 to 02:00.";
        public const string FullTimeShiftMustBeEightHours = "A full-time shift must be exactly 8 hours long.";
        public const string PartTimeShiftMustBeFourHours = "A part-time shift must be exactly 4 hours long.";
        public const string ShiftTemplateCreated = "Shift template created successfully.";
        public const string StaffProfileUpdated = "Staff profile updated successfully.";
        public const string PartTimeCanOnlyRegisterShortShifts = "Part-time staff can only register part-time or rotating shifts under 4 hours.";
        public const string PartTimeCannotRegisterLongShift = "Part-time staff cannot register shifts longer than 4 hours.";
        public const string FullTimeShortShiftReasonRequired = "Full-time staff must provide a reason when registering a short shift under 8 hours.";
        public const string StaffCanOnlyRegisterOwnDepartment = "Staff can only register shifts in their own department.";
        public const string SystemBusyRegisterShift = "The system is busy. Please try registering again.";
        public const string ShiftOverlapsExistingRegistration = "This shift overlaps with another shift you already registered.";
        public const string ShiftFull = "This shift is already full.";
        public const string SelectShiftToRegister = "Please select a shift or work schedule to register.";
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
        public const string NoDepartmentAssigned = "Your account has not been assigned to any department yet.";
        public const string SelectStaffOrLoginPos = "Please select a staff member or login to POS for auto-detection.";
        public const string PosConfigNotFound = "POS configuration not found.";
        public const string NoFaceMatchFound = "No staff member with a matching face was found at this cinema.";
        public const string ShiftTimeConfigNotFound = "Shift time configuration not found in registration.";
        public static string WelcomeBackToShift(string username) => $"Welcome back to your shift, {username}!";
        public const string ApprovedShiftSuccessfully = "Approved shift successfully.";
        public const string RejectedShiftSuccessfully = "Rejected shift successfully.";
        public const string CancelledShiftSuccessfully = "Cancelled shift successfully.";
        public const string InvalidShiftRegistrationStatus = "Invalid shift registration status.";
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
        public static string ShiftSchedulesCreated(int count) => $"Work schedule created successfully ({count} shift(s)).";
        public static string PayrollCalculated(int shiftCount, decimal totalAmount) => $"Payroll calculated successfully. Total shifts: {shiftCount}, total amount: {totalAmount:N0} VND.";
        public static string PayrollPaid(decimal totalAmount) => $"Payroll payment confirmed successfully for {totalAmount:N0} VND.";
        public static string NoUncalculatedShiftsBefore(DateTime date) => $"There are no uncalculated shifts for this staff member before {date:dd/MM/yyyy}.";
    }

    // =============================================================
    //  COMMENTS / REVIEWS
    // =============================================================
    public static class Comment
    {
        public const string NotificationNotFound = "Notification not found.";
        public const string CommentNotFound = "Comment not found.";
        public const string ParentCommentNotFound = "Parent comment not found.";
        public const string CommentSaveFailed = "Failed to save comment.";
        public const string ReplySaveFailed = "Failed to save reply.";
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
        public const string OutOfStock = "Voucher is out of stock.";
        public const string InsufficientRewardPoints = "Insufficient reward points.";
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

    public static class Department
    {
        public const string NoPermissionManageCinema = "You do not have permission to manage this cinema.";
        public const string GetListSuccess = "Department list retrieved successfully.";
        public const string NotFound = "Department not found.";
        public const string NoPermissionToDelete = "You do not have permission to delete this department.";
        public const string DeactivatedSuccessfully = "Deactivated department successfully.";
        public const string CreatedSuccessfully = "Department created successfully.";
        public const string UpdatedSuccessfully = "Department updated successfully.";
        public const string DeletedSuccessfully = "Department deleted successfully.";
        public static string AlreadyExists(string name) => $"Department '{name}' already exists in this cinema.";
        public static string DeleteError(string detail) => $"Error deleting department: {detail}";
        public static string CreateError(string detail) => $"Error creating department: {detail}";
        public static string UpdateError(string detail) => $"Error updating department: {detail}";
    }

    public static class Chatbot
    {
        public const string MessageRequired = "Message must not be empty.";
        public const string NoShowtimesForDate = "No showtimes are available for the requested date. Upcoming showtime dates are listed below.";
        public const string NoPermissionForRole = "You do not have permission to perform this request with your current role.";
        public const string LoginRequired = "Please login to perform this request.";
        public const string SystemError = "System encountered an error processing your question. Please try again later.";
        public const string ProvideMovieOrDate = "Please provide a movie name or screening date so I can check available seats.";
        public const string NoMatchingSchedule = "No matching schedule found. You can ask \"When is movie ABC showing?\" to see the schedule.";
        public const string MultipleSchedulesFound = "Multiple schedules found. Which show do you want to check seats for?";
        public const string NoAuditoriumInfo = "Auditorium information not found.";
        public const string NoActivePromotions = "There are currently no active promotions.";
        public const string NoMatchingMovies = "No matching movies found.";
        public const string NoMoviesFound = "No movies found.";
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
        public const string ShiftDeletionApproved = "Shift deletion request approved and related staff have been notified.";
        public const string ShiftDeletionRejected = "Shift deletion request rejected and the manager has been notified.";
        public static string UserStatusUpdated(string status) => $"User status updated to {status} successfully.";
        public const string InvalidTransferType = "Invalid transfer type.";
        public const string GetUsersByRoleSuccess = "Get users list by role successfully.";
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
        public const string MustProvideItemIdOrSourceUserId = "Must provide ItemId or SourceUserId for authorization.";
        public const string EmailRequired = "Email is required.";
        public const string UserNameRequired = "User name is required.";
        public const string PasswordsDoNotMatch = "Passwords do not match.";
        public const string PasswordTooShort = "Password must be at least 8 characters.";
        public const string IdentityCodeInvalid = "Identity code must be exactly 12 digits.";
        public const string PhoneNumberInvalid = "Phone number must be exactly 10 digits.";
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
    //  PRICING PROMOTIONS
    // =============================================================
    public static class Promotion
    {
        public const string NotFound = "Pricing promotion not found.";
        public const string NotFoundBySlug = "Pricing promotion not found by slug.";
        public const string CreatedSuccessfully = "Pricing promotion created successfully.";
        public const string UpdatedSuccessfully = "Pricing promotion updated successfully.";
        public const string DeletedSuccessfully = "Pricing promotion deleted successfully.";
        public const string ToggledSuccessfully = "Pricing promotion status toggled successfully.";
        public const string InvalidDateRange = "End date must be after start date.";
        public const string CannotDeleteActive = "Cannot delete an active promotion.";
    }

    // =============================================================
    //  SHOWTIME RECOMMENDATION
    // =============================================================
    public static class ShowtimeRecommendation
    {
        public const string DateRangeInvalid = "The recommendation date range is invalid.";
        public const string NoActiveAuditorium = "No active auditorium is available for recommendations.";
        public const string NoActiveMovie = "No active movie is available for recommendations.";
        public const string NoCinemaPermission = "You do not have permission to manage this cinema.";
        public const string BatchNotFound = "Recommendation batch not found.";
        public const string RecommendationNotFound = "Recommendation not found.";
        public const string GenerateSuccess = "Showtime recommendations generated successfully.";
        public const string PreviewSuccess = "Showtime recommendation preview generated successfully.";
        public const string ApplySuccess = "Showtime recommendations applied successfully.";
        public const string DismissSuccess = "Showtime recommendation dismissed successfully.";
        public const string HistorySuccess = "Showtime recommendation history retrieved successfully.";
        public const string ApplyValidationFailed = "Some recommendations failed validation. Preview the result or enable apply valid only.";
        public const string ReadyToApply = "Ready to apply.";
        public const string NoSelectedRecommendationCanApply = "No selected recommendation can be applied safely.";
        public const string SuggestedShowtimeInPast = "The suggested showtime is in the past.";
        public const string MovieOutsideActivePeriod = "The movie is outside its active screening period.";
        public const string ExistingShowtimeConflict = "This suggestion conflicts with an existing showtime or cleanup buffer.";
        public const string SelectedSuggestionConflict = "This suggestion conflicts with another selected suggestion.";
        public const string RecentReleaseFreshness = "Recent release freshness can lift demand.";
        public const string EligibleActiveMovie = "Eligible active movie with available scheduling window.";
        public const string ExpectedDemandHigh = "Expected demand level is High.";
        public const string ExpectedDemandMedium = "Expected demand level is Medium.";
        public const string ExpectedDemandLow = "Expected demand level is Low.";
        public const string HighExpectedImpact = "High expected occupancy during prime time.";
        public const string ModerateExpectedImpact = "Moderate demand lift expected.";
        public const string ChatbotCinemaRequired = "Please select a cinema before requesting showtime recommendations.";

        public static string RecentTicketsSold(int count) => $"{count} tickets sold in the last 7 days.";
        public static string TotalPaidTickets(int count) => $"{count} total paid tickets in recent history.";
        public static string CustomerViews(int count) => $"{count} customer views indicate active interest.";
        public static string StrongAudienceRating(decimal rating) => $"Strong audience rating: {rating:0.0}/5.";
        public static string PrimeTimeScore(decimal score) => $"Prime-time score for this slot is {score:0}.";
        public static string AuditoriumSupports(string auditoriumNumber, string formatName) => $"Auditorium {auditoriumNumber} supports {formatName}.";
        public static string AppliedAuditDescription(int count) => $"Applied {count} showtime recommendation(s).";
        public static string GeneratedAuditDescription(int count) => $"Generated {count} showtime recommendation(s).";
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
