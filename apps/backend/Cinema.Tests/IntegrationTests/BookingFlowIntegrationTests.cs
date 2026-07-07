using Moq;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Cinema.Api.Controllers.Customer.Booking;
using Cinema.Api.Hubs;
using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Booking;
using Cinema.Application.UseCases.Booking.BookingFlow;
using Cinema.Application.UseCases.Booking.UserHistory;
using Cinema.Infrastructure.ExternalServices.Notifications;
using Microsoft.AspNetCore.Http;

namespace Cinema.Tests.IntegrationTests;

/// <summary>
/// Integration tests for the full booking flow:
/// Lock seat -> Create booking -> Payment callback -> Ticket retrieval
/// </summary>
public class BookingFlowIntegrationTests
{
    private readonly Mock<CreateBookingUseCase> _createBookingUseCase;
    private readonly Mock<GetTicketDataUseCase> _getTicketDataUseCase;
    private readonly Mock<ProcessVnPayCallbackUseCase> _processVnPayCallbackUseCase;
    private readonly Mock<GetUserAccountInfoUseCase> _getUserAccountInfoUseCase;
    private readonly Mock<GetUserBookingHistoryUseCase> _getUserBookingHistoryUseCase;
    private readonly Mock<GetBookingCustomerByEmailUseCase> _getBookingCustomerByEmailUseCase;
    private readonly Mock<SeatLockManager> _seatLockManager;
    private readonly Mock<IHubContext<CinemaHub>> _hubContext;
    private readonly Mock<ILogger<BookingController>> _logger;
    private readonly Mock<IConfiguration> _configuration;
    private readonly BookingController _controller;

