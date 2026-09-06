namespace Cinema.Api.Services.Contracts;

public interface IContractObjectStorage
{
    Task PutAsync(string objectKey, Stream source, long length, string contentType, CancellationToken ct);
    Task<byte[]?> GetAsync(string objectKey, CancellationToken ct);
}
