using BusinessLayer.Dtos;
using BusinessLayer.Dtos.Booking;
using BusinessLayer.Services.IdentityAccess;
using DataAccess;
using DataAccess.Entities.CinemaInfos;
using DataAccess.Entities.MovieInfos;
using DataAccess.Entities.UserInfos;
using Microsoft.EntityFrameworkCore;
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
    private readonly ILogger<BookingService> _logger;

    public BookingService(
        CinemaDbContext dbContext,
        IUserContextService userContextService,
        VnPayHelper vnPayHelper,
        BusinessLayer.Services.ThirdPersonServices.IVnPayService vnPayService,
        ILogger<BookingService> logger)
    {
        _dbContext = dbContext;
        _userContextService = userContextService;
        _vnPayHelper = vnPayHelper;
        _vnPayService = vnPayService;
        _logger = logger;
    }

    // ==========================================
    // 1. Lấy danh sách phim đang chiếu
    // ==========================================
    public async Task<BaseResponse<List<ResPublicMovieListDto>>> GetNowShowingMovies()
    {
        var now = DateTime.Now;
        var movies = await _dbContext.MovieInfoEntity
            .Where(x => x.IsActive && !x.IsDeleted && x.ActiveAt <= now && x.EndedDate > now)
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

        return new BaseResponse<List<ResPublicMovieListDto>>
        {
            IsSuccess = true,
            Data = movies,
            Message = Messages.Movie.GetListSuccess
        };
    }

    // ==========================================
    // 2. Lấy danh sách phim sắp chiếu
    // ==========================================
    public async Task<BaseResponse<List<ResPublicMovieListDto>>> GetComingSoonMovies()
    {
        var now = DateTime.Now;
        var movies = await _dbContext.MovieInfoEntity
            .Where(x => !x.IsDeleted && x.ActiveAt > now)
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

        return new BaseResponse<List<ResPublicMovieListDto>>
        {
            IsSuccess = true,
            Data = movies,
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
        var segments = await _dbContext.Set<UserSegmentsInfoEntity>().ToListAsync();

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
            var userId = _userContextService.GetUserId();

            // Validate schedule
            var schedule = await _dbContext.MovieScheduleInfoEntity
                .Include(s => s.MovieFormatInfoEntity)
                .Include(s => s.MovieInfoEntity)
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

            // Validate seats belong to the auditorium
            var validSeats = await _dbContext.SeatsInfoEntity
                .Where(s => s.AuditoriumId == schedule.AuditoriumId
                            && request.SeatIds.Contains(s.SeatId))
                .ToListAsync();

            if (validSeats.Count != request.SeatIds.Count)
            {
                throw new BadRequestException(Messages.Booking.InvalidSeats, "BK03");
            }

            // Check seats aren't already booked
            var alreadyBooked = await _dbContext.Set<OrderDetailsInfo>()
                .Where(od => od.MovieScheduleId == request.ScheduleId
                             && request.SeatIds.Contains(od.SeatId)
                             && (od.OrderInfoEntity.OrderStatus == OrderStatusEnum.Pending
                                 || od.OrderInfoEntity.OrderStatus == OrderStatusEnum.Booked))
                .Select(od => od.SeatId)
                .Distinct()
                .ToListAsync();

            if (alreadyBooked.Any())
            {
                throw new BadRequestException(Messages.Booking.SeatsAlreadyBooked, "BK04");
            }

            // Calculate price
            var formatPrice = schedule.MovieFormatInfoEntity?.MovieFormatPrice ?? 0;
            var totalPrice = formatPrice * request.SeatIds.Count;

            // Create order
            var orderId = Guid.NewGuid();
            var order = new OrderInfoEntity
            {
                OrderId = orderId,
                UserId = userId,
                OrderStatus = OrderStatusEnum.Pending,
                PaymentMethod = PaymentMethodEnum.VNPAY,
                TotalPrice = totalPrice,
                OrderDate = DateTime.Now,
                TotalQuantity = request.SeatIds.Count,
                CustomerName = request.CustomerName,
                CustomerAddress = request.CustomerAddress,
                CustomerEmail = request.CustomerEmail
            };

            var orderDetails = request.SeatIds.Select(seatId => new OrderDetailsInfo
            {
                OrderId = orderId,
                SeatId = seatId,
                MovieScheduleId = request.ScheduleId,
                PriceEach = formatPrice
            }).ToList();

            await _dbContext.Set<OrderInfoEntity>().AddAsync(order);
            await _dbContext.Set<OrderDetailsInfo>().AddRangeAsync(orderDetails);
            await _dbContext.SaveChangesAsync();
            await transaction.CommitAsync();

            // Generate VNPay payment URL
            // Sử dụng logic Vnpay nguyên bản của dự án cũ
            var paymentUrl = _vnPayService.GenerateVnpayUrl((long)totalPrice, orderId.ToString());

            return new BaseResponse<ResCreateBookingDto>
            {
                IsSuccess = true,
                Data = new ResCreateBookingDto
                {
                    OrderId = orderId,
                    PaymentUrl = paymentUrl,
                    TotalPrice = totalPrice,
                    TotalQuantity = request.SeatIds.Count,
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
        }
        else
        {
            order.OrderStatus = OrderStatusEnum.Canceled;
        }

        await _dbContext.SaveChangesAsync();

        return (isSuccess, orderId);
    }
}
