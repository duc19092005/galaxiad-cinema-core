using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Cinema.Domain.Entities.MovieInfos;
using Cinema.Domain.Entities.UserInfos;
using Cinema.Domain.Enums;

namespace Cinema.Domain.Entities.Contracts;

public class ContractTemplateEntity
{
    [Key] public Guid ContractTemplateId { get; set; }
    [MaxLength(50)] public string Code { get; set; } = string.Empty;
    [MaxLength(200)] public string Name { get; set; } = string.Empty;
    public int Version { get; set; } = 1;
    public ContractTemplateStatus Status { get; set; } = ContractTemplateStatus.Draft;
    public string SchemaJson { get; set; } = "{}";
    public string BodyTemplate { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? PublishedAt { get; set; }
    public Guid CreatedByUserId { get; set; }
    [Timestamp] public byte[] RowVersion { get; set; } = [];
}

public class DistributorEntity
{
    [Key] public Guid DistributorId { get; set; }
    [MaxLength(200)] public string LegalName { get; set; } = string.Empty;
    [MaxLength(50)] public string? TaxCode { get; set; }
    [MaxLength(500)] public string? Address { get; set; }
    [MaxLength(200)] public string? RepresentativeName { get; set; }
    [MaxLength(200)] public string? RepresentativeTitle { get; set; }
    public bool IsDemo { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class FilmContractEntity
{
    [Key] public Guid ContractId { get; set; }
    [MaxLength(50)] public string InternalCode { get; set; } = string.Empty;
    [MaxLength(100)] public string? CounterpartyContractNumber { get; set; }
    public Guid? DistributorId { get; set; }
    public DistributorEntity? Distributor { get; set; }
    public Guid AssignedMovieManagerId { get; set; }
    public UserInfoEntity? AssignedMovieManager { get; set; }
    public Guid? TemplateId { get; set; }
    public ContractTemplateEntity? Template { get; set; }
    public Guid? PreviousContractId { get; set; }
    public FilmContractEntity? PreviousContract { get; set; }
    public ContractStatus Status { get; set; } = ContractStatus.Draft;
    public ContractProcessingStatus ProcessingStatus { get; set; }
    public int CurrentRevisionNumber { get; set; } = 1;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public Guid CreatedByUserId { get; set; }
    [Timestamp] public byte[] RowVersion { get; set; } = [];
    public List<ContractRevisionEntity> Revisions { get; set; } = [];
}

public class ContractRevisionEntity
{
    [Key] public Guid ContractRevisionId { get; set; }
    public Guid ContractId { get; set; }
    public FilmContractEntity Contract { get; set; } = null!;
    public int RevisionNumber { get; set; }
    public bool IsCurrent { get; set; } = true;
    public string ExtractedText { get; set; } = string.Empty;
    public string ExtractionJson { get; set; } = "{}";
    public string ReviewedDataJson { get; set; } = "{}";
    public bool DataReviewed { get; set; }
    public bool FinancialPolicyReviewed { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public Guid CreatedByUserId { get; set; }
    [MaxLength(64)] public string ContentHash { get; set; } = string.Empty;
    public List<ContractMovieLineEntity> MovieLines { get; set; } = [];
    public List<ContractDocumentEntity> Documents { get; set; } = [];
}

public class ContractDocumentEntity
{
    [Key] public Guid ContractDocumentId { get; set; }
    public Guid ContractRevisionId { get; set; }
    public ContractRevisionEntity Revision { get; set; } = null!;
    public ContractDocumentKind Kind { get; set; }
    [MaxLength(260)] public string FileName { get; set; } = string.Empty;
    [MaxLength(100)] public string ContentType { get; set; } = string.Empty;
    [MaxLength(700)] public string StoragePath { get; set; } = string.Empty;
    [MaxLength(64)] public string Sha256 { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public bool IsDemoSignature { get; set; }
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
    public Guid UploadedByUserId { get; set; }
}

public class ContractMovieLineEntity
{
    [Key] public Guid ContractMovieLineId { get; set; }
    public Guid ContractRevisionId { get; set; }
    public ContractRevisionEntity Revision { get; set; } = null!;
    public Guid? MovieId { get; set; }
    public MovieInfoEntity? Movie { get; set; }
    [MaxLength(200)] public string VietnameseTitle { get; set; } = string.Empty;
    [MaxLength(200)] public string? EnglishTitle { get; set; }
    public string Description { get; set; } = string.Empty;
    [MaxLength(2048)] public string? PosterUrl { get; set; }
    [MaxLength(2048)] public string? TrailerUrl { get; set; }
    [MaxLength(200)] public string? Director { get; set; }
    [MaxLength(500)] public string? Actors { get; set; }
    public int DurationMinutes { get; set; }
    public Guid MovieRequiredAgeId { get; set; }
    public DateTime LicenseStartAt { get; set; }
    public DateTime LicenseEndAt { get; set; }
    public ContractScopeState CinemaScopeState { get; set; } = ContractScopeState.Unresolved;
    public ContractScopeState FormatScopeState { get; set; } = ContractScopeState.Unresolved;
    public string CinemaIdsJson { get; set; } = "[]";
    public string FormatIdsJson { get; set; } = "[]";
    [Column(TypeName = "decimal(5,2)")] public decimal CinemaSharePercent { get; set; }
    [Column(TypeName = "decimal(5,2)")] public decimal DistributorSharePercent { get; set; }
    [MaxLength(100)] public string RevenueBasis { get; set; } = "TICKET_FINAL_PRICE_AFTER_REFUND";
    public RevenueSettlementCycle SettlementCycle { get; set; }
    public bool Reviewed { get; set; }
}

public class ContractSignOffEntity
{
    [Key] public Guid ContractSignOffId { get; set; }
    public Guid ContractId { get; set; }
    public Guid ContractRevisionId { get; set; }
    public Guid SignedByUserId { get; set; }
    public DateTime SignedAt { get; set; } = DateTime.UtcNow;
    [MaxLength(64)] public string SignedContentHash { get; set; } = string.Empty;
    [MaxLength(700)] public string? SignatureImagePath { get; set; }
    public bool IsInternalApproval { get; set; } = true;
}

public class ExhibitionRightEntity
{
    [Key] public Guid ExhibitionRightId { get; set; }
    public Guid ContractId { get; set; }
    public Guid ContractRevisionId { get; set; }
    public Guid ContractMovieLineId { get; set; }
    public Guid MovieId { get; set; }
    public Guid? CinemaId { get; set; }
    public Guid? FormatId { get; set; }
    public DateTime StartsAt { get; set; }
    public DateTime EndsAt { get; set; }
    [Column(TypeName = "decimal(5,2)")] public decimal CinemaSharePercent { get; set; }
    [Column(TypeName = "decimal(5,2)")] public decimal DistributorSharePercent { get; set; }
    public bool IsActive { get; set; } = true;
}

public class MovieChangeRequestEntity
{
    [Key] public Guid MovieChangeRequestId { get; set; }
    public Guid MovieId { get; set; }
    public Guid RequestedByUserId { get; set; }
    public MovieChangeRequestStatus Status { get; set; } = MovieChangeRequestStatus.Draft;
    [MaxLength(1000)] public string Reason { get; set; } = string.Empty;
    public string OriginalSnapshotJson { get; set; } = "{}";
    public string ProposedChangesJson { get; set; } = "{}";
    public string? ReviewNote { get; set; }
    public Guid? ReviewedByUserId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    [Timestamp] public byte[] RowVersion { get; set; } = [];
}

public class TicketRevenueSnapshotEntity
{
    [Key] public Guid TicketRevenueSnapshotId { get; set; }
    public Guid OrderId { get; set; }
    public Guid SeatId { get; set; }
    public Guid MovieScheduleId { get; set; }
    public Guid MovieId { get; set; }
    public Guid ContractId { get; set; }
    public Guid ContractRevisionId { get; set; }
    public DateTime SoldAt { get; set; }
    public DateTime ShowtimeAt { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal TicketNetAmount { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal RefundedAmount { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal RevenueBasisAmount { get; set; }
    [Column(TypeName = "decimal(5,2)")] public decimal CinemaSharePercent { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal CinemaShareAmount { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal DistributorShareAmount { get; set; }
}
