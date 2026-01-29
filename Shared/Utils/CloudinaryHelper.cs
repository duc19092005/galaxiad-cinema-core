using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Shared.Utils;

public class cloudinaryHelper
{
    private readonly Cloudinary _cloudinary;
    
    private readonly ILogger<cloudinaryHelper> _logger;
    
    public cloudinaryHelper(IConfiguration configuration , ILogger<cloudinaryHelper> _logger)
    {
        var account = new Account(
            configuration["Cloudinary:CloudName"],
            configuration["Cloudinary:ApiKey"],
            configuration["Cloudinary:ApiSecret"]
        );

        _cloudinary = new Cloudinary(account);
        this._logger = _logger;
    }

    public async Task<(bool , string)> PostImageIntoCloudinary(IFormFile? file)
    {
        if (file == null || file.Length == 0)
        {
            return (false , "No file selected");
        }

        ImageUploadResult uploadResult;

        await using(var stream = file.OpenReadStream())
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
    
    public async Task<bool> DeleteImageFromCloudinary(string fileURL)
    {
        if (string.IsNullOrEmpty(fileURL))
        {
            _logger.LogError("No file selected");
            return false;
        }

        try
        {
            var uri = new Uri(fileURL);
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
            _logger.LogError("Delete failed Details : {0}" , result.Error.Message);
            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError("Delete failed Details : {0}" , ex.Message);
            return false;
        }
    }
}
