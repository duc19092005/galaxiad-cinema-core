using BusinessLayer.Dtos;
using BusinessLayer.Dtos.Booking;
using BusinessLayer.Services.IdentityAccess;
using DataAccess;
using DataAccess.Entities.CinemaInfos;
using DataAccess.Entities.MovieInfos;
using DataAccess.Entities.UserInfos;
using DataAccess.Entities.Vouchers;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Shared.Enums;
using Shared.Exceptions;
using Shared.Localization;
using Shared.Utils;

namespace BusinessLayer.Services.Booking;

public class BookingService
{
    private readonly CinemaDbContext _dbContext;
    private readonly IUserContextService _userContextService;
    private readonly VnPayHelper _vnPayHelper;
    private readonly BusinessLayer.Services.ThirdPersonServices.IVnPayService _vnPayService;
    private readonly IConfiguration _configuration;
    private readonly ILogger<BookingService> _logger;

    public BookingService(
        CinemaDbContext dbContext,
        IUserContextService userContextService,
        VnPayHelper vnPayHelper,
        BusinessLayer.Services.ThirdPersonServices.IVnPayService vnPayService,
        IConfiguration configuration,
        ILogger<BookingService> logger)
    {
        _dbContext = dbContext;
        _userContextService = userContextService;
        _vnPayHelper = vnPayHelper;
        _vnPayService = vnPayService;
        _configuration = configuration;
        _logger = logger;
    }

    // ==========================================
    // 1. Lấy danh sách phim đang chiếu
    // ==========================================
    public async Task<BaseResponse<PagedResult<ResPublicMovieListDto>>> GetNowShowingMovies(string? keyword = null, int pageIndex = 1, int pageSize = 5)
    {
        var query = _dbContext.MovieInfoEntity
            .Where(x => !x.IsDeleted && x.IsActive && !x.IsCommingSoon);

        if (!string.IsNullOrEmpty(keyword))
        {
            var kw = keyword.ToLower();
            if (Guid.TryParse(keyword, out Guid cId))
            {
                query = query.Where(x => x.MovieScheduleInfoEntity.Any(s => 
                    !s.IsDeleted && s.AuditoriumInfoEntities!.CinemaId == cId));
            }
            else
            {
                query = query.Where(x => 
                    x.MovieName.ToLower().Contains(kw) || 
                    x.MovieScheduleInfoEntity.Any(s => !s.IsDeleted && s.AuditoriumInfoEntities!.CinemaInfoEntity.CinemaName.ToLower().Contains(kw))
                );
            }
        }

        var totalCount = await query.CountAsync();

        var movies = await query
            .OrderByDescending(x => x.CreatedAt)
            .Skip((pageIndex - 1) * pageSize)
            .Take(pageSize)
            .Select(x => new ResPublicMovieListDto
            {
                MovieId = x.MovieId,
                MovieName = x.MovieName,
                MovieImageUrl = x.MovieImageUrl,
                MovieDescription = x.MovieDescription,
                MovieDuration = x.MovieDuration,
                StartedDate = x.ActiveAt,
                EndedDate = x.EndedDate,
                MovieRequiredAgeSymbol = x.MovieRequiredAgeEntity.MovieRequiredAgeSymbol.Trim(),
                MovieGenres = x.MovieGenreMovieInfoEntity
                    .Select(g => g.MovieGenreInfoEntity.MovieGenreName).ToList(),
                MovieFormats = x.MovieFormatMovieInfoEntity
                    .Select(f => f.MovieFormatInfoEntity.MovieFormatName).ToList()
            })
            .AsNoTracking()
            .ToListAsync();

        return new BaseResponse<PagedResult<ResPublicMovieListDto>>
        {
            IsSuccess = true,
            Data = new PagedResult<ResPublicMovieListDto>(movies, totalCount, pageIndex, pageSize),
            Message = Messages.Movie.GetListSuccess
        };
    }

    // ==========================================
    // 2. Lấy danh sách phim sắp chiếu
    // ==========================================
    public async Task<BaseResponse<PagedResult<ResPublicMovieListDto>>> GetComingSoonMovies(string? keyword = null, int pageIndex = 1, int pageSize = 5)
    {
        var query = _dbContext.MovieInfoEntity
            .Where(x => !x.IsDeleted && x.IsCommingSoon);

        if (!string.IsNullOrEmpty(keyword))
        {
            var kw = keyword.ToLower();
            if (Guid.TryParse(keyword, out Guid cId))
            {
                // Correctly filter by cinemaId: movie MUST have at least one schedule at this cinema
                query = query.Where(x => x.MovieScheduleInfoEntity.Any(s => 
                    !s.IsDeleted && s.AuditoriumInfoEntities!.CinemaId == cId));
            }
            else
            {
                query = query.Where(x => 
                    x.MovieName.ToLower().Contains(kw) || 
                    x.MovieScheduleInfoEntity.Any(s => !s.IsDeleted && s.AuditoriumInfoEntities!.CinemaInfoEntity.CinemaName.ToLower().Contains(kw))
                );
            }
        }

        var totalCount = await query.CountAsync();

        var movies = await query
            .OrderByDescending(x => x.CreatedAt)
            .Skip((pageIndex - 1) * pageSize)
            .Take(pageSize)
            .Select(x => new ResPublicMovieListDto
            {
                MovieId = x.MovieId,
                MovieName = x.MovieName,
                MovieImageUrl = x.MovieImageUrl,
                MovieDescription = x.MovieDescription,
                MovieDuration = x.MovieDuration,
                StartedDate = x.ActiveAt,
                EndedDate = x.EndedDate,
                MovieRequiredAgeSymbol = x.MovieRequiredAgeEntity.MovieRequiredAgeSymbol.Trim(),
                MovieGenres = x.MovieGenreMovieInfoEntity
                    .Select(g => g.MovieGenreInfoEntity.MovieGenreName).ToList(),
                MovieFormats = x.MovieFormatMovieInfoEntity
                    .Select(f => f.MovieFormatInfoEntity.MovieFormatName).ToList()
            })
            .AsNoTracking()
            .ToListAsync();

        return new BaseResponse<PagedResult<ResPublicMovieListDto>>
        {
            IsSuccess = true,
            Data = new PagedResult<ResPublicMovieListDto>(movies, totalCount, pageIndex, pageSize),
            Message = Messages.Movie.GetListSuccess
        };
    }

