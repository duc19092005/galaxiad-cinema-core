using Cinema.Domain.Enums;

namespace Cinema.Application.Dtos.MovieManager.Contracts;

public sealed record CreateContractReqDto(
    string? CounterpartyContractNumber,
    Guid? DistributorId,
    string? DistributorName,
    bool IsDemo,
    Guid? AssignedMovieManagerId,
    Guid? TemplateId);

public sealed record ReviewExtractionReqDto(
    List<ContractMovieLineDto> MovieLines,
    bool FinancialPolicyReviewed,
    string? DistributorName = null);

public sealed record ContractReviewerDto(Guid UserId, string Name);
public sealed record AssignContractReqDto(Guid MovieManagerId);

public sealed record ContractMovieLineDto
{
    public Guid? MovieId { get; init; }
    public string VietnameseTitle { get; init; } = string.Empty;
    public string? EnglishTitle { get; init; }
    public string? Description { get; init; }
    public string? PosterUrl { get; init; }
    public string? TrailerUrl { get; init; }
    public string? Director { get; init; }
    public string? Actors { get; init; }
    public int DurationMinutes { get; init; }
    public Guid MovieRequiredAgeId { get; init; }
    public DateTime LicenseStartAt { get; init; }
    public DateTime LicenseEndAt { get; init; }
    public ContractScopeState CinemaScopeState { get; init; } = ContractScopeState.Unresolved;
    public ContractScopeState FormatScopeState { get; init; } = ContractScopeState.Unresolved;
    public List<Guid> CinemaIds { get; init; } = [];
    public List<Guid> FormatIds { get; init; } = [];
    public decimal CinemaSharePercent { get; init; }
    public decimal DistributorSharePercent { get; init; }
    public string? RevenueBasis { get; init; }
    public RevenueSettlementCycle SettlementCycle { get; init; }
    public bool Reviewed { get; init; }
}

public sealed record ReviewDecisionReqDto(string Reason);

public sealed record SignContractReqDto(string Password);

public sealed record CreateAddendumReqDto(string Reason, List<ContractMovieLineDto> MovieLines);

public sealed record ResContractListItemDto(
    Guid ContractId,
    string InternalCode,
    string? CounterpartyContractNumber,
    string? DistributorName,
    Guid AssignedMovieManagerId,
    string? AssignedMovieManagerName,
    string Status,
    string ProcessingStatus,
    int CurrentRevisionNumber,
    DateTime CreatedAt,
    DateTime UpdatedAt);

public sealed record ResContractDetailDto
{
    public Guid ContractId { get; init; }
    public string InternalCode { get; init; } = string.Empty;
    public string? CounterpartyContractNumber { get; init; }
    public Guid? DistributorId { get; init; }
    public string? DistributorName { get; init; }
    public Guid AssignedMovieManagerId { get; init; }
    public string? AssignedMovieManagerName { get; init; }
    public Guid? TemplateId { get; init; }
    public string? TemplateName { get; init; }
    public string Status { get; init; } = string.Empty;
    public string ProcessingStatus { get; init; } = string.Empty;
    public int CurrentRevisionNumber { get; init; }
    public ResContractRevisionDto? Revision { get; init; }
    public string[] AllowedActions { get; init; } = [];
}

public sealed record ResContractRevisionDto
{
    public Guid ContractRevisionId { get; init; }
    public int RevisionNumber { get; init; }
    public string ExtractedText { get; init; } = string.Empty;
    public string ExtractionJson { get; init; } = "{}";
    public string ReviewHistoryJson { get; init; } = "{}";
    public bool DataReviewed { get; init; }
    public bool FinancialPolicyReviewed { get; init; }
    public IEnumerable<ResContractDocumentDto> Documents { get; init; } = [];
    public IEnumerable<ResContractMovieLineDto> MovieLines { get; init; } = [];
}

public sealed record ResContractDocumentDto(
    Guid ContractDocumentId,
    string FileName,
    string Kind,
    string ContentType,
    long FileSize,
    string Sha256,
    DateTime UploadedAt);

public sealed record ResContractMovieLineDto
{
    public Guid ContractMovieLineId { get; init; }
    public Guid? MovieId { get; init; }
    public string VietnameseTitle { get; init; } = string.Empty;
    public string? EnglishTitle { get; init; }
    public string Description { get; init; } = string.Empty;
    public string? PosterUrl { get; init; }
    public string? TrailerUrl { get; init; }
    public string? Director { get; init; }
    public string? Actors { get; init; }
    public int DurationMinutes { get; init; }
    public Guid MovieRequiredAgeId { get; init; }
    public DateTime LicenseStartAt { get; init; }
    public DateTime LicenseEndAt { get; init; }
    public string CinemaScopeState { get; init; } = string.Empty;
    public string FormatScopeState { get; init; } = string.Empty;
    public List<Guid> CinemaIds { get; init; } = [];
    public List<Guid> FormatIds { get; init; } = [];
    public decimal CinemaSharePercent { get; init; }
    public decimal DistributorSharePercent { get; init; }
    public string RevenueBasis { get; init; } = string.Empty;
    public string SettlementCycle { get; init; } = string.Empty;
    public bool Reviewed { get; init; }
}

public sealed record ResContractReconciliationDto
{
    public Guid ContractId { get; init; }
    public string InternalCode { get; init; } = string.Empty;
    public string? CounterpartyContractNumber { get; init; }
    public string? DistributorName { get; init; }
    public DateTime? From { get; init; }
    public DateTime? To { get; init; }
    public int TotalTicketsSold { get; init; }
    public decimal TotalNetRevenue { get; init; }
    public decimal TotalRefunded { get; init; }
    public decimal TotalRevenueBasis { get; init; }
    public decimal CinemaShareTotal { get; init; }
    public decimal DistributorShareTotal { get; init; }
    public IEnumerable<object> Items { get; init; } = [];
}

public sealed record MovieRevenueReportRowDto(
    Guid MovieId,
    string MovieName,
    Guid ContractId,
    string InternalCode,
    string? DistributorName,
    int Tickets,
    decimal TicketRevenue,
    decimal RevenueBasis,
    decimal CinemaShare,
    decimal DistributorShare);

public sealed record ResMovieRevenueReportDto(
    DateTime From,
    DateTime To,
    decimal TotalRevenue,
    decimal TotalCinemaShare,
    IEnumerable<ResMovieRevenueItemDto> Movies);

public sealed record ResMovieRevenueItemDto(
    Guid MovieId,
    string MovieName,
    Guid ContractId,
    string InternalCode,
    string? DistributorName,
    int Tickets,
    decimal TicketRevenue,
    decimal RevenueBasis,
    decimal CinemaShare,
    decimal DistributorShare,
    decimal RevenueWeightPercent,
    decimal CinemaShareWeightPercent,
    decimal EffectiveCinemaRate);
