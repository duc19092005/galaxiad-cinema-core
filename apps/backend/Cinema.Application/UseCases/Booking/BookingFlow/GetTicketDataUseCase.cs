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