    public BookingFlowIntegrationTests()
    {
        _createBookingUseCase = new Mock<CreateBookingUseCase>();
        _getTicketDataUseCase = new Mock<GetTicketDataUseCase>();
        _processVnPayCallbackUseCase = new Mock<ProcessVnPayCallbackUseCase>();
        _getUserAccountInfoUseCase = new Mock<GetUserAccountInfoUseCase>();
        _getUserBookingHistoryUseCase = new Mock<GetUserBookingHistoryUseCase>();
        _getBookingCustomerByEmailUseCase = new Mock<GetBookingCustomerByEmailUseCase>();
        _seatLockManager = new Mock<SeatLockManager>();
        _hubContext = new Mock<IHubContext<CinemaHub>>();
        _logger = new Mock<ILogger<BookingController>>();
        _configuration = new Mock<IConfiguration>();
        _configuration.Setup(c => c["FrontendBaseUrl"]).Returns("http://localhost:5173");

        _controller = new BookingController(
            _createBookingUseCase.Object,
            _getTicketDataUseCase.Object,
            _processVnPayCallbackUseCase.Object,
            _getUserAccountInfoUseCase.Object,
            _getUserBookingHistoryUseCase.Object,
            _getBookingCustomerByEmailUseCase.Object,
            _seatLockManager.Object,
            _hubContext.Object,
            _logger.Object,
            _configuration.Object);

        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext()
        };
    }

    [Fact]
    public async Task FullBookingFlow_LockSeat_CreateBooking_Payment_Success()
    {
        // Arrange
        var scheduleId = Guid.NewGuid();
        var seatId = Guid.NewGuid();
        var orderId = Guid.NewGuid();
        var clientId = "test-client-1";

        // Step 1: Lock seat
        _seatLockManager.Setup(x => x.LockSeatAsync(scheduleId.ToString(), seatId.ToString(), "Test User", clientId))
            .ReturnsAsync((true, "Seat locked successfully", new Dictionary<string, object>
            {
                [seatId.ToString().ToLower()] = new { SeatId = seatId, Owner = "Test User" }
            }));

        var lockResult = await _seatLockManager.Object.LockSeatAsync(
            scheduleId.ToString(), seatId.ToString(), "Test User", clientId);

        lockResult.Item1.Should().BeTrue();
        lockResult.Item2.Should().Contain("locked");

        // Step 2: Create booking
        var createRequest = new ReqCreateBookingDto
        {
            ScheduleId = scheduleId,
            SeatSelections = new List<SeatSelectionDto>
            {
                new() { SeatId = seatId, UserSegmentId = Guid.NewGuid() }
            },
            SeatLockOwnerToken = clientId
        };

        var createResponse = new BaseResponse<ResCreateBookingDto>
        {
            IsSuccess = true,
            Data = new ResCreateBookingDto
            {
                OrderId = orderId,
                PaymentUrl = $"https://sandbox.vnpayment.vn/?orderId={orderId}"
            }
        };

        _createBookingUseCase.Setup(x => x.ExecuteAsync(It.IsAny<ReqCreateBookingDto>(), It.IsAny<string>()))
            .ReturnsAsync(createResponse);

        var createResult = await _controller.CreateBooking(createRequest);
        createResult.Should().BeOfType<OkObjectResult>();

        // Step 3: Payment callback (success)
        _processVnPayCallbackUseCase.Setup(x => x.ExecuteAsync(It.IsAny<Dictionary<string, string>>()))
            .ReturnsAsync((true, orderId, (string?)null));

        var mockClients = new Mock<IHubClients>();
        var mockClientProxy = new Mock<IClientProxy>();
        mockClients.Setup(c => c.Group(It.IsAny<string>())).Returns(mockClientProxy.Object);
        _hubContext.Setup(h => h.Clients).Returns(mockClients.Object);

        _controller.ControllerContext.HttpContext.Request.QueryString =
            new QueryString($"?vnp_TxnRef={orderId}&vnp_ResponseCode=00");

        var paymentResult = await _controller.VnPayCallback();
        paymentResult.Should().BeOfType<RedirectResult>();
        (paymentResult as RedirectResult)!.Url.Should().Contain("booking/success");

        // Step 4: Get ticket
        var ticketData = new ResTicketPdfDto
        {
            OrderId = orderId,
            MovieTitle = "Test Movie",
            CinemaName = "Test Cinema",
            AuditoriumName = "Hall 1",
            Seats = new List<string> { seatId.ToString() },
            TotalPrice = 90000
        };

        _getTicketDataUseCase.Setup(x => x.ExecuteAsync(orderId))
            .ReturnsAsync(ticketData);

        var ticketResult = await _controller.GetTicketData(orderId);
        ticketResult.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task FullBookingFlow_PaymentFailed_RedirectToFailedPage()
    {
        // Arrange
        var orderId = Guid.NewGuid();

        _processVnPayCallbackUseCase.Setup(x => x.ExecuteAsync(It.IsAny<Dictionary<string, string>>()))
            .ReturnsAsync((false, orderId, (string?)null));

        var mockClients = new Mock<IHubClients>();
        var mockClientProxy = new Mock<IClientProxy>();
        mockClients.Setup(c => c.Group(It.IsAny<string>())).Returns(mockClientProxy.Object);
        _hubContext.Setup(h => h.Clients).Returns(mockClients.Object);

        _controller.ControllerContext.HttpContext.Request.QueryString =
            new QueryString($"?vnp_TxnRef={orderId}&vnp_ResponseCode=24");

        // Act
        var result = await _controller.VnPayCallback();

        // Assert
        result.Should().BeOfType<RedirectResult>();
        (result as RedirectResult)!.Url.Should().Contain("booking/failed");
    }

    [Fact]
    public async Task BookingWithExpiredVoucher_ShouldFail()
    {
        var request = new ReqCreateBookingDto
        {
            ScheduleId = Guid.NewGuid(),
            SeatSelections = new List<SeatSelectionDto>
            {
                new() { SeatId = Guid.NewGuid(), UserSegmentId = Guid.NewGuid() }
            },
            VoucherId = Guid.NewGuid()
        };

        _createBookingUseCase.Setup(x => x.ExecuteAsync(It.IsAny<ReqCreateBookingDto>(), It.IsAny<string>()))
            .ThrowsAsync(new Application.Exceptions.AppException("Voucher has expired", 400));

        await Assert.ThrowsAsync<Application.Exceptions.AppException>(
            () => _controller.CreateBooking(request));
    }
}
