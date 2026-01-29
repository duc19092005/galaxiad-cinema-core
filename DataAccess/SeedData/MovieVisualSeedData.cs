using DataAccess.Constants;
using DataAccess.Entities.CinemaInfos;
using DataAccess.Entities.MovieInfos;
using Microsoft.EntityFrameworkCore;

namespace DataAccess.SeedData;

public static class SeedDataMovieFormat
{
    public static void AddMovieFormatSeedData(ModelBuilder modelBuilder)
    {
        var adminId = Guid.Parse("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c");
        var defaultDate = new DateTime(2024, 1, 1);

        modelBuilder.Entity<MovieFormatInfoEntity>().HasData(new List<MovieFormatInfoEntity>()
        {
            new() {
                MovieFormatId = movie_visual_constant.Format2D,
                MovieFormatName = "2D",
                MovieFormatDescription = "Standard digital 2D format with crystal clear image quality.",
                MovieFormatPrice = 80000, 
                CreatedAt = defaultDate,
                CreatedByUserId = adminId
            },
            new() {
                MovieFormatId = movie_visual_constant.Format3D,
                MovieFormatName = "3D",
                MovieFormatDescription = "Immersive three-dimensional visual experience with specialized glasses.",
                MovieFormatPrice = 110000,
                CreatedAt = defaultDate,
                CreatedByUserId = adminId
            },
            new() {
                MovieFormatId = movie_visual_constant.Imax,
                MovieFormatName = "IMAX",
                MovieFormatDescription = "Giant screen format with unparalleled brightness and ultra-high resolution.",
                MovieFormatPrice = 250000,
                CreatedAt = defaultDate,
                CreatedByUserId = adminId
            },
            new() {
                MovieFormatId = movie_visual_constant.DolbyAtmos,
                MovieFormatName = "Dolby Atmos",
                MovieFormatDescription = "State-of-the-art surround sound technology for a lifelike audio experience.",
                MovieFormatPrice = 130000,
                CreatedAt = defaultDate,
                CreatedByUserId = adminId
            },
            new() {
                MovieFormatId = movie_visual_constant.ScreenX,
                MovieFormatName = "ScreenX",
                MovieFormatDescription = "A revolutionary 270-degree panoramic cinematic experience.",
                MovieFormatPrice = 160000,
                CreatedAt = defaultDate,
                CreatedByUserId = adminId
            },
            new() {
                MovieFormatId = movie_visual_constant.FourDX,
                MovieFormatName = "4DX",
                MovieFormatDescription = "Multi-sensory experience featuring motion seats, wind, water, and scents.",
                MovieFormatPrice = 180000,
                CreatedAt = defaultDate,
                CreatedByUserId = adminId
            },
            new() {
                MovieFormatId = movie_visual_constant.GoldClass,
                MovieFormatName = "Gold Class",
                MovieFormatDescription = "Premium luxury seating with in-theater dining and personalized service.",
                MovieFormatPrice = 300000,
                CreatedAt = defaultDate,
                CreatedByUserId = adminId
            },
            new() {
                MovieFormatId = movie_visual_constant.LAmour,
                MovieFormatName = "L'Amour",
                MovieFormatDescription = "Luxury bed-seating auditorium designed for ultimate comfort and couples.",
                MovieFormatPrice = 600000,
                CreatedAt = defaultDate,
                CreatedByUserId = adminId
            }
        });
    }
}
