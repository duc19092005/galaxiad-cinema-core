using System.Net;
using Cinema.Application.Interfaces.Booking;
using Cinema.Application.Interfaces.Concessions;
using Cinema.Application.Interfaces.IThirdPersonServices;
using Cinema.Application.UseCases.Booking.BookingFlow;
using Cinema.Domain.Entities.UserInfos;
using Cinema.Domain.Entities.Vouchers;
using Cinema.Domain.Enums;
using Cinema.Infrastructure.ExternalServices.Payments;
using Cinema.Infrastructure.ExternalServices.Security;
using Cinema.Infrastructure.Persistence.Repositories.Booking;
using Cinema.Infrastructure.Persistence.Repositories.Common;
using Cinema.Testing.Fixtures;
using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace Cinema.Tests.Integration.Booking;

public class ProcessVnPayCallbackIntegrationTests
{
    private const string TestHashSecret = "TEST_SECRET_KEY_1234567890ABCDEF";
    private readonly IConfiguration _configuration;
    private readonly ISha256Services _sha256Service;
    private readonly IVnPayService _vnPayService;

    public ProcessVnPayCallbackIntegrationTests()
    {
        var configValues = new Dictionary<string, string?>
        {
            { "VNPay:HashSecret", TestHashSecret },
            { "VNPay:TmnCode", "TESTCODE" },
            { "VNPay:ReturnUrl", "http://localhost/callback" },
            { "VNPay:PayUrl", "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html" }
        };

        _configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(configValues)
            .Build();

        var loggerSha = new Mock<ILogger<Sha256Service>>();
        _sha256Service = new Sha256Service(_configuration, loggerSha.Object);

        var loggerVnp = new Mock<ILogger<VnpayService>>();
        _vnPayService = new VnpayService(_configuration, _sha256Service, loggerVnp.Object);
    }

    private string ComputeValidHash(IDictionary<string, string> parameters)
    {
        var sortedParams = parameters
            .Where(x => x.Key != "vnp_SecureHash" && x.Key != "vnp_SecureHashType" && !string.IsNullOrEmpty(x.Value))
            .OrderBy(x => x.Key)
            .ToList();

        var rawData = new System.Text.StringBuilder();
        foreach (var vp in sortedParams)
        {
            rawData.Append(WebUtility.UrlEncode(vp.Key) + "=" + WebUtility.UrlEncode(vp.Value) + "&");
        }

        string rawDataStr = rawData.ToString().TrimEnd('&');
        return _sha256Service.Encrypt(rawDataStr, TestHashSecret);
    }

