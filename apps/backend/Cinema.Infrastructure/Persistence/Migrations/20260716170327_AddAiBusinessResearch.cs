using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Cinema.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddAiBusinessResearch : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AiResearchJobEntity",
                columns: table => new
                {
                    JobId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    City = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    AnalysisType = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: false),
                    RunMode = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: false),
                    SelectedModulesJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Notes = table.Column<string>(type: "nvarchar(1000)", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: false),
                    BudgetUsed = table.Column<int>(type: "int", nullable: false),
                    BudgetCap = table.Column<int>(type: "int", nullable: false),
                    CreatedByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CompletedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ErrorMessage = table.Column<string>(type: "nvarchar(2000)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AiResearchJobEntity", x => x.JobId);
                });

            migrationBuilder.CreateTable(
                name: "AiResearchClaimEntity",
                columns: table => new
                {
                    ClaimId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    JobId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Text = table.Column<string>(type: "nvarchar(1000)", nullable: false),
                    Category = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: false),
                    IsCritical = table.Column<bool>(type: "bit", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: false),
                    IterationCount = table.Column<int>(type: "int", nullable: false),
                    Confidence = table.Column<decimal>(type: "decimal(5,4)", precision: 5, scale: 4, nullable: false),
                    Classification = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AiResearchClaimEntity", x => x.ClaimId);
                    table.ForeignKey(
                        name: "FK_AiResearchClaimEntity_AiResearchJobEntity_JobId",
                        column: x => x.JobId,
                        principalTable: "AiResearchJobEntity",
                        principalColumn: "JobId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AiResearchEventEntity",
                columns: table => new
                {
                    EventId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    JobId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    EventType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    PayloadJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AiResearchEventEntity", x => x.EventId);
                    table.ForeignKey(
                        name: "FK_AiResearchEventEntity_AiResearchJobEntity_JobId",
                        column: x => x.JobId,
                        principalTable: "AiResearchJobEntity",
                        principalColumn: "JobId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AiResearchReportEntity",
                columns: table => new
                {
                    JobId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    GeneratedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    SectionsJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    SummaryJson = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AiResearchReportEntity", x => x.JobId);
                    table.ForeignKey(
                        name: "FK_AiResearchReportEntity_AiResearchJobEntity_JobId",
                        column: x => x.JobId,
                        principalTable: "AiResearchJobEntity",
                        principalColumn: "JobId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AiResearchEvidenceEntity",
                columns: table => new
                {
                    EvidenceId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ClaimId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Url = table.Column<string>(type: "nvarchar(2048)", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(500)", nullable: false),
                    Snippet = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ExtractedContent = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    PublishedDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    QueryUsed = table.Column<string>(type: "nvarchar(1000)", nullable: false),
                    SourceDomain = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    SourceType = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: false),
                    DomainTrustTier = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Relation = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    IterationAdded = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AiResearchEvidenceEntity", x => x.EvidenceId);
                    table.ForeignKey(
                        name: "FK_AiResearchEvidenceEntity_AiResearchClaimEntity_ClaimId",
                        column: x => x.ClaimId,
                        principalTable: "AiResearchClaimEntity",
                        principalColumn: "ClaimId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AiResearchClaimEntity_JobId_Category_Status",
                table: "AiResearchClaimEntity",
                columns: new[] { "JobId", "Category", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_AiResearchEventEntity_JobId_EventId",
                table: "AiResearchEventEntity",
                columns: new[] { "JobId", "EventId" });

            migrationBuilder.CreateIndex(
                name: "IX_AiResearchEvidenceEntity_ClaimId_SourceDomain",
                table: "AiResearchEvidenceEntity",
                columns: new[] { "ClaimId", "SourceDomain" });

            migrationBuilder.CreateIndex(
                name: "IX_AiResearchJobEntity_CreatedByUserId_CreatedAt",
                table: "AiResearchJobEntity",
                columns: new[] { "CreatedByUserId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_AiResearchJobEntity_Status",
                table: "AiResearchJobEntity",
                column: "Status");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AiResearchEventEntity");

            migrationBuilder.DropTable(
                name: "AiResearchEvidenceEntity");

            migrationBuilder.DropTable(
                name: "AiResearchReportEntity");

            migrationBuilder.DropTable(
                name: "AiResearchClaimEntity");

            migrationBuilder.DropTable(
                name: "AiResearchJobEntity");
        }
    }
}