    // ==========================================
    // 3. Lấy chi tiết phim
    // ==========================================
    public async Task<BaseResponse<ResPublicMovieDetailDto>> GetMovieDetail(Guid movieId)
    {
        var movie = await _dbContext.MovieInfoEntity
            .Where(x => x.MovieId == movieId && !x.IsDeleted)
            .Select(x => new ResPublicMovieDetailDto
            {
                MovieId = x.MovieId,
                MovieName = x.MovieName,
                MovieImageUrl = x.MovieImageUrl,
                MovieDescription = x.MovieDescription,
                TrailerUrl = x.TrailerUrl,
                Director = x.Director,
                Actors = x.Actors,
                MovieDuration = x.MovieDuration,
                StartedDate = x.ActiveAt,
                EndedDate = x.EndedDate,
                MovieRequiredAgeSymbol = x.MovieRequiredAgeEntity.MovieRequiredAgeSymbol.Trim(),
                MovieGenres = x.MovieGenreMovieInfoEntity
                    .Select(g => g.MovieGenreInfoEntity.MovieGenreName).ToList(),
                MovieFormats = x.MovieFormatMovieInfoEntity
                    .Select(f => f.MovieFormatInfoEntity.MovieFormatName).ToList()
            })
            .AsNoTracking()
            .FirstOrDefaultAsync();

        if (movie == null)
        {
            throw new NotFoundException(Messages.Movie.NotFoundById(movieId));
        }

        return new BaseResponse<ResPublicMovieDetailDto>
        {
            IsSuccess = true,
            Data = movie,
            Message = Messages.Movie.GetInfoSuccess
        };
    }

    // ==========================================
    // 3.1. Advanced Search / Combobox Dropdowns
    // ==========================================
    public async Task<BaseResponse<List<ResPublicSimpleCinemaDto>>> GetActiveCinemas()
    {
        var cinemas = await _dbContext.CinemaInfoEntity
            .Where(c => !c.IsDeleted && c.IsActive)
            .Select(c => new ResPublicSimpleCinemaDto
            {
                CinemaId = c.CinemaId,
                CinemaName = c.CinemaName
            })
            .AsNoTracking()
            .ToListAsync();

        return new BaseResponse<List<ResPublicSimpleCinemaDto>>
        {
            IsSuccess = true,
            Data = cinemas,
            Message = "Lấy danh sách rạp thành công"
        };
    }

    public async Task<BaseResponse<List<ResPublicSimpleMovieDto>>> GetActiveMovies()
    {
        var now = DateTime.Now;
        var movies = await _dbContext.MovieInfoEntity
            .Where(m => m.IsActive && !m.IsDeleted && m.EndedDate > now)
            .Select(m => new ResPublicSimpleMovieDto
            {
                MovieId = m.MovieId,
                MovieName = m.MovieName
            })
            .AsNoTracking()
            .ToListAsync();

        return new BaseResponse<List<ResPublicSimpleMovieDto>>
        {
            IsSuccess = true,
            Data = movies,
            Message = "Lấy danh sách phim thành công"
        };
    }