    [Fact]
    public async Task ExecuteAsync_ValidCallback_MarksOrderBooked_CreditsPoints_CommitsStock()
    {
        // Arrange
        using var dbContext = TestDbContextFactory.CreateInMemory();
        var common = new CommonBookingQueries(dbContext);
        var repo = new PaymentCallbackRepository(dbContext, common);
        var unitOfWork = new EfUnitOfWork(dbContext);

        var userId = Guid.NewGuid();
        var orderId = Guid.NewGuid();
        var scheduleId = Guid.NewGuid();
        var seatId = Guid.NewGuid();

        var user = new UserInfoEntity
        {
            UserId = userId,
            UserName = "testuser",
            UserEmail = "test@example.com",
            IdentityCode = "012345678901",
            PhoneNumber = "0901234567",
            RewardPoints = 50,
            AccountStatus = AccountStatusEnum.Active
        };
        var customerProfile = new CustomerProfileEntity
        {
            UserId = userId,
            TotalPoint = 100,
            MembershipRank = MembershipRankEnum.Standard
        };
        var order = new OrderInfoEntity
        {
            OrderId = orderId,
            BookingCode = "GXD-TEST01",
            UserId = userId,
            OrderStatus = OrderStatusEnum.Pending,
            PaymentMethod = PaymentMethodEnum.VNPAY,
            TotalPrice = 100000m,
            SubtotalPrice = 100000m,
            FinalAmount = 100000m,
            OrderDate = DateTime.UtcNow,
            TotalQuantity = 1,
            OrderDetailsInfo = new List<OrderDetailsInfo>
            {
                new()
                {
                    OrderId = orderId,
                    SeatId = seatId,
                    MovieScheduleId = scheduleId,
                    PriceEach = 100000m,
                    FinalPrice = 100000m
                }
            }
        };

        await dbContext.UserInfoEntity.AddAsync(user);
        await dbContext.CustomerProfileEntity.AddAsync(customerProfile);
        await dbContext.OrderInfoEntity.AddAsync(order);
        await dbContext.SaveChangesAsync();

        var logger = new Mock<ILogger<ProcessVnPayCallbackUseCase>>();
        var cacheService = new Mock<IMovieCacheService>();
        var groupBookingRepo = new Mock<IGroupBookingRepository>();
        var notificationService = new Mock<ISeatLockerNotificationService>();
        var groupBookingCacheService = new Mock<IGroupBookingCacheService>();
        var voteTimeoutScheduler = new Mock<IVoteTimeoutScheduler>();
        var inventoryStockService = new Mock<IInventoryStockService>();

        var useCase = new ProcessVnPayCallbackUseCase(
            repo,
            _vnPayService,
            logger.Object,
            unitOfWork,
            cacheService.Object,
            groupBookingRepo.Object,
            notificationService.Object,
            null!,
            groupBookingCacheService.Object,
            voteTimeoutScheduler.Object,
            inventoryStockService.Object);

        var callbackParams = new Dictionary<string, string>
        {
            { "vnp_TxnRef", orderId.ToString() },
            { "vnp_ResponseCode", "00" },
            { "vnp_TransactionNo", "VNPAY_TXN_987654" },
            { "vnp_Amount", "10000000" } // 100,000 * 100
        };
        callbackParams["vnp_SecureHash"] = ComputeValidHash(callbackParams);

        // Act
        var result = await useCase.ExecuteAsync(callbackParams);

        // Assert
        result.success.Should().BeTrue();
        result.orderId.Should().Be(orderId);

        var updatedOrder = await repo.GetOrderByIdAsync(orderId);
        updatedOrder.Should().NotBeNull();
        updatedOrder!.OrderStatus.Should().Be(OrderStatusEnum.Booked);
        updatedOrder.VnPayTransactionId.Should().Be("VNPAY_TXN_987654");

        inventoryStockService.Verify(s => s.CommitAsync(orderId, userId), Times.Once);

        var updatedProfile = await repo.GetCustomerProfileAsync(userId);
        updatedProfile!.TotalPoint.Should().BeGreaterThan(100);

        var updatedUser = await repo.FindUserByIdAsync(userId);
        updatedUser!.RewardPoints.Should().BeGreaterThan(50);
    }

    [Fact]
    public async Task ExecuteAsync_ValidCallback_WithVoucher_MarksVoucherAsUsed()
    {
        // Arrange
        using var dbContext = TestDbContextFactory.CreateInMemory();
        var common = new CommonBookingQueries(dbContext);
        var repo = new PaymentCallbackRepository(dbContext, common);
        var unitOfWork = new EfUnitOfWork(dbContext);

        var userId = Guid.NewGuid();
        var orderId = Guid.NewGuid();
        var voucherId = Guid.NewGuid();
        var userVoucherId = Guid.NewGuid();

        var user = new UserInfoEntity
        {
            UserId = userId,
            UserName = "vouchertester",
            UserEmail = "voucher@example.com",
            IdentityCode = "012345678902",
            PhoneNumber = "0901234568",
            AccountStatus = AccountStatusEnum.Active
        };
        var userVoucher = new UserVoucherEntity
        {
            UserVoucherId = userVoucherId,
            VoucherId = voucherId,
            UserId = userId,
            IsUsed = false
        };
        var order = new OrderInfoEntity
        {
            OrderId = orderId,
            BookingCode = "GXD-VOUCHER01",
            UserId = userId,
            VoucherId = voucherId,
            OrderStatus = OrderStatusEnum.Pending,
            PaymentMethod = PaymentMethodEnum.VNPAY,
            TotalPrice = 80000m,
            SubtotalPrice = 100000m,
            FinalAmount = 80000m,
            OrderDate = DateTime.UtcNow,
            TotalQuantity = 1
        };

        await dbContext.UserInfoEntity.AddAsync(user);
        await dbContext.UserVoucherEntity.AddAsync(userVoucher);
        await dbContext.OrderInfoEntity.AddAsync(order);
        await dbContext.SaveChangesAsync();

        var logger = new Mock<ILogger<ProcessVnPayCallbackUseCase>>();
        var cacheService = new Mock<IMovieCacheService>();
        var groupBookingRepo = new Mock<IGroupBookingRepository>();
        var notificationService = new Mock<ISeatLockerNotificationService>();
        var groupBookingCacheService = new Mock<IGroupBookingCacheService>();
        var voteTimeoutScheduler = new Mock<IVoteTimeoutScheduler>();
        var inventoryStockService = new Mock<IInventoryStockService>();

        var useCase = new ProcessVnPayCallbackUseCase(
            repo,
            _vnPayService,
            logger.Object,
            unitOfWork,
            cacheService.Object,
            groupBookingRepo.Object,
            notificationService.Object,
            null!,
            groupBookingCacheService.Object,
            voteTimeoutScheduler.Object,
            inventoryStockService.Object);

        var callbackParams = new Dictionary<string, string>
        {
            { "vnp_TxnRef", orderId.ToString() },
            { "vnp_ResponseCode", "00" },
            { "vnp_TransactionNo", "VNPAY_TXN_VOUCHER_1" },
            { "vnp_Amount", "8000000" } // 80,000 * 100
        };
        callbackParams["vnp_SecureHash"] = ComputeValidHash(callbackParams);

        // Act
        var result = await useCase.ExecuteAsync(callbackParams);

        // Assert
        result.success.Should().BeTrue();
        var updatedVoucher = await dbContext.UserVoucherEntity.FindAsync(userVoucherId);
        updatedVoucher.Should().NotBeNull();
        updatedVoucher!.IsUsed.Should().BeTrue();
        updatedVoucher.UsedAt.Should().NotBeNull();
    }

