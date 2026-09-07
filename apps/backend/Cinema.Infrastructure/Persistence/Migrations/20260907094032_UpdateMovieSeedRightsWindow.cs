using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Cinema.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class UpdateMovieSeedRightsWindow : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "MovieInfoEntity",
                keyColumn: "MovieId",
                keyValue: new Guid("66666666-6666-6666-6666-666666666666"),
                columns: new[] { "ActiveAt", "EndedDate" },
                values: new object[] { new DateTime(2026, 9, 6, 0, 0, 0, 0, DateTimeKind.Utc), new DateTime(2027, 9, 20, 23, 59, 59, 0, DateTimeKind.Utc) });

            migrationBuilder.UpdateData(
                table: "MovieInfoEntity",
                keyColumn: "MovieId",
                keyValue: new Guid("77777777-7777-7777-7777-777777777777"),
                columns: new[] { "ActiveAt", "EndedDate" },
                values: new object[] { new DateTime(2026, 9, 6, 0, 0, 0, 0, DateTimeKind.Utc), new DateTime(2027, 9, 20, 23, 59, 59, 0, DateTimeKind.Utc) });

            migrationBuilder.UpdateData(
                table: "MovieInfoEntity",
                keyColumn: "MovieId",
                keyValue: new Guid("88888888-8888-8888-8888-888888888888"),
                columns: new[] { "ActiveAt", "EndedDate" },
                values: new object[] { new DateTime(2026, 9, 6, 0, 0, 0, 0, DateTimeKind.Utc), new DateTime(2027, 9, 20, 23, 59, 59, 0, DateTimeKind.Utc) });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "MovieInfoEntity",
                keyColumn: "MovieId",
                keyValue: new Guid("66666666-6666-6666-6666-666666666666"),
                columns: new[] { "ActiveAt", "EndedDate" },
                values: new object[] { new DateTime(2026, 3, 13, 0, 0, 0, 0, DateTimeKind.Utc), new DateTime(2026, 4, 12, 0, 0, 0, 0, DateTimeKind.Utc) });

            migrationBuilder.UpdateData(
                table: "MovieInfoEntity",
                keyColumn: "MovieId",
                keyValue: new Guid("77777777-7777-7777-7777-777777777777"),
                columns: new[] { "ActiveAt", "EndedDate" },
                values: new object[] { new DateTime(2026, 3, 17, 0, 0, 0, 0, DateTimeKind.Utc), new DateTime(2026, 4, 17, 0, 0, 0, 0, DateTimeKind.Utc) });

            migrationBuilder.UpdateData(
                table: "MovieInfoEntity",
                keyColumn: "MovieId",
                keyValue: new Guid("88888888-8888-8888-8888-888888888888"),
                columns: new[] { "ActiveAt", "EndedDate" },
                values: new object[] { new DateTime(2026, 3, 28, 0, 0, 0, 0, DateTimeKind.Utc), new DateTime(2026, 4, 27, 0, 0, 0, 0, DateTimeKind.Utc) });
        }
    }
}
