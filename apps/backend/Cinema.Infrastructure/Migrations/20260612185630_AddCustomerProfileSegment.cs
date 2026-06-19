using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Cinema.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddCustomerProfileSegment : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "UserSegmentId",
                table: "CustomerProfileEntity",
                type: "uniqueidentifier",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.CreateIndex(
                name: "IX_CustomerProfileEntity_UserSegmentId",
                table: "CustomerProfileEntity",
                column: "UserSegmentId");

            migrationBuilder.AddForeignKey(
                name: "FK_CustomerProfileEntity_UserSegmentsInfoEntity_UserSegmentId",
                table: "CustomerProfileEntity",
                column: "UserSegmentId",
                principalTable: "UserSegmentsInfoEntity",
                principalColumn: "UserSegmentId",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_CustomerProfileEntity_UserSegmentsInfoEntity_UserSegmentId",
                table: "CustomerProfileEntity");

            migrationBuilder.DropIndex(
                name: "IX_CustomerProfileEntity_UserSegmentId",
                table: "CustomerProfileEntity");

            migrationBuilder.DropColumn(
                name: "UserSegmentId",
                table: "CustomerProfileEntity");
        }
    }
}