    // ==========================================
    // 3.2. Lấy dữ liệu cho Advanced Search (Ngày + Phim + Rạp)
    // ==========================================
    public async Task<BaseResponse<List<ResAdvancedSearchMovieDto>>> GetAdvancedSearchSchedules(DateTime? date, Guid? movieId, Guid? cinemaId)
    {
        var now = DateTime.Now;
        var targetDate = date ?? DateTime.Today;
        var startOfDay = targetDate.Date;
        var endOfDay = startOfDay.AddDays(1);

        var query = _dbContext.MovieScheduleInfoEntity
            .Where(s => !s.IsDeleted 
                        && s.StartTime >= startOfDay 
                        && s.StartTime < endOfDay
                        && s.StartTime > now);

        if (movieId.HasValue)
            query = query.Where(s => s.MovieId == movieId.Value);
        
        if (cinemaId.HasValue)
            query = query.Where(s => s.AuditoriumInfoEntities!.CinemaId == cinemaId.Value);

        var schedules = await query
            .Select(s => new
            {
                s.MovieScheduleInfoId,
                s.StartTime,
                s.EndedTime,
                s.MovieId,
                s.MovieInfoEntity!.MovieName,
                s.MovieInfoEntity.MovieImageUrl,
                s.MovieInfoEntity.MovieDuration,
                s.MovieInfoEntity.MovieDescription,
                MovieRequiredAgeSymbol = s.MovieInfoEntity.MovieRequiredAgeEntity.MovieRequiredAgeSymbol.Trim(),
                MovieGenres = s.MovieInfoEntity.MovieGenreMovieInfoEntity.Select(g => g.MovieGenreInfoEntity.MovieGenreName).ToList(),
                CinemaId = s.AuditoriumInfoEntities!.CinemaId,
                s.AuditoriumInfoEntities.CinemaInfoEntity.CinemaName,
                s.AuditoriumInfoEntities.CinemaInfoEntity.CinemaLocation,
                s.AuditoriumInfoEntities.CinemaInfoEntity.CinemaCity,
                FormatId = s.MovieFormatId,
                FormatName = s.MovieFormatInfoEntity!.MovieFormatName,
                s.AuditoriumId,
                AuditoriumNumber = s.AuditoriumInfoEntities.AuditoriumNumber
            })
            .AsNoTracking()
            .ToListAsync();

        var result = schedules.GroupBy(s => new { s.MovieId, s.MovieName, s.MovieImageUrl, s.MovieDuration, s.MovieRequiredAgeSymbol, s.MovieDescription })
            .Select(mGroup => new ResAdvancedSearchMovieDto
            {
                MovieId = mGroup.Key.MovieId,
                MovieName = mGroup.Key.MovieName,
                MovieImageUrl = mGroup.Key.MovieImageUrl,
                MovieDuration = mGroup.Key.MovieDuration,
                MovieRequiredAgeSymbol = mGroup.Key.MovieRequiredAgeSymbol,
                MovieDescription = mGroup.Key.MovieDescription,
                MovieGenres = mGroup.First().MovieGenres,
                Cinemas = mGroup.GroupBy(c => new { c.CinemaId, c.CinemaName, c.CinemaLocation, c.CinemaCity })
                    .Select(cGroup => new ResPublicCinemaShowtimeDto
                    {
                        CinemaId = cGroup.Key.CinemaId,
                        CinemaName = cGroup.Key.CinemaName,
                        CinemaLocation = cGroup.Key.CinemaLocation,
                        CinemaCity = cGroup.Key.CinemaCity,
                        FormatShowtimes = cGroup.GroupBy(f => new { f.FormatId, f.FormatName })
                            .Select(fGroup => new FormatShowtimeGroup
                            {
                                FormatId = fGroup.Key.FormatId,
                                FormatName = fGroup.Key.FormatName,
                                Showtimes = fGroup.Select(st => new ShowtimeSlot
                                {
                                    ScheduleId = st.MovieScheduleInfoId,
                                    StartTime = st.StartTime,
                                    EndedTime = st.EndedTime,
                                    AuditoriumId = st.AuditoriumId,
                                    AuditoriumNumber = st.AuditoriumNumber
                                }).OrderBy(st => st.StartTime).ToList()
                            }).ToList()
                    }).ToList()
            }).ToList();

        return new BaseResponse<List<ResAdvancedSearchMovieDto>>
        {
            IsSuccess = true,
            Data = result,
            Message = "Lọc danh sách phim và lịch chiếu thành công"
        };
    }

    // ==========================================
    // 4. Lấy danh sách thành phố có rạp
    // ==========================================
    public async Task<BaseResponse<List<ResPublicCityListDto>>> GetCities()
    {
        var cities = await _dbContext.CinemaInfoEntity
            .Where(x => !x.IsDeleted)
            .GroupBy(x => x.CinemaCity)
            .Select(g => new ResPublicCityListDto
            {
                CityName = g.Key,
                CinemaCount = g.Count()
            })
            .AsNoTracking()
            .ToListAsync();

        return new BaseResponse<List<ResPublicCityListDto>>
        {
            IsSuccess = true,
            Data = cities,
            Message = Messages.Booking.GetCitiesSuccess
        };
    }

    // ==========================================
    // 4.1 Lấy danh sách tất cả thể loại
    // ==========================================
    public async Task<BaseResponse<List<ResPublicGenreDto>>> GetGenres()
    {
        var genres = await _dbContext.Set<MovieGenreInfoEntity>()
            .Select(x => new ResPublicGenreDto
            {
                GenreId = x.MovieGenreId,
                GenreName = x.MovieGenreName,
                Description = x.MovieGenreDescription
            })
            .AsNoTracking()
            .ToListAsync();

        return new BaseResponse<List<ResPublicGenreDto>>
        {
            IsSuccess = true,
            Data = genres,
            Message = Messages.Movie.GetGenresSuccess
        };
    }

    // ==========================================
    // 5. Lấy danh sách rạp + lịch chiếu theo thành phố & phim
    // ==========================================
    public async Task<BaseResponse<List<ResPublicCinemaShowtimeDto>>> GetCinemaShowtimes(
        Guid movieId, string city, DateTime? date)
    {
        var targetDate = date ?? DateTime.Today;
        var startOfDay = targetDate.Date;
        var endOfDay = startOfDay.AddDays(1);
        var now = DateTime.Now;

        // Lấy tất cả schedule cho phim này, ở thành phố này, trong ngày này
        var cinemas = await _dbContext.CinemaInfoEntity
            .Where(c => !c.IsDeleted && c.CinemaCity == city)
            .Select(c => new ResPublicCinemaShowtimeDto
            {
                CinemaId = c.CinemaId,
                CinemaName = c.CinemaName,
                CinemaLocation = c.CinemaLocation,
                CinemaCity = c.CinemaCity,
                FormatShowtimes = c.AuditoriumInfoEntities
                    .Where(a => !a.IsDeleted)
                    .SelectMany(a => a.MovieScheduleInfoEntity
                        .Where(s => s.MovieId == movieId
                                    && !s.IsDeleted
                                    && s.StartTime >= startOfDay
                                    && s.StartTime < endOfDay
                                    && s.StartTime > now)
                        .Select(s => new
                        {
                            s.MovieFormatId,
                            FormatName = s.MovieFormatInfoEntity != null
                                ? s.MovieFormatInfoEntity.MovieFormatName
                                : "",
                            s.MovieScheduleInfoId,
                            s.StartTime,
                            s.EndedTime,
                            s.AuditoriumId,
                            AuditoriumNumber = a.AuditoriumNumber
                        }))
                    .GroupBy(x => new { x.MovieFormatId, x.FormatName })
                    .Select(g => new FormatShowtimeGroup
                    {
                        FormatId = g.Key.MovieFormatId,
                        FormatName = g.Key.FormatName,
                        Showtimes = g.Select(s => new ShowtimeSlot
                        {
                            ScheduleId = s.MovieScheduleInfoId,
                            StartTime = s.StartTime,
                            EndedTime = s.EndedTime,
                            AuditoriumId = s.AuditoriumId,
                            AuditoriumNumber = s.AuditoriumNumber
                        }).OrderBy(s => s.StartTime).ToList()
                    }).ToList()
            })
            .Where(c => c.FormatShowtimes.Any())
            .AsNoTracking()
            .ToListAsync();

        return new BaseResponse<List<ResPublicCinemaShowtimeDto>>
        {
            IsSuccess = true,
            Data = cinemas,
            Message = Messages.Booking.GetShowtimesSuccess
        };
    }

