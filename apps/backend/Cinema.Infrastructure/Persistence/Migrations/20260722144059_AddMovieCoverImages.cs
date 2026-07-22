using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Cinema.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddMovieCoverImages : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "MovieCoverImageEntity",
                columns: table => new
                {
                    MovieCoverImageId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    MovieId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ImageUrl = table.Column<string>(type: "varchar(2048)", nullable: false),
                    SortOrder = table.Column<int>(type: "int", nullable: false),
                    IsPrimary = table.Column<bool>(type: "bit", nullable: false),
                    Caption = table.Column<string>(type: "nvarchar(200)", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MovieCoverImageEntity", x => x.MovieCoverImageId);
                    table.ForeignKey(
                        name: "FK_MovieCoverImageEntity_MovieInfoEntity_MovieId",
                        column: x => x.MovieId,
                        principalTable: "MovieInfoEntity",
                        principalColumn: "MovieId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "MovieCoverImageEntity",
                columns: new[] { "MovieCoverImageId", "Caption", "CreatedAt", "ImageUrl", "IsActive", "IsPrimary", "MovieId", "SortOrder" },
                values: new object[,]
                {
                    { new Guid("c6666666-0001-4000-8000-000000000001"), "Gotham rain", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?auto=format&fit=crop&w=1920&q=80", true, true, new Guid("66666666-6666-6666-6666-666666666666"), 0 },
                    { new Guid("c6666666-0001-4000-8000-000000000002"), "Cinema noir", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1920&q=80", true, false, new Guid("66666666-6666-6666-6666-666666666666"), 1 },
                    { new Guid("c6666666-0001-4000-8000-000000000003"), "Night streets", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&w=1920&q=80", true, false, new Guid("66666666-6666-6666-6666-666666666666"), 2 },
                    { new Guid("c6666666-0001-4000-8000-000000000004"), "Auditorium glow", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=1920&q=80", true, false, new Guid("66666666-6666-6666-6666-666666666666"), 3 },
                    { new Guid("c7777777-0001-4000-8000-000000000001"), "Atomic horizon", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=1920&q=80", true, true, new Guid("77777777-7777-7777-7777-777777777777"), 0 },
                    { new Guid("c7777777-0001-4000-8000-000000000002"), "Desert sky", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?auto=format&fit=crop&w=1920&q=80", true, false, new Guid("77777777-7777-7777-7777-777777777777"), 1 },
                    { new Guid("c7777777-0001-4000-8000-000000000003"), "Earth light", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1920&q=80", true, false, new Guid("77777777-7777-7777-7777-777777777777"), 2 },
                    { new Guid("c8888888-0001-4000-8000-000000000001"), "Biolume forest", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1920&q=80", true, true, new Guid("88888888-8888-8888-8888-888888888888"), 0 },
                    { new Guid("c8888888-0001-4000-8000-000000000002"), "Ocean world", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=1920&q=80", true, false, new Guid("88888888-8888-8888-8888-888888888888"), 1 },
                    { new Guid("c8888888-0001-4000-8000-000000000003"), "Planet glow", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?auto=format&fit=crop&w=1920&q=80", true, false, new Guid("88888888-8888-8888-8888-888888888888"), 2 }
                });

            migrationBuilder.CreateIndex(
                name: "IX_MovieCoverImageEntity_MovieId_IsPrimary",
                table: "MovieCoverImageEntity",
                columns: new[] { "MovieId", "IsPrimary" });

            migrationBuilder.CreateIndex(
                name: "IX_MovieCoverImageEntity_MovieId_SortOrder",
                table: "MovieCoverImageEntity",
                columns: new[] { "MovieId", "SortOrder" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "MovieCoverImageEntity");
        }
    }
}
