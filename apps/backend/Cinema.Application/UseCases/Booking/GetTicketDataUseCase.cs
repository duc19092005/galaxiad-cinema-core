using Cinema.Application.Dtos.Booking;
using Cinema.Application.Interfaces.Booking;
using Cinema.Domain.Enums;
using Cinema.Application.Exceptions;

namespace Cinema.Application.UseCases.Booking;

public class GetTicketDataUseCase
{
    private readonly IBookingOrderRepository _repo;

    public GetTicketDataUseCase(IBookingOrderRepository repo)
    {
        _repo = repo;
    }

    public async Task<ResTicketPdfDto> ExecuteAsync(Guid orderId)
    {
        var order = await _repo.GetOrderWithDetailsAsync(orderId);

        if (order == null || order.OrderStatus != OrderStatusEnum.Booked)
        {
            throw new NotFoundException("Không tìm thấy vé hoặc đơn hàng chưa thanh toán thành công.");
        }

        return new ResTicketPdfDto
        {
            OrderId = order.OrderId,
            CustomerName = order.CustomerName,
            CustomerEmail = order.CustomerEmail,
            OrderDate = order.OrderDate,
            TotalPrice = order.TotalPrice,
            VnPayTransactionId = order.VnPayTransactionId,
            MovieName = order.OrderDetailsInfo
                .Select(od => od.MovieScheduleInfoEntity.MovieInfoEntity!.MovieName).FirstOrDefault() ?? "",
            MovieImageUrl = order.OrderDetailsInfo
                .Select(od => od.MovieScheduleInfoEntity.MovieInfoEntity!.MovieImageUrl).FirstOrDefault() ?? "",
            CinemaName = order.OrderDetailsInfo
                .Select(od => od.MovieScheduleInfoEntity.AuditoriumInfoEntities!.CinemaInfoEntity.CinemaName).FirstOrDefault() ?? "",
            CinemaAddress = order.OrderDetailsInfo
                .Select(od => od.MovieScheduleInfoEntity.AuditoriumInfoEntities!.CinemaInfoEntity.CinemaLocation).FirstOrDefault() ?? "",
            AuditoriumNumber = order.OrderDetailsInfo
                .Select(od => od.MovieScheduleInfoEntity.AuditoriumInfoEntities!.AuditoriumNumber).FirstOrDefault() ?? "",
            FormatName = order.OrderDetailsInfo
                .Select(od => od.MovieScheduleInfoEntity.MovieFormatInfoEntity!.MovieFormatName).FirstOrDefault() ?? "",
            ShowTime = order.OrderDetailsInfo
                .Select(od => od.MovieScheduleInfoEntity.StartTime).FirstOrDefault(),
            EndedTime = order.OrderDetailsInfo
                .Select(od => od.MovieScheduleInfoEntity.EndedTime).FirstOrDefault(),
            Seats = order.OrderDetailsInfo.Select(od => new TicketSeatDetail
            {
                SeatNumber = od.SeatsInfoEntity.SeatNumber,
                SegmentName = od.UserSegmentsInfoEntity.UserSegmentName,
                PriceEach = od.PriceEach
            }).ToList()
        };
    }

    public byte[] GenerateTicketPdf(ResTicketPdfDto ticket)
    {
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

        return System.Text.Encoding.UTF8.GetBytes(sb.ToString());
    }
}
