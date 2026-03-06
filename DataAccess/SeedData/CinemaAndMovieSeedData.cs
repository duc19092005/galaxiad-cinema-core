using DataAccess.Constants;
using DataAccess.Entities.CinemaInfos;
using DataAccess.Entities.MovieInfos;
using Microsoft.EntityFrameworkCore;

namespace DataAccess.SeedData;

public static class CinemaAndMovieSeedData
{
    public static void AddSeedData(ModelBuilder modelBuilder)
    {
        var adminId = Guid.Parse("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c");
        var movieManagerId = Guid.Parse("b2c3d4e5-f6a7-8b9c-d0e1-f2a3b4c5d6e7");
        var theaterManagerId = Guid.Parse("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5");
        
        var defaultDate = new DateTime(2024, 1, 1);
        var now = DateTime.Now;

        // 1. Seed Cinemas
        var cinemaHCMId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        var cinemaHNId = Guid.Parse("22222222-2222-2222-2222-222222222222");

        modelBuilder.Entity<CinemaInfoEntity>().HasData(
            new CinemaInfoEntity 
            { 
                CinemaId = cinemaHCMId, 
                CinemaName = "CGV Vincom Center Landmark 81",
                CinemaCity = "Hồ Chí Minh",
                CinemaLocation = "Tầng B1, Vincom Center Landmark 81, 772 Điện Biên Phủ, P.22, Q. Bình Thạnh",
                CinemaHotLineNumber = "1900 6017",
                CinemaDescription = "Rạp chiếu phim hiện đại nhất Việt Nam",
                IsActive = true,
                CreatedAt = defaultDate,
                CreatedByUserId = adminId,
                ManagerId = theaterManagerId
            },
            new CinemaInfoEntity 
            { 
                CinemaId = cinemaHNId, 
                CinemaName = "Lotte Cinema Landmark",
                CinemaCity = "Hà Nội",
                CinemaLocation = "Tầng 5 Keangnam Hanoi Landmark Tower, E6 Phạm Hùng",
                CinemaHotLineNumber = "0243837800",
                CinemaDescription = "Trải nghiệm điện ảnh đỉnh cao",
                IsActive = true,
                CreatedAt = defaultDate,
                CreatedByUserId = adminId,
                ManagerId = theaterManagerId
            }
        );

        // 2. Seed Auditoriums (Phòng chiếu)
        var auditorium1Id = Guid.Parse("33333333-3333-3333-3333-333333333333"); // HCM - Theo định dạng 2D
        var auditorium2Id = Guid.Parse("44444444-4444-4444-4444-444444444444"); // HCM - IMAX
        var auditorium3Id = Guid.Parse("55555555-5555-5555-5555-555555555555"); // HN - 3D

        modelBuilder.Entity<AuditoriumInfoEntities>().HasData(
            new AuditoriumInfoEntities { AuditoriumId = auditorium1Id, CinemaId = cinemaHCMId, AuditoriumNumber = "Phòng 1 (2D)", CreatedByUserId = theaterManagerId, CreatedAt = defaultDate, IsActive = true },
            new AuditoriumInfoEntities { AuditoriumId = auditorium2Id, CinemaId = cinemaHCMId, AuditoriumNumber = "Phòng 2 (IMAX)", CreatedByUserId = theaterManagerId, CreatedAt = defaultDate, IsActive = true },
            new AuditoriumInfoEntities { AuditoriumId = auditorium3Id, CinemaId = cinemaHNId, AuditoriumNumber = "Phòng 1 (3D)", CreatedByUserId = theaterManagerId, CreatedAt = defaultDate, IsActive = true }
        );

        // Map Auditorium với Format
        modelBuilder.Entity<AuditoriumFormatInfos>().HasData(
            new AuditoriumFormatInfos { AuditoriumId = auditorium1Id, FormatId = movie_visual_constant.Format2D },
            new AuditoriumFormatInfos { AuditoriumId = auditorium2Id, FormatId = movie_visual_constant.Imax },
            new AuditoriumFormatInfos { AuditoriumId = auditorium3Id, FormatId = movie_visual_constant.Format3D }
        );

        // 3. Seed Seats (Ghế) - Tạo một vài ghế tượng trưng cho mỗi phòng
        var seats = new List<SeatsInfoEntity>();
        string[] rows = { "A", "B", "C" };
        foreach (var audId in new[] { auditorium1Id, auditorium2Id, auditorium3Id })
        {
            for (int r = 0; r < 3; r++)
            {
                for (int c = 1; c <= 5; c++)
                {
                    seats.Add(new SeatsInfoEntity
                    {
                        SeatId = Guid.NewGuid(),
                        AuditoriumId = audId,
                        SeatNumber = $"{rows[r]}{c}",
                        ColIndex = c - 1,
                        RowIndex = r,
                        CoordX = (c - 1) * 50,
                        CoordY = r * 50
                    });
                }
            }
        }
        modelBuilder.Entity<SeatsInfoEntity>().HasData(seats);

        // 4. Seed Movies
        var movieId1 = Guid.Parse("66666666-6666-6666-6666-666666666666"); // Đang chiếu
        var movieId2 = Guid.Parse("77777777-7777-7777-7777-777777777777"); // Sắp chiếu

        modelBuilder.Entity<MovieInfoEntity>().HasData(
            new MovieInfoEntity
            {
                MovieId = movieId1,
                MovieName = "Dune: Part Two",
                MovieDescription = "Paul Atreides unites with Chani and the Fremen while on a warpath of revenge against the conspirators who destroyed his family.",
                MovieImageUrl = "https://res.cloudinary.com/dp6utffzy/image/upload/v170000000/dune2_poster",
                TrailerUrl = "https://www.youtube.com/watch?v=Way9Dexny3w",
                Director = "Denis Villeneuve",
                Actors = "Timothée Chalamet, Zendaya, Rebecca Ferguson",
                MovieDuration = 166,
                MovieRequiredAgeId = movieRequiredAgeConstants.Teen13,
                ActiveAt = now.AddDays(-10), // Đã chiếu được 10 ngày
                EndedDate = now.AddDays(20), // Còn chiếu 20 ngày nữa
                IsActive = true,
                CreatedAt = defaultDate,
                CreatedByUserId = movieManagerId,
                ManagerId = movieManagerId
            },
            new MovieInfoEntity
            {
                MovieId = movieId2,
                MovieName = "Kung Fu Panda 4",
                MovieDescription = "After Po is tapped to become the Spiritual Leader of the Valley of Peace, he needs to find and train a new Dragon Warrior.",
                MovieImageUrl = "https://res.cloudinary.com/dp6utffzy/image/upload/v170000000/kfp4_poster",
                TrailerUrl = "https://www.youtube.com/watch?v=_inKs4eeHiI",
                Director = "Mike Mitchell",
                Actors = "Jack Black, Awkwafina, Viola Davis",
                MovieDuration = 94,
                MovieRequiredAgeId = movieRequiredAgeConstants.AllAges,
                ActiveAt = now.AddDays(5), // 5 ngày nữa mới chiếu (Sắp chiếu)
                EndedDate = now.AddDays(35),
                IsActive = true,
                CreatedAt = defaultDate,
                CreatedByUserId = movieManagerId,
                ManagerId = movieManagerId
            }
        );

        // Map Movie với Genre và Format
        modelBuilder.Entity<MovieGenreMovieInfoEntity>().HasData(
            new MovieGenreMovieInfoEntity { MovieId = movieId1, MovieGenreId = movieGenreConstant.SciFi },
            new MovieGenreMovieInfoEntity { MovieId = movieId1, MovieGenreId = movieGenreConstant.Action },
            new MovieGenreMovieInfoEntity { MovieId = movieId2, MovieGenreId = movieGenreConstant.Animation },
            new MovieGenreMovieInfoEntity { MovieId = movieId2, MovieGenreId = movieGenreConstant.Comedy }
        );

        modelBuilder.Entity<movieFormatMovieInfoEntity>().HasData(
            new movieFormatMovieInfoEntity { MovieId = movieId1, FormatId = movie_visual_constant.Format2D },
            new movieFormatMovieInfoEntity { MovieId = movieId1, FormatId = movie_visual_constant.Imax },
            new movieFormatMovieInfoEntity { MovieId = movieId2, FormatId = movie_visual_constant.Format2D },
            new movieFormatMovieInfoEntity { MovieId = movieId2, FormatId = movie_visual_constant.Format3D }
        );

        // 5. Seed Movie Schedules (Lịch chiếu)
        var scheduleId1 = Guid.Parse("88888888-8888-8888-8888-888888888888");
        var scheduleId2 = Guid.Parse("99999999-9999-9999-9999-999999999999");
        var scheduleId3 = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        var scheduleId4 = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

        modelBuilder.Entity<MovieScheduleInfoEntity>().HasData(
            // --- HỒ CHÍ MINH ---
            // Dune Part 2 - 2D - HCM (Phòng 1) - Tầm 10 giờ tối
            new MovieScheduleInfoEntity
            {
                MovieScheduleInfoId = scheduleId1,
                MovieId = movieId1,
                AuditoriumId = auditorium1Id,
                MovieFormatId = movie_visual_constant.Format2D,
                StartTime = now.Date.AddHours(22), 
                EndedTime = now.Date.AddHours(22).AddMinutes(166),
                ActiveAt = now.Date.AddHours(22), 
                IsActive = true,
                CreatedAt = defaultDate,
                CreatedByUserId = theaterManagerId
            },
            // Dune Part 2 - IMAX - HCM (Phòng 2) - Tầm 11 giờ tối
            new MovieScheduleInfoEntity
            {
                MovieScheduleInfoId = scheduleId2,
                MovieId = movieId1,
                AuditoriumId = auditorium2Id,
                MovieFormatId = movie_visual_constant.Imax,
                StartTime = now.Date.AddHours(23),
                EndedTime = now.Date.AddHours(23).AddMinutes(166),
                ActiveAt = now.Date.AddHours(23), 
                IsActive = true,
                CreatedAt = defaultDate,
                CreatedByUserId = theaterManagerId
            },

            // --- HÀ NỘI ---
            // Dune Part 2 - 3D - HN (Phòng 1) - Tầm 10:30 tối
            new MovieScheduleInfoEntity
            {
                MovieScheduleInfoId = scheduleId4,
                MovieId = movieId1,
                AuditoriumId = auditorium3Id,
                MovieFormatId = movie_visual_constant.Format3D,
                StartTime = now.Date.AddHours(22).AddMinutes(30),
                EndedTime = now.Date.AddHours(22).AddMinutes(30).AddMinutes(166),
                ActiveAt = now.Date.AddHours(22).AddMinutes(30),
                IsActive = true,
                CreatedAt = defaultDate,
                CreatedByUserId = theaterManagerId
            },
            
            // Kung Fu Panda 4 - 3D - HN (Phòng 1) - 5 ngày tới
            new MovieScheduleInfoEntity
            {
                MovieScheduleInfoId = scheduleId3,
                MovieId = movieId2,
                AuditoriumId = auditorium3Id,
                MovieFormatId = movie_visual_constant.Format3D,
                StartTime = now.AddDays(5),
                EndedTime = now.AddDays(5).AddMinutes(94),
                ActiveAt = now.AddDays(5),
                IsActive = true,
                CreatedAt = defaultDate,
                CreatedByUserId = theaterManagerId
            }
        );
    }
}
