using Microsoft.AspNetCore.Http;

namespace Cinema.Application.Interfaces.IThirdPersonServices;

public interface IImageStorageService
{
    Task<(bool Success, string Result)> PostImageAsync(IFormFile? file);
    Task<bool> DeleteImageAsync(string fileUrl);
}
