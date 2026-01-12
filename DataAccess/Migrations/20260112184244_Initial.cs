using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace DataAccess.Migrations
{
    /// <inheritdoc />
    public partial class Initial : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "role_list_info_entity",
                columns: table => new
                {
                    roleId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    roleName = table.Column<string>(type: "nvarchar(50)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_role_list_info_entity", x => x.roleId);
                });

            migrationBuilder.CreateTable(
                name: "user_info_entity",
                columns: table => new
                {
                    userId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    userEmail = table.Column<string>(type: "varchar(100)", nullable: false),
                    password = table.Column<string>(type: "varchar(100)", nullable: false),
                    refreshToken = table.Column<string>(type: "varchar(100)", nullable: true),
                    subId = table.Column<string>(type: "varchar(50)", nullable: true),
                    registerMethod = table.Column<int>(type: "int", nullable: false),
                    accoutStatus = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_user_info_entity", x => x.userId);
                });

            migrationBuilder.CreateTable(
                name: "cinema_info_entity",
                columns: table => new
                {
                    cinemaId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    cinemaLocation = table.Column<string>(type: "nvarchar(100)", nullable: false),
                    cinemaName = table.Column<string>(type: "nvarchar(1000)", nullable: false),
                    cinemaHotLineNumber = table.Column<string>(type: "char(10)", nullable: false),
                    cinemaDescription = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    isDeleted = table.Column<bool>(type: "bit", nullable: false),
                    isActive = table.Column<bool>(type: "bit", nullable: false),
                    deletedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    activeAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    createdAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    updatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    createdByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    updatedByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    deletedByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    managerId = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_cinema_info_entity", x => x.cinemaId);
                    table.ForeignKey(
                        name: "FK_cinema_info_entity_user_info_entity_createdByUserId",
                        column: x => x.createdByUserId,
                        principalTable: "user_info_entity",
                        principalColumn: "userId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_cinema_info_entity_user_info_entity_deletedByUserId",
                        column: x => x.deletedByUserId,
                        principalTable: "user_info_entity",
                        principalColumn: "userId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_cinema_info_entity_user_info_entity_managerId",
                        column: x => x.managerId,
                        principalTable: "user_info_entity",
                        principalColumn: "userId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_cinema_info_entity_user_info_entity_updatedByUserId",
                        column: x => x.updatedByUserId,
                        principalTable: "user_info_entity",
                        principalColumn: "userId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "movie_format_info_entity",
                columns: table => new
                {
                    movieFormatId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    movieFormatName = table.Column<string>(type: "nvarchar(50)", nullable: false),
                    movieFormatDescription = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    movieFormatPrice = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    isDeleted = table.Column<bool>(type: "bit", nullable: false),
                    isActive = table.Column<bool>(type: "bit", nullable: false),
                    deletedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    activeAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    createdAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    updatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    createdByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    updatedByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    deletedByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    managerId = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_movie_format_info_entity", x => x.movieFormatId);
                    table.ForeignKey(
                        name: "FK_movie_format_info_entity_user_info_entity_createdByUserId",
                        column: x => x.createdByUserId,
                        principalTable: "user_info_entity",
                        principalColumn: "userId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_movie_format_info_entity_user_info_entity_deletedByUserId",
                        column: x => x.deletedByUserId,
                        principalTable: "user_info_entity",
                        principalColumn: "userId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_movie_format_info_entity_user_info_entity_managerId",
                        column: x => x.managerId,
                        principalTable: "user_info_entity",
                        principalColumn: "userId");
                    table.ForeignKey(
                        name: "FK_movie_format_info_entity_user_info_entity_updatedByUserId",
                        column: x => x.updatedByUserId,
                        principalTable: "user_info_entity",
                        principalColumn: "userId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "user_profile_entity",
                columns: table => new
                {
                    userID = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    userName = table.Column<string>(type: "nvarchar(100)", nullable: false),
                    identityCode = table.Column<string>(type: "varchar(200)", nullable: false),
                    dateOfBirth = table.Column<DateTime>(type: "datetime2", nullable: false),
                    phoneNumber = table.Column<string>(type: "char(10)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_user_profile_entity", x => x.userID);
                    table.ForeignKey(
                        name: "FK_user_profile_entity_user_info_entity_userID",
                        column: x => x.userID,
                        principalTable: "user_info_entity",
                        principalColumn: "userId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "user_role_info_entity",
                columns: table => new
                {
                    userId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    roleId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_user_role_info_entity", x => new { x.roleId, x.userId });
                    table.ForeignKey(
                        name: "FK_user_role_info_entity_role_list_info_entity_roleId",
                        column: x => x.roleId,
                        principalTable: "role_list_info_entity",
                        principalColumn: "roleId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_user_role_info_entity_user_info_entity_userId",
                        column: x => x.userId,
                        principalTable: "user_info_entity",
                        principalColumn: "userId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "auditorium_info_entity",
                columns: table => new
                {
                    auditoriumId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    auditoriumNumber = table.Column<string>(type: "varchar(100)", nullable: false),
                    movieFormatId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    cinemaId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    isDeleted = table.Column<bool>(type: "bit", nullable: false),
                    isActive = table.Column<bool>(type: "bit", nullable: false),
                    deletedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    activeAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    createdAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    updatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    createdByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    updatedByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    deletedByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    managerId = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_auditorium_info_entity", x => x.auditoriumId);
                    table.ForeignKey(
                        name: "FK_auditorium_info_entity_cinema_info_entity_cinemaId",
                        column: x => x.cinemaId,
                        principalTable: "cinema_info_entity",
                        principalColumn: "cinemaId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_auditorium_info_entity_movie_format_info_entity_movieFormatId",
                        column: x => x.movieFormatId,
                        principalTable: "movie_format_info_entity",
                        principalColumn: "movieFormatId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_auditorium_info_entity_user_info_entity_createdByUserId",
                        column: x => x.createdByUserId,
                        principalTable: "user_info_entity",
                        principalColumn: "userId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_auditorium_info_entity_user_info_entity_deletedByUserId",
                        column: x => x.deletedByUserId,
                        principalTable: "user_info_entity",
                        principalColumn: "userId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_auditorium_info_entity_user_info_entity_managerId",
                        column: x => x.managerId,
                        principalTable: "user_info_entity",
                        principalColumn: "userId");
                    table.ForeignKey(
                        name: "FK_auditorium_info_entity_user_info_entity_updatedByUserId",
                        column: x => x.updatedByUserId,
                        principalTable: "user_info_entity",
                        principalColumn: "userId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "cinema_discount_info_entity",
                columns: table => new
                {
                    cinemaId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    movieFormatId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    discountPercent = table.Column<decimal>(type: "decimal(5,2)", nullable: false),
                    discountNote = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    isDeleted = table.Column<bool>(type: "bit", nullable: false),
                    isActive = table.Column<bool>(type: "bit", nullable: false),
                    deletedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    activeAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    createdAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    updatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    createdByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    updatedByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    deletedByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    managerId = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_cinema_discount_info_entity", x => new { x.cinemaId, x.movieFormatId });
                    table.ForeignKey(
                        name: "FK_cinema_discount_info_entity_cinema_info_entity_cinemaId",
                        column: x => x.cinemaId,
                        principalTable: "cinema_info_entity",
                        principalColumn: "cinemaId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_cinema_discount_info_entity_movie_format_info_entity_movieFormatId",
                        column: x => x.movieFormatId,
                        principalTable: "movie_format_info_entity",
                        principalColumn: "movieFormatId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_cinema_discount_info_entity_user_info_entity_createdByUserId",
                        column: x => x.createdByUserId,
                        principalTable: "user_info_entity",
                        principalColumn: "userId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_cinema_discount_info_entity_user_info_entity_deletedByUserId",
                        column: x => x.deletedByUserId,
                        principalTable: "user_info_entity",
                        principalColumn: "userId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_cinema_discount_info_entity_user_info_entity_managerId",
                        column: x => x.managerId,
                        principalTable: "user_info_entity",
                        principalColumn: "userId");
                    table.ForeignKey(
                        name: "FK_cinema_discount_info_entity_user_info_entity_updatedByUserId",
                        column: x => x.updatedByUserId,
                        principalTable: "user_info_entity",
                        principalColumn: "userId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "seats_info_entity",
                columns: table => new
                {
                    seatId = table.Column<string>(type: "varchar(100)", nullable: false),
                    seatNumber = table.Column<string>(type: "nvarchar(50)", nullable: false),
                    coordX = table.Column<double>(type: "float", nullable: false),
                    coordY = table.Column<double>(type: "float", nullable: false),
                    colIndex = table.Column<int>(type: "int", nullable: false),
                    rowIndex = table.Column<int>(type: "int", nullable: false),
                    auditoriumId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    isDeleted = table.Column<bool>(type: "bit", nullable: false),
                    isActive = table.Column<bool>(type: "bit", nullable: false),
                    deletedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    activeAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    createdAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    updatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    createdByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    updatedByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    deletedByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    managerId = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_seats_info_entity", x => x.seatId);
                    table.ForeignKey(
                        name: "FK_seats_info_entity_auditorium_info_entity_auditoriumId",
                        column: x => x.auditoriumId,
                        principalTable: "auditorium_info_entity",
                        principalColumn: "auditoriumId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_seats_info_entity_user_info_entity_createdByUserId",
                        column: x => x.createdByUserId,
                        principalTable: "user_info_entity",
                        principalColumn: "userId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_seats_info_entity_user_info_entity_deletedByUserId",
                        column: x => x.deletedByUserId,
                        principalTable: "user_info_entity",
                        principalColumn: "userId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_seats_info_entity_user_info_entity_managerId",
                        column: x => x.managerId,
                        principalTable: "user_info_entity",
                        principalColumn: "userId");
                    table.ForeignKey(
                        name: "FK_seats_info_entity_user_info_entity_updatedByUserId",
                        column: x => x.updatedByUserId,
                        principalTable: "user_info_entity",
                        principalColumn: "userId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.InsertData(
                table: "role_list_info_entity",
                columns: new[] { "roleId", "roleName" },
                values: new object[,]
                {
                    { new Guid("1a8f7b9c-d4e5-4f6a-b7c8-9d0e1f2a3b4c"), "Cashier" },
                    { new Guid("2b9c8d0e-f5a6-7b8c-d9e0-1f2a3b4c5d6e"), "Customer" },
                    { new Guid("3c0d9e1f-a6b7-c8d9-e0f1-2a3b4c5d6e7f"), "Admin" },
                    { new Guid("4d1e0f2a-b7c8-d9e0-f1a2-3b4c5d6e7f8a"), "MovieManager" },
                    { new Guid("5e2f1a3b-c8d9-e0f1-a2b3-4c5d6e7f8a9b"), "TheaterManager" },
                    { new Guid("6f3a2b4c-d9e0-f1a2-b3c4-d5e6f7a8b9c0"), "FacilitiesManager" }
                });

            migrationBuilder.InsertData(
                table: "user_info_entity",
                columns: new[] { "userId", "accoutStatus", "password", "refreshToken", "registerMethod", "subId", "userEmail" },
                values: new object[,]
                {
                    { new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), 0, "$2a$12$FeLXQjfW3gfNFfELxTJS3.gH8o9Y2CB5WSGcDZxKMrPEJiR2RcxIS", null, 0, null, "theater@example.com" },
                    { new Guid("a1b2c3d4-e5f6-7a8b-c9d0-e1f2a3b4c5d6"), 0, "$2a$12$CkugZHMrWhxG0h6hUqOAf.fX9QQFkLnfnLlI.xWCNZ1y/PivtfN2O", null, 0, null, "cashier@example.com" },
                    { new Guid("b2c3d4e5-f6a7-8b9c-d0e1-f2a3b4c5d6e7"), 0, "$2a$12$ADqBiSquthm1g7bLZvg6UulJ5QJFQQ6olUQzf66AQfJDGbQ2W1wlG", null, 0, null, "user@example.com" },
                    { new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), 0, "$2a$12$91JfhncA5t3ssFtiaoKjSOrbMj7zON.wtL/n3cjme/wvK2kDCgZ7K", null, 0, null, "admin@example.com" },
                    { new Guid("f1a0e9b8-d7c6-5e4f-a3b2-1d0c9b8a7f6e"), 0, "$2a$12$CkugZHMrWhxG0h6hUqOAf.fX9QQFkLnfnLlI.xWCNZ1y/PivtfN2O", null, 0, null, "facilities@example.com" }
                });

            migrationBuilder.InsertData(
                table: "user_profile_entity",
                columns: new[] { "userID", "dateOfBirth", "identityCode", "phoneNumber", "userName" },
                values: new object[,]
                {
                    { new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), new DateTime(1990, 5, 15, 0, 0, 0, 0, DateTimeKind.Unspecified), "Pk3VcB5Kk2xdhHerF74zBg==", "0977234567", "Theater Manager" },
                    { new Guid("a1b2c3d4-e5f6-7a8b-c9d0-e1f2a3b4c5d6"), new DateTime(1995, 12, 12, 0, 0, 0, 0, DateTimeKind.Unspecified), "pFoBRlv4RT1kyqKE1Ch3Hw==", "0944456789", "Cashier" },
                    { new Guid("b2c3d4e5-f6a7-8b9c-d0e1-f2a3b4c5d6e7"), new DateTime(2005, 10, 10, 0, 0, 0, 0, DateTimeKind.Unspecified), "NjItl/uAfIOjjzvtWPbnzg==", "0123456789", "Movie Manager 1" },
                    { new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), new DateTime(1985, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), "pxc5zG8sfEcsJrHg1AjV3w==", "0988123456", "Admin" },
                    { new Guid("f1a0e9b8-d7c6-5e4f-a3b2-1d0c9b8a7f6e"), new DateTime(1992, 8, 20, 0, 0, 0, 0, DateTimeKind.Unspecified), "cFobMOQzli9Um8tWi/vJZg==", "0966345678", "Facilities Manager" }
                });

            migrationBuilder.InsertData(
                table: "user_role_info_entity",
                columns: new[] { "roleId", "userId" },
                values: new object[,]
                {
                    { new Guid("1a8f7b9c-d4e5-4f6a-b7c8-9d0e1f2a3b4c"), new Guid("a1b2c3d4-e5f6-7a8b-c9d0-e1f2a3b4c5d6") },
                    { new Guid("3c0d9e1f-a6b7-c8d9-e0f1-2a3b4c5d6e7f"), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c") },
                    { new Guid("4d1e0f2a-b7c8-d9e0-f1a2-3b4c5d6e7f8a"), new Guid("b2c3d4e5-f6a7-8b9c-d0e1-f2a3b4c5d6e7") },
                    { new Guid("5e2f1a3b-c8d9-e0f1-a2b3-4c5d6e7f8a9b"), new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5") },
                    { new Guid("6f3a2b4c-d9e0-f1a2-b3c4-d5e6f7a8b9c0"), new Guid("f1a0e9b8-d7c6-5e4f-a3b2-1d0c9b8a7f6e") }
                });

            migrationBuilder.CreateIndex(
                name: "IX_auditorium_info_entity_auditoriumNumber_cinemaId",
                table: "auditorium_info_entity",
                columns: new[] { "auditoriumNumber", "cinemaId" },
                unique: true,
                filter: "[isDeleted] = CAST(0 AS BIT)");

            migrationBuilder.CreateIndex(
                name: "IX_auditorium_info_entity_cinemaId",
                table: "auditorium_info_entity",
                column: "cinemaId");

            migrationBuilder.CreateIndex(
                name: "IX_auditorium_info_entity_createdByUserId",
                table: "auditorium_info_entity",
                column: "createdByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_auditorium_info_entity_deletedByUserId",
                table: "auditorium_info_entity",
                column: "deletedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_auditorium_info_entity_managerId",
                table: "auditorium_info_entity",
                column: "managerId");

            migrationBuilder.CreateIndex(
                name: "IX_auditorium_info_entity_movieFormatId",
                table: "auditorium_info_entity",
                column: "movieFormatId");

            migrationBuilder.CreateIndex(
                name: "IX_auditorium_info_entity_updatedByUserId",
                table: "auditorium_info_entity",
                column: "updatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_cinema_discount_info_entity_createdByUserId",
                table: "cinema_discount_info_entity",
                column: "createdByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_cinema_discount_info_entity_deletedByUserId",
                table: "cinema_discount_info_entity",
                column: "deletedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_cinema_discount_info_entity_managerId",
                table: "cinema_discount_info_entity",
                column: "managerId");

            migrationBuilder.CreateIndex(
                name: "IX_cinema_discount_info_entity_movieFormatId",
                table: "cinema_discount_info_entity",
                column: "movieFormatId");

            migrationBuilder.CreateIndex(
                name: "IX_cinema_discount_info_entity_updatedByUserId",
                table: "cinema_discount_info_entity",
                column: "updatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_cinema_info_entity_cinemaHotLineNumber",
                table: "cinema_info_entity",
                column: "cinemaHotLineNumber",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_cinema_info_entity_cinemaName",
                table: "cinema_info_entity",
                column: "cinemaName",
                unique: true,
                filter: "[isDeleted] = CAST(0 AS BIT)");

            migrationBuilder.CreateIndex(
                name: "IX_cinema_info_entity_createdByUserId",
                table: "cinema_info_entity",
                column: "createdByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_cinema_info_entity_deletedByUserId",
                table: "cinema_info_entity",
                column: "deletedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_cinema_info_entity_managerId",
                table: "cinema_info_entity",
                column: "managerId");

            migrationBuilder.CreateIndex(
                name: "IX_cinema_info_entity_updatedByUserId",
                table: "cinema_info_entity",
                column: "updatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_movie_format_info_entity_createdByUserId",
                table: "movie_format_info_entity",
                column: "createdByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_movie_format_info_entity_deletedByUserId",
                table: "movie_format_info_entity",
                column: "deletedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_movie_format_info_entity_managerId",
                table: "movie_format_info_entity",
                column: "managerId");

            migrationBuilder.CreateIndex(
                name: "IX_movie_format_info_entity_updatedByUserId",
                table: "movie_format_info_entity",
                column: "updatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_role_list_info_entity_roleName",
                table: "role_list_info_entity",
                column: "roleName",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_seats_info_entity_auditoriumId",
                table: "seats_info_entity",
                column: "auditoriumId");

            migrationBuilder.CreateIndex(
                name: "IX_seats_info_entity_createdByUserId",
                table: "seats_info_entity",
                column: "createdByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_seats_info_entity_deletedByUserId",
                table: "seats_info_entity",
                column: "deletedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_seats_info_entity_managerId",
                table: "seats_info_entity",
                column: "managerId");

            migrationBuilder.CreateIndex(
                name: "IX_seats_info_entity_updatedByUserId",
                table: "seats_info_entity",
                column: "updatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_user_info_entity_refreshToken",
                table: "user_info_entity",
                column: "refreshToken",
                unique: true,
                filter: "[refreshToken] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_user_info_entity_userEmail",
                table: "user_info_entity",
                column: "userEmail",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_user_role_info_entity_userId",
                table: "user_role_info_entity",
                column: "userId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "cinema_discount_info_entity");

            migrationBuilder.DropTable(
                name: "seats_info_entity");

            migrationBuilder.DropTable(
                name: "user_profile_entity");

            migrationBuilder.DropTable(
                name: "user_role_info_entity");

            migrationBuilder.DropTable(
                name: "auditorium_info_entity");

            migrationBuilder.DropTable(
                name: "role_list_info_entity");

            migrationBuilder.DropTable(
                name: "cinema_info_entity");

            migrationBuilder.DropTable(
                name: "movie_format_info_entity");

            migrationBuilder.DropTable(
                name: "user_info_entity");
        }
    }
}