    // ==========================================
    // 6. Lấy sơ đồ ghế cho một lịch chiếu
    // ==========================================
    public async Task<BaseResponse<ResPublicSeatMapDto>> GetSeatMap(Guid scheduleId)
    {
        var schedule = await _dbContext.MovieScheduleInfoEntity
            .Where(s => s.MovieScheduleInfoId == scheduleId && !s.IsDeleted)
            .Select(s => new
            {
                s.MovieScheduleInfoId,
                s.StartTime,
                s.EndedTime,
                s.AuditoriumId,
                AuditoriumNumber = s.AuditoriumInfoEntities!.AuditoriumNumber,
                MovieName = s.MovieInfoEntity!.MovieName,
                FormatName = s.MovieFormatInfoEntity!.MovieFormatName,
                Seats = s.AuditoriumInfoEntities!.SeatsInfoEntity.Select(seat => new
                {
                    seat.SeatId,
                    seat.SeatNumber,
                    seat.ColIndex,
                    seat.RowIndex
                }).ToList()
            })
            .AsNoTracking()
            .FirstOrDefaultAsync();

        if (schedule == null)
        {
            throw new NotFoundException(Messages.Booking.ScheduleNotFound);
        }

        // Lấy danh sách ghế đã đặt (Pending hoặc Booked)
        var occupiedSeatIds = await _dbContext.Set<OrderDetailsInfo>()
            .Where(od => od.MovieScheduleId == scheduleId
                         && (od.OrderInfoEntity.OrderStatus == OrderStatusEnum.Pending
                             || od.OrderInfoEntity.OrderStatus == OrderStatusEnum.Booked))
            .Select(od => od.SeatId)
            .Distinct()
            .ToListAsync();

        var occupiedSet = new HashSet<Guid>(occupiedSeatIds);

        var seatMap = new ResPublicSeatMapDto
        {
            ScheduleId = schedule.MovieScheduleInfoId,
            AuditoriumNumber = schedule.AuditoriumNumber,
            MovieName = schedule.MovieName,
            FormatName = schedule.FormatName,
            StartTime = schedule.StartTime,
            Seats = schedule.Seats.Select(s => new SeatDto
            {
                SeatId = s.SeatId,
                SeatNumber = s.SeatNumber,
                ColIndex = s.ColIndex,
                RowIndex = s.RowIndex,
                IsOccupied = occupiedSet.Contains(s.SeatId)
            }).OrderBy(s => s.RowIndex).ThenBy(s => s.ColIndex).ToList()
        };

        return new BaseResponse<ResPublicSeatMapDto>
        {
            IsSuccess = true,
            Data = seatMap,
            Message = Messages.Booking.GetSeatMapSuccess
        };
    }

    // ==========================================
    // 7. Lấy thông tin giá cho một lịch chiếu
    // ==========================================
    public async Task<BaseResponse<ResPublicPricingDto>> GetPricing(Guid scheduleId)
    {
        var schedule = await _dbContext.MovieScheduleInfoEntity
            .Include(s => s.MovieFormatInfoEntity)
            .Include(s => s.AuditoriumInfoEntities)
            .FirstOrDefaultAsync(s => s.MovieScheduleInfoId == scheduleId && !s.IsDeleted);

        if (schedule == null)
        {
            throw new NotFoundException(Messages.Booking.ScheduleNotFound);
        }

        var basePrice = schedule.MovieFormatInfoEntity?.MovieFormatPrice ?? 0;
        var cinemaId = schedule.AuditoriumInfoEntities?.CinemaId;
        var formatId = schedule.MovieFormatId;

        // Lấy tất cả các segments
        var segmentsQuery = _dbContext.Set<UserSegmentsInfoEntity>().AsQueryable();

        bool hasHighRole = _userContextService.IsInRole("Admin") || 
                           _userContextService.IsInRole("MovieManager") || 
                           _userContextService.IsInRole("TheaterManager") || 
                           _userContextService.IsInRole("FacilitiesManager");

        if (!hasHighRole)
        {
            segmentsQuery = segmentsQuery.Where(seg => seg.UserSegmentName == "Adult" || seg.UserSegmentName == "Child");
        }

        var segments = await segmentsQuery.ToListAsync();

        // Lấy surcharges của rạp này và format này
        var surcharges = await _dbContext.Set<CinemaSurchargeInfosEntity>()
            .Where(s => s.CinemaId == cinemaId && s.MovieFormatId == formatId)
            .ToListAsync();

        var pricing = new ResPublicPricingDto
        {
            ScheduleId = scheduleId,
            BasePrice = basePrice,
            SegmentPrices = segments.Select(seg => 
            {
                var surcharge = surcharges.FirstOrDefault(s => s.UserSegmentId == seg.UserSegmentId);
                var finalPrice = basePrice;
                if (surcharge != null)
                {
                    finalPrice = basePrice * (1 + (surcharge.SurchangePercent / 100));
                }

                return new SegmentPriceDto
                {
                    UserSegmentId = seg.UserSegmentId,
                    SegmentName = seg.UserSegmentName,
                    Description = seg.UserSegmentDescription,
                    FinalPrice = Math.Round(finalPrice, 0)
                };
            }).ToList()
        };

        return new BaseResponse<ResPublicPricingDto>
        {
            IsSuccess = true,
            Data = pricing,
            Message = Messages.Booking.GetPricingSuccess
        };
    }

