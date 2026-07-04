using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Cinema.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class UpdatePricingPromotionRuleToUserSegment : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "RequiredMembershipRank",
                table: "PricingPromotionRuleEntity");

            migrationBuilder.AddColumn<Guid>(
                name: "UserSegmentId",
                table: "PricingPromotionRuleEntity",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_PricingPromotionRuleEntity_UserSegmentId",
                table: "PricingPromotionRuleEntity",
                column: "UserSegmentId");

            migrationBuilder.AddForeignKey(
                name: "FK_PricingPromotionRuleEntity_UserSegmentsInfoEntity_UserSegmentId",
                table: "PricingPromotionRuleEntity",
                column: "UserSegmentId",
                principalTable: "UserSegmentsInfoEntity",
                principalColumn: "UserSegmentId",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_PricingPromotionRuleEntity_UserSegmentsInfoEntity_UserSegmentId",
                table: "PricingPromotionRuleEntity");

            migrationBuilder.DropIndex(
                name: "IX_PricingPromotionRuleEntity_UserSegmentId",
                table: "PricingPromotionRuleEntity");

            migrationBuilder.DropColumn(
                name: "UserSegmentId",
                table: "PricingPromotionRuleEntity");

            migrationBuilder.AddColumn<int>(
                name: "RequiredMembershipRank",
                table: "PricingPromotionRuleEntity",
                type: "int",
                nullable: true);
        }
    }
}
