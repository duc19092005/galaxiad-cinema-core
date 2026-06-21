using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Cinema.Application.Interfaces.IThirdPersonServices;
using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Cinema.Infrastructure.Services;

public class CloudinaryImageStorageService : IImageStorageService
{
    private readonly Cloudinary _cloudinary;
    private readonly ILogger<CloudinaryImageStorageService> _logger;

    public CloudinaryImageStorageService(IConfiguration configuration, ILogger<CloudinaryImageStorageService> logger)
    {
        var account = new Account(
            configuration["Cloudinary:CloudName"],
            configuration["Cloudinary:ApiKey"],
            configuration["Cloudinary:ApiSecret"]
        );

        _cloudinary = new Cloudinary(account);
        _logger = logger;
    }

    public async Task<(bool Success, string Result)> PostImageAsync(IFormFile? file)
    {
        if (file == null || file.Length == 0)
        {
            return (false, "No file selected");
        }

        ImageUploadResult uploadResult;

        await using (var stream = file.OpenReadStream())
        {
            var uploadParams = new ImageUploadParams()
            {
                File = new FileDescription(file.FileName, stream),
                Folder = "MovieImages",
                Transformation = new Transformation().Quality("auto").FetchFormat("auto")
            };

            uploadResult = await _cloudinary.UploadAsync(uploadParams);
        }

        if (!string.IsNullOrEmpty(uploadResult.SecureUrl?.ToString()))
        {
            return (true, uploadResult.SecureUrl.ToString());
        }

        return (false, "Upload failed");
    }

    public async Task<bool> DeleteImageAsync(string fileUrl)
    {
        if (string.IsNullOrEmpty(fileUrl))
        {
            _logger.LogError("No file selected");
            return false;
        }

        try
        {
            var uri = new Uri(fileUrl);
            var segments = uri.Segments;

            var uploadIndex = Array.FindIndex(segments, s => s.StartsWith("upload/"));
            var publicIdWithExtension = string.Join("", segments.Skip(uploadIndex + 2));
            var publicId = Path.ChangeExtension(publicIdWithExtension, null);

            var deleteParams = new DeletionParams(publicId)
            {
                ResourceType = ResourceType.Image
            };

            var result = await _cloudinary.DestroyAsync(deleteParams);

            if (result.Result == "ok")
            {
                return true;
            }

            _logger.LogError("Delete failed Details : {0}", result.Error?.Message ?? "Unknown error");
            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError("Delete failed Details : {0}", ex.Message);
            return false;
        }
    }
}
