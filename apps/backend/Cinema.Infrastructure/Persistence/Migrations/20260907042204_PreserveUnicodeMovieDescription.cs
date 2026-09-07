using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Cinema.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class PreserveUnicodeMovieDescription : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "MovieDescription",
                table: "MovieInfoEntity",
                type: "nvarchar(2048)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "varchar(2048)");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "MovieDescription",
                table: "MovieInfoEntity",
                type: "varchar(2048)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(2048)");
        }
    }
}
