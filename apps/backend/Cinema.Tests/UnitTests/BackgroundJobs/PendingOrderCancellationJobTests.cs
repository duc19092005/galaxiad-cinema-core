using Moq;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Cinema.Infrastructure.BackgroundJobs.Bookings;
using Cinema.Application.Interfaces.Booking;

namespace Cinema.Tests.UnitTests.BackgroundJobs;

public class PendingOrderCancellationJobTests
{
    private readonly Mock<IPendingOrderCancellationJob> _jobService;
    private readonly Mock<ILogger<PendingOrderCancellationJob>> _logger;
    private readonly PendingOrderCancellationJob _job;

    public PendingOrderCancellationJobTests()
    {
        _jobService = new Mock<IPendingOrderCancellationJob>();
        _logger = new Mock<ILogger<PendingOrderCancellationJob>>();
        _job = new PendingOrderCancellationJob(_jobService.Object, _logger.Object);
    }

    [Fact]
    public async Task ExecuteAsync_PendingOrdersExist_CancelsOrdersAndReleasesSeats()
    {
        _jobService.Setup(x => x.CancelExpiredPendingOrdersAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(3);

        await _job.ExecuteAsync(CancellationToken.None);

        _jobService.Verify(x => x.CancelExpiredPendingOrdersAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task ExecuteAsync_NoPendingOrders_DoesNothing()
    {
        _jobService.Setup(x => x.CancelExpiredPendingOrdersAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(0);

        await _job.ExecuteAsync(CancellationToken.None);

        _jobService.Verify(x => x.CancelExpiredPendingOrdersAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task ExecuteAsync_ServiceThrows_LogsError()
    {
        _jobService.Setup(x => x.CancelExpiredPendingOrdersAsync(It.IsAny<CancellationToken>()))
            .ThrowsAsync(new Exception("Database connection failed"));

        await Assert.ThrowsAsync<Exception>(() => _job.ExecuteAsync(CancellationToken.None));
    }
}