    // ==========================================
    // 8. Tạo đơn đặt vé + Trả VNPay URL
    // ==========================================
    public async Task<BaseResponse<ResCreateBookingDto>> CreateBooking(
        ReqCreateBookingDto request, string ipAddress)
    {
        using var transaction = await _dbContext.Database.BeginTransactionAsync();
        try
        {
            var userId = _userContextService.TryGetUserId();

            // Validate schedule
            var schedule = await _dbContext.MovieScheduleInfoEntity
                .Include(s => s.MovieFormatInfoEntity)
                .Include(s => s.MovieInfoEntity)
                .Include(s => s.AuditoriumInfoEntities)
                .FirstOrDefaultAsync(s => s.MovieScheduleInfoId == request.ScheduleId
                                          && !s.IsDeleted);

            if (schedule == null || schedule.MovieInfoEntity == null || !schedule.MovieInfoEntity.IsActive)
            {
                throw new BadRequestException(Messages.Booking.ScheduleNotFoundOrInactive, "BK01");
            }

            if (schedule.StartTime <= DateTime.Now)
            {
                throw new BadRequestException(Messages.Booking.ShowtimeAlreadyStarted, "BK02");
            }

            var seatIds = request.SeatSelections.Select(s => s.SeatId).ToList();
            var segmentIds = request.SeatSelections.Select(s => s.UserSegmentId).Distinct().ToList();

            // Validate seats belong to the auditorium
            var validSeats = await _dbContext.SeatsInfoEntity
                .Where(s => s.AuditoriumId == schedule.AuditoriumId
                            && seatIds.Contains(s.SeatId))
                .ToListAsync();

            if (validSeats.Count != seatIds.Count)
            {
                throw new BadRequestException(Messages.Booking.InvalidSeats, "BK03");
            }

            // Validate all segment IDs exist
            var validSegments = await _dbContext.Set<UserSegmentsInfoEntity>()
                .Where(seg => segmentIds.Contains(seg.UserSegmentId))
                .ToListAsync();
            
            if (validSegments.Count != segmentIds.Count)
            {
                throw new BadRequestException("Loại khách hàng không hợp lệ.", "BK06");
            }

            // Check seats aren't already booked
            var alreadyBooked = await _dbContext.Set<OrderDetailsInfo>()
                .Where(od => od.MovieScheduleId == request.ScheduleId
                             && seatIds.Contains(od.SeatId)
                             && (od.OrderInfoEntity.OrderStatus == OrderStatusEnum.Pending
                                 || od.OrderInfoEntity.OrderStatus == OrderStatusEnum.Booked))
                .Select(od => od.SeatId)
                .Distinct()
                .ToListAsync();

            if (alreadyBooked.Any())
            {
                throw new BadRequestException(Messages.Booking.SeatsAlreadyBooked, "BK04");
            }

            // Calculate price per seat based on segment surcharge
            var basePrice = schedule.MovieFormatInfoEntity?.MovieFormatPrice ?? 0;
            var cinemaId = schedule.AuditoriumInfoEntities?.CinemaId;
            var formatId = schedule.MovieFormatId;

            var surcharges = await _dbContext.Set<CinemaSurchargeInfosEntity>()
                .Where(s => s.CinemaId == cinemaId && s.MovieFormatId == formatId)
                .ToListAsync();

            decimal totalPrice = 0;
            var orderDetails = new List<OrderDetailsInfo>();
            var orderId = Guid.NewGuid();

            foreach (var sel in request.SeatSelections)
            {
                var surcharge = surcharges.FirstOrDefault(s => s.UserSegmentId == sel.UserSegmentId);
                var priceEach = basePrice;
                if (surcharge != null)
                {
                    priceEach = basePrice * (1 + (surcharge.SurchangePercent / 100));
                }
                priceEach = Math.Round(priceEach, 0);
                totalPrice += priceEach;

                orderDetails.Add(new OrderDetailsInfo
                {
                    OrderId = orderId,
                    SeatId = sel.SeatId,
                    MovieScheduleId = request.ScheduleId,
                    UserSegmentId = sel.UserSegmentId,
                    PriceEach = priceEach
                });
            }

            // Calculate role-based discount
            decimal roleDiscountPercent = 0;
            if (userId.HasValue)
            {
                var userRoles = await _dbContext.UserRoleInfoEntity
                    .Include(ur => ur.RoleListInfoEntity)
                    .Where(ur => ur.UserId == userId.Value)
                    .Select(ur => ur.RoleListInfoEntity.RoleName)
                    .ToListAsync();

                if (userRoles.Contains("VIP"))
                {
                    roleDiscountPercent = 15;
                }
                else if (userRoles.Contains("Student"))
                {
                    roleDiscountPercent = 10;
                }
                else
                {
                    roleDiscountPercent = 5; // All other registered roles (Customer, Admin, Managers) get at least 5%
                }
            }

            // Calculate voucher discount
            decimal voucherDiscountPercent = 0;
            if (request.VoucherId.HasValue)
            {
                if (!userId.HasValue)
                {
                    throw new BadRequestException("Guests cannot apply vouchers.", "BK07");
                }

                var userVoucher = await _dbContext.Set<UserVoucherEntity>()
                    .Include(uv => uv.VoucherInfoEntity)
                    .FirstOrDefaultAsync(uv => uv.VoucherId == request.VoucherId.Value &&
                                               uv.UserId == userId.Value &&
                                               !uv.IsUsed);

                if (userVoucher == null)
                {
                    throw new BadRequestException("Voucher is invalid or has already been used.", "BK08");
                }

                if (!userVoucher.VoucherInfoEntity.IsValid(null))
                {
                    throw new BadRequestException("Voucher has expired or is not active yet.", "BK09");
                }

                voucherDiscountPercent = userVoucher.VoucherInfoEntity.voucherDiscountPercent;
            }

            decimal totalDiscountPercent = roleDiscountPercent + voucherDiscountPercent;
            if (totalDiscountPercent > 100)
            {
                totalDiscountPercent = 100;
            }

            decimal finalPrice = totalPrice * (1 - (totalDiscountPercent / 100));
            finalPrice = Math.Round(finalPrice, 0);

            string? finalCustomerName = null;
            string? finalCustomerEmail = null;

            if (userId.HasValue)
            {
                var user = await _dbContext.UserInfoEntity
                    .Include(u => u.UserProfileEntity)
                    .FirstOrDefaultAsync(u => u.UserId == userId);
                
                finalCustomerName = user?.UserProfileEntity?.UserName;
                finalCustomerEmail = user?.UserEmail;
            }
            else
            {
                if (string.IsNullOrEmpty(request.CustomerName) || string.IsNullOrEmpty(request.CustomerEmail))
                {
                    throw new BadRequestException("Guest booking requires Customer Name and Email.", "BK05");
                }
                finalCustomerName = request.CustomerName;
                finalCustomerEmail = request.CustomerEmail;
            }

            var order = new OrderInfoEntity
            {
                OrderId = orderId,
                UserId = userId,
                OrderStatus = OrderStatusEnum.Pending,
                PaymentMethod = PaymentMethodEnum.VNPAY,
                TotalPrice = finalPrice,
                OrderDate = DateTime.UtcNow,
                TotalQuantity = seatIds.Count,
                CustomerName = finalCustomerName,
                CustomerEmail = finalCustomerEmail,
                CustomerAddress = userId.HasValue ? null : request.CustomerAddress,
                VoucherId = request.VoucherId
            };

            await _dbContext.Set<OrderInfoEntity>().AddAsync(order);
            await _dbContext.Set<OrderDetailsInfo>().AddRangeAsync(orderDetails);
            await _dbContext.SaveChangesAsync();
            await transaction.CommitAsync();

            var paymentUrl = _vnPayService.GenerateVnpayUrl((long)finalPrice, orderId.ToString(), ipAddress);

            return new BaseResponse<ResCreateBookingDto>
            {
                IsSuccess = true,
                Data = new ResCreateBookingDto
                {
                    OrderId = orderId,
                    PaymentUrl = paymentUrl,
                    TotalPrice = finalPrice,
                    TotalQuantity = seatIds.Count,
                    OrderDate = order.OrderDate
                },
                Message = Messages.Booking.CreateBookingSuccess
            };
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            if (ex is AppException) throw;
            _logger.LogError(ex, "Error creating booking");
            throw CustomSystemException.SystemExceptionCaller();
        }
    }

