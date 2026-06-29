using Cinema.Domain.Constants;
using Cinema.Domain.Entities.CinemaInfos;
using Cinema.Domain.Entities.MovieInfos;
using Microsoft.EntityFrameworkCore;

namespace Cinema.Infrastructure.SeedData;

public static class CinemaAndMovieSeedData
{
    public static void AddSeedData(ModelBuilder modelBuilder)
    {
        var adminId = Guid.Parse("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c");
        var movieManagerId = Guid.Parse("b2c3d4e5-f6a7-8b9c-d0e1-f2a3b4c5d6e7");
        var theaterManagerId = Guid.Parse("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5");
        var facilitiesManagerId = Guid.Parse("f1a0e9b8-d7c6-5e4f-a3b2-1d0c9b8a7f6e");
        
        var defaultDate = new DateTime(2024, 1, 1);
        var now = new DateTime(2026, 3, 18, 0, 0, 0); // Use fixed date for stable migrations

        // 1. Seed Cinemas
        var cinemaHCMId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        var cinemaHNId = Guid.Parse("22222222-2222-2222-2222-222222222222");
        var cinemaBHDId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

        modelBuilder.Entity<CinemaInfoEntity>().HasData(
            new CinemaInfoEntity 
            { 
                CinemaId = cinemaHCMId, 
                CinemaName = "Galaxy Cinema Nguyễn Du",
                CinemaCity = "Hồ Chí Minh",
                CinemaLocation = "116 Nguyễn Du, Quận 1, TP. HCM",
                CinemaHotLineNumber = "19002235",
                CinemaDescription = "Không gian điện ảnh trẻ trung, hiện đại bậc nhất Sài Gòn.",
                Latitude = 10.7766,
                Longitude = 106.6953,
                IsActive = true,
                CreatedAt = defaultDate,
                UpdatedAt = defaultDate,
                CreatedByUserId = adminId,
                TheaterManagerId = theaterManagerId
            },
            new CinemaInfoEntity 
            { 
                CinemaId = cinemaHNId, 
                CinemaName = "Lotte Cinema West Lake",
                CinemaCity = "Hà Nội",
                CinemaLocation = "Tầng 4, Lotte Mall West Lake, 272 Võ Chí Công, Tây Hồ",
                CinemaHotLineNumber = "0243724666",
                CinemaDescription = "Cụm rạp cao cấp với công nghệ âm thanh Dolby Atmos.",
                Latitude = 21.0745,
                Longitude = 105.8115,
                IsActive = true,
                CreatedAt = defaultDate,
                UpdatedAt = defaultDate,
                CreatedByUserId = adminId,
                TheaterManagerId = adminId // Admin quản lý rạp này
            },
            new CinemaInfoEntity 
            { 
                CinemaId = cinemaBHDId, 
                CinemaName = "BHD Star Bitexco",
                CinemaCity = "Hồ Chí Minh",
                CinemaLocation = "Tầng 3 & 4, Tòa nhà Bitexco, 2 Hải Triều, Quận 1",
                CinemaHotLineNumber = "19002099",
                CinemaDescription = "Tọa lạc tại biểu tượng của thành phố, mang lại trải nghiệm đẳng cấp.",
                Latitude = 10.7715,
                Longitude = 106.7042,
                IsActive = true,
                CreatedAt = defaultDate,
                UpdatedAt = defaultDate,
                CreatedByUserId = adminId,
                FacilitiesManagerId = facilitiesManagerId // Facilities Manager quản lý rạp này
            }
        );

        // 2. Seed Auditoriums (Phòng chiếu)
        var auditorium1Id = Guid.Parse("33333333-3333-3333-3333-333333333333"); 
        var auditorium2Id = Guid.Parse("44444444-4444-4444-4444-444444444444"); 
        var auditorium3Id = Guid.Parse("55555555-5555-5555-5555-555555555555"); 

        modelBuilder.Entity<AuditoriumInfoEntities>().HasData(
            new AuditoriumInfoEntities { AuditoriumId = auditorium1Id, CinemaId = cinemaHCMId, AuditoriumNumber = "Cinema 1 (2D)", CreatedByUserId = theaterManagerId, CreatedAt = defaultDate, UpdatedAt = defaultDate, IsActive = true },
            new AuditoriumInfoEntities { AuditoriumId = auditorium2Id, CinemaId = cinemaHNId, AuditoriumNumber = "Cinema 2 (IMAX)", CreatedByUserId = adminId, CreatedAt = defaultDate, UpdatedAt = defaultDate, IsActive = true },
            new AuditoriumInfoEntities { AuditoriumId = auditorium3Id, CinemaId = cinemaBHDId, AuditoriumNumber = "Cinema 3 (3D)", CreatedByUserId = facilitiesManagerId, CreatedAt = defaultDate, UpdatedAt = defaultDate, IsActive = true }
        );

        modelBuilder.Entity<AuditoriumFormatInfos>().HasData(
            new AuditoriumFormatInfos { AuditoriumId = auditorium1Id, FormatId = movie_visual_constant.Format2D },
            new AuditoriumFormatInfos { AuditoriumId = auditorium2Id, FormatId = movie_visual_constant.Imax },
            new AuditoriumFormatInfos { AuditoriumId = auditorium3Id, FormatId = movie_visual_constant.Format3D }
        );

        // 3. Seed Seats (Ghế)
        var seats = new List<SeatsInfoEntity>();
        string[] rows = { "A", "B", "C", "D" };
        foreach (var audId in new[] { auditorium1Id, auditorium2Id, auditorium3Id })
        {
            for (int r = 0; r < 4; r++)
            {
                for (int c = 1; c <= 8; c++)
                {
                    seats.Add(new SeatsInfoEntity
                    {
                        SeatId = Guid.Parse($"{audId.ToString().Substring(0, 24)}{r:D4}{c:D8}"), // Deterministic ID
                        AuditoriumId = audId,
                        SeatNumber = $"{rows[r]}{c}",
                        ColIndex = c - 1,
                        RowIndex = r,
                        CoordX = (c - 1) * 60,
                        CoordY = r * 60
                    });
                }
            }
        }
        modelBuilder.Entity<SeatsInfoEntity>().HasData(seats);

        // 4. Seed Movies
        var movieId1 = Guid.Parse("66666666-6666-6666-6666-666666666666"); 
        var movieId2 = Guid.Parse("77777777-7777-7777-7777-777777777777"); 
        var movieId3 = Guid.Parse("88888888-8888-8888-8888-888888888888");

        modelBuilder.Entity<MovieInfoEntity>().HasData(
            new MovieInfoEntity
            {
                MovieId = movieId1,
                MovieName = "The Batman",
                MovieDescription = "Batman ventures into Gotham City's underworld when a sadistic killer leaves behind a trail of cryptic clues.",
                MovieImageUrl = "https://res.cloudinary.com/dp6utffzy/image/upload/v171000000/the_batman_poster",
                TrailerUrl = "https://www.youtube.com/watch?v=mqqft239u6Q",
                Director = "Matt Reeves",
                Actors = "Robert Pattinson, Zoë Kravitz, Paul Dano",
                MovieDuration = 176,
                MovieRequiredAgeId = movieRequiredAgeConstants.Teen13,
                ActiveAt = now.AddDays(-5),
                EndedDate = now.AddDays(25), 
                IsActive = true,
                CreatedAt = defaultDate,
                UpdatedAt = defaultDate,
                CreatedByUserId = movieManagerId,
                MovieManagerId = movieManagerId
            },
            new MovieInfoEntity
            {
                MovieId = movieId2,
                MovieName = "Oppenheimer",
                MovieDescription = "The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb.",
                MovieImageUrl = "https://res.cloudinary.com/dp6utffzy/image/upload/v171000000/oppenheimer_poster",
                TrailerUrl = "https://www.youtube.com/watch?v=uYPbbksJxIg",
                Director = "Christopher Nolan",
                Actors = "Cillian Murphy, Emily Blunt, Matt Damon",
                MovieDuration = 180,
                MovieRequiredAgeId = movieRequiredAgeConstants.Teen16,
                ActiveAt = now.AddDays(-1),
                EndedDate = now.AddDays(30),
                IsActive = true,
                CreatedAt = defaultDate,
                UpdatedAt = defaultDate,
                CreatedByUserId = adminId,
                MovieManagerId = adminId // Admin quản lý nội dung phim này
            },
            new MovieInfoEntity
            {
                MovieId = movieId3,
                MovieName = "Avatar: The Way of Water",
                MovieDescription = "Jake Sully lives with his newfound family formed on the extrasolar moon Pandora.",
                MovieImageUrl = "https://res.cloudinary.com/dp6utffzy/image/upload/v171000000/avatar_poster",
                TrailerUrl = "https://www.youtube.com/watch?v=d9MyW72ELq0",
                Director = "James Cameron",
                Actors = "Sam Worthington, Zoe Saldana, Sigourney Weaver",
                MovieDuration = 192,
                MovieRequiredAgeId = movieRequiredAgeConstants.Teen13,
                ActiveAt = now.AddDays(10), // Phim sắp chiếu
                EndedDate = now.AddDays(40),
                IsActive = true,
                CreatedAt = defaultDate,
                UpdatedAt = defaultDate,
                CreatedByUserId = movieManagerId,
                MovieManagerId = movieManagerId
            }
        );

        modelBuilder.Entity<MovieGenreMovieInfoEntity>().HasData(
            new MovieGenreMovieInfoEntity { MovieId = movieId1, MovieGenreId = movieGenreConstant.Action },
            new MovieGenreMovieInfoEntity { MovieId = movieId2, MovieGenreId = movieGenreConstant.Drama },
            new MovieGenreMovieInfoEntity { MovieId = movieId3, MovieGenreId = movieGenreConstant.SciFi }
        );

        modelBuilder.Entity<movieFormatMovieInfoEntity>().HasData(
            new movieFormatMovieInfoEntity { MovieId = movieId1, FormatId = movie_visual_constant.Format2D },
            new movieFormatMovieInfoEntity { MovieId = movieId2, FormatId = movie_visual_constant.Imax },
            new movieFormatMovieInfoEntity { MovieId = movieId3, FormatId = movie_visual_constant.Format3D }
        );

        // 4.1 Seed Movie - Cinema Authorization (Many-to-Many)
        modelBuilder.Entity<MovieCinemaEntity>().HasData(
            // Galaxy Cinema HCM (cinemaHCMId) chiếu Batman (movieId1) và Avatar (movieId3)
            new MovieCinemaEntity { MovieId = movieId1, CinemaId = cinemaHCMId },
            new MovieCinemaEntity { MovieId = movieId3, CinemaId = cinemaHCMId },

            // Lotte Cinema West Lake (cinemaHNId) chiếu Oppenheimer (movieId2) và Batman (movieId1)
            new MovieCinemaEntity { MovieId = movieId1, CinemaId = cinemaHNId },
            new MovieCinemaEntity { MovieId = movieId2, CinemaId = cinemaHNId },

            // BHD Star Bitexco (cinemaBHDId) chiếu Avatar (movieId3) và Batman (movieId1)
            new MovieCinemaEntity { MovieId = movieId1, CinemaId = cinemaBHDId },
            new MovieCinemaEntity { MovieId = movieId3, CinemaId = cinemaBHDId }
        );

        // 5. Seed Movie Schedules (Lịch chiếu) - Chỉ tạo 1 vài slot tiêu biểu
        var schedules = new List<MovieScheduleInfoEntity>();
        var scheduleDate = now.Date.AddDays(1); // Ưu tiên ngày mai
        var batmanScheduleId = Guid.Parse("99999999-9999-9999-9999-999999999991");
        var oppenheimerScheduleId = Guid.Parse("99999999-9999-9999-9999-999999999992");

        // Galaxy Cinema - The Batman
        schedules.Add(new MovieScheduleInfoEntity
        {
            MovieScheduleInfoId = batmanScheduleId, MovieId = movieId1, AuditoriumId = auditorium1Id,
            MovieFormatId = movie_visual_constant.Format2D,
            StartTime = scheduleDate.AddHours(19), EndedTime = scheduleDate.AddHours(19).AddMinutes(176),
            ActiveAt = scheduleDate.AddHours(19), IsActive = true, CreatedByUserId = theaterManagerId,
            CreatedAt = defaultDate, UpdatedAt = defaultDate
        });

        // Lotte Cinema - Oppenheimer (IMAX)
        schedules.Add(new MovieScheduleInfoEntity
        {
            MovieScheduleInfoId = oppenheimerScheduleId, MovieId = movieId2, AuditoriumId = auditorium2Id,
            MovieFormatId = movie_visual_constant.Imax,
            StartTime = scheduleDate.AddHours(20), EndedTime = scheduleDate.AddHours(20).AddMinutes(180),
            ActiveAt = scheduleDate.AddHours(20), IsActive = true, CreatedByUserId = adminId,
            CreatedAt = defaultDate, UpdatedAt = defaultDate
        });

        modelBuilder.Entity<MovieScheduleInfoEntity>().HasData(schedules);

        // 5.5 Seed Departments
        var departments = new List<DepartmentEntity>
        {
            // Galaxy Cinema Nguyễn Du
            new DepartmentEntity
            {
                DepartmentId = Guid.Parse("d1111111-1111-1111-1111-111111111111"),
                CinemaId = cinemaHCMId,
                DepartmentName = "Quầy vé",
                DepartmentType = DepartmentType.Cashier,
                CashierType = CashierType.TicketPOS,
                SharedUserId = null,
                IsActive = true
            },
            new DepartmentEntity
            {
                DepartmentId = Guid.Parse("d1111111-1111-1111-1111-222222222222"),
                CinemaId = cinemaHCMId,
                DepartmentName = "Quầy bắp nước",
                DepartmentType = DepartmentType.Cashier,
                CashierType = CashierType.FoodPOS,
                SharedUserId = null,
                IsActive = true
            },

            // Lotte Cinema West Lake
            new DepartmentEntity
            {
                DepartmentId = Guid.Parse("d2222222-2222-2222-2222-111111111111"),
                CinemaId = cinemaHNId,
                DepartmentName = "Quầy vé",
                DepartmentType = DepartmentType.Cashier,
                CashierType = CashierType.TicketPOS,
                SharedUserId = null,
                IsActive = true
            },
            new DepartmentEntity
            {
                DepartmentId = Guid.Parse("d2222222-2222-2222-2222-222222222222"),
                CinemaId = cinemaHNId,
                DepartmentName = "Quầy bắp nước",
                DepartmentType = DepartmentType.Cashier,
                CashierType = CashierType.FoodPOS,
                SharedUserId = null,
                IsActive = true
            },

            // BHD Star Bitexco
            new DepartmentEntity
            {
                DepartmentId = Guid.Parse("dbbbbbbb-bbbb-bbbb-bbbb-111111111111"),
                CinemaId = cinemaBHDId,
                DepartmentName = "Quầy vé",
                DepartmentType = DepartmentType.Cashier,
                CashierType = CashierType.TicketPOS,
                SharedUserId = null,
                IsActive = true
            },
            new DepartmentEntity
            {
                DepartmentId = Guid.Parse("dbbbbbbb-bbbb-bbbb-bbbb-222222222222"),
                CinemaId = cinemaBHDId,
                DepartmentName = "Quầy bắp nước",
                DepartmentType = DepartmentType.Cashier,
                CashierType = CashierType.FoodPOS,
                SharedUserId = null,
                IsActive = true
            }
        };

        modelBuilder.Entity<DepartmentEntity>().HasData(departments);

        // 6. Seed Cinema Shift Templates (Mẫu ca trực)
        var shiftTemplates = new List<CinemaShiftTemplateEntity>
        {
            // Galaxy Cinema Nguyễn Du
            new CinemaShiftTemplateEntity
            {
                ShiftTemplateId = Guid.Parse("a1111111-1111-1111-1111-111111111111"),
                CinemaId = cinemaHCMId,
                DepartmentId = Guid.Parse("d1111111-1111-1111-1111-111111111111"),
                ShiftName = "Ca Part-time Sáng",
                StartTime = new TimeSpan(8, 0, 0),
                EndTime = new TimeSpan(12, 0, 0),
                MaxStaff = 5,
                RoleId = userRoles.Cashier,
                IsActive = true
            },
            new CinemaShiftTemplateEntity
            {
                ShiftTemplateId = Guid.Parse("a1111111-1111-1111-1111-222222222222"),
                CinemaId = cinemaHCMId,
                DepartmentId = Guid.Parse("d1111111-1111-1111-1111-111111111111"),
                ShiftName = "Ca Part-time Chiều",
                StartTime = new TimeSpan(12, 0, 0),
                EndTime = new TimeSpan(16, 0, 0),
                MaxStaff = 5,
                RoleId = userRoles.Cashier,
                IsActive = true
            },
            new CinemaShiftTemplateEntity
            {
                ShiftTemplateId = Guid.Parse("a1111111-1111-1111-1111-333333333333"),
                CinemaId = cinemaHCMId,
                DepartmentId = Guid.Parse("d1111111-1111-1111-1111-111111111111"),
                ShiftName = "Ca Part-time Tối",
                StartTime = new TimeSpan(18, 0, 0),
                EndTime = new TimeSpan(22, 0, 0),
                MaxStaff = 5,
                RoleId = userRoles.Cashier,
                IsActive = true
            },
            new CinemaShiftTemplateEntity
            {
                ShiftTemplateId = Guid.Parse("a1111111-1111-1111-1111-444444444444"),
                CinemaId = cinemaHCMId,
                DepartmentId = Guid.Parse("d1111111-1111-1111-1111-222222222222"),
                ShiftName = "Ca Full-time Sáng",
                StartTime = new TimeSpan(8, 0, 0),
                EndTime = new TimeSpan(16, 0, 0),
                MaxStaff = 5,
                RoleId = userRoles.Cashier,
                IsActive = true
            },
            new CinemaShiftTemplateEntity
            {
                ShiftTemplateId = Guid.Parse("a1111111-1111-1111-1111-555555555555"),
                CinemaId = cinemaHCMId,
                DepartmentId = Guid.Parse("d1111111-1111-1111-1111-222222222222"),
                ShiftName = "Ca Full-time Chiều",
                StartTime = new TimeSpan(14, 0, 0),
                EndTime = new TimeSpan(22, 0, 0),
                MaxStaff = 5,
                RoleId = userRoles.Cashier,
                IsActive = true
            },

            // Lotte Cinema West Lake
            new CinemaShiftTemplateEntity
            {
                ShiftTemplateId = Guid.Parse("b2222222-2222-2222-2222-111111111111"),
                CinemaId = cinemaHNId,
                DepartmentId = Guid.Parse("d2222222-2222-2222-2222-111111111111"),
                ShiftName = "Ca Part-time Sáng",
                StartTime = new TimeSpan(8, 0, 0),
                EndTime = new TimeSpan(12, 0, 0),
                MaxStaff = 5,
                RoleId = userRoles.Cashier,
                IsActive = true
            },
            new CinemaShiftTemplateEntity
            {
                ShiftTemplateId = Guid.Parse("b2222222-2222-2222-2222-222222222222"),
                CinemaId = cinemaHNId,
                DepartmentId = Guid.Parse("d2222222-2222-2222-2222-111111111111"),
                ShiftName = "Ca Part-time Chiều",
                StartTime = new TimeSpan(12, 0, 0),
                EndTime = new TimeSpan(16, 0, 0),
                MaxStaff = 5,
                RoleId = userRoles.Cashier,
                IsActive = true
            },
            new CinemaShiftTemplateEntity
            {
                ShiftTemplateId = Guid.Parse("b2222222-2222-2222-2222-333333333333"),
                CinemaId = cinemaHNId,
                DepartmentId = Guid.Parse("d2222222-2222-2222-2222-111111111111"),
                ShiftName = "Ca Part-time Tối",
                StartTime = new TimeSpan(18, 0, 0),
                EndTime = new TimeSpan(22, 0, 0),
                MaxStaff = 5,
                RoleId = userRoles.Cashier,
                IsActive = true
            },
            new CinemaShiftTemplateEntity
            {
                ShiftTemplateId = Guid.Parse("b2222222-2222-2222-2222-444444444444"),
                CinemaId = cinemaHNId,
                DepartmentId = Guid.Parse("d2222222-2222-2222-2222-222222222222"),
                ShiftName = "Ca Full-time Sáng",
                StartTime = new TimeSpan(8, 0, 0),
                EndTime = new TimeSpan(16, 0, 0),
                MaxStaff = 5,
                RoleId = userRoles.Cashier,
                IsActive = true
            },
            new CinemaShiftTemplateEntity
            {
                ShiftTemplateId = Guid.Parse("b2222222-2222-2222-2222-555555555555"),
                CinemaId = cinemaHNId,
                DepartmentId = Guid.Parse("d2222222-2222-2222-2222-222222222222"),
                ShiftName = "Ca Full-time Chiều",
                StartTime = new TimeSpan(14, 0, 0),
                EndTime = new TimeSpan(22, 0, 0),
                MaxStaff = 5,
                RoleId = userRoles.Cashier,
                IsActive = true
            },

            // BHD Star Bitexco
            new CinemaShiftTemplateEntity
            {
                ShiftTemplateId = Guid.Parse("c3333333-3333-3333-3333-111111111111"),
                CinemaId = cinemaBHDId,
                DepartmentId = Guid.Parse("dbbbbbbb-bbbb-bbbb-bbbb-111111111111"),
                ShiftName = "Ca Part-time Sáng",
                StartTime = new TimeSpan(8, 0, 0),
                EndTime = new TimeSpan(12, 0, 0),
                MaxStaff = 5,
                RoleId = userRoles.Cashier,
                IsActive = true
            },
            new CinemaShiftTemplateEntity
            {
                ShiftTemplateId = Guid.Parse("c3333333-3333-3333-3333-222222222222"),
                CinemaId = cinemaBHDId,
                DepartmentId = Guid.Parse("dbbbbbbb-bbbb-bbbb-bbbb-111111111111"),
                ShiftName = "Ca Part-time Chiều",
                StartTime = new TimeSpan(12, 0, 0),
                EndTime = new TimeSpan(16, 0, 0),
                MaxStaff = 5,
                RoleId = userRoles.Cashier,
                IsActive = true
            },
            new CinemaShiftTemplateEntity
            {
                ShiftTemplateId = Guid.Parse("c3333333-3333-3333-3333-333333333333"),
                CinemaId = cinemaBHDId,
                DepartmentId = Guid.Parse("dbbbbbbb-bbbb-bbbb-bbbb-111111111111"),
                ShiftName = "Ca Part-time Tối",
                StartTime = new TimeSpan(18, 0, 0),
                EndTime = new TimeSpan(22, 0, 0),
                MaxStaff = 5,
                RoleId = userRoles.Cashier,
                IsActive = true
            },
            new CinemaShiftTemplateEntity
            {
                ShiftTemplateId = Guid.Parse("c3333333-3333-3333-3333-444444444444"),
                CinemaId = cinemaBHDId,
                DepartmentId = Guid.Parse("dbbbbbbb-bbbb-bbbb-bbbb-222222222222"),
                ShiftName = "Ca Full-time Sáng",
                StartTime = new TimeSpan(8, 0, 0),
                EndTime = new TimeSpan(16, 0, 0),
                MaxStaff = 5,
                RoleId = userRoles.Cashier,
                IsActive = true
            },
            new CinemaShiftTemplateEntity
            {
                ShiftTemplateId = Guid.Parse("c3333333-3333-3333-3333-555555555555"),
                CinemaId = cinemaBHDId,
                DepartmentId = Guid.Parse("dbbbbbbb-bbbb-bbbb-bbbb-222222222222"),
                ShiftName = "Ca Full-time Chiều",
                StartTime = new TimeSpan(14, 0, 0),
                EndTime = new TimeSpan(22, 0, 0),
                MaxStaff = 5,
                RoleId = userRoles.Cashier,
                IsActive = true
            }
        };

        modelBuilder.Entity<CinemaShiftTemplateEntity>().HasData(shiftTemplates);
    }
}
