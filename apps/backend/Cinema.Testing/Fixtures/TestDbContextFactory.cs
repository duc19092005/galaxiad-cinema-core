using Cinema.Application.Abstractions.Security;
using Cinema.Infrastructure;
using Cinema.Infrastructure.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;

namespace Cinema.Testing.Fixtures;

public static class TestDbContextFactory
{
    private static UserIdentityCodeConstant CreateUserIdentityCodeConstant()
    {
        var configMock = new Mock<IConfiguration>();
        configMock.Setup(c => c["AES_256:Key"]).Returns("12345678901234567890123456789012");
        configMock.Setup(c => c["AES_256:IV"]).Returns("1234567890123456");

        var loggerMock = new Mock<ILogger<UserIdentityCodeConstant>>();
        var encryptionMock = new Mock<IEncryptionService>();
        encryptionMock.Setup(e => e.Encrypt(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()))
            .Returns<string, string, string>((plain, key, iv) => $"ENC_{plain}");

        return new UserIdentityCodeConstant(configMock.Object, loggerMock.Object, encryptionMock.Object);
    }

    public static CinemaDbContext CreateInMemory(string? databaseName = null)
    {
        databaseName ??= $"CinemaTest_{Guid.NewGuid()}";
        var options = new DbContextOptionsBuilder<CinemaDbContext>()
            .UseInMemoryDatabase(databaseName)
            .Options;

        return new CinemaDbContext(options, CreateUserIdentityCodeConstant());
    }

    public static CinemaDbContext CreateSqlServer(string connectionString)
    {
        var options = new DbContextOptionsBuilder<CinemaDbContext>()
            .UseSqlServer(connectionString)
            .Options;

        return new CinemaDbContext(options, CreateUserIdentityCodeConstant());
    }
}