    // ==========================================
    // 8b. Lấy thông tin vé (cho tải PDF)
    // ==========================================
    public async Task<ResTicketPdfDto> GetTicketData(Guid orderId)
    {
        var order = await _dbContext.Set<OrderInfoEntity>()
            .Where(o => o.OrderId == orderId && o.OrderStatus == OrderStatusEnum.Booked)
            .Select(o => new ResTicketPdfDto
            {
                OrderId = o.OrderId,
                CustomerName = o.CustomerName,
                CustomerEmail = o.CustomerEmail,
                OrderDate = o.OrderDate,
                TotalPrice = o.TotalPrice,
                VnPayTransactionId = o.VnPayTransactionId,
                MovieName = o.OrderDetailsInfo
                    .Select(od => od.MovieScheduleInfoEntity.MovieInfoEntity!.MovieName).FirstOrDefault() ?? "",
                MovieImageUrl = o.OrderDetailsInfo
                    .Select(od => od.MovieScheduleInfoEntity.MovieInfoEntity!.MovieImageUrl).FirstOrDefault() ?? "",
                CinemaName = o.OrderDetailsInfo
                    .Select(od => od.MovieScheduleInfoEntity.AuditoriumInfoEntities!.CinemaInfoEntity.CinemaName).FirstOrDefault() ?? "",
                CinemaAddress = o.OrderDetailsInfo
                    .Select(od => od.MovieScheduleInfoEntity.AuditoriumInfoEntities!.CinemaInfoEntity.CinemaLocation).FirstOrDefault() ?? "",
                AuditoriumNumber = o.OrderDetailsInfo
                    .Select(od => od.MovieScheduleInfoEntity.AuditoriumInfoEntities!.AuditoriumNumber).FirstOrDefault() ?? "",
                FormatName = o.OrderDetailsInfo
                    .Select(od => od.MovieScheduleInfoEntity.MovieFormatInfoEntity!.MovieFormatName).FirstOrDefault() ?? "",
                ShowTime = o.OrderDetailsInfo
                    .Select(od => od.MovieScheduleInfoEntity.StartTime).FirstOrDefault(),
                EndedTime = o.OrderDetailsInfo
                    .Select(od => od.MovieScheduleInfoEntity.EndedTime).FirstOrDefault(),
                Seats = o.OrderDetailsInfo.Select(od => new TicketSeatDetail
                {
                    SeatNumber = od.SeatsInfoEntity.SeatNumber,
                    SegmentName = od.UserSegmentsInfoEntity.UserSegmentName,
                    PriceEach = od.PriceEach
                }).ToList()
            })
            .AsNoTracking()
            .FirstOrDefaultAsync();

        if (order == null)
        {
            throw new NotFoundException("Không tìm thấy vé hoặc đơn hàng chưa thanh toán thành công.");
        }

        return order;
    }

