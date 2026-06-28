using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Cinema.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddShowtimeRecommendations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ShowtimeRecommendationBatchEntity",
                columns: table => new
                {
                    BatchId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CinemaId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RequestedByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    FromDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ToDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    AuditoriumId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    MaxSuggestions = table.Column<int>(type: "int", nullable: false),
                    RequestSnapshotJson = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ShowtimeRecommendationBatchEntity", x => x.BatchId);
                    table.ForeignKey(
                        name: "FK_ShowtimeRecommendationBatchEntity_AuditoriumInfoEntities_AuditoriumId",
                        column: x => x.AuditoriumId,
                        principalTable: "AuditoriumInfoEntities",
                        principalColumn: "AuditoriumId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ShowtimeRecommendationBatchEntity_CinemaInfoEntity_CinemaId",
                        column: x => x.CinemaId,
                        principalTable: "CinemaInfoEntity",
                        principalColumn: "CinemaId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ShowtimeRecommendationBatchEntity_UserInfoEntity_RequestedByUserId",
                        column: x => x.RequestedByUserId,
                        principalTable: "UserInfoEntity",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ShowtimeRecommendationItemEntity",
                columns: table => new
                {
                    RecommendationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    BatchId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CinemaId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    AuditoriumId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    MovieId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    FormatId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    StartTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    EndTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ConfidenceScore = table.Column<decimal>(type: "decimal(9,4)", nullable: false),
                    DemandLevel = table.Column<string>(type: "nvarchar(30)", nullable: false),
                    ExpectedImpact = table.Column<string>(type: "nvarchar(300)", nullable: false),
                    ReasonsJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ScoreSnapshotJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false),
                    AppliedScheduleId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    AppliedByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    AppliedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    DismissedByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    DismissedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    LastValidationMessage = table.Column<string>(type: "nvarchar(500)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ShowtimeRecommendationItemEntity", x => x.RecommendationId);
                    table.ForeignKey(
                        name: "FK_ShowtimeRecommendationItemEntity_AuditoriumInfoEntities_AuditoriumId",
                        column: x => x.AuditoriumId,
                        principalTable: "AuditoriumInfoEntities",
                        principalColumn: "AuditoriumId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ShowtimeRecommendationItemEntity_CinemaInfoEntity_CinemaId",
                        column: x => x.CinemaId,
                        principalTable: "CinemaInfoEntity",
                        principalColumn: "CinemaId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ShowtimeRecommendationItemEntity_MovieFormatInfoEntity_FormatId",
                        column: x => x.FormatId,
                        principalTable: "MovieFormatInfoEntity",
                        principalColumn: "MovieFormatId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ShowtimeRecommendationItemEntity_MovieInfoEntity_MovieId",
                        column: x => x.MovieId,
                        principalTable: "MovieInfoEntity",
                        principalColumn: "MovieId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ShowtimeRecommendationItemEntity_MovieScheduleInfoEntity_AppliedScheduleId",
                        column: x => x.AppliedScheduleId,
                        principalTable: "MovieScheduleInfoEntity",
                        principalColumn: "MovieScheduleInfoId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ShowtimeRecommendationItemEntity_ShowtimeRecommendationBatchEntity_BatchId",
                        column: x => x.BatchId,
                        principalTable: "ShowtimeRecommendationBatchEntity",
                        principalColumn: "BatchId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ShowtimeRecommendationItemEntity_UserInfoEntity_AppliedByUserId",
                        column: x => x.AppliedByUserId,
                        principalTable: "UserInfoEntity",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ShowtimeRecommendationItemEntity_UserInfoEntity_DismissedByUserId",
                        column: x => x.DismissedByUserId,
                        principalTable: "UserInfoEntity",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ShowtimeRecommendationActionEntity",
                columns: table => new
                {
                    ActionId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RecommendationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ActorUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ActionType = table.Column<string>(type: "varchar(40)", nullable: false),
                    Notes = table.Column<string>(type: "nvarchar(1000)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ShowtimeRecommendationActionEntity", x => x.ActionId);
                    table.ForeignKey(
                        name: "FK_ShowtimeRecommendationActionEntity_ShowtimeRecommendationItemEntity_RecommendationId",
                        column: x => x.RecommendationId,
                        principalTable: "ShowtimeRecommendationItemEntity",
                        principalColumn: "RecommendationId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ShowtimeRecommendationActionEntity_UserInfoEntity_ActorUserId",
                        column: x => x.ActorUserId,
                        principalTable: "UserInfoEntity",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ShowtimeRecommendationActionEntity_ActorUserId",
                table: "ShowtimeRecommendationActionEntity",
                column: "ActorUserId");

            migrationBuilder.CreateIndex(
                name: "IX_ShowtimeRecommendationActionEntity_RecommendationId_CreatedAt",
                table: "ShowtimeRecommendationActionEntity",
                columns: new[] { "RecommendationId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_ShowtimeRecommendationBatchEntity_AuditoriumId",
                table: "ShowtimeRecommendationBatchEntity",
                column: "AuditoriumId");

            migrationBuilder.CreateIndex(
                name: "IX_ShowtimeRecommendationBatchEntity_CinemaId_CreatedAt",
                table: "ShowtimeRecommendationBatchEntity",
                columns: new[] { "CinemaId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_ShowtimeRecommendationBatchEntity_RequestedByUserId",
                table: "ShowtimeRecommendationBatchEntity",
                column: "RequestedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_ShowtimeRecommendationItemEntity_AppliedByUserId",
                table: "ShowtimeRecommendationItemEntity",
                column: "AppliedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_ShowtimeRecommendationItemEntity_AppliedScheduleId",
                table: "ShowtimeRecommendationItemEntity",
                column: "AppliedScheduleId");

            migrationBuilder.CreateIndex(
                name: "IX_ShowtimeRecommendationItemEntity_AuditoriumId",
                table: "ShowtimeRecommendationItemEntity",
                column: "AuditoriumId");

            migrationBuilder.CreateIndex(
                name: "IX_ShowtimeRecommendationItemEntity_BatchId_Status",
                table: "ShowtimeRecommendationItemEntity",
                columns: new[] { "BatchId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_ShowtimeRecommendationItemEntity_CinemaId_StartTime",
                table: "ShowtimeRecommendationItemEntity",
                columns: new[] { "CinemaId", "StartTime" });

            migrationBuilder.CreateIndex(
                name: "IX_ShowtimeRecommendationItemEntity_DismissedByUserId",
                table: "ShowtimeRecommendationItemEntity",
                column: "DismissedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_ShowtimeRecommendationItemEntity_FormatId",
                table: "ShowtimeRecommendationItemEntity",
                column: "FormatId");

            migrationBuilder.CreateIndex(
                name: "IX_ShowtimeRecommendationItemEntity_MovieId",
                table: "ShowtimeRecommendationItemEntity",
                column: "MovieId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ShowtimeRecommendationActionEntity");

            migrationBuilder.DropTable(
                name: "ShowtimeRecommendationItemEntity");

            migrationBuilder.DropTable(
                name: "ShowtimeRecommendationBatchEntity");
        }
    }
}
