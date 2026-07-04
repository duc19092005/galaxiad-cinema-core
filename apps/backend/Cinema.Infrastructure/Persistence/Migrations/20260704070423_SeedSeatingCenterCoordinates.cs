using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Cinema.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class SeedSeatingCenterCoordinates : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("UPDATE AuditoriumInfoEntities SET CenterRowStart = 2, CenterRowEnd = 5, CenterColStart = 2, CenterColEnd = 7 WHERE CenterRowStart = 0 AND CenterRowEnd = 0;");
        }


        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {

        }
    }
}
