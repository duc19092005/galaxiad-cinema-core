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

namespace Cinema.Tests.UnitTests.Booking;

public class BookingControllerTests
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

    public BookingControllerTests()
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
    public async Task CreateBooking_ValidRequest_ReturnsOkWithPaymentUrl()
    {
        var request = new ReqCreateBookingDto
        {
            ScheduleId = Guid.NewGuid(),
            SeatSelections = new List<SeatSelectionDto>
            {
                new() { SeatId = Guid.NewGuid(), UserSegmentId = Guid.NewGuid() }
            }
        };

        var response = new BaseResponse<ResCreateBookingDto>
        {
            IsSuccess = true,
            Data = new ResCreateBookingDto
            {
                OrderId = Guid.NewGuid(),
                PaymentUrl = "https://sandbox.vnpayment.vn/..."
            }
        };

        _createBookingUseCase.Setup(x => x.ExecuteAsync(It.IsAny<ReqCreateBookingDto>(), It.IsAny<string>()))
            .ReturnsAsync(response);

        var result = await _controller.CreateBooking(request);

        result.Should().BeOfType<OkObjectResult>();
        var okResult = result as OkObjectResult;
        var data = okResult!.Value as BaseResponse<ResCreateBookingDto>;
        data!.IsSuccess.Should().BeTrue();
        data.Data!.OrderId.Should().NotBeEmpty();
        data.Data.PaymentUrl.Should().NotBeNullOrEmpty();
    }

    [Fact]
    public async Task CreateBooking_EmptySeats_ReturnsError()
    {
        var request = new ReqCreateBookingDto
        {
            ScheduleId = Guid.NewGuid(),
            SeatSelections = new List<SeatSelectionDto>()
        };

        _createBookingUseCase.Setup(x => x.ExecuteAsync(It.IsAny<ReqCreateBookingDto>(), It.IsAny<string>()))
            .ThrowsAsync(new Application.Exceptions.AppException("At least one seat must be selected", 400));

        await Assert.ThrowsAsync<Application.Exceptions.AppException>(
            () => _controller.CreateBooking(request));
    }

    [Fact]
    public async Task GetTicketData_ValidOrderId_ReturnsOk()
    {
        var orderId = Guid.NewGuid();
        var response = new BaseResponse<ResTicketPdfDto>
        {
            IsSuccess = true,
            Data = new ResTicketPdfDto
            {
                OrderId = orderId,
                MovieTitle = "Test Movie",
                CinemaName = "Test Cinema",
                AuditoriumName = "Hall 1",
                Seats = new List<string> { "A1", "A2" },
                TotalPrice = 180000
            }
        };

        _getTicketDataUseCase.Setup(x => x.ExecuteAsync(orderId))
            .ReturnsAsync(response.Data!);

        var result = await _controller.GetTicketData(orderId);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task GetTicketData_InvalidOrderId_ThrowsException()
    {
        var orderId = Guid.NewGuid();

        _getTicketDataUseCase.Setup(x => x.ExecuteAsync(orderId))
            .ThrowsAsync(new Application.Exceptions.AppException("Order not found", 404));

        await Assert.ThrowsAsync<Application.Exceptions.AppException>(
            () => _controller.GetTicketData(orderId));
    }

    [Fact]
    public async Task VnPayCallback_SuccessPayment_RedirectsToSuccessPage()
    {
        var orderId = Guid.NewGuid();
        _processVnPayCallbackUseCase.Setup(x => x.ExecuteAsync(It.IsAny<Dictionary<string, string>>()))
            .ReturnsAsync((true, orderId, (string?)null));

        // Setup query params
        _controller.ControllerContext.HttpContext.Request.QueryString =
            new QueryString($"?vnp_TxnRef={orderId}&vnp_ResponseCode=00");

        var mockClients = new Mock<IHubClients>();
        var mockClientProxy = new Mock<IClientProxy>();
        mockClients.Setup(c => c.Group(It.IsAny<string>())).Returns(mockClientProxy.Object);
        _hubContext.Setup(h => h.Clients).Returns(mockClients.Object);

        var result = await _controller.VnPayCallback();

        result.Should().BeOfType<RedirectResult>();
        var redirect = result as RedirectResult;
        redirect!.Url.Should().Contain("booking/success");
        redirect.Url.Should().Contain(orderId.ToString());
    }

    [Fact]
    public async Task VnPayCallback_FailedPayment_RedirectsToFailedPage()
    {
        var orderId = Guid.NewGuid();
        _processVnPayCallbackUseCase.Setup(x => x.ExecuteAsync(It.IsAny<Dictionary<string, string>>()))
            .ReturnsAsync((false, orderId, (string?)null));

        _controller.ControllerContext.HttpContext.Request.QueryString =
            new QueryString($"?vnp_TxnRef={orderId}&vnp_ResponseCode=24");

        var mockClients = new Mock<IHubClients>();
        var mockClientProxy = new Mock<IClientProxy>();
        mockClients.Setup(c => c.Group(It.IsAny<string>())).Returns(mockClientProxy.Object);
        _hubContext.Setup(h => h.Clients).Returns(mockClients.Object);

        var result = await _controller.VnPayCallback();

        result.Should().BeOfType<RedirectResult>();
        var redirect = result as RedirectResult;
        redirect!.Url.Should().Contain("booking/failed");
    }

    [Fact]
    public async Task LookupCustomer_ValidEmail_ReturnsOk()
    {
        var response = new BaseResponse<object>
        {
            IsSuccess = true,
            Data = new { Email = "customer@test.com", FullName = "Customer Name" }
        };

        _getBookingCustomerByEmailUseCase.Setup(x => x.ExecuteAsync("customer@test.com"))
            .ReturnsAsync(response);

        var result = await _controller.LookupCustomer("customer@test.com");

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task GetBookingHistory_ReturnsOk()
    {
        var response = new BaseResponse<object>
        {
            IsSuccess = true,
            Data = new List<object>()
        };

        _getUserBookingHistoryUseCase.Setup(x => x.ExecuteAsync())
            .ReturnsAsync(response);

        var result = await _controller.GetBookingHistory();

        result.Should().BeOfType<OkObjectResult>();
    }
}
