using Application.Common;
using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Infrastructure.MovieManager;

/// <summary>
/// Adapter lưu trữ ảnh dùng Cloudinary (hợp nhất logic upload/delete từ cloudinaryHelper cũ).
/// </summary>
public class CloudinaryImageStorage : IImageStorage
{
    private readonly Cloudinary _cloudinary;
    private readonly ILogger<CloudinaryImageStorage> _logger;

    public CloudinaryImageStorage(IConfiguration configuration, ILogger<CloudinaryImageStorage> logger)
    {
        var account = new Account(
            configuration["Cloudinary:CloudName"],
            configuration["Cloudinary:ApiKey"],
            configuration["Cloudinary:ApiSecret"]);
        _cloudinary = new Cloudinary(account);
        _logger = logger;
    }

    public async Task<(bool Success, string UrlOrError)> UploadAsync(
        Stream content, string fileName, CancellationToken cancellationToken = default)
    {
        if (content == null || content.Length == 0)
        {
            return (false, "No file selected");
        }

        var uploadParams = new ImageUploadParams
        {
            File = new FileDescription(fileName, content),
            Folder = "MovieImages",
            Transformation = new Transformation().Quality("auto").FetchFormat("auto")
        };

        var result = await _cloudinary.UploadAsync(uploadParams, cancellationToken);
        var url = result.SecureUrl?.ToString();
        return !string.IsNullOrEmpty(url) ? (true, url) : (false, "Upload failed");
    }

    public async Task<bool> DeleteAsync(string imageUrl, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrEmpty(imageUrl))
        {
            _logger.LogError("No file URL provided for deletion");
            return false;
        }

        try
        {
            var uri = new Uri(imageUrl);
            var segments = uri.Segments;
            var uploadIndex = Array.FindIndex(segments, s => s.StartsWith("upload/"));
            var publicIdWithExtension = string.Join("", segments.Skip(uploadIndex + 2));
            var publicId = Path.ChangeExtension(publicIdWithExtension, null);

            var result = await _cloudinary.DestroyAsync(new DeletionParams(publicId)
            {
                ResourceType = ResourceType.Image
            });

            if (result.Result == "ok")
            {
                return true;
            }
            _logger.LogError("Delete failed: {Detail}", result.Error?.Message ?? "Unknown error");
            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Delete failed for {Url}", imageUrl);
            return false;
        }
    }
}
