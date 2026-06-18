using Application.Common;
using Application.MovieManager.Ports;
using Microsoft.Extensions.Logging;
using Shared.Exceptions;
using Shared.Localization;

namespace Application.MovieManager.UseCases;

/// <summary>
/// Use case ghi phim (tạo/sửa/xoá). Đóng gói validate, tải ảnh + rollback ảnh khi lỗi,
/// transaction, và lên lịch job nền — tất cả qua ports (không chạm EF/Cloudinary/Hangfire trực tiếp).
/// </summary>
public class WriteMovieUseCase
{
    private const int MaxDurationExclusive = 500;

    private readonly IMovieRepository _movieRepository;
    private readonly IImageStorage _imageStorage;
    private readonly IBackgroundJobScheduler _jobScheduler;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IClock _clock;
    private readonly ILogger<WriteMovieUseCase> _logger;

    public WriteMovieUseCase(
        IMovieRepository movieRepository,
        IImageStorage imageStorage,
        IBackgroundJobScheduler jobScheduler,
        IUnitOfWork unitOfWork,
        IClock clock,
        ILogger<WriteMovieUseCase> logger)
    {
        _movieRepository = movieRepository;
        _imageStorage = imageStorage;
        _jobScheduler = jobScheduler;
        _unitOfWork = unitOfWork;
        _clock = clock;
        _logger = logger;
    }

