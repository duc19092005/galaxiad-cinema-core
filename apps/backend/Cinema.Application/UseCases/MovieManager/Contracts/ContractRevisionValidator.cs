using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Cinema.Application.Exceptions;
using Cinema.Domain.Entities.Contracts;
using Cinema.Domain.Enums;

namespace Cinema.Application.UseCases.MovieManager.Contracts;

public static class ContractRevisionValidator
{
    public static void Validate(ContractRevisionEntity revision)
    {
        if (revision.Documents.Count == 0)
            throw new AppException("Hồ sơ cần ít nhất một tài liệu đính kèm.", 422, "CONTRACT_NO_DOCUMENTS");
        if (revision.MovieLines.Count == 0)
            throw new AppException("Hồ sơ cần ít nhất một dòng phim.", 422, "CONTRACT_NO_MOVIE_LINES");
        if (!revision.DataReviewed)
            throw new AppException("Thông tin phim chưa được rà soát đầy đủ.", 422, "CONTRACT_DATA_NOT_REVIEWED");
        if (!revision.FinancialPolicyReviewed)
            throw new AppException("Chính sách tài chính chưa được xác nhận.", 422, "CONTRACT_POLICY_NOT_REVIEWED");

        foreach (var line in revision.MovieLines)
        {
            if (string.IsNullOrWhiteSpace(line.VietnameseTitle))
                throw new AppException("Tên tiếng Việt của phim không được để trống.", 422, "MOVIE_TITLE_REQUIRED");
            if (line.DurationMinutes <= 0)
                throw new AppException($"Thời lượng phim '{line.VietnameseTitle}' không hợp lệ.", 422, "MOVIE_DURATION_INVALID");
            if (line.LicenseStartAt >= line.LicenseEndAt)
                throw new AppException($"Thời hạn bản quyền '{line.VietnameseTitle}' không hợp lệ.", 422, "LICENSE_PERIOD_INVALID");
            if (line.CinemaScopeState == ContractScopeState.Unresolved)
                throw new AppException($"Phạm vi rạp của phim '{line.VietnameseTitle}' chưa được xử lý.", 422, "CINEMA_SCOPE_UNRESOLVED");
            if (line.CinemaScopeState == ContractScopeState.Specified && ParseIds(line.CinemaIdsJson).Count == 0)
                throw new AppException($"Phim '{line.VietnameseTitle}' thiếu danh sách rạp chỉ định.", 422, "CINEMA_SCOPE_EMPTY");
            if (line.FormatScopeState == ContractScopeState.Unresolved)
                throw new AppException($"Phạm vi định dạng của phim '{line.VietnameseTitle}' chưa được xử lý.", 422, "FORMAT_SCOPE_UNRESOLVED");
            if (line.FormatScopeState == ContractScopeState.Specified && ParseIds(line.FormatIdsJson).Count == 0)
                throw new AppException($"Phim '{line.VietnameseTitle}' thiếu danh sách định dạng chỉ định.", 422, "FORMAT_SCOPE_EMPTY");
            if (line.CinemaSharePercent + line.DistributorSharePercent != 100m)
                throw new AppException($"Tổng tỷ lệ chia doanh thu của '{line.VietnameseTitle}' phải bằng 100%.", 422, "REVENUE_SHARE_INVALID");
            if (!line.Reviewed)
                throw new AppException($"Dòng phim '{line.VietnameseTitle}' chưa được đánh dấu rà soát.", 422, "MOVIE_LINE_NOT_REVIEWED");
        }
    }

    public static string Hash(ContractRevisionEntity revision)
    {
        var canonical = new
        {
            revision.ContractId,
            revision.RevisionNumber,
            documents = revision.Documents.OrderBy(x => x.FileName).Select(x => new { x.FileName, x.Sha256, x.FileSize }),
            movieLines = revision.MovieLines.OrderBy(x => x.VietnameseTitle).Select(x => new
            {
                x.VietnameseTitle,
                x.EnglishTitle,
                x.DurationMinutes,
                x.MovieRequiredAgeId,
                x.LicenseStartAt,
                x.LicenseEndAt,
                x.CinemaScopeState,
                x.FormatScopeState,
                x.CinemaIdsJson,
                x.FormatIdsJson,
                x.CinemaSharePercent,
                x.DistributorSharePercent,
                x.RevenueBasis,
                x.SettlementCycle
            })
        };
        var bytes = Encoding.UTF8.GetBytes(JsonSerializer.Serialize(canonical));
        return Convert.ToHexString(SHA256.HashData(bytes)).ToLowerInvariant();
    }

    public static List<Guid> ParseIds(string json)
    {
        try { return JsonSerializer.Deserialize<List<Guid>>(json) ?? []; }
        catch { return []; }
    }
}