    [Fact]
    public async Task ExecuteAsync_TamperedChecksum_RejectsCallback_OrderRemainsPending()
    {
        // Arrange
        using var dbContext = TestDbContextFactory.CreateInMemory();
        var common = new CommonBookingQueries(dbContext);
        var repo = new PaymentCallbackRepository(dbContext, common);
        var unitOfWork = new EfUnitOfWork(dbContext);

        var orderId = Guid.NewGuid();
        var order = new OrderInfoEntity
        {
            OrderId = orderId,
            BookingCode = "GXD-TAMPER01",
            OrderStatus = OrderStatusEnum.Pending,
            PaymentMethod = PaymentMethodEnum.VNPAY,
            TotalPrice = 100000m,
            SubtotalPrice = 100000m,
            FinalAmount = 100000m,
            OrderDate = DateTime.UtcNow
        };
        await dbContext.OrderInfoEntity.AddAsync(order);
        await dbContext.SaveChangesAsync();

        var logger = new Mock<ILogger<ProcessVnPayCallbackUseCase>>();
        var cacheService = new Mock<IMovieCacheService>();
        var groupBookingRepo = new Mock<IGroupBookingRepository>();
        var notificationService = new Mock<ISeatLockerNotificationService>();
        var groupBookingCacheService = new Mock<IGroupBookingCacheService>();
        var voteTimeoutScheduler = new Mock<IVoteTimeoutScheduler>();
        var inventoryStockService = new Mock<IInventoryStockService>();

        var useCase = new ProcessVnPayCallbackUseCase(
            repo,
            _vnPayService,
            logger.Object,
            unitOfWork,
            cacheService.Object,
            groupBookingRepo.Object,
            notificationService.Object,
            null!,
            groupBookingCacheService.Object,
            voteTimeoutScheduler.Object,
            inventoryStockService.Object);

        var callbackParams = new Dictionary<string, string>
        {
            { "vnp_TxnRef", orderId.ToString() },
            { "vnp_ResponseCode", "00" },
            { "vnp_TransactionNo", "VNPAY_TXN_TAMPER" },
            { "vnp_Amount", "10000000" },
            { "vnp_SecureHash", "INVALID_TAMPERED_CHECKSUM_HASH" }
        };

        // Act
        var result = await useCase.ExecuteAsync(callbackParams);

        // Assert
        result.success.Should().BeFalse();
        result.orderId.Should().Be(Guid.Empty);

        var freshOrder = await repo.GetOrderByIdAsync(orderId);
        freshOrder!.OrderStatus.Should().Be(OrderStatusEnum.Pending);
        inventoryStockService.Verify(s => s.CommitAsync(It.IsAny<Guid>(), It.IsAny<Guid?>()), Times.Never);
    }