    public async Task<Guid> CreateAsync(
        CreateMovieCommand command, Guid userId, CancellationToken cancellationToken = default)
    {
        var errors = new List<string>();
        if (await _movieRepository.NameExistsAsync(command.MovieName, null, cancellationToken))
        {
            errors.Add(Messages.Movie.NameAlreadyInUse);
        }
        if (command.Duration < 0 || command.Duration >= MaxDurationExclusive)
        {
            errors.Add(Messages.Movie.InvalidDuration);
        }
        if (await _movieRepository.DescriptionExistsAsync(command.MovieDescription, null, cancellationToken))
        {
            errors.Add(Messages.Movie.DescriptionAlreadyInUse);
        }
        ValidateDateRange(command.StartedDate, command.EndedDate, errors);
        if (errors.Count > 0)
        {
            throw new BadRequestException(errors, "E01");
        }

        var (uploaded, urlOrError) = await _imageStorage.UploadAsync(
            command.Image.Content, command.Image.FileName, cancellationToken);
        if (!uploaded)
        {
            throw new AppException(Messages.Movie.ImageUploadError, 400, "E01");
        }

        var movieId = Guid.NewGuid();
        try
        {
            await using var transaction = await _unitOfWork.BeginTransactionAsync(cancellationToken: cancellationToken);

            var newMovie = new NewMovieData(
                movieId, command.MovieRequiredAgeId, command.MovieName, command.MovieDescription,
                urlOrError, command.StartedDate, command.EndedDate, command.Duration,
                command.TrailerUrl ?? string.Empty, command.Director ?? string.Empty, command.Actors ?? string.Empty,
                userId, command.MovieFormatIds, command.MovieGenreIds, command.CinemaIds);

            await _movieRepository.AddAsync(newMovie, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            await _imageStorage.DeleteAsync(urlOrError, cancellationToken);
            if (ex is AppException) throw;
            _logger.LogError(ex, "Error creating movie");
            throw CustomSystemException.SystemExceptionCaller();
        }

        // Sau khi commit mới lên lịch job để tránh job chạy trước khi DB có bản ghi.
        await _jobScheduler.ScheduleStatusJobsAsync(
            BackgroundJobTarget.Movie, movieId, command.StartedDate, command.EndedDate, cancellationToken);

        return movieId;
    }

    public async Task UpdateAsync(
        Guid movieId, UpdateMovieCommand command, Guid userId, CancellationToken cancellationToken = default)
    {
        var state = await _movieRepository.GetStateAsync(movieId, cancellationToken);
        if (state == null)
        {
            throw new NotFoundException(Messages.Movie.NotFoundById(movieId));
        }

        if (await _movieRepository.HasSuccessfulBookingAsync(movieId, cancellationToken))
        {
            throw new BadRequestException("Không thể sửa phim khi đã có khách hàng đặt vé thành công.", "E03");
        }

        var errors = new List<string>();
        if (!string.IsNullOrEmpty(command.MovieName)
            && await _movieRepository.NameExistsAsync(command.MovieName, movieId, cancellationToken))
        {
            errors.Add(Messages.Movie.NameAlreadyExists);
        }
        if (command.Duration != null && (command.Duration < 0 || command.Duration >= MaxDurationExclusive))
        {
            errors.Add(Messages.Movie.InvalidDuration);
        }
        if (!string.IsNullOrEmpty(command.MovieDescription)
            && await _movieRepository.DescriptionExistsAsync(command.MovieDescription, movieId, cancellationToken))
        {
            errors.Add(Messages.Movie.DescriptionAlreadyExists);
        }
        ValidateDateRange(
            command.StartedDate ?? state.ActiveAt, command.EndedDate ?? state.EndedDate, errors);
        if (errors.Count > 0)
        {
            throw new BadRequestException(errors, "S01");
        }

        // Tải ảnh mới (nếu có) trước khi mở transaction; nhớ URL cũ để dọn sau khi commit.
        string? newImageUrl = null;
        if (command.Image != null)
        {
            var (uploaded, urlOrError) = await _imageStorage.UploadAsync(
                command.Image.Content, command.Image.FileName, cancellationToken);
            if (!uploaded)
            {
                _logger.LogError("Image upload failed: {Detail}", urlOrError);
                throw CustomSystemException.SystemExceptionCaller();
            }
            newImageUrl = urlOrError;
        }

        try
        {
            await using var transaction = await _unitOfWork.BeginTransactionAsync(cancellationToken: cancellationToken);

            var update = new MovieUpdateData(
                command.MovieRequiredAgeId, command.MovieName, command.MovieDescription, newImageUrl,
                command.StartedDate, command.EndedDate, command.Duration, command.TrailerUrl,
                command.Director, command.Actors, userId,
                command.MovieFormatIds, command.MovieGenreIds, command.CinemaIds);

            await _movieRepository.UpdateAsync(movieId, update, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            if (newImageUrl != null)
            {
                await _imageStorage.DeleteAsync(newImageUrl, cancellationToken);
            }
            if (ex is AppException) throw;
            _logger.LogError(ex, "Error updating movie");
            throw CustomSystemException.SystemExceptionCaller();
        }

        await _jobScheduler.RescheduleStatusJobsAsync(
            BackgroundJobTarget.Movie, movieId, command.StartedDate, command.EndedDate, cancellationToken);

        // Dọn ảnh cũ sau khi commit thành công (không chặn luồng nếu lỗi).
        if (newImageUrl != null && !string.IsNullOrEmpty(state.ImageUrl))
        {
            try
            {
                await _imageStorage.DeleteAsync(state.ImageUrl, cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Could not delete old image: {Url}", state.ImageUrl);
            }
        }
    }

    public async Task DeleteAsync(Guid movieId, Guid userId, CancellationToken cancellationToken = default)
    {
        var state = await _movieRepository.GetStateAsync(movieId, cancellationToken);
        if (state == null)
        {
            throw new NotFoundException(Messages.Movie.NotFoundById(movieId));
        }
        if (state.IsDeleted)
        {
            throw new BadRequestException("Phim này đã bị xóa.", "D01");
        }

        // Có đơn (kể cả huỷ) → soft delete để tránh vi phạm khoá ngoại; ngược lại hard delete.
        var hasAnyBooking = await _movieRepository.HasAnyBookingAsync(movieId, cancellationToken);
        if (hasAnyBooking)
        {
            await _movieRepository.SoftDeleteAsync(movieId, userId, cancellationToken);
        }
        else
        {
            await _movieRepository.HardDeleteAsync(movieId, cancellationToken);
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    private void ValidateDateRange(DateTime start, DateTime end, List<string> errors)
    {
        if (start >= end)
        {
            errors.Add("Started Date must be lower than the ended date.");
            return;
        }
        if (start.ToUniversalTime() < _clock.UtcNow.AddSeconds(-20))
        {
            errors.Add("Started Date must be higher than the current date.");
        }
        if (end.ToUniversalTime() < _clock.UtcNow)
        {
            errors.Add("Ended Date must be higher than the current date.");
        }
    }
}
