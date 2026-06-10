namespace Application.Common;

/// <summary>
/// Cổng lưu trữ ảnh (Cloudinary). Tách Application khỏi SDK lưu trữ và khỏi IFormFile của ASP.NET.
/// </summary>
public interface IImageStorage
{
    /// <summary>Tải ảnh lên, trả về (thành công, URL hoặc thông báo lỗi).</summary>
    Task<(bool Success, string UrlOrError)> UploadAsync(
        Stream content, string fileName, CancellationToken cancellationToken = default);

    /// <summary>Xoá ảnh theo URL. Trả về true nếu xoá thành công.</summary>
    Task<bool> DeleteAsync(string imageUrl, CancellationToken cancellationToken = default);
}