    // ==========================================
    // 8c. Tạo file PDF vé
    // ==========================================
    public byte[] GenerateTicketPdf(ResTicketPdfDto ticket)
    {
        // Simple text-based PDF generation without external library
        var sb = new System.Text.StringBuilder();
        sb.AppendLine("==============================================");
        sb.AppendLine("           VE XEM PHIM / MOVIE TICKET         ");
        sb.AppendLine("==============================================");
        sb.AppendLine();
        sb.AppendLine($"Ma don hang:    {ticket.OrderId}");
        sb.AppendLine($"Ngay dat:       {ticket.OrderDate:dd/MM/yyyy HH:mm}");
        sb.AppendLine($"Ma giao dich:   {ticket.VnPayTransactionId ?? "N/A"}");
        sb.AppendLine();
        sb.AppendLine("----------------------------------------------");
        sb.AppendLine("THONG TIN KHACH HANG");
        sb.AppendLine("----------------------------------------------");
        sb.AppendLine($"Ho ten:         {ticket.CustomerName ?? "N/A"}");
        sb.AppendLine($"Email:          {ticket.CustomerEmail ?? "N/A"}");
        sb.AppendLine();
        sb.AppendLine("----------------------------------------------");
        sb.AppendLine("THONG TIN PHIM");
        sb.AppendLine("----------------------------------------------");
        sb.AppendLine($"Phim:           {ticket.MovieName}");
        sb.AppendLine($"Dinh dang:      {ticket.FormatName}");
        sb.AppendLine($"Rap:            {ticket.CinemaName}");
        sb.AppendLine($"Dia chi:        {ticket.CinemaAddress}");
        sb.AppendLine($"Phong:          {ticket.AuditoriumNumber}");
        sb.AppendLine($"Gio chieu:      {ticket.ShowTime:dd/MM/yyyy HH:mm}");
        sb.AppendLine($"Gio ket thuc:   {ticket.EndedTime:dd/MM/yyyy HH:mm}");
        sb.AppendLine();
        sb.AppendLine("----------------------------------------------");
        sb.AppendLine("CHI TIET GHE");
        sb.AppendLine("----------------------------------------------");
        foreach (var seat in ticket.Seats)
        {
            sb.AppendLine($"  Ghe {seat.SeatNumber,-8} | {seat.SegmentName,-15} | {seat.PriceEach:N0} VND");
        }
        sb.AppendLine();
        sb.AppendLine("----------------------------------------------");
        sb.AppendLine($"TONG TIEN:      {ticket.TotalPrice:N0} VND");
        sb.AppendLine("==============================================");
        sb.AppendLine("Cam on quy khach! Chuc quy khach xem phim vui ve!");
        sb.AppendLine();

        var text = sb.ToString();
        return System.Text.Encoding.UTF8.GetBytes(text);
    }

    // ==========================================
    // 8. Xử lý callback từ VNPay
    // ==========================================
    public async Task<(bool success, Guid orderId)> ProcessVnPayCallback(
        IDictionary<string, string> vnpParams)
    {
        // Validate signature
        if (!_vnPayHelper.ValidateCallback(vnpParams))
        {
            _logger.LogWarning("Invalid VNPay callback signature");
            return (false, Guid.Empty);
        }

        vnpParams.TryGetValue("vnp_TxnRef", out var orderIdStr);
        vnpParams.TryGetValue("vnp_ResponseCode", out var responseCode);
        vnpParams.TryGetValue("vnp_TransactionNo", out var transactionId);
        orderIdStr ??= "";
        responseCode ??= "";
        transactionId ??= "";

        if (!Guid.TryParse(orderIdStr, out var orderId))
        {
            _logger.LogWarning("Invalid order ID in VNPay callback: {OrderId}", orderIdStr);
            return (false, Guid.Empty);
        }

        var order = await _dbContext.Set<OrderInfoEntity>()
            .FirstOrDefaultAsync(o => o.OrderId == orderId);

        if (order == null)
        {
            _logger.LogWarning("Order not found for VNPay callback: {OrderId}", orderId);
            return (false, orderId);
        }

        if (order.OrderStatus != OrderStatusEnum.Pending)
        {
            _logger.LogWarning("Order {OrderId} is not in Pending status, current: {Status}",
                orderId, order.OrderStatus);
            return (false, orderId);
        }

        var isSuccess = _vnPayHelper.IsPaymentSuccess(responseCode);

        if (isSuccess)
        {
            order.OrderStatus = OrderStatusEnum.Booked;
            order.VnPayTransactionId = transactionId;

            // Credit points and mark voucher as used
            if (order.UserId.HasValue)
            {
                var userRoles = await _dbContext.UserRoleInfoEntity
                    .Include(ur => ur.RoleListInfoEntity)
                    .Where(ur => ur.UserId == order.UserId.Value)
                    .Select(ur => ur.RoleListInfoEntity.RoleName)
                    .ToListAsync();

                decimal earningRate = 5; // Default standard rate is 5% for all registered users (Customer, Admin, Managers, etc.)
                if (userRoles.Contains("VIP"))
                {
                    earningRate = 10;
                }
                else if (userRoles.Contains("Student"))
                {
                    earningRate = 8;
                }

                if (earningRate > 0)
                {
                    long pointsEarned = (long)Math.Floor((order.TotalPrice * earningRate) / 100);
                    var user = await _dbContext.UserInfoEntity
                        .FirstOrDefaultAsync(u => u.UserId == order.UserId.Value);
                    if (user != null)
                    {
                        user.RewardPoints += pointsEarned;
                    }
                }

                if (order.VoucherId.HasValue)
                {
                    var userVoucher = await _dbContext.Set<UserVoucherEntity>()
                        .FirstOrDefaultAsync(uv => uv.VoucherId == order.VoucherId.Value &&
                                                   uv.UserId == order.UserId.Value &&
                                                   !uv.IsUsed);
                    if (userVoucher != null)
                    {
                        userVoucher.IsUsed = true;
                        userVoucher.UsedAt = DateTime.UtcNow;
                    }
                }
            }
        }
        else
        {
            order.OrderStatus = OrderStatusEnum.Canceled;
        }

        await _dbContext.SaveChangesAsync();

        return (isSuccess, orderId);
    }