    [Fact]
    public async Task ExecuteAsync_AmountMismatch_RejectsCallback_OrderRemainsPending()
    {
        // Arrange
        using var dbContext = TestDbContextFactory.CreateInMemory();
        var common = new CommonBookingQueries(dbContext);
        var repo = new PaymentCallbackRepository(dbContext, common);
        var unitOfWork = new EfUnitOfWork(dbContext);

        var orderId = Guid.NewGuid();
        var order = new OrderInfoEntity
        {
            OrderId = orderId,
            BookingCode = "GXD-MISMATCH01",
            OrderStatus = OrderStatusEnum.Pending,
            PaymentMethod = PaymentMethodEnum.VNPAY,
            TotalPrice = 100000m,
            SubtotalPrice = 100000m,
            FinalAmount = 100000m,
            OrderDate = DateTime.UtcNow
        };
        await dbContext.OrderInfoEntity.AddAsync(order);
        await dbContext.SaveChangesAsync();

        var logger = new Mock<ILogger<ProcessVnPayCallbackUseCase>>();
        var cacheService = new Mock<IMovieCacheService>();
        var groupBookingRepo = new Mock<IGroupBookingRepository>();
        var notificationService = new Mock<ISeatLockerNotificationService>();
        var groupBookingCacheService = new Mock<IGroupBookingCacheService>();
        var voteTimeoutScheduler = new Mock<IVoteTimeoutScheduler>();
        var inventoryStockService = new Mock<IInventoryStockService>();

        var useCase = new ProcessVnPayCallbackUseCase(
            repo,
            _vnPayService,
            logger.Object,
            unitOfWork,
            cacheService.Object,
            groupBookingRepo.Object,
            notificationService.Object,
            null!,
            groupBookingCacheService.Object,
            voteTimeoutScheduler.Object,
            inventoryStockService.Object);

        // Callback says amount is 50,000 instead of 100,000
        var callbackParams = new Dictionary<string, string>
        {
            { "vnp_TxnRef", orderId.ToString() },
            { "vnp_ResponseCode", "00" },
            { "vnp_TransactionNo", "VNPAY_TXN_MISMATCH" },
            { "vnp_Amount", "5000000" } // 50,000 * 100
        };
        callbackParams["vnp_SecureHash"] = ComputeValidHash(callbackParams);

        // Act
        var result = await useCase.ExecuteAsync(callbackParams);

        // Assert
        result.success.Should().BeFalse();
        result.orderId.Should().Be(orderId);

        var freshOrder = await repo.GetOrderByIdAsync(orderId);
        freshOrder!.OrderStatus.Should().Be(OrderStatusEnum.Pending);
        inventoryStockService.Verify(s => s.CommitAsync(It.IsAny<Guid>(), It.IsAny<Guid?>()), Times.Never);
    }

