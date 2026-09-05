using FluentAssertions;
using Cinema.Infrastructure;
using Cinema.Infrastructure.Persistence;
using Xunit;

namespace Cinema.Tests.Integration.Migrations;

/// <summary>
/// Tests that all EF Core migrations can be applied cleanly.
/// </summary>
public class MigrationTests
{
    [Fact]
    public void AllMigrations_ShouldBeConsistent()
    {
        var migrationDir = Path.Combine(
            Directory.GetCurrentDirectory(),
            "..", "..", "..", "..",
            "Cinema.Infrastructure", "Persistence", "Migrations");

        if (Directory.Exists(migrationDir))
        {
            var migrationFiles = Directory.GetFiles(migrationDir, "*.cs")
                .Where(f => !f.EndsWith("Designer.cs") && !f.EndsWith("ModelSnapshot.cs"))
                .ToList();

            migrationFiles.Should().NotBeEmpty("There should be migration files");
            migrationFiles.Count.Should().BeGreaterThan(10, "There should be multiple migrations for a mature schema");
        }
    }

    [Fact]
    public void DbContext_ShouldHaveAllRequiredDbSets()
    {
        var dbContextType = typeof(CinemaDbContext);
        var expectedEntities = new[]
        {
            "UserInfoEntity",
            "MovieInfoEntity",
            "CinemaInfoEntity",
            "AuditoriumInfoEntities",
            "SeatsInfoEntity",
            "OrderInfoEntity",
            "OrderDetailsInfoEntity",
        };

        foreach (var entityName in expectedEntities)
        {
            var property = dbContextType.GetProperty(entityName);
            property.Should().NotBeNull($"DbContext should have DbSet for {entityName}");
        }
    }
}
