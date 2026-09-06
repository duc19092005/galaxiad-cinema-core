using Cinema.Application.Dtos.Common;

namespace Cinema.Application.Interfaces.IThirdPersonServices;

public interface IImageStorageService
{
    Task<(bool Success, string Result)> PostImageAsync(FileUploadModel? file);
    Task<bool> DeleteImageAsync(string fileUrl);
}
