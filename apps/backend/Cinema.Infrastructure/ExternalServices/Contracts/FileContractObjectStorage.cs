using Cinema.Application.Interfaces.Contracts;
using Microsoft.Extensions.Configuration;

namespace Cinema.Infrastructure.ExternalServices.Contracts;

public sealed class FileContractObjectStorage : IContractObjectStorage
{
    private readonly string _root;

    public FileContractObjectStorage(IConfiguration configuration)
    {
        _root = configuration["ContractStorage:RootPath"]
            ?? Path.Combine(AppContext.BaseDirectory, "App_Data", "contracts");
        Directory.CreateDirectory(_root);
    }

    public async Task PutAsync(string objectKey, Stream source, long length, string contentType, CancellationToken ct)
    {
        var target = Path.Combine(_root, objectKey.Replace('/', Path.DirectorySeparatorChar));
        Directory.CreateDirectory(Path.GetDirectoryName(target)!);
        await using var output = File.Create(target);
        await source.CopyToAsync(output, ct);
    }

    public async Task<byte[]?> GetAsync(string objectKey, CancellationToken ct)
    {
        var target = Path.Combine(_root, objectKey.Replace('/', Path.DirectorySeparatorChar));
        return File.Exists(target) ? await File.ReadAllBytesAsync(target, ct) : null;
    }
}
