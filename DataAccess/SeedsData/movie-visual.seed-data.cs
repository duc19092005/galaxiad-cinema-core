using DataAccess.Constants;
using DataAccess.Entities.Cinema_Infos;
using DataAccess.Entities.Movies_Infos;
using Microsoft.EntityFrameworkCore;

namespace DataAccess.SeedsData;

public static class seedDataMovieFormat
{
    public static void AddMovieFormatSeedData(ModelBuilder modelBuilder)
    {
        var adminId = Guid.Parse("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c");
        var defaultDate = new DateTime(2024, 1, 1);

        modelBuilder.Entity<movie_format_info_entity>().HasData(new List<movie_format_info_entity>()
        {
            new() {
                movieFormatId = movie_visual_constant.Format2D,
                movieFormatName = "2D",
                movieFormatDescription = "Standard digital 2D format with crystal clear image quality.",
                movieFormatPrice = 80000, 
                createdAt = defaultDate,
                createdByUserId = adminId
            },
            new() {
                movieFormatId = movie_visual_constant.Format3D,
                movieFormatName = "3D",
                movieFormatDescription = "Immersive three-dimensional visual experience with specialized glasses.",
                movieFormatPrice = 110000,
                createdAt = defaultDate,
                createdByUserId = adminId
            },
            new() {
                movieFormatId = movie_visual_constant.Imax,
                movieFormatName = "IMAX",
                movieFormatDescription = "Giant screen format with unparalleled brightness and ultra-high resolution.",
                movieFormatPrice = 250000,
                createdAt = defaultDate,
                createdByUserId = adminId
            },
            new() {
                movieFormatId = movie_visual_constant.DolbyAtmos,
                movieFormatName = "Dolby Atmos",
                movieFormatDescription = "State-of-the-art surround sound technology for a lifelike audio experience.",
                movieFormatPrice = 130000,
                createdAt = defaultDate,
                createdByUserId = adminId
            },
            new() {
                movieFormatId = movie_visual_constant.ScreenX,
                movieFormatName = "ScreenX",
                movieFormatDescription = "A revolutionary 270-degree panoramic cinematic experience.",
                movieFormatPrice = 160000,
                createdAt = defaultDate,
                createdByUserId = adminId
            },
            new() {
                movieFormatId = movie_visual_constant.FourDX,
                movieFormatName = "4DX",
                movieFormatDescription = "Multi-sensory experience featuring motion seats, wind, water, and scents.",
                movieFormatPrice = 180000,
                createdAt = defaultDate,
                createdByUserId = adminId
            },
            new() {
                movieFormatId = movie_visual_constant.GoldClass,
                movieFormatName = "Gold Class",
                movieFormatDescription = "Premium luxury seating with in-theater dining and personalized service.",
                movieFormatPrice = 300000,
                createdAt = defaultDate,
                createdByUserId = adminId
            },
            new() {
                movieFormatId = movie_visual_constant.LAmour,
                movieFormatName = "L'Amour",
                movieFormatDescription = "Luxury bed-seating auditorium designed for ultimate comfort and couples.",
                movieFormatPrice = 600000,
                createdAt = defaultDate,
                createdByUserId = adminId
            }
        });
    }
}