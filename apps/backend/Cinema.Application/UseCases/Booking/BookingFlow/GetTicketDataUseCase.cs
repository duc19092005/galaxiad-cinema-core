using Cinema.Application.Dtos.Booking;
using Cinema.Application.Interfaces.Booking;
using Cinema.Domain.Enums;
using Cinema.Application.Exceptions;
using Cinema.Domain.Localization;

namespace Cinema.Application.UseCases.Booking.BookingFlow;

public class GetTicketDataUseCase
{
    private readonly IBookingOrderRepository _repo;

    public GetTicketDataUseCase(IBookingOrderRepository repo)
    {
        _repo = repo;
    }

    public async Task<ResTicketPdfDto> ExecuteAsync(Guid orderId)
    {
        var ticket = await _repo.GetTicketDataAsync(orderId);

        if (ticket == null)
        {
            throw new NotFoundException(Messages.Booking.TicketNotFoundOrNotPaid);
        }

        return ticket;
    }

    public byte[] GenerateTicketPdf(ResTicketPdfDto ticket)
    {
        var sb = new System.Text.StringBuilder();
        sb.AppendLine("==============================================");
        sb.AppendLine("           VÉ XEM PHIM / MOVIE TICKET         ");
        sb.AppendLine("==============================================");
        sb.AppendLine();
        sb.AppendLine($"Mã đơn hàng:    {ticket.OrderId}");
        sb.AppendLine($"Ngày đặt:       {ticket.OrderDate:dd/MM/yyyy HH:mm}");
        sb.AppendLine($"Mã giao dịch:   {ticket.VnPayTransactionId ?? "N/A"}");
        sb.AppendLine();
        sb.AppendLine("----------------------------------------------");
        sb.AppendLine("THÔNG TIN KHÁCH HÀNG");
        sb.AppendLine("----------------------------------------------");
        sb.AppendLine($"Họ tên:         {ticket.CustomerName ?? "N/A"}");
        sb.AppendLine($"Email:          {ticket.CustomerEmail ?? "N/A"}");
        sb.AppendLine();
        sb.AppendLine("----------------------------------------------");
        sb.AppendLine("THÔNG TIN PHIM");
        sb.AppendLine("----------------------------------------------");
        sb.AppendLine($"Phim:           {ticket.MovieName}");
        sb.AppendLine($"Định dạng:      {ticket.FormatName}");
        sb.AppendLine($"Rạp:            {ticket.CinemaName}");
        sb.AppendLine($"Địa chỉ:        {ticket.CinemaAddress}");
        sb.AppendLine($"Phòng:          {ticket.AuditoriumNumber}");
        sb.AppendLine($"Giờ chiếu:      {ticket.ShowTime:dd/MM/yyyy HH:mm}");
        sb.AppendLine($"Giờ kết thúc:   {ticket.EndedTime:dd/MM/yyyy HH:mm}");
        sb.AppendLine();
        sb.AppendLine("----------------------------------------------");
        sb.AppendLine("CHI TIẾT GHẾ");
        sb.AppendLine("----------------------------------------------");
        foreach (var seat in ticket.Seats)
        {
            sb.AppendLine($"  Ghế {seat.SeatNumber,-8} | {seat.SegmentName,-15} | {seat.PriceEach:N0} VND");
        }
        sb.AppendLine();
        sb.AppendLine("----------------------------------------------");
        sb.AppendLine($"TỔNG TIỀN:      {ticket.TotalPrice:N0} VND");
        sb.AppendLine("==============================================");
        sb.AppendLine("Cảm ơn quý khách! Chúc quý khách xem phim vui vẻ!");
        sb.AppendLine();

        return System.Text.Encoding.UTF8.GetBytes(sb.ToString());
    }
}

