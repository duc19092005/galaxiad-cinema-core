using Cinema.Domain.Entities.MovieInfos;
using Microsoft.EntityFrameworkCore;

namespace Cinema.Infrastructure.Persistence.SeedData;

public static class MovieCoverImageSeedData
{
    public static void AddMovieCoverImageSeedData(ModelBuilder modelBuilder)
    {
        var movieBatman = Guid.Parse("66666666-6666-6666-6666-666666666666");
        var movieOppenheimer = Guid.Parse("77777777-7777-7777-7777-777777777777");
        var movieAvatar = Guid.Parse("88888888-8888-8888-8888-888888888888");
        var createdAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc);

        modelBuilder.Entity<MovieCoverImageEntity>().HasData(
            // The Batman – cinematic multi-cover hero
            new MovieCoverImageEntity
            {
                MovieCoverImageId = Guid.Parse("c6666666-0001-4000-8000-000000000001"),
                MovieId = movieBatman,
                ImageUrl = "https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?auto=format&fit=crop&w=1920&q=80",
                SortOrder = 0,
                IsPrimary = true,
                Caption = "Gotham rain",
                IsActive = true,
                CreatedAt = createdAt
            },
            new MovieCoverImageEntity
            {
                MovieCoverImageId = Guid.Parse("c6666666-0001-4000-8000-000000000002"),
                MovieId = movieBatman,
                ImageUrl = "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1920&q=80",
                SortOrder = 1,
                IsPrimary = false,
                Caption = "Cinema noir",
                IsActive = true,
                CreatedAt = createdAt
            },
            new MovieCoverImageEntity
            {
                MovieCoverImageId = Guid.Parse("c6666666-0001-4000-8000-000000000003"),
                MovieId = movieBatman,
                ImageUrl = "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&w=1920&q=80",
                SortOrder = 2,
                IsPrimary = false,
                Caption = "Night streets",
                IsActive = true,
                CreatedAt = createdAt
            },
            new MovieCoverImageEntity
            {
                MovieCoverImageId = Guid.Parse("c6666666-0001-4000-8000-000000000004"),
                MovieId = movieBatman,
                ImageUrl = "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=1920&q=80",
                SortOrder = 3,
                IsPrimary = false,
                Caption = "Auditorium glow",
                IsActive = true,
                CreatedAt = createdAt
            },

            // Oppenheimer
            new MovieCoverImageEntity
            {
                MovieCoverImageId = Guid.Parse("c7777777-0001-4000-8000-000000000001"),
                MovieId = movieOppenheimer,
                ImageUrl = "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=1920&q=80",
                SortOrder = 0,
                IsPrimary = true,
                Caption = "Atomic horizon",
                IsActive = true,
                CreatedAt = createdAt
            },
            new MovieCoverImageEntity
            {
                MovieCoverImageId = Guid.Parse("c7777777-0001-4000-8000-000000000002"),
                MovieId = movieOppenheimer,
                ImageUrl = "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?auto=format&fit=crop&w=1920&q=80",
                SortOrder = 1,
                IsPrimary = false,
                Caption = "Desert sky",
                IsActive = true,
                CreatedAt = createdAt
            },
            new MovieCoverImageEntity
            {
                MovieCoverImageId = Guid.Parse("c7777777-0001-4000-8000-000000000003"),
                MovieId = movieOppenheimer,
                ImageUrl = "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1920&q=80",
                SortOrder = 2,
                IsPrimary = false,
                Caption = "Earth light",
                IsActive = true,
                CreatedAt = createdAt
            },

            // Avatar
            new MovieCoverImageEntity
            {
                MovieCoverImageId = Guid.Parse("c8888888-0001-4000-8000-000000000001"),
                MovieId = movieAvatar,
                ImageUrl = "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1920&q=80",
                SortOrder = 0,
                IsPrimary = true,
                Caption = "Biolume forest",
                IsActive = true,
                CreatedAt = createdAt
            },
            new MovieCoverImageEntity
            {
                MovieCoverImageId = Guid.Parse("c8888888-0001-4000-8000-000000000002"),
                MovieId = movieAvatar,
                ImageUrl = "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=1920&q=80",
                SortOrder = 1,
                IsPrimary = false,
                Caption = "Ocean world",
                IsActive = true,
                CreatedAt = createdAt
            },
            new MovieCoverImageEntity
            {
                MovieCoverImageId = Guid.Parse("c8888888-0001-4000-8000-000000000003"),
                MovieId = movieAvatar,
                ImageUrl = "https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?auto=format&fit=crop&w=1920&q=80",
                SortOrder = 2,
                IsPrimary = false,
                Caption = "Planet glow",
                IsActive = true,
                CreatedAt = createdAt
            }
        );
    }
}
