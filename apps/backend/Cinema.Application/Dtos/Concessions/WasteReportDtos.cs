using System.ComponentModel.DataAnnotations;
using Cinema.Domain.Enums;

namespace Cinema.Application.Dtos.Concessions;

public class ReqCreateWasteReportDto
{
    [Required] public Guid CinemaId { get; set; }
    [Required] public Guid ProductId { get; set; }
    [Range(1, int.MaxValue)] public int Quantity { get; set; }
    [Required, StringLength(500)] public string Reason { get; set; } = string.Empty;
    public string? ProofImageUrl { get; set; }
}

public class ReqReviewWasteReportDto
{
    public bool Approve { get; set; }
    public string? ReviewNote { get; set; }
}

public class ResWasteReportDto
{
    public Guid WasteReportId { get; set; }
    public Guid CinemaId { get; set; }
    public string CinemaName { get; set; } = string.Empty;
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string Sku { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public string Reason { get; set; } = string.Empty;
    public string? ProofImageUrl { get; set; }
    public WasteReportStatus Status { get; set; }
    public Guid ReportedByUserId { get; set; }
    public string ReportedByUserName { get; set; } = string.Empty;
    public Guid? ReviewedByUserId { get; set; }
    public string? ReviewedByUserName { get; set; }
    public string? ReviewNote { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ReviewedAt { get; set; }
}
