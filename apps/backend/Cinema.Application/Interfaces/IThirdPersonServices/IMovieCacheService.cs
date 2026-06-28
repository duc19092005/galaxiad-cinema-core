using System;
using System.Threading.Tasks;

namespace Cinema.Application.Interfaces.IThirdPersonServices;

public interface IMovieCacheService
{
    Task<T?> GetAsync<T>(string key);
    Task SetAsync<T>(string key, T value, TimeSpan ttl);
    Task ClearMovieCatalogCacheAsync();
    Task ClearMovieDetailCacheAsync(Guid movieId);
    Task ClearUserCacheAsync(Guid userId);
}
