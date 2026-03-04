using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DataAccess.Migrations
{
    /// <inheritdoc />
    public partial class Repair_The_Schemas : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_OrderDetailsInfo_MovieScheduleInfoEntity_MovieScheduleId",
                table: "OrderDetailsInfo");

            migrationBuilder.DropForeignKey(
                name: "FK_OrderDetailsInfo_OrderInfoEntity_OrderId",
                table: "OrderDetailsInfo");

            migrationBuilder.DropPrimaryKey(
                name: "PK_OrderDetailsInfo",
                table: "OrderDetailsInfo");

            migrationBuilder.RenameTable(
                name: "OrderDetailsInfo",
                newName: "OrderDetailsInfoEntity");

            migrationBuilder.RenameIndex(
                name: "IX_OrderDetailsInfo_MovieScheduleId",
                table: "OrderDetailsInfoEntity",
                newName: "IX_OrderDetailsInfoEntity_MovieScheduleId");

            migrationBuilder.AddColumn<bool>(
                name: "IsCommingSoon",
                table: "MovieInfoEntity",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AlterColumn<string>(
                name: "SeatId",
                table: "OrderDetailsInfoEntity",
                type: "varchar(100)",
                nullable: false,
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier");

            migrationBuilder.AddPrimaryKey(
                name: "PK_OrderDetailsInfoEntity",
                table: "OrderDetailsInfoEntity",
                columns: new[] { "OrderId", "MovieScheduleId" });

            migrationBuilder.CreateIndex(
                name: "IX_OrderDetailsInfoEntity_SeatId",
                table: "OrderDetailsInfoEntity",
                column: "SeatId");

            migrationBuilder.AddForeignKey(
                name: "FK_OrderDetailsInfoEntity_MovieScheduleInfoEntity_MovieScheduleId",
                table: "OrderDetailsInfoEntity",
                column: "MovieScheduleId",
                principalTable: "MovieScheduleInfoEntity",
                principalColumn: "MovieScheduleInfoId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_OrderDetailsInfoEntity_OrderInfoEntity_OrderId",
                table: "OrderDetailsInfoEntity",
                column: "OrderId",
                principalTable: "OrderInfoEntity",
                principalColumn: "OrderId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_OrderDetailsInfoEntity_SeatsInfoEntity_SeatId",
                table: "OrderDetailsInfoEntity",
                column: "SeatId",
                principalTable: "SeatsInfoEntity",
                principalColumn: "SeatId",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_OrderDetailsInfoEntity_MovieScheduleInfoEntity_MovieScheduleId",
                table: "OrderDetailsInfoEntity");

            migrationBuilder.DropForeignKey(
                name: "FK_OrderDetailsInfoEntity_OrderInfoEntity_OrderId",
                table: "OrderDetailsInfoEntity");

            migrationBuilder.DropForeignKey(
                name: "FK_OrderDetailsInfoEntity_SeatsInfoEntity_SeatId",
                table: "OrderDetailsInfoEntity");

            migrationBuilder.DropPrimaryKey(
                name: "PK_OrderDetailsInfoEntity",
                table: "OrderDetailsInfoEntity");

            migrationBuilder.DropIndex(
                name: "IX_OrderDetailsInfoEntity_SeatId",
                table: "OrderDetailsInfoEntity");

            migrationBuilder.DropColumn(
                name: "IsCommingSoon",
                table: "MovieInfoEntity");

            migrationBuilder.RenameTable(
                name: "OrderDetailsInfoEntity",
                newName: "OrderDetailsInfo");

            migrationBuilder.RenameIndex(
                name: "IX_OrderDetailsInfoEntity_MovieScheduleId",
                table: "OrderDetailsInfo",
                newName: "IX_OrderDetailsInfo_MovieScheduleId");

            migrationBuilder.AlterColumn<Guid>(
                name: "SeatId",
                table: "OrderDetailsInfo",
                type: "uniqueidentifier",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "varchar(100)");

            migrationBuilder.AddPrimaryKey(
                name: "PK_OrderDetailsInfo",
                table: "OrderDetailsInfo",
                columns: new[] { "OrderId", "MovieScheduleId" });

            migrationBuilder.AddForeignKey(
                name: "FK_OrderDetailsInfo_MovieScheduleInfoEntity_MovieScheduleId",
                table: "OrderDetailsInfo",
                column: "MovieScheduleId",
                principalTable: "MovieScheduleInfoEntity",
                principalColumn: "MovieScheduleInfoId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_OrderDetailsInfo_OrderInfoEntity_OrderId",
                table: "OrderDetailsInfo",
                column: "OrderId",
                principalTable: "OrderInfoEntity",
                principalColumn: "OrderId",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
