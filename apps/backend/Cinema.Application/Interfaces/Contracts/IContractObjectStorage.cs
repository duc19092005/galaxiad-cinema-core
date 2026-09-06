namespace Cinema.Application.Interfaces.Contracts;

public interface IContractObjectStorage
{
    Task PutAsync(string objectKey, Stream source, long length, string contentType, CancellationToken ct);
    Task<byte[]?> GetAsync(string objectKey, CancellationToken ct);
}
