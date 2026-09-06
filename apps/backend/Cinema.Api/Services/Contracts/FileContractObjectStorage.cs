namespace Cinema.Api.Services.Contracts;

public sealed class FileContractObjectStorage : IContractObjectStorage
{
    private readonly string _root;
    public FileContractObjectStorage(IWebHostEnvironment environment) =>
        _root = Path.Combine(environment.ContentRootPath, "App_Data", "contracts");

    public async Task PutAsync(string objectKey, Stream source, long length, string contentType, CancellationToken ct)
    {
        var path = SafePath(objectKey);
        Directory.CreateDirectory(Path.GetDirectoryName(path)!);
        await using var target = File.Create(path);
        await source.CopyToAsync(target, ct);
    }

    public async Task<byte[]?> GetAsync(string objectKey, CancellationToken ct)
    {
        var path = SafePath(objectKey);
        return File.Exists(path) ? await File.ReadAllBytesAsync(path, ct) : null;
    }

    private string SafePath(string objectKey)
    {
        var path = Path.GetFullPath(Path.Combine(_root, objectKey.Replace('/', Path.DirectorySeparatorChar)));
        var root = Path.GetFullPath(_root) + Path.DirectorySeparatorChar;
        if (!path.StartsWith(root, StringComparison.OrdinalIgnoreCase)) throw new InvalidOperationException("Invalid object key.");
        return path;
    }
}
