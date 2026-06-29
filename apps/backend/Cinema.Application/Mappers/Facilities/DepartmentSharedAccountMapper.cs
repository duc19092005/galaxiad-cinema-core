using System.Globalization;
using System.Text;
using Cinema.Application.Dtos.FacilitiesManager.Cinemas.Requests;
using Cinema.Domain.Entities.CinemaInfos;

namespace Cinema.Application.Mappers.Facilities;

public static class DepartmentSharedAccountMapper
{
    public const string DefaultPassword = "123";

    public static string BuildEmail(CreateDepartmentReqDto request, CinemaInfoEntity cinema)
    {
        var departmentSlug = ToSlug(request.DepartmentName);
        var cinemaSlug = ToSlug(cinema.CinemaName);
        return $"{departmentSlug}.{cinemaSlug}@cinema.com";
    }

    public static string BuildUserName(CreateDepartmentReqDto request, CinemaInfoEntity cinema)
    {
        return $"{request.DepartmentName} - {cinema.CinemaName}";
    }

    private static string ToSlug(string value)
    {
        var normalized = value.Normalize(NormalizationForm.FormD);
        var builder = new StringBuilder();

        foreach (var c in normalized)
        {
            var category = CharUnicodeInfo.GetUnicodeCategory(c);
            if (category == UnicodeCategory.NonSpacingMark) continue;

            var lower = char.ToLowerInvariant(c);
            if (lower == '\u0111') lower = 'd';
            if (char.IsLetterOrDigit(lower))
            {
                builder.Append(lower);
            }
            else if (builder.Length > 0 && builder[^1] != '.')
            {
                builder.Append('.');
            }
        }

        return builder.ToString().Trim('.');
    }
}
