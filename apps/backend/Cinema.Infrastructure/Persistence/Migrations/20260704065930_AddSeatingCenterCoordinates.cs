using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Cinema.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddSeatingCenterCoordinates : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "CenterColEnd",
                table: "AuditoriumInfoEntities",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "CenterColStart",
                table: "AuditoriumInfoEntities",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "CenterRowEnd",
                table: "AuditoriumInfoEntities",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "CenterRowStart",
                table: "AuditoriumInfoEntities",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.UpdateData(
                table: "AuditoriumInfoEntities",
                keyColumn: "AuditoriumId",
                keyValue: new Guid("33333333-3333-3333-3333-333333333333"),
                columns: new[] { "CenterColEnd", "CenterColStart", "CenterRowEnd", "CenterRowStart" },
                values: new object[] { 0, 0, 0, 0 });

            migrationBuilder.UpdateData(
                table: "AuditoriumInfoEntities",
                keyColumn: "AuditoriumId",
                keyValue: new Guid("44444444-4444-4444-4444-444444444444"),
                columns: new[] { "CenterColEnd", "CenterColStart", "CenterRowEnd", "CenterRowStart" },
                values: new object[] { 0, 0, 0, 0 });

            migrationBuilder.UpdateData(
                table: "AuditoriumInfoEntities",
                keyColumn: "AuditoriumId",
                keyValue: new Guid("55555555-5555-5555-5555-555555555555"),
                columns: new[] { "CenterColEnd", "CenterColStart", "CenterRowEnd", "CenterRowStart" },
                values: new object[] { 0, 0, 0, 0 });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CenterColEnd",
                table: "AuditoriumInfoEntities");

            migrationBuilder.DropColumn(
                name: "CenterColStart",
                table: "AuditoriumInfoEntities");

            migrationBuilder.DropColumn(
                name: "CenterRowEnd",
                table: "AuditoriumInfoEntities");

            migrationBuilder.DropColumn(
                name: "CenterRowStart",
                table: "AuditoriumInfoEntities");
        }
    }
}
