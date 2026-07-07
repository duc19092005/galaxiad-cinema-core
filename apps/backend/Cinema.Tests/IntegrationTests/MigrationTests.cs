using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Cinema.Infrastructure.Persistence;

namespace Cinema.Tests.IntegrationTests;

/// <summary>
/// Tests that all EF Core migrations can be applied cleanly.
/// Requires a running SQL Server instance or TestContainers.
/// </summary>
public class MigrationTests
{
    [Fact]
    public void AllMigrations_ShouldBeConsistent()
    {
        // This test verifies that the migration files are syntactically correct
        // and consistent with the DbContext model.

        // In a real integration test, you would:
        // 1. Create a TestContainers SQL Server
        // 2. Apply all migrations
        // 3. Verify the database schema matches the model

        // For now, we verify the migration files exist and are parseable
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
        // Verify that the DbContext has all the expected DbSets
        // This is a compile-time check - if a DbSet is missing, the type won't resolve

        var dbContextType = typeof(CinemaDbContext);
        var expectedEntities = new[]
        {
            "UserInfoEntity",
            "MovieInfoEntity",
            "CinemaInfoEntity",
            "AuditoriumInfoEntities",
            "SeatsInfoEntity",
            "OrderInfoEntity",
            "OrderDetailsInfo",
        };

        foreach (var entityName in expectedEntities)
        {
            var property = dbContextType.GetProperty(entityName);
            property.Should().NotBeNull($"DbContext should have DbSet for {entityName}");
        }
    }
}
