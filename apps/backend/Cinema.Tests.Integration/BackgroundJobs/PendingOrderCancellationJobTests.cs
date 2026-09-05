using Cinema.Application.Interfaces.Booking;
using Cinema.Application.Interfaces.Concessions;
using Cinema.Domain.Entities.UserInfos;
using Cinema.Domain.Enums;
using Cinema.Infrastructure.BackgroundJobs.Bookings;
using Cinema.Infrastructure.Persistence.Repositories.Common;
using Cinema.Testing.Fixtures;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace Cinema.Tests.Integration.BackgroundJobs;

public class PendingOrderCancellationJobTests
{
    [Fact]
    public async Task ExecuteAsync_ExpiredPendingOrders_CancelsOrders_ReleasesSeatsAndStock()
    {
        // Arrange
        using var dbContext = TestDbContextFactory.CreateInMemory();
        var unitOfWork = new EfUnitOfWork(dbContext);

        var expiredOrderId = Guid.NewGuid();
        var freshOrderId = Guid.NewGuid();
        var bookedOrderId = Guid.NewGuid();
        var scheduleId = Guid.NewGuid();
        var seat1 = Guid.NewGuid();
        var seat2 = Guid.NewGuid();
        var seat3 = Guid.NewGuid();

        // Expired pending order (created 25 minutes ago)
        var expiredOrder = new OrderInfoEntity
        {
            OrderId = expiredOrderId,
            BookingCode = "GXD-EXP01",
            OrderStatus = OrderStatusEnum.Pending,
            PaymentMethod = PaymentMethodEnum.VNPAY,
            TotalPrice = 100000m,
            SubtotalPrice = 100000m,
            FinalAmount = 100000m,
            OrderDate = DateTime.UtcNow.AddMinutes(-25),
            OrderDetailsInfo = new List<OrderDetailsInfo>
            {
                new()
                {
                    OrderId = expiredOrderId,
                    SeatId = seat1,
                    MovieScheduleId = scheduleId,
                    PriceEach = 100000m,
                    FinalPrice = 100000m,
                    ReleasedAt = null
                }
            }
        };

        // Fresh pending order (created 5 minutes ago)
        var freshOrder = new OrderInfoEntity
        {
            OrderId = freshOrderId,
            BookingCode = "GXD-FRESH01",
            OrderStatus = OrderStatusEnum.Pending,
            PaymentMethod = PaymentMethodEnum.VNPAY,
            TotalPrice = 100000m,
            SubtotalPrice = 100000m,
            FinalAmount = 100000m,
            OrderDate = DateTime.UtcNow.AddMinutes(-5),
            OrderDetailsInfo = new List<OrderDetailsInfo>
            {
                new()
                {
                    OrderId = freshOrderId,
                    SeatId = seat2,
                    MovieScheduleId = scheduleId,
                    PriceEach = 100000m,
                    FinalPrice = 100000m,
                    ReleasedAt = null
                }
            }
        };

        // Already booked order (created 30 minutes ago)
        var bookedOrder = new OrderInfoEntity
        {
            OrderId = bookedOrderId,
            BookingCode = "GXD-BOOKED01",
            OrderStatus = OrderStatusEnum.Booked,
            PaymentMethod = PaymentMethodEnum.VNPAY,
            TotalPrice = 100000m,
            SubtotalPrice = 100000m,
            FinalAmount = 100000m,
            OrderDate = DateTime.UtcNow.AddMinutes(-30),
            OrderDetailsInfo = new List<OrderDetailsInfo>
            {
                new()
                {
                    OrderId = bookedOrderId,
                    SeatId = seat3,
                    MovieScheduleId = scheduleId,
                    PriceEach = 100000m,
                    FinalPrice = 100000m,
                    ReleasedAt = null
                }
            }
        };

        await dbContext.OrderInfoEntity.AddRangeAsync(expiredOrder, freshOrder, bookedOrder);
        await dbContext.SaveChangesAsync();

        var logger = new Mock<ILogger<PendingOrderCancellationJob>>();
        var notificationService = new Mock<ISeatLockerNotificationService>();
        var inventoryStockService = new Mock<IInventoryStockService>();

        var job = new PendingOrderCancellationJob(
            unitOfWork,
            logger.Object,
            notificationService.Object,
            inventoryStockService.Object);

        // Act
        await job.ExecuteAsync(expireAfterMinutes: 15);

        // Assert
        var updatedExpiredOrder = await dbContext.OrderInfoEntity
            .Include(o => o.OrderDetailsInfo)
            .FirstOrDefaultAsync(o => o.OrderId == expiredOrderId);

        var updatedFreshOrder = await dbContext.OrderInfoEntity
            .Include(o => o.OrderDetailsInfo)
            .FirstOrDefaultAsync(o => o.OrderId == freshOrderId);

        var updatedBookedOrder = await dbContext.OrderInfoEntity
            .Include(o => o.OrderDetailsInfo)
            .FirstOrDefaultAsync(o => o.OrderId == bookedOrderId);

        // Expired order must be canceled and its seats released
        updatedExpiredOrder.Should().NotBeNull();
        updatedExpiredOrder!.OrderStatus.Should().Be(OrderStatusEnum.Canceled);
        updatedExpiredOrder.OrderDetailsInfo.First().ReleasedAt.Should().NotBeNull();
        inventoryStockService.Verify(s => s.ReleaseAsync(expiredOrderId), Times.Once);
        notificationService.Verify(s => s.NotifySeatsReleasedAsync(
            scheduleId.ToString(),
            It.Is<List<string>>(seats => seats.Contains(seat1.ToString()))), Times.Once);

        // Fresh order must still be Pending
        updatedFreshOrder.Should().NotBeNull();
        updatedFreshOrder!.OrderStatus.Should().Be(OrderStatusEnum.Pending);
        updatedFreshOrder.OrderDetailsInfo.First().ReleasedAt.Should().BeNull();

        // Booked order must still be Booked
        updatedBookedOrder.Should().NotBeNull();
        updatedBookedOrder!.OrderStatus.Should().Be(OrderStatusEnum.Booked);
        updatedBookedOrder.OrderDetailsInfo.First().ReleasedAt.Should().BeNull();
    }

