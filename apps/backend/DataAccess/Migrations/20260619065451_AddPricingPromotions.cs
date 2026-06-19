using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DataAccess.Migrations
{
    /// <inheritdoc />
    public partial class AddPricingPromotions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "FinalAmount",
                table: "OrderInfoEntity",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "PricingSnapshotJson",
                table: "OrderInfoEntity",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "PromotionDiscountAmount",
                table: "OrderInfoEntity",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "SubtotalPrice",
                table: "OrderInfoEntity",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "VoucherDiscountAmount",
                table: "OrderInfoEntity",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "AppliedPromotionSnapshotJson",
                table: "OrderDetailsInfoEntity",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "BaseFormatPriceSnapshot",
                table: "OrderDetailsInfoEntity",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "FinalPrice",
                table: "OrderDetailsInfoEntity",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "PriceBeforeVoucher",
                table: "OrderDetailsInfoEntity",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "PricingAdjustmentAmount",
                table: "OrderDetailsInfoEntity",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "VoucherDiscountAmount",
                table: "OrderDetailsInfoEntity",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.CreateTable(
                name: "HolidayCalendarEntity",
                columns: table => new
                {
                    HolidayId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(150)", nullable: false),
                    Date = table.Column<DateTime>(type: "date", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_HolidayCalendarEntity", x => x.HolidayId);
                });

            migrationBuilder.CreateTable(
                name: "PricingPromotionEntity",
                columns: table => new
                {
                    PricingPromotionId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(150)", nullable: false),
                    Slug = table.Column<string>(type: "varchar(180)", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(200)", nullable: false),
                    ShortDescription = table.Column<string>(type: "nvarchar(500)", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    TermsAndConditions = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ImageUrl = table.Column<string>(type: "varchar(2048)", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    ExcludeHolidays = table.Column<bool>(type: "bit", nullable: false),
                    StartDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    EndDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PricingPromotionEntity", x => x.PricingPromotionId);
                    table.ForeignKey(
                        name: "FK_PricingPromotionEntity_UserInfoEntity_CreatedBy",
                        column: x => x.CreatedBy,
                        principalTable: "UserInfoEntity",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PricingPromotionEntity_UserInfoEntity_UpdatedBy",
                        column: x => x.UpdatedBy,
                        principalTable: "UserInfoEntity",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "PricingPromotionRuleEntity",
                columns: table => new
                {
                    PricingPromotionRuleId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PricingPromotionId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    MovieFormatId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    CinemaId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    AuditoriumId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    RequiredMembershipTierId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    PromotionType = table.Column<int>(type: "int", nullable: false),
                    AdjustmentValue = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    StartDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    EndDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    TimeFrom = table.Column<TimeSpan>(type: "time", nullable: true),
                    TimeTo = table.Column<TimeSpan>(type: "time", nullable: true),
                    DaysOfWeekMask = table.Column<int>(type: "int", nullable: false),
                    Priority = table.Column<int>(type: "int", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PricingPromotionRuleEntity", x => x.PricingPromotionRuleId);
                    table.ForeignKey(
                        name: "FK_PricingPromotionRuleEntity_AuditoriumInfoEntities_AuditoriumId",
                        column: x => x.AuditoriumId,
                        principalTable: "AuditoriumInfoEntities",
                        principalColumn: "AuditoriumId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PricingPromotionRuleEntity_CinemaInfoEntity_CinemaId",
                        column: x => x.CinemaId,
                        principalTable: "CinemaInfoEntity",
                        principalColumn: "CinemaId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PricingPromotionRuleEntity_MovieFormatInfoEntity_MovieFormatId",
                        column: x => x.MovieFormatId,
                        principalTable: "MovieFormatInfoEntity",
                        principalColumn: "MovieFormatId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PricingPromotionRuleEntity_PricingPromotionEntity_PricingPromotionId",
                        column: x => x.PricingPromotionId,
                        principalTable: "PricingPromotionEntity",
                        principalColumn: "PricingPromotionId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PricingPromotionRuleEntity_UserSegmentsInfoEntity_RequiredMembershipTierId",
                        column: x => x.RequiredMembershipTierId,
                        principalTable: "UserSegmentsInfoEntity",
                        principalColumn: "UserSegmentId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_HolidayCalendarEntity_Date",
                table: "HolidayCalendarEntity",
                column: "Date",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PricingPromotionEntity_CreatedBy",
                table: "PricingPromotionEntity",
                column: "CreatedBy");

            migrationBuilder.CreateIndex(
                name: "IX_PricingPromotionEntity_IsActive_StartDate_EndDate",
                table: "PricingPromotionEntity",
                columns: new[] { "IsActive", "StartDate", "EndDate" });

            migrationBuilder.CreateIndex(
                name: "IX_PricingPromotionEntity_Slug",
                table: "PricingPromotionEntity",
                column: "Slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PricingPromotionEntity_UpdatedBy",
                table: "PricingPromotionEntity",
                column: "UpdatedBy");

            migrationBuilder.CreateIndex(
                name: "IX_PricingPromotionRuleEntity_AuditoriumId",
                table: "PricingPromotionRuleEntity",
                column: "AuditoriumId");

            migrationBuilder.CreateIndex(
                name: "IX_PricingPromotionRuleEntity_CinemaId",
                table: "PricingPromotionRuleEntity",
                column: "CinemaId");

            migrationBuilder.CreateIndex(
                name: "IX_PricingPromotionRuleEntity_IsActive_MovieFormatId_CinemaId_DaysOfWeekMask",
                table: "PricingPromotionRuleEntity",
                columns: new[] { "IsActive", "MovieFormatId", "CinemaId", "DaysOfWeekMask" });

            migrationBuilder.CreateIndex(
                name: "IX_PricingPromotionRuleEntity_MovieFormatId",
                table: "PricingPromotionRuleEntity",
                column: "MovieFormatId");

            migrationBuilder.CreateIndex(
                name: "IX_PricingPromotionRuleEntity_PricingPromotionId",
                table: "PricingPromotionRuleEntity",
                column: "PricingPromotionId");

            migrationBuilder.CreateIndex(
                name: "IX_PricingPromotionRuleEntity_RequiredMembershipTierId",
                table: "PricingPromotionRuleEntity",
                column: "RequiredMembershipTierId");

            migrationBuilder.CreateIndex(
                name: "IX_PricingPromotionRuleEntity_TimeFrom_TimeTo",
                table: "PricingPromotionRuleEntity",
                columns: new[] { "TimeFrom", "TimeTo" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "HolidayCalendarEntity");

            migrationBuilder.DropTable(
                name: "PricingPromotionRuleEntity");

            migrationBuilder.DropTable(
                name: "PricingPromotionEntity");

            migrationBuilder.DropColumn(
                name: "FinalAmount",
                table: "OrderInfoEntity");

            migrationBuilder.DropColumn(
                name: "PricingSnapshotJson",
                table: "OrderInfoEntity");

            migrationBuilder.DropColumn(
                name: "PromotionDiscountAmount",
                table: "OrderInfoEntity");

            migrationBuilder.DropColumn(
                name: "SubtotalPrice",
                table: "OrderInfoEntity");

            migrationBuilder.DropColumn(
                name: "VoucherDiscountAmount",
                table: "OrderInfoEntity");

            migrationBuilder.DropColumn(
                name: "AppliedPromotionSnapshotJson",
                table: "OrderDetailsInfoEntity");

            migrationBuilder.DropColumn(
                name: "BaseFormatPriceSnapshot",
                table: "OrderDetailsInfoEntity");

            migrationBuilder.DropColumn(
                name: "FinalPrice",
                table: "OrderDetailsInfoEntity");

            migrationBuilder.DropColumn(
                name: "PriceBeforeVoucher",
                table: "OrderDetailsInfoEntity");

            migrationBuilder.DropColumn(
                name: "PricingAdjustmentAmount",
                table: "OrderDetailsInfoEntity");

            migrationBuilder.DropColumn(
                name: "VoucherDiscountAmount",
                table: "OrderDetailsInfoEntity");

        }
    }
}
