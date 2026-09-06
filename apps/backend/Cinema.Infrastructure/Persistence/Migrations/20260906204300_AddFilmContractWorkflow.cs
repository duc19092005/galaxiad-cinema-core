using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Cinema.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddFilmContractWorkflow : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "PermissionForRoleEntity",
                keyColumns: new[] { "PermissionId", "RoleId" },
                keyValues: new object[] { new Guid("a1b2c3d4-1111-1111-1111-111111111006"), new Guid("4d1e0f2a-b7c8-d9e0-f1a2-3b4c5d6e7f8a") });

            migrationBuilder.CreateTable(
                name: "ContractTemplateEntity",
                columns: table => new
                {
                    ContractTemplateId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Code = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Version = table.Column<int>(type: "int", nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false),
                    SchemaJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    BodyTemplate = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    PublishedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RowVersion = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ContractTemplateEntity", x => x.ContractTemplateId);
                });

            migrationBuilder.CreateTable(
                name: "DistributorEntity",
                columns: table => new
                {
                    DistributorId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    LegalName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    TaxCode = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    Address = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    RepresentativeName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    RepresentativeTitle = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    IsDemo = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DistributorEntity", x => x.DistributorId);
                });

            migrationBuilder.CreateTable(
                name: "MovieChangeRequestEntity",
                columns: table => new
                {
                    MovieChangeRequestId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    MovieId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RequestedByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false),
                    Reason = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    OriginalSnapshotJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ProposedChangesJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ReviewNote = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ReviewedByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    RowVersion = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MovieChangeRequestEntity", x => x.MovieChangeRequestId);
                    table.ForeignKey(
                        name: "FK_MovieChangeRequestEntity_MovieInfoEntity_MovieId",
                        column: x => x.MovieId,
                        principalTable: "MovieInfoEntity",
                        principalColumn: "MovieId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_MovieChangeRequestEntity_UserInfoEntity_RequestedByUserId",
                        column: x => x.RequestedByUserId,
                        principalTable: "UserInfoEntity",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_MovieChangeRequestEntity_UserInfoEntity_ReviewedByUserId",
                        column: x => x.ReviewedByUserId,
                        principalTable: "UserInfoEntity",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "FilmContractEntity",
                columns: table => new
                {
                    ContractId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    InternalCode = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    CounterpartyContractNumber = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    DistributorId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    AssignedMovieManagerId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TemplateId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    PreviousContractId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    Status = table.Column<int>(type: "int", nullable: false),
                    ProcessingStatus = table.Column<int>(type: "int", nullable: false),
                    CurrentRevisionNumber = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RowVersion = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FilmContractEntity", x => x.ContractId);
                    table.ForeignKey(
                        name: "FK_FilmContractEntity_ContractTemplateEntity_TemplateId",
                        column: x => x.TemplateId,
                        principalTable: "ContractTemplateEntity",
                        principalColumn: "ContractTemplateId");
                    table.ForeignKey(
                        name: "FK_FilmContractEntity_DistributorEntity_DistributorId",
                        column: x => x.DistributorId,
                        principalTable: "DistributorEntity",
                        principalColumn: "DistributorId");
                    table.ForeignKey(
                        name: "FK_FilmContractEntity_FilmContractEntity_PreviousContractId",
                        column: x => x.PreviousContractId,
                        principalTable: "FilmContractEntity",
                        principalColumn: "ContractId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_FilmContractEntity_UserInfoEntity_AssignedMovieManagerId",
                        column: x => x.AssignedMovieManagerId,
                        principalTable: "UserInfoEntity",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ContractRevisionEntity",
                columns: table => new
                {
                    ContractRevisionId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ContractId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RevisionNumber = table.Column<int>(type: "int", nullable: false),
                    IsCurrent = table.Column<bool>(type: "bit", nullable: false),
                    ExtractedText = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ExtractionJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ReviewedDataJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DataReviewed = table.Column<bool>(type: "bit", nullable: false),
                    FinancialPolicyReviewed = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ContentHash = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ContractRevisionEntity", x => x.ContractRevisionId);
                    table.ForeignKey(
                        name: "FK_ContractRevisionEntity_FilmContractEntity_ContractId",
                        column: x => x.ContractId,
                        principalTable: "FilmContractEntity",
                        principalColumn: "ContractId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ContractDocumentEntity",
                columns: table => new
                {
                    ContractDocumentId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ContractRevisionId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Kind = table.Column<int>(type: "int", nullable: false),
                    FileName = table.Column<string>(type: "nvarchar(260)", maxLength: 260, nullable: false),
                    ContentType = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    StoragePath = table.Column<string>(type: "nvarchar(700)", maxLength: 700, nullable: false),
                    Sha256 = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    FileSize = table.Column<long>(type: "bigint", nullable: false),
                    IsDemoSignature = table.Column<bool>(type: "bit", nullable: false),
                    UploadedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UploadedByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ContractDocumentEntity", x => x.ContractDocumentId);
                    table.ForeignKey(
                        name: "FK_ContractDocumentEntity_ContractRevisionEntity_ContractRevisionId",
                        column: x => x.ContractRevisionId,
                        principalTable: "ContractRevisionEntity",
                        principalColumn: "ContractRevisionId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ContractMovieLineEntity",
                columns: table => new
                {
                    ContractMovieLineId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ContractRevisionId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    MovieId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    VietnameseTitle = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    EnglishTitle = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    PosterUrl = table.Column<string>(type: "nvarchar(2048)", maxLength: 2048, nullable: true),
                    TrailerUrl = table.Column<string>(type: "nvarchar(2048)", maxLength: 2048, nullable: true),
                    Director = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    Actors = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    DurationMinutes = table.Column<int>(type: "int", nullable: false),
                    MovieRequiredAgeId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    LicenseStartAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    LicenseEndAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CinemaScopeState = table.Column<int>(type: "int", nullable: false),
                    FormatScopeState = table.Column<int>(type: "int", nullable: false),
                    CinemaIdsJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    FormatIdsJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CinemaSharePercent = table.Column<decimal>(type: "decimal(5,2)", nullable: false),
                    DistributorSharePercent = table.Column<decimal>(type: "decimal(5,2)", nullable: false),
                    RevenueBasis = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    SettlementCycle = table.Column<int>(type: "int", nullable: false),
                    Reviewed = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ContractMovieLineEntity", x => x.ContractMovieLineId);
                    table.ForeignKey(
                        name: "FK_ContractMovieLineEntity_ContractRevisionEntity_ContractRevisionId",
                        column: x => x.ContractRevisionId,
                        principalTable: "ContractRevisionEntity",
                        principalColumn: "ContractRevisionId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ContractMovieLineEntity_MovieInfoEntity_MovieId",
                        column: x => x.MovieId,
                        principalTable: "MovieInfoEntity",
                        principalColumn: "MovieId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ContractMovieLineEntity_MovieRequiredAgeEntity_MovieRequiredAgeId",
                        column: x => x.MovieRequiredAgeId,
                        principalTable: "MovieRequiredAgeEntity",
                        principalColumn: "MovieRequiredAgeId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ContractSignOffEntity",
                columns: table => new
                {
                    ContractSignOffId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ContractId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ContractRevisionId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SignedByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SignedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    SignedContentHash = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    SignatureImagePath = table.Column<string>(type: "nvarchar(700)", maxLength: 700, nullable: true),
                    IsInternalApproval = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ContractSignOffEntity", x => x.ContractSignOffId);
                    table.ForeignKey(
                        name: "FK_ContractSignOffEntity_ContractRevisionEntity_ContractRevisionId",
                        column: x => x.ContractRevisionId,
                        principalTable: "ContractRevisionEntity",
                        principalColumn: "ContractRevisionId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ContractSignOffEntity_FilmContractEntity_ContractId",
                        column: x => x.ContractId,
                        principalTable: "FilmContractEntity",
                        principalColumn: "ContractId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ContractSignOffEntity_UserInfoEntity_SignedByUserId",
                        column: x => x.SignedByUserId,
                        principalTable: "UserInfoEntity",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "TicketRevenueSnapshotEntity",
                columns: table => new
                {
                    TicketRevenueSnapshotId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OrderId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SeatId = table.Column<string>(type: "varchar(100)", nullable: false),
                    MovieScheduleId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    MovieId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ContractId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ContractRevisionId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SoldAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ShowtimeAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    TicketNetAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    RefundedAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    RevenueBasisAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    CinemaSharePercent = table.Column<decimal>(type: "decimal(5,2)", nullable: false),
                    CinemaShareAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    DistributorShareAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TicketRevenueSnapshotEntity", x => x.TicketRevenueSnapshotId);
                    table.ForeignKey(
                        name: "FK_TicketRevenueSnapshotEntity_ContractRevisionEntity_ContractRevisionId",
                        column: x => x.ContractRevisionId,
                        principalTable: "ContractRevisionEntity",
                        principalColumn: "ContractRevisionId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_TicketRevenueSnapshotEntity_FilmContractEntity_ContractId",
                        column: x => x.ContractId,
                        principalTable: "FilmContractEntity",
                        principalColumn: "ContractId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_TicketRevenueSnapshotEntity_MovieInfoEntity_MovieId",
                        column: x => x.MovieId,
                        principalTable: "MovieInfoEntity",
                        principalColumn: "MovieId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_TicketRevenueSnapshotEntity_MovieScheduleInfoEntity_MovieScheduleId",
                        column: x => x.MovieScheduleId,
                        principalTable: "MovieScheduleInfoEntity",
                        principalColumn: "MovieScheduleInfoId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_TicketRevenueSnapshotEntity_OrderInfoEntity_OrderId",
                        column: x => x.OrderId,
                        principalTable: "OrderInfoEntity",
                        principalColumn: "OrderId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_TicketRevenueSnapshotEntity_SeatsInfoEntity_SeatId",
                        column: x => x.SeatId,
                        principalTable: "SeatsInfoEntity",
                        principalColumn: "SeatId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ExhibitionRightEntity",
                columns: table => new
                {
                    ExhibitionRightId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ContractId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ContractRevisionId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ContractMovieLineId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    MovieId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CinemaId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    FormatId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    StartsAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    EndsAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CinemaSharePercent = table.Column<decimal>(type: "decimal(5,2)", nullable: false),
                    DistributorSharePercent = table.Column<decimal>(type: "decimal(5,2)", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ExhibitionRightEntity", x => x.ExhibitionRightId);
                    table.ForeignKey(
                        name: "FK_ExhibitionRightEntity_CinemaInfoEntity_CinemaId",
                        column: x => x.CinemaId,
                        principalTable: "CinemaInfoEntity",
                        principalColumn: "CinemaId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ExhibitionRightEntity_ContractMovieLineEntity_ContractMovieLineId",
                        column: x => x.ContractMovieLineId,
                        principalTable: "ContractMovieLineEntity",
                        principalColumn: "ContractMovieLineId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ExhibitionRightEntity_ContractRevisionEntity_ContractRevisionId",
                        column: x => x.ContractRevisionId,
                        principalTable: "ContractRevisionEntity",
                        principalColumn: "ContractRevisionId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ExhibitionRightEntity_FilmContractEntity_ContractId",
                        column: x => x.ContractId,
                        principalTable: "FilmContractEntity",
                        principalColumn: "ContractId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ExhibitionRightEntity_MovieFormatInfoEntity_FormatId",
                        column: x => x.FormatId,
                        principalTable: "MovieFormatInfoEntity",
                        principalColumn: "MovieFormatId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ExhibitionRightEntity_MovieInfoEntity_MovieId",
                        column: x => x.MovieId,
                        principalTable: "MovieInfoEntity",
                        principalColumn: "MovieId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.InsertData(
                table: "PermissionEntity",
                columns: new[] { "PermissionId", "PermissionInfo" },
                values: new object[,]
                {
                    { new Guid("a1b2c3d4-1111-1111-1111-111111111033"), "ViewContracts" },
                    { new Guid("a1b2c3d4-1111-1111-1111-111111111034"), "ManageContractDrafts" },
                    { new Guid("a1b2c3d4-1111-1111-1111-111111111035"), "ManageContractTemplates" },
                    { new Guid("a1b2c3d4-1111-1111-1111-111111111036"), "ApproveContracts" },
                    { new Guid("a1b2c3d4-1111-1111-1111-111111111037"), "SignContracts" },
                    { new Guid("a1b2c3d4-1111-1111-1111-111111111038"), "ActivateContracts" },
                    { new Guid("a1b2c3d4-1111-1111-1111-111111111039"), "ViewContractFinance" },
                    { new Guid("a1b2c3d4-1111-1111-1111-111111111040"), "ManageSettlements" },
                    { new Guid("a1b2c3d4-1111-1111-1111-111111111041"), "ProposeMovieChanges" },
                    { new Guid("a1b2c3d4-1111-1111-1111-111111111042"), "ApproveMovieChanges" }
                });

            migrationBuilder.InsertData(
                table: "PermissionForRoleEntity",
                columns: new[] { "PermissionId", "RoleId" },
                values: new object[,]
                {
                    { new Guid("a1b2c3d4-1111-1111-1111-111111111033"), new Guid("3c0d9e1f-a6b7-c8d9-e0f1-2a3b4c5d6e7f") },
                    { new Guid("a1b2c3d4-1111-1111-1111-111111111033"), new Guid("4d1e0f2a-b7c8-d9e0-f1a2-3b4c5d6e7f8a") },
                    { new Guid("a1b2c3d4-1111-1111-1111-111111111034"), new Guid("3c0d9e1f-a6b7-c8d9-e0f1-2a3b4c5d6e7f") },
                    { new Guid("a1b2c3d4-1111-1111-1111-111111111034"), new Guid("4d1e0f2a-b7c8-d9e0-f1a2-3b4c5d6e7f8a") },
                    { new Guid("a1b2c3d4-1111-1111-1111-111111111035"), new Guid("3c0d9e1f-a6b7-c8d9-e0f1-2a3b4c5d6e7f") },
                    { new Guid("a1b2c3d4-1111-1111-1111-111111111036"), new Guid("3c0d9e1f-a6b7-c8d9-e0f1-2a3b4c5d6e7f") },
                    { new Guid("a1b2c3d4-1111-1111-1111-111111111037"), new Guid("3c0d9e1f-a6b7-c8d9-e0f1-2a3b4c5d6e7f") },
                    { new Guid("a1b2c3d4-1111-1111-1111-111111111038"), new Guid("3c0d9e1f-a6b7-c8d9-e0f1-2a3b4c5d6e7f") },
                    { new Guid("a1b2c3d4-1111-1111-1111-111111111039"), new Guid("3c0d9e1f-a6b7-c8d9-e0f1-2a3b4c5d6e7f") },
                    { new Guid("a1b2c3d4-1111-1111-1111-111111111039"), new Guid("4d1e0f2a-b7c8-d9e0-f1a2-3b4c5d6e7f8a") },
                    { new Guid("a1b2c3d4-1111-1111-1111-111111111040"), new Guid("3c0d9e1f-a6b7-c8d9-e0f1-2a3b4c5d6e7f") },
                    { new Guid("a1b2c3d4-1111-1111-1111-111111111041"), new Guid("3c0d9e1f-a6b7-c8d9-e0f1-2a3b4c5d6e7f") },
                    { new Guid("a1b2c3d4-1111-1111-1111-111111111041"), new Guid("4d1e0f2a-b7c8-d9e0-f1a2-3b4c5d6e7f8a") },
                    { new Guid("a1b2c3d4-1111-1111-1111-111111111042"), new Guid("3c0d9e1f-a6b7-c8d9-e0f1-2a3b4c5d6e7f") }
                });

            migrationBuilder.CreateIndex(
                name: "IX_ContractDocumentEntity_ContractRevisionId",
                table: "ContractDocumentEntity",
                column: "ContractRevisionId");

            migrationBuilder.CreateIndex(
                name: "IX_ContractDocumentEntity_Sha256",
                table: "ContractDocumentEntity",
                column: "Sha256");

            migrationBuilder.CreateIndex(
                name: "IX_ContractMovieLineEntity_ContractRevisionId",
                table: "ContractMovieLineEntity",
                column: "ContractRevisionId");

            migrationBuilder.CreateIndex(
                name: "IX_ContractMovieLineEntity_MovieId",
                table: "ContractMovieLineEntity",
                column: "MovieId");

            migrationBuilder.CreateIndex(
                name: "IX_ContractMovieLineEntity_MovieRequiredAgeId",
                table: "ContractMovieLineEntity",
                column: "MovieRequiredAgeId");

            migrationBuilder.CreateIndex(
                name: "IX_ContractRevisionEntity_ContractId_RevisionNumber",
                table: "ContractRevisionEntity",
                columns: new[] { "ContractId", "RevisionNumber" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ContractSignOffEntity_ContractId_ContractRevisionId",
                table: "ContractSignOffEntity",
                columns: new[] { "ContractId", "ContractRevisionId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ContractSignOffEntity_ContractRevisionId",
                table: "ContractSignOffEntity",
                column: "ContractRevisionId");

            migrationBuilder.CreateIndex(
                name: "IX_ContractSignOffEntity_SignedByUserId",
                table: "ContractSignOffEntity",
                column: "SignedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_ContractTemplateEntity_Code_Version",
                table: "ContractTemplateEntity",
                columns: new[] { "Code", "Version" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_DistributorEntity_LegalName",
                table: "DistributorEntity",
                column: "LegalName");

            migrationBuilder.CreateIndex(
                name: "IX_ExhibitionRightEntity_CinemaId",
                table: "ExhibitionRightEntity",
                column: "CinemaId");

            migrationBuilder.CreateIndex(
                name: "IX_ExhibitionRightEntity_ContractId_ContractMovieLineId",
                table: "ExhibitionRightEntity",
                columns: new[] { "ContractId", "ContractMovieLineId" });

            migrationBuilder.CreateIndex(
                name: "IX_ExhibitionRightEntity_ContractMovieLineId",
                table: "ExhibitionRightEntity",
                column: "ContractMovieLineId");

            migrationBuilder.CreateIndex(
                name: "IX_ExhibitionRightEntity_ContractRevisionId",
                table: "ExhibitionRightEntity",
                column: "ContractRevisionId");

            migrationBuilder.CreateIndex(
                name: "IX_ExhibitionRightEntity_FormatId",
                table: "ExhibitionRightEntity",
                column: "FormatId");

            migrationBuilder.CreateIndex(
                name: "IX_ExhibitionRightEntity_MovieId_CinemaId_FormatId_StartsAt_EndsAt",
                table: "ExhibitionRightEntity",
                columns: new[] { "MovieId", "CinemaId", "FormatId", "StartsAt", "EndsAt" });

            migrationBuilder.CreateIndex(
                name: "IX_FilmContractEntity_AssignedMovieManagerId",
                table: "FilmContractEntity",
                column: "AssignedMovieManagerId");

            migrationBuilder.CreateIndex(
                name: "IX_FilmContractEntity_DistributorId",
                table: "FilmContractEntity",
                column: "DistributorId");

            migrationBuilder.CreateIndex(
                name: "IX_FilmContractEntity_InternalCode",
                table: "FilmContractEntity",
                column: "InternalCode",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_FilmContractEntity_PreviousContractId",
                table: "FilmContractEntity",
                column: "PreviousContractId");

            migrationBuilder.CreateIndex(
                name: "IX_FilmContractEntity_Status_AssignedMovieManagerId",
                table: "FilmContractEntity",
                columns: new[] { "Status", "AssignedMovieManagerId" });

            migrationBuilder.CreateIndex(
                name: "IX_FilmContractEntity_TemplateId",
                table: "FilmContractEntity",
                column: "TemplateId");

            migrationBuilder.CreateIndex(
                name: "IX_MovieChangeRequestEntity_MovieId_Status",
                table: "MovieChangeRequestEntity",
                columns: new[] { "MovieId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_MovieChangeRequestEntity_RequestedByUserId",
                table: "MovieChangeRequestEntity",
                column: "RequestedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_MovieChangeRequestEntity_ReviewedByUserId",
                table: "MovieChangeRequestEntity",
                column: "ReviewedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_TicketRevenueSnapshotEntity_ContractId",
                table: "TicketRevenueSnapshotEntity",
                column: "ContractId");

            migrationBuilder.CreateIndex(
                name: "IX_TicketRevenueSnapshotEntity_ContractRevisionId",
                table: "TicketRevenueSnapshotEntity",
                column: "ContractRevisionId");

            migrationBuilder.CreateIndex(
                name: "IX_TicketRevenueSnapshotEntity_MovieId_ShowtimeAt",
                table: "TicketRevenueSnapshotEntity",
                columns: new[] { "MovieId", "ShowtimeAt" });

            migrationBuilder.CreateIndex(
                name: "IX_TicketRevenueSnapshotEntity_MovieScheduleId",
                table: "TicketRevenueSnapshotEntity",
                column: "MovieScheduleId");

            migrationBuilder.CreateIndex(
                name: "IX_TicketRevenueSnapshotEntity_OrderId_SeatId",
                table: "TicketRevenueSnapshotEntity",
                columns: new[] { "OrderId", "SeatId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TicketRevenueSnapshotEntity_SeatId",
                table: "TicketRevenueSnapshotEntity",
                column: "SeatId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ContractDocumentEntity");

            migrationBuilder.DropTable(
                name: "ContractSignOffEntity");

            migrationBuilder.DropTable(
                name: "ExhibitionRightEntity");

            migrationBuilder.DropTable(
                name: "MovieChangeRequestEntity");

            migrationBuilder.DropTable(
                name: "TicketRevenueSnapshotEntity");

            migrationBuilder.DropTable(
                name: "ContractMovieLineEntity");

            migrationBuilder.DropTable(
                name: "ContractRevisionEntity");

            migrationBuilder.DropTable(
                name: "FilmContractEntity");

            migrationBuilder.DropTable(
                name: "ContractTemplateEntity");

            migrationBuilder.DropTable(
                name: "DistributorEntity");

            migrationBuilder.DeleteData(
                table: "PermissionForRoleEntity",
                keyColumns: new[] { "PermissionId", "RoleId" },
                keyValues: new object[] { new Guid("a1b2c3d4-1111-1111-1111-111111111033"), new Guid("3c0d9e1f-a6b7-c8d9-e0f1-2a3b4c5d6e7f") });

            migrationBuilder.DeleteData(
                table: "PermissionForRoleEntity",
                keyColumns: new[] { "PermissionId", "RoleId" },
                keyValues: new object[] { new Guid("a1b2c3d4-1111-1111-1111-111111111033"), new Guid("4d1e0f2a-b7c8-d9e0-f1a2-3b4c5d6e7f8a") });

            migrationBuilder.DeleteData(
                table: "PermissionForRoleEntity",
                keyColumns: new[] { "PermissionId", "RoleId" },
                keyValues: new object[] { new Guid("a1b2c3d4-1111-1111-1111-111111111034"), new Guid("3c0d9e1f-a6b7-c8d9-e0f1-2a3b4c5d6e7f") });

            migrationBuilder.DeleteData(
                table: "PermissionForRoleEntity",
                keyColumns: new[] { "PermissionId", "RoleId" },
                keyValues: new object[] { new Guid("a1b2c3d4-1111-1111-1111-111111111034"), new Guid("4d1e0f2a-b7c8-d9e0-f1a2-3b4c5d6e7f8a") });

            migrationBuilder.DeleteData(
                table: "PermissionForRoleEntity",
                keyColumns: new[] { "PermissionId", "RoleId" },
                keyValues: new object[] { new Guid("a1b2c3d4-1111-1111-1111-111111111035"), new Guid("3c0d9e1f-a6b7-c8d9-e0f1-2a3b4c5d6e7f") });

            migrationBuilder.DeleteData(
                table: "PermissionForRoleEntity",
                keyColumns: new[] { "PermissionId", "RoleId" },
                keyValues: new object[] { new Guid("a1b2c3d4-1111-1111-1111-111111111036"), new Guid("3c0d9e1f-a6b7-c8d9-e0f1-2a3b4c5d6e7f") });

            migrationBuilder.DeleteData(
                table: "PermissionForRoleEntity",
                keyColumns: new[] { "PermissionId", "RoleId" },
                keyValues: new object[] { new Guid("a1b2c3d4-1111-1111-1111-111111111037"), new Guid("3c0d9e1f-a6b7-c8d9-e0f1-2a3b4c5d6e7f") });

            migrationBuilder.DeleteData(
                table: "PermissionForRoleEntity",
                keyColumns: new[] { "PermissionId", "RoleId" },
                keyValues: new object[] { new Guid("a1b2c3d4-1111-1111-1111-111111111038"), new Guid("3c0d9e1f-a6b7-c8d9-e0f1-2a3b4c5d6e7f") });

            migrationBuilder.DeleteData(
                table: "PermissionForRoleEntity",
                keyColumns: new[] { "PermissionId", "RoleId" },
                keyValues: new object[] { new Guid("a1b2c3d4-1111-1111-1111-111111111039"), new Guid("3c0d9e1f-a6b7-c8d9-e0f1-2a3b4c5d6e7f") });

            migrationBuilder.DeleteData(
                table: "PermissionForRoleEntity",
                keyColumns: new[] { "PermissionId", "RoleId" },
                keyValues: new object[] { new Guid("a1b2c3d4-1111-1111-1111-111111111039"), new Guid("4d1e0f2a-b7c8-d9e0-f1a2-3b4c5d6e7f8a") });

            migrationBuilder.DeleteData(
                table: "PermissionForRoleEntity",
                keyColumns: new[] { "PermissionId", "RoleId" },
                keyValues: new object[] { new Guid("a1b2c3d4-1111-1111-1111-111111111040"), new Guid("3c0d9e1f-a6b7-c8d9-e0f1-2a3b4c5d6e7f") });

            migrationBuilder.DeleteData(
                table: "PermissionForRoleEntity",
                keyColumns: new[] { "PermissionId", "RoleId" },
                keyValues: new object[] { new Guid("a1b2c3d4-1111-1111-1111-111111111041"), new Guid("3c0d9e1f-a6b7-c8d9-e0f1-2a3b4c5d6e7f") });

            migrationBuilder.DeleteData(
                table: "PermissionForRoleEntity",
                keyColumns: new[] { "PermissionId", "RoleId" },
                keyValues: new object[] { new Guid("a1b2c3d4-1111-1111-1111-111111111041"), new Guid("4d1e0f2a-b7c8-d9e0-f1a2-3b4c5d6e7f8a") });

            migrationBuilder.DeleteData(
                table: "PermissionForRoleEntity",
                keyColumns: new[] { "PermissionId", "RoleId" },
                keyValues: new object[] { new Guid("a1b2c3d4-1111-1111-1111-111111111042"), new Guid("3c0d9e1f-a6b7-c8d9-e0f1-2a3b4c5d6e7f") });

            migrationBuilder.DeleteData(
                table: "PermissionEntity",
                keyColumn: "PermissionId",
                keyValue: new Guid("a1b2c3d4-1111-1111-1111-111111111033"));

            migrationBuilder.DeleteData(
                table: "PermissionEntity",
                keyColumn: "PermissionId",
                keyValue: new Guid("a1b2c3d4-1111-1111-1111-111111111034"));

            migrationBuilder.DeleteData(
                table: "PermissionEntity",
                keyColumn: "PermissionId",
                keyValue: new Guid("a1b2c3d4-1111-1111-1111-111111111035"));

            migrationBuilder.DeleteData(
                table: "PermissionEntity",
                keyColumn: "PermissionId",
                keyValue: new Guid("a1b2c3d4-1111-1111-1111-111111111036"));

            migrationBuilder.DeleteData(
                table: "PermissionEntity",
                keyColumn: "PermissionId",
                keyValue: new Guid("a1b2c3d4-1111-1111-1111-111111111037"));

            migrationBuilder.DeleteData(
                table: "PermissionEntity",
                keyColumn: "PermissionId",
                keyValue: new Guid("a1b2c3d4-1111-1111-1111-111111111038"));

            migrationBuilder.DeleteData(
                table: "PermissionEntity",
                keyColumn: "PermissionId",
                keyValue: new Guid("a1b2c3d4-1111-1111-1111-111111111039"));

            migrationBuilder.DeleteData(
                table: "PermissionEntity",
                keyColumn: "PermissionId",
                keyValue: new Guid("a1b2c3d4-1111-1111-1111-111111111040"));

            migrationBuilder.DeleteData(
                table: "PermissionEntity",
                keyColumn: "PermissionId",
                keyValue: new Guid("a1b2c3d4-1111-1111-1111-111111111041"));

            migrationBuilder.DeleteData(
                table: "PermissionEntity",
                keyColumn: "PermissionId",
                keyValue: new Guid("a1b2c3d4-1111-1111-1111-111111111042"));

            migrationBuilder.InsertData(
                table: "PermissionForRoleEntity",
                columns: new[] { "PermissionId", "RoleId" },
                values: new object[] { new Guid("a1b2c3d4-1111-1111-1111-111111111006"), new Guid("4d1e0f2a-b7c8-d9e0-f1a2-3b4c5d6e7f8a") });
        }
    }
}
