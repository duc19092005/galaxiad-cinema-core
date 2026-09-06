using Cinema.Application.Interfaces.Contracts;
using Microsoft.Extensions.Configuration;
using Minio;
using Minio.DataModel.Args;

namespace Cinema.Infrastructure.ExternalServices.Contracts;

public sealed class MinioContractObjectStorage : IContractObjectStorage
{
    private readonly IMinioClient _client;
    private readonly string _bucket;

    public MinioContractObjectStorage(IConfiguration configuration)
    {
        var endpoint = configuration["Minio:Endpoint"] ?? "localhost:9000";
        var accessKey = configuration["Minio:AccessKey"] ?? "cinema-local";
        var secretKey = configuration["Minio:SecretKey"] ?? "cinema-local-secret";
        _bucket = configuration["Minio:ContractBucket"] ?? "cinema-contracts";
        var useSsl = configuration.GetValue("Minio:UseSsl", false);
        _client = new MinioClient().WithEndpoint(endpoint).WithCredentials(accessKey, secretKey)
            .WithSSL(useSsl).Build();
    }

    public async Task PutAsync(string objectKey, Stream source, long length, string contentType, CancellationToken ct)
    {
        if (!await _client.BucketExistsAsync(new BucketExistsArgs().WithBucket(_bucket), ct))
            await _client.MakeBucketAsync(new MakeBucketArgs().WithBucket(_bucket), ct);
        await _client.PutObjectAsync(new PutObjectArgs().WithBucket(_bucket).WithObject(objectKey)
            .WithStreamData(source).WithObjectSize(length).WithContentType(contentType), ct);
    }

    public async Task<byte[]?> GetAsync(string objectKey, CancellationToken ct)
    {
        try
        {
            await using var output = new MemoryStream();
            await _client.GetObjectAsync(new GetObjectArgs().WithBucket(_bucket).WithObject(objectKey)
                .WithCallbackStream(stream => stream.CopyTo(output)), ct);
            return output.ToArray();
        }
        catch (Minio.Exceptions.ObjectNotFoundException) { return null; }
    }
}
