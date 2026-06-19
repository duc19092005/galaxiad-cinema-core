namespace Cinema.Application.Interfaces.IThirdPersonServices;

public interface IRedisLockService
{
    Task<bool> AcquireLockAsync(string key, string value, TimeSpan expiration);
    Task<bool> ReleaseLockAsync(string key, string value);
}
