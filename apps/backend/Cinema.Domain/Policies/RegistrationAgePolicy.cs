using Cinema.Domain.Enums;

namespace Cinema.Domain.Policies;

public static class RegistrationAgePolicy
{
    public const int CustomerMinimumAge = 16;
    public const int StaffMinimumAge = 18;

    public static string? GetValidationMessage(DateTime dateOfBirth, RegisterUserTypeEnum registerUserType, DateTime? today = null)
    {
        var minimumAge = GetMinimumAge(registerUserType);

        return CalculateAge(dateOfBirth, today ?? DateTime.UtcNow) < minimumAge
            ? GetMinimumAgeMessage(registerUserType, minimumAge)
            : null;
    }

    public static int CalculateAge(DateTime dateOfBirth, DateTime today)
    {
        var birthDate = dateOfBirth.Date;
        var currentDate = today.Date;
        var age = currentDate.Year - birthDate.Year;

        if (birthDate > currentDate.AddYears(-age))
        {
            age--;
        }

        return age;
    }

    public static int GetMinimumAge(RegisterUserTypeEnum registerUserType)
    {
        return registerUserType switch
        {
            RegisterUserTypeEnum.Customer => CustomerMinimumAge,
            RegisterUserTypeEnum.Staff => StaffMinimumAge,
            _ => throw new ArgumentOutOfRangeException(nameof(registerUserType), registerUserType, "Invalid user type.")
        };
    }

    private static string GetMinimumAgeMessage(RegisterUserTypeEnum registerUserType, int minimumAge)
    {
        return registerUserType switch
        {
            RegisterUserTypeEnum.Customer => $"User Must Be At least {minimumAge} Years Old",
            RegisterUserTypeEnum.Staff => $"Staff Must Be At least {minimumAge} Years Old",
            _ => "Invalid User Type"
        };
    }
}