    // ==========================================
    // 9. Lấy thông tin tài khoản đang đăng nhập
    // ==========================================
    public async Task<BaseResponse<ResUserAccountInfoDto>> GetUserAccountInfo()
    {
        var userId = _userContextService.GetUserId();
        var user = await _dbContext.UserInfoEntity
            .Include(u => u.UserProfileEntity)
            .FirstOrDefaultAsync(u => u.UserId == userId);

        if (user == null)
        {
            throw new UnauthorizeException(null);
        }

        var key = _configuration["AES_256:Key"] ?? "";
        var iv = _configuration["AES_256:IV"] ?? "";
        var decryptedIdentityCode = AES256Helper.Decrypt(user.UserProfileEntity.IdentityCode, key, iv);

        var res = new ResUserAccountInfoDto
        {
            UserId = user.UserId,
            Email = user.UserEmail,
            UserName = user.UserProfileEntity.UserName,
            IdentityCode = decryptedIdentityCode,
            DateOfBirth = user.UserProfileEntity.DateOfBirth,
            PhoneNumber = user.UserProfileEntity.PhoneNumber,
            RewardPoints = user.RewardPoints
        };

        return new BaseResponse<ResUserAccountInfoDto>
        {
            IsSuccess = true,
            Data = res,
            Message = Messages.Auth.GetInfoSuccess
        };
    }

    // ==========================================
    // 10. Lấy lịch sử đặt vé của người dùng
    // ==========================================
    public async Task<BaseResponse<List<ResUserBookingHistoryDto>>> GetUserBookingHistory()
    {
        var userId = _userContextService.GetUserId();
        var now = DateTime.Now;

        var orders = await _dbContext.Set<OrderInfoEntity>()
            .Where(o => o.UserId == userId)
            .OrderByDescending(o => o.OrderDate)
            .Select(o => new ResUserBookingHistoryDto
            {
                OrderId = o.OrderId,
                OrderDate = o.OrderDate,
                TotalPrice = o.TotalPrice,
                OrderStatus = o.OrderStatus.ToString(),
                // Lấy thông tin phim từ record đầu tiên trong đơn hàng
                MovieName = o.OrderDetailsInfo.Select(od => od.MovieScheduleInfoEntity.MovieInfoEntity!.MovieName).FirstOrDefault() ?? "",
                MovieImageUrl = o.OrderDetailsInfo.Select(od => od.MovieScheduleInfoEntity.MovieInfoEntity!.MovieImageUrl).FirstOrDefault() ?? "",
                CinemaName = o.OrderDetailsInfo.Select(od => od.MovieScheduleInfoEntity.AuditoriumInfoEntities!.CinemaInfoEntity.CinemaName).FirstOrDefault() ?? "",
                AuditoriumNumber = o.OrderDetailsInfo.Select(od => od.MovieScheduleInfoEntity.AuditoriumInfoEntities!.AuditoriumNumber).FirstOrDefault() ?? "",
                StartTime = o.OrderDetailsInfo.Select(od => od.MovieScheduleInfoEntity.StartTime).FirstOrDefault(),
                Seats = o.OrderDetailsInfo.Select(od => od.SeatsInfoEntity.SeatNumber).ToList(),
                
                // Trạng thái phim
                IsMovieAired = o.OrderDetailsInfo.Any(od => od.MovieScheduleInfoEntity.StartTime <= now),
                MovieAiringStatus = o.OrderDetailsInfo.Select(od => 
                    now < od.MovieScheduleInfoEntity.StartTime ? "Upcoming" :
                    (now >= od.MovieScheduleInfoEntity.StartTime && now <= od.MovieScheduleInfoEntity.EndedTime) ? "Airing" : "Finished"
                ).FirstOrDefault() ?? ""
            })
            .AsNoTracking()
            .ToListAsync();

        return new BaseResponse<List<ResUserBookingHistoryDto>>
        {
            IsSuccess = true,
            Data = orders,
            Message = Messages.Booking.GetHistorySuccess
        };
    }
}