    [Fact]
    public async Task ExecuteAsync_PaymentFailedCode_CancelsOrder_ReleasesDetailsAndStock()
    {
        // Arrange
        using var dbContext = TestDbContextFactory.CreateInMemory();
        var common = new CommonBookingQueries(dbContext);
        var repo = new PaymentCallbackRepository(dbContext, common);
        var unitOfWork = new EfUnitOfWork(dbContext);

        var orderId = Guid.NewGuid();
        var scheduleId = Guid.NewGuid();
        var seatId = Guid.NewGuid();

        var order = new OrderInfoEntity
        {
            OrderId = orderId,
            BookingCode = "GXD-FAIL01",
            OrderStatus = OrderStatusEnum.Pending,
            PaymentMethod = PaymentMethodEnum.VNPAY,
            TotalPrice = 90000m,
            SubtotalPrice = 90000m,
            FinalAmount = 90000m,
            OrderDate = DateTime.UtcNow,
            OrderDetailsInfo = new List<OrderDetailsInfo>
            {
                new()
                {
                    OrderId = orderId,
                    SeatId = seatId,
                    MovieScheduleId = scheduleId,
                    PriceEach = 90000m,
                    FinalPrice = 90000m,
                    ReleasedAt = null
                }
            }
        };
        await dbContext.OrderInfoEntity.AddAsync(order);
        await dbContext.SaveChangesAsync();

        var logger = new Mock<ILogger<ProcessVnPayCallbackUseCase>>();
        var cacheService = new Mock<IMovieCacheService>();
        var groupBookingRepo = new Mock<IGroupBookingRepository>();
        var notificationService = new Mock<ISeatLockerNotificationService>();
        var groupBookingCacheService = new Mock<IGroupBookingCacheService>();
        var voteTimeoutScheduler = new Mock<IVoteTimeoutScheduler>();
        var inventoryStockService = new Mock<IInventoryStockService>();

        var useCase = new ProcessVnPayCallbackUseCase(
            repo,
            _vnPayService,
            logger.Object,
            unitOfWork,
            cacheService.Object,
            groupBookingRepo.Object,
            notificationService.Object,
            null!,
            groupBookingCacheService.Object,
            voteTimeoutScheduler.Object,
            inventoryStockService.Object);

        // Code 24 = User canceled on VNPay gateway
        var callbackParams = new Dictionary<string, string>
        {
            { "vnp_TxnRef", orderId.ToString() },
            { "vnp_ResponseCode", "24" },
            { "vnp_TransactionNo", "VNPAY_TXN_CANCELED" },
            { "vnp_Amount", "9000000" }
        };
        callbackParams["vnp_SecureHash"] = ComputeValidHash(callbackParams);

        // Act
        var result = await useCase.ExecuteAsync(callbackParams);

        // Assert
        result.success.Should().BeFalse();
        result.orderId.Should().Be(orderId);

        var freshOrder = await repo.GetOrderByIdAsync(orderId);
        freshOrder!.OrderStatus.Should().Be(OrderStatusEnum.Canceled);
        freshOrder.OrderDetailsInfo.First().ReleasedAt.Should().NotBeNull();
        inventoryStockService.Verify(s => s.ReleaseAsync(orderId), Times.Once);
    }

    [Fact]
    public async Task ExecuteAsync_DuplicateCallback_SameTransactionId_IsIdempotent()
    {
        // Arrange
        using var dbContext = TestDbContextFactory.CreateInMemory();
        var common = new CommonBookingQueries(dbContext);
        var repo = new PaymentCallbackRepository(dbContext, common);
        var unitOfWork = new EfUnitOfWork(dbContext);

        var orderId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        const string transactionId = "VNPAY_TXN_ALREADY_BOOKED";

        var order = new OrderInfoEntity
        {
            OrderId = orderId,
            BookingCode = "GXD-IDEMP01",
            UserId = userId,
            OrderStatus = OrderStatusEnum.Booked, // Already booked
            VnPayTransactionId = transactionId,
            PaymentMethod = PaymentMethodEnum.VNPAY,
            TotalPrice = 120000m,
            SubtotalPrice = 120000m,
            FinalAmount = 120000m,
            OrderDate = DateTime.UtcNow
        };
        await dbContext.OrderInfoEntity.AddAsync(order);
        await dbContext.SaveChangesAsync();

        var logger = new Mock<ILogger<ProcessVnPayCallbackUseCase>>();
        var cacheService = new Mock<IMovieCacheService>();
        var groupBookingRepo = new Mock<IGroupBookingRepository>();
        var notificationService = new Mock<ISeatLockerNotificationService>();
        var groupBookingCacheService = new Mock<IGroupBookingCacheService>();
        var voteTimeoutScheduler = new Mock<IVoteTimeoutScheduler>();
        var inventoryStockService = new Mock<IInventoryStockService>();

        var useCase = new ProcessVnPayCallbackUseCase(
            repo,
            _vnPayService,
            logger.Object,
            unitOfWork,
            cacheService.Object,
            groupBookingRepo.Object,
            notificationService.Object,
            null!,
            groupBookingCacheService.Object,
            voteTimeoutScheduler.Object,
            inventoryStockService.Object);

        var callbackParams = new Dictionary<string, string>
        {
            { "vnp_TxnRef", orderId.ToString() },
            { "vnp_ResponseCode", "00" },
            { "vnp_TransactionNo", transactionId },
            { "vnp_Amount", "12000000" }
        };
        callbackParams["vnp_SecureHash"] = ComputeValidHash(callbackParams);

        // Act
        var result = await useCase.ExecuteAsync(callbackParams);

        // Assert - Idempotent return true, no additional stock commit
        result.success.Should().BeTrue();
        result.orderId.Should().Be(orderId);
        inventoryStockService.Verify(s => s.CommitAsync(It.IsAny<Guid>(), It.IsAny<Guid?>()), Times.Never);
    }
}