    [Fact]
    public async Task ExecuteForOrderAsync_PendingOrder_CancelsOrderAndReleasesSeats()
    {
        // Arrange
        using var dbContext = TestDbContextFactory.CreateInMemory();
        var unitOfWork = new EfUnitOfWork(dbContext);

        var orderId = Guid.NewGuid();
        var scheduleId = Guid.NewGuid();
        var seatId = Guid.NewGuid();

        var order = new OrderInfoEntity
        {
            OrderId = orderId,
            BookingCode = "GXD-ONTIMEOUT01",
            OrderStatus = OrderStatusEnum.Pending,
            PaymentMethod = PaymentMethodEnum.VNPAY,
            TotalPrice = 95000m,
            SubtotalPrice = 95000m,
            FinalAmount = 95000m,
            OrderDate = DateTime.UtcNow.AddMinutes(-10),
            OrderDetailsInfo = new List<OrderDetailsInfo>
            {
                new()
                {
                    OrderId = orderId,
                    SeatId = seatId,
                    MovieScheduleId = scheduleId,
                    PriceEach = 95000m,
                    FinalPrice = 95000m,
                    ReleasedAt = null
                }
            }
        };

        await dbContext.OrderInfoEntity.AddAsync(order);
        await dbContext.SaveChangesAsync();

        var logger = new Mock<ILogger<PendingOrderCancellationJob>>();
        var notificationService = new Mock<ISeatLockerNotificationService>();
        var inventoryStockService = new Mock<IInventoryStockService>();

        var job = new PendingOrderCancellationJob(
            unitOfWork,
            logger.Object,
            notificationService.Object,
            inventoryStockService.Object);

        // Act
        await job.ExecuteForOrderAsync(orderId);

        // Assert
        var canceledOrder = await dbContext.OrderInfoEntity
            .Include(o => o.OrderDetailsInfo)
            .FirstOrDefaultAsync(o => o.OrderId == orderId);

        canceledOrder.Should().NotBeNull();
        canceledOrder!.OrderStatus.Should().Be(OrderStatusEnum.Canceled);
        canceledOrder.OrderDetailsInfo.First().ReleasedAt.Should().NotBeNull();
        inventoryStockService.Verify(s => s.ReleaseAsync(orderId), Times.Once);
        notificationService.Verify(s => s.NotifySeatsReleasedAsync(
            scheduleId.ToString(),
            It.Is<List<string>>(seats => seats.Contains(seatId.ToString()))), Times.Once);
    }

    [Fact]
    public async Task ExecuteForOrderAsync_AlreadyBookedOrder_DoesNotCancel()
    {
        // Arrange
        using var dbContext = TestDbContextFactory.CreateInMemory();
        var unitOfWork = new EfUnitOfWork(dbContext);

        var orderId = Guid.NewGuid();
        var scheduleId = Guid.NewGuid();
        var seatId = Guid.NewGuid();

        var order = new OrderInfoEntity
        {
            OrderId = orderId,
            BookingCode = "GXD-BOOKEDNOOP",
            OrderStatus = OrderStatusEnum.Booked,
            PaymentMethod = PaymentMethodEnum.VNPAY,
            TotalPrice = 95000m,
            SubtotalPrice = 95000m,
            FinalAmount = 95000m,
            OrderDate = DateTime.UtcNow.AddMinutes(-30),
            OrderDetailsInfo = new List<OrderDetailsInfo>
            {
                new()
                {
                    OrderId = orderId,
                    SeatId = seatId,
                    MovieScheduleId = scheduleId,
                    PriceEach = 95000m,
                    FinalPrice = 95000m,
                    ReleasedAt = null
                }
            }
        };

        await dbContext.OrderInfoEntity.AddAsync(order);
        await dbContext.SaveChangesAsync();

        var logger = new Mock<ILogger<PendingOrderCancellationJob>>();
        var notificationService = new Mock<ISeatLockerNotificationService>();
        var inventoryStockService = new Mock<IInventoryStockService>();

        var job = new PendingOrderCancellationJob(
            unitOfWork,
            logger.Object,
            notificationService.Object,
            inventoryStockService.Object);

        // Act
        await job.ExecuteForOrderAsync(orderId);

        // Assert
        var unchangedOrder = await dbContext.OrderInfoEntity
            .Include(o => o.OrderDetailsInfo)
            .FirstOrDefaultAsync(o => o.OrderId == orderId);

        unchangedOrder.Should().NotBeNull();
        unchangedOrder!.OrderStatus.Should().Be(OrderStatusEnum.Booked);
        unchangedOrder.OrderDetailsInfo.First().ReleasedAt.Should().BeNull();
        inventoryStockService.Verify(s => s.ReleaseAsync(It.IsAny<Guid>()), Times.Never);
        notificationService.Verify(s => s.NotifySeatsReleasedAsync(It.IsAny<string>(), It.IsAny<List<string>>()), Times.Never);
    }
}
