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
                name: "movieGenreInfoEntity",
                columns: table => new
                {
                    movieGenreId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    movieGenreName = table.Column<string>(type: "nvarchar(40)", nullable: false),
                    movieGenreDescription = table.Column<string>(type: "nvarchar(200)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_movieGenreInfoEntity", x => x.movieGenreId);
                });

            migrationBuilder.CreateTable(
                name: "movieRequiredAgeEntity",
                columns: table => new
                {
                    movieRequiredAgeId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    movieRequiredAgeSymbol = table.Column<string>(type: "nchar(10)", nullable: false),
                    movieRequiredAgeDescription = table.Column<string>(type: "nvarchar(2000)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_movieRequiredAgeEntity", x => x.movieRequiredAgeId);
                });

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
                name: "user_segments_info_entity",
                columns: table => new
                {
                    userSegmentId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    userSegmentName = table.Column<string>(type: "nvarchar(50)", nullable: false),
                    userSegmentDescription = table.Column<string>(type: "nvarchar(2000)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_user_segments_info_entity", x => x.userSegmentId);
                });

            migrationBuilder.CreateTable(
                name: "voucher_info_entity",
                columns: table => new
                {
                    voucherId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    voucherName = table.Column<string>(type: "nvarchar(100)", nullable: false),
                    voucherDescription = table.Column<string>(type: "nvarchar(300)", nullable: false),
                    voucherAmount = table.Column<long>(type: "bigint", nullable: false),
                    voucherDiscountPercent = table.Column<decimal>(type: "decimal(5,2)", nullable: false),
                    roleId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_voucher_info_entity", x => x.voucherId);
                    table.ForeignKey(
                        name: "FK_voucher_info_entity_role_list_info_entity_roleId",
                        column: x => x.roleId,
                        principalTable: "role_list_info_entity",
                        principalColumn: "roleId",
                        onDelete: ReferentialAction.Cascade);
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
                    managerId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    isDeleted = table.Column<bool>(type: "bit", nullable: false),
                    isActive = table.Column<bool>(type: "bit", nullable: false),
                    deletedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    activeAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    createdAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    updatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    createdByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    updatedByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    deletedByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
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
                    movieFormatDescription = table.Column<string>(type: "nvarchar(2000)", nullable: false),
                    movieFormatPrice = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    isDeleted = table.Column<bool>(type: "bit", nullable: false),
                    isActive = table.Column<bool>(type: "bit", nullable: false),
                    deletedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    activeAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    createdAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    updatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    createdByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    updatedByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    deletedByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
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
                        name: "FK_movie_format_info_entity_user_info_entity_updatedByUserId",
                        column: x => x.updatedByUserId,
                        principalTable: "user_info_entity",
                        principalColumn: "userId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "movieInfoEntity",
                columns: table => new
                {
                    movieId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    movieRequiredAgeId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    movieName = table.Column<string>(type: "nvarchar(100)", nullable: false),
                    movieDescription = table.Column<string>(type: "varchar(2048)", nullable: false),
                    movieImageUrl = table.Column<string>(type: "varchar(2048)", nullable: false),
                    endedDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    isDeleted = table.Column<bool>(type: "bit", nullable: false),
                    isActive = table.Column<bool>(type: "bit", nullable: false),
                    deletedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    activeAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    createdAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    updatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    createdByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    updatedByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    deletedByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_movieInfoEntity", x => x.movieId);
                    table.ForeignKey(
                        name: "FK_movieInfoEntity_movieRequiredAgeEntity_movieRequiredAgeId",
                        column: x => x.movieRequiredAgeId,
                        principalTable: "movieRequiredAgeEntity",
                        principalColumn: "movieRequiredAgeId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_movieInfoEntity_user_info_entity_createdByUserId",
                        column: x => x.createdByUserId,
                        principalTable: "user_info_entity",
                        principalColumn: "userId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_movieInfoEntity_user_info_entity_deletedByUserId",
                        column: x => x.deletedByUserId,
                        principalTable: "user_info_entity",
                        principalColumn: "userId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_movieInfoEntity_user_info_entity_updatedByUserId",
                        column: x => x.updatedByUserId,
                        principalTable: "user_info_entity",
                        principalColumn: "userId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "order_info_entity",
                columns: table => new
                {
                    orderId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    userId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    orderStatus = table.Column<int>(type: "int", nullable: false),
                    paymentMethod = table.Column<int>(type: "int", nullable: false),
                    totalPrice = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    orderDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    totalQuantity = table.Column<int>(type: "int", nullable: false),
                    customerName = table.Column<string>(type: "nvarchar(50)", nullable: false),
                    customerAddress = table.Column<string>(type: "nvarchar(200)", nullable: false),
                    customerEmail = table.Column<string>(type: "varchar(40)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_order_info_entity", x => x.orderId);
                    table.ForeignKey(
                        name: "FK_order_info_entity_user_info_entity_userId",
                        column: x => x.userId,
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
                    deletedByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
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
                    deletedByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
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
                        name: "FK_cinema_discount_info_entity_user_info_entity_updatedByUserId",
                        column: x => x.updatedByUserId,
                        principalTable: "user_info_entity",
                        principalColumn: "userId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "cinema_surcharge_infos_entity",
                columns: table => new
                {
                    cinemaId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    movieFormatId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    userSegmentId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    surchangePercent = table.Column<decimal>(type: "decimal(5,2)", nullable: false),
                    isDeleted = table.Column<bool>(type: "bit", nullable: false),
                    isActive = table.Column<bool>(type: "bit", nullable: false),
                    deletedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    activeAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    createdAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    updatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    createdByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    updatedByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    deletedByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_cinema_surcharge_infos_entity", x => new { x.cinemaId, x.movieFormatId });
                    table.ForeignKey(
                        name: "FK_cinema_surcharge_infos_entity_cinema_info_entity_cinemaId",
                        column: x => x.cinemaId,
                        principalTable: "cinema_info_entity",
                        principalColumn: "cinemaId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_cinema_surcharge_infos_entity_movie_format_info_entity_movieFormatId",
                        column: x => x.movieFormatId,
                        principalTable: "movie_format_info_entity",
                        principalColumn: "movieFormatId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_cinema_surcharge_infos_entity_user_info_entity_createdByUserId",
                        column: x => x.createdByUserId,
                        principalTable: "user_info_entity",
                        principalColumn: "userId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_cinema_surcharge_infos_entity_user_info_entity_deletedByUserId",
                        column: x => x.deletedByUserId,
                        principalTable: "user_info_entity",
                        principalColumn: "userId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_cinema_surcharge_infos_entity_user_info_entity_updatedByUserId",
                        column: x => x.updatedByUserId,
                        principalTable: "user_info_entity",
                        principalColumn: "userId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_cinema_surcharge_infos_entity_user_segments_info_entity_userSegmentId",
                        column: x => x.userSegmentId,
                        principalTable: "user_segments_info_entity",
                        principalColumn: "userSegmentId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "movieFormatMovieInfoEntity",
                columns: table => new
                {
                    MovieId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    FormatId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_movieFormatMovieInfoEntity", x => new { x.MovieId, x.FormatId });
                    table.ForeignKey(
                        name: "FK_movieFormatMovieInfoEntity_movieInfoEntity_MovieId",
                        column: x => x.MovieId,
                        principalTable: "movieInfoEntity",
                        principalColumn: "movieId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_movieFormatMovieInfoEntity_movie_format_info_entity_FormatId",
                        column: x => x.FormatId,
                        principalTable: "movie_format_info_entity",
                        principalColumn: "movieFormatId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "movieGenreMovieInfoEntity",
                columns: table => new
                {
                    movieId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    movieGenreId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_movieGenreMovieInfoEntity", x => new { x.movieGenreId, x.movieId });
                    table.ForeignKey(
                        name: "FK_movieGenreMovieInfoEntity_movieGenreInfoEntity_movieGenreId",
                        column: x => x.movieGenreId,
                        principalTable: "movieGenreInfoEntity",
                        principalColumn: "movieGenreId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_movieGenreMovieInfoEntity_movieInfoEntity_movieId",
                        column: x => x.movieId,
                        principalTable: "movieInfoEntity",
                        principalColumn: "movieId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "movie_schedule_info_entity",
                columns: table => new
                {
                    movieScheduleInfoId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    movieId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    auditoriumId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    movieFormatId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    startedTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    endedTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    isDeleted = table.Column<bool>(type: "bit", nullable: false),
                    isActive = table.Column<bool>(type: "bit", nullable: false),
                    deletedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    activeAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    createdAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    updatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    createdByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    updatedByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    deletedByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_movie_schedule_info_entity", x => x.movieScheduleInfoId);
                    table.ForeignKey(
                        name: "FK_movie_schedule_info_entity_auditorium_info_entity_auditoriumId",
                        column: x => x.auditoriumId,
                        principalTable: "auditorium_info_entity",
                        principalColumn: "auditoriumId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_movie_schedule_info_entity_movieInfoEntity_movieId",
                        column: x => x.movieId,
                        principalTable: "movieInfoEntity",
                        principalColumn: "movieId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_movie_schedule_info_entity_movie_format_info_entity_movieFormatId",
                        column: x => x.movieFormatId,
                        principalTable: "movie_format_info_entity",
                        principalColumn: "movieFormatId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_movie_schedule_info_entity_user_info_entity_createdByUserId",
                        column: x => x.createdByUserId,
                        principalTable: "user_info_entity",
                        principalColumn: "userId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_movie_schedule_info_entity_user_info_entity_deletedByUserId",
                        column: x => x.deletedByUserId,
                        principalTable: "user_info_entity",
                        principalColumn: "userId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_movie_schedule_info_entity_user_info_entity_updatedByUserId",
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
                    auditoriumId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
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
                });

            migrationBuilder.CreateTable(
                name: "order_details_info",
                columns: table => new
                {
                    orderId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    movieScheduleId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    seatId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    priceEach = table.Column<decimal>(type: "decimal(18,2)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_order_details_info", x => new { x.orderId, x.movieScheduleId });
                    table.ForeignKey(
                        name: "FK_order_details_info_movie_schedule_info_entity_movieScheduleId",
                        column: x => x.movieScheduleId,
                        principalTable: "movie_schedule_info_entity",
                        principalColumn: "movieScheduleInfoId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_order_details_info_order_info_entity_orderId",
                        column: x => x.orderId,
                        principalTable: "order_info_entity",
                        principalColumn: "orderId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.InsertData(
                table: "movieGenreInfoEntity",
                columns: new[] { "movieGenreId", "movieGenreDescription", "movieGenreName" },
                values: new object[,]
                {
                    { new Guid("0a1b2c3d-4e5f-6a7b-8c9d-0e1f2a3b4c5d"), "Non-fictional films intended to document reality for instruction or history.", "Documentary" },
                    { new Guid("1b2c3d4e-5f6a-7b8c-9d0e-1f2a3b4c5d6e"), "Movies characterized by excitement, suspense, and intense anticipation.", "Thriller" },
                    { new Guid("2c3d4e5f-6a7b-8c9d-0e1f-2a3b4c5d6e7f"), "Exciting journeys to new places, often involving a quest or exploration.", "Adventure" },
                    { new Guid("a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d"), "Films designed to entertain and provoke laughter through humor.", "Comedy" },
                    { new Guid("b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e"), "Focuses on realistic characters and emotional themes of human conflict.", "Drama" },
                    { new Guid("c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f"), "Intended to scare, shock, and thrill audiences with supernatural or dark themes.", "Horror" },
                    { new Guid("d4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a"), "Exploring futuristic concepts, space travel, and advanced technology.", "Sci-Fi" },
                    { new Guid("e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b"), "Focuses on romantic love relationships and emotional connections.", "Romance" },
                    { new Guid("f2a1b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c"), "Fast-paced movies with physical feats, stunts, and heroic battles.", "Action" },
                    { new Guid("f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f8a9b0c"), "Feature films produced using traditional or computer-generated imagery.", "Animation" }
                });

            migrationBuilder.InsertData(
                table: "movieRequiredAgeEntity",
                columns: new[] { "movieRequiredAgeId", "movieRequiredAgeDescription", "movieRequiredAgeSymbol" },
                values: new object[,]
                {
                    { new Guid("2b3c4d5e-6f7a-4b8c-9d0e-1f2a3b4c5d6e"), "18+: Adult only. This film is restricted to audiences aged 18 and above.", "T18" },
                    { new Guid("3d8e9a2b-1f0c-4b5a-9d6e-7f2a1b4c3d0e"), "Parental Guidance: Films suitable for children under 13 with parental supervision.", "K" },
                    { new Guid("5c1b2d4e-8a9b-4c0d-7f6e-1d2c3b4a5e0f"), "13+: This film is restricted to audiences aged 13 and above.", "T13" },
                    { new Guid("7a2f4b1d-9c3e-4d5a-8b2c-6f1e0a9d4b5c"), "General Admission: Suitable for audiences of all ages.", "P" },
                    { new Guid("9f0e1d2c-3b4a-4d5e-6f7a-8b9c0d1e2f3a"), "16+: This film is restricted to audiences aged 16 and above.", "T16" }
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
                    { new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), 0, "$2a$12$Lcz0doBD1.jofXcNDWF8x.4TSmUsyJKR/pbdP.fIh4Fc9yDV5X39m", null, 0, null, "theater@cinema.com" },
                    { new Guid("a1b2c3d4-e5f6-7a8b-c9d0-e1f2a3b4c5d6"), 0, "$2a$12$HSYdRT84AjbFawIfnmluJ.AMrBqmqBtKyyn6kNZFTNW7olAMMgXPy", null, 0, null, "cashier@cinema.com" },
                    { new Guid("b2c3d4e5-f6a7-8b9c-d0e1-f2a3b4c5d6e7"), 0, "$2a$12$FhmQsQjdtTZIHEzJIpAjZumRH0WvleZ2xidk22wSd841kxaQNE7ke", null, 0, null, "moviemanager@cinema.com" },
                    { new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), 0, "$2a$12$ufIKVZZwGlxHfQ0WSZQRmeDDeCuneaflIghQhHC6RupR0LVYLU5bi", null, 0, null, "admin@cinema.com" },
                    { new Guid("f1a0e9b8-d7c6-5e4f-a3b2-1d0c9b8a7f6e"), 0, "$2a$12$v2nSRwPmr62wHUakVl6TCeZLPGLEaVJBqotgF3qXVff0KnlWNWHE2", null, 0, null, "facilities@cinema.com" }
                });

            migrationBuilder.InsertData(
                table: "user_segments_info_entity",
                columns: new[] { "userSegmentId", "userSegmentDescription", "userSegmentName" },
                values: new object[,]
                {
                    { new Guid("1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d"), "Full-time students with a valid student ID card.", "Student" },
                    { new Guid("3d4e5f6a-7b8c-4d9e-0f1a-2b3c4d5e6f7a"), "Senior citizens aged 60 and above with a valid ID.", "Senior" },
                    { new Guid("5c6d7e8f-9a0b-4c1d-2e3f-4a5b6c7d8e9f"), "Registered members with basic loyalty benefits.", "Standard Member" },
                    { new Guid("7b2e1a9d-3f5c-4e8b-91d2-a6b3c4d5e6f7"), "Standard customers aged 18 to 59.", "Adult" },
                    { new Guid("9f8e7d6c-5b4a-4e3d-2c1b-0a9f8e7d6c5b"), "Children under 12 years old or under 1.3m in height.", "Child" },
                    { new Guid("d1e2f3a4-b5c6-4d7e-8f9a-0b1c2d3e4f5a"), "High-tier members with premium discounts and exclusive offers.", "VIP Member" }
                });

            migrationBuilder.InsertData(
                table: "movie_format_info_entity",
                columns: new[] { "movieFormatId", "activeAt", "createdAt", "createdByUserId", "deletedAt", "deletedByUserId", "isActive", "isDeleted", "movieFormatDescription", "movieFormatName", "movieFormatPrice", "updatedAt", "updatedByUserId" },
                values: new object[,]
                {
                    { new Guid("1c2d3e4f-5a6b-4c7d-8e9f-0a1b2c3d4e5f"), new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, null, true, false, "Luxury bed-seating auditorium designed for ultimate comfort and couples.", "L'Amour", 600000m, new DateTime(2026, 1, 17, 16, 6, 5, 322, DateTimeKind.Local).AddTicks(5586), null },
                    { new Guid("3fbc4a32-15f5-47e0-b98a-784f1b8a9612"), new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, null, true, false, "Standard digital 2D format with crystal clear image quality.", "2D", 80000m, new DateTime(2026, 1, 17, 16, 6, 5, 322, DateTimeKind.Local).AddTicks(5559), null },
                    { new Guid("5d4c3b2a-1f0e-4d9c-8b7a-6e5d4c3b2a1f"), new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, null, true, false, "Multi-sensory experience featuring motion seats, wind, water, and scents.", "4DX", 180000m, new DateTime(2026, 1, 17, 16, 6, 5, 322, DateTimeKind.Local).AddTicks(5580), null },
                    { new Guid("7a5e82b1-c4d3-4a92-9e11-3f4b52c1a8d9"), new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, null, true, false, "Immersive three-dimensional visual experience with specialized glasses.", "3D", 110000m, new DateTime(2026, 1, 17, 16, 6, 5, 322, DateTimeKind.Local).AddTicks(5567), null },
                    { new Guid("9f8e7d6c-5b4a-4e3d-2c1b-0a9f8e7d6c5b"), new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, null, true, false, "Premium luxury seating with in-theater dining and personalized service.", "Gold Class", 300000m, new DateTime(2026, 1, 17, 16, 6, 5, 322, DateTimeKind.Local).AddTicks(5583), null },
                    { new Guid("a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d"), new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, null, true, false, "A revolutionary 270-degree panoramic cinematic experience.", "ScreenX", 160000m, new DateTime(2026, 1, 17, 16, 6, 5, 322, DateTimeKind.Local).AddTicks(5576), null },
                    { new Guid("d29b0f1c-8e2a-4c5b-bc3d-1a2f3e4d5c6b"), new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, null, true, false, "Giant screen format with unparalleled brightness and ultra-high resolution.", "IMAX", 250000m, new DateTime(2026, 1, 17, 16, 6, 5, 322, DateTimeKind.Local).AddTicks(5570), null },
                    { new Guid("f9e1d2c3-b4a5-4e6f-8d7c-9b0a1f2e3d4c"), new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, null, true, false, "State-of-the-art surround sound technology for a lifelike audio experience.", "Dolby Atmos", 130000m, new DateTime(2026, 1, 17, 16, 6, 5, 322, DateTimeKind.Local).AddTicks(5573), null }
                });

            migrationBuilder.InsertData(
                table: "user_profile_entity",
                columns: new[] { "userID", "dateOfBirth", "identityCode", "phoneNumber", "userName" },
                values: new object[,]
                {
                    { new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), new DateTime(1988, 3, 15, 0, 0, 0, 0, DateTimeKind.Unspecified), "Pk3VcB5Kk2xdhHerF74zBg==", "0922222222", "Cinema Operations Manager" },
                    { new Guid("a1b2c3d4-e5f6-7a8b-c9d0-e1f2a3b4c5d6"), new DateTime(1995, 12, 12, 0, 0, 0, 0, DateTimeKind.Unspecified), "pFoBRlv4RT1kyqKE1Ch3Hw==", "0944444444", "Main Cashier" },
                    { new Guid("b2c3d4e5-f6a7-8b9c-d0e1-f2a3b4c5d6e7"), new DateTime(1990, 5, 10, 0, 0, 0, 0, DateTimeKind.Unspecified), "pxc5zG8sfEcsJrHg1AjV3w==", "0911111111", "Movie Content Manager" },
                    { new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), new DateTime(1985, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), "NjItl/uAfIOjjzvtWPbnzg==", "0988123456", "System Administrator" },
                    { new Guid("f1a0e9b8-d7c6-5e4f-a3b2-1d0c9b8a7f6e"), new DateTime(1992, 8, 20, 0, 0, 0, 0, DateTimeKind.Unspecified), "cFobMOQzli9Um8tWi/vJZg==", "0933333333", "Technical Facilities Manager" }
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
                name: "IX_cinema_surcharge_infos_entity_createdByUserId",
                table: "cinema_surcharge_infos_entity",
                column: "createdByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_cinema_surcharge_infos_entity_deletedByUserId",
                table: "cinema_surcharge_infos_entity",
                column: "deletedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_cinema_surcharge_infos_entity_movieFormatId_userSegmentId",
                table: "cinema_surcharge_infos_entity",
                columns: new[] { "movieFormatId", "userSegmentId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_cinema_surcharge_infos_entity_updatedByUserId",
                table: "cinema_surcharge_infos_entity",
                column: "updatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_cinema_surcharge_infos_entity_userSegmentId",
                table: "cinema_surcharge_infos_entity",
                column: "userSegmentId");

            migrationBuilder.CreateIndex(
                name: "IX_movie_format_info_entity_createdByUserId",
                table: "movie_format_info_entity",
                column: "createdByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_movie_format_info_entity_deletedByUserId",
                table: "movie_format_info_entity",
                column: "deletedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_movie_format_info_entity_updatedByUserId",
                table: "movie_format_info_entity",
                column: "updatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_movie_schedule_info_entity_auditoriumId_startedTime",
                table: "movie_schedule_info_entity",
                columns: new[] { "auditoriumId", "startedTime" },
                unique: true,
                filter: "[isDeleted] = 0");

            migrationBuilder.CreateIndex(
                name: "IX_movie_schedule_info_entity_createdByUserId",
                table: "movie_schedule_info_entity",
                column: "createdByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_movie_schedule_info_entity_deletedByUserId",
                table: "movie_schedule_info_entity",
                column: "deletedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_movie_schedule_info_entity_movieFormatId",
                table: "movie_schedule_info_entity",
                column: "movieFormatId");

            migrationBuilder.CreateIndex(
                name: "IX_movie_schedule_info_entity_movieId",
                table: "movie_schedule_info_entity",
                column: "movieId");

            migrationBuilder.CreateIndex(
                name: "IX_movie_schedule_info_entity_updatedByUserId",
                table: "movie_schedule_info_entity",
                column: "updatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_movieFormatMovieInfoEntity_FormatId",
                table: "movieFormatMovieInfoEntity",
                column: "FormatId");

            migrationBuilder.CreateIndex(
                name: "IX_movieGenreInfoEntity_movieGenreDescription",
                table: "movieGenreInfoEntity",
                column: "movieGenreDescription",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_movieGenreInfoEntity_movieGenreName",
                table: "movieGenreInfoEntity",
                column: "movieGenreName",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_movieGenreMovieInfoEntity_movieId",
                table: "movieGenreMovieInfoEntity",
                column: "movieId");

            migrationBuilder.CreateIndex(
                name: "IX_movieInfoEntity_createdByUserId",
                table: "movieInfoEntity",
                column: "createdByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_movieInfoEntity_deletedByUserId",
                table: "movieInfoEntity",
                column: "deletedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_movieInfoEntity_movieDescription",
                table: "movieInfoEntity",
                column: "movieDescription",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_movieInfoEntity_movieImageUrl",
                table: "movieInfoEntity",
                column: "movieImageUrl",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_movieInfoEntity_movieName",
                table: "movieInfoEntity",
                column: "movieName",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_movieInfoEntity_movieRequiredAgeId",
                table: "movieInfoEntity",
                column: "movieRequiredAgeId");

            migrationBuilder.CreateIndex(
                name: "IX_movieInfoEntity_updatedByUserId",
                table: "movieInfoEntity",
                column: "updatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_movieRequiredAgeEntity_movieRequiredAgeDescription",
                table: "movieRequiredAgeEntity",
                column: "movieRequiredAgeDescription",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_movieRequiredAgeEntity_movieRequiredAgeSymbol",
                table: "movieRequiredAgeEntity",
                column: "movieRequiredAgeSymbol",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_order_details_info_movieScheduleId",
                table: "order_details_info",
                column: "movieScheduleId");

            migrationBuilder.CreateIndex(
                name: "IX_order_info_entity_userId_orderId",
                table: "order_info_entity",
                columns: new[] { "userId", "orderId" },
                unique: true,
                filter: "[userId] IS NOT NULL");

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
                name: "IX_user_profile_entity_identityCode",
                table: "user_profile_entity",
                column: "identityCode",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_user_profile_entity_phoneNumber",
                table: "user_profile_entity",
                column: "phoneNumber",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_user_role_info_entity_userId",
                table: "user_role_info_entity",
                column: "userId");

            migrationBuilder.CreateIndex(
                name: "IX_user_segments_info_entity_userSegmentDescription",
                table: "user_segments_info_entity",
                column: "userSegmentDescription",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_user_segments_info_entity_userSegmentName",
                table: "user_segments_info_entity",
                column: "userSegmentName",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_voucher_info_entity_roleId",
                table: "voucher_info_entity",
                column: "roleId");

            migrationBuilder.CreateIndex(
                name: "IX_voucher_info_entity_voucherDescription",
                table: "voucher_info_entity",
                column: "voucherDescription",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_voucher_info_entity_voucherName",
                table: "voucher_info_entity",
                column: "voucherName",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "cinema_discount_info_entity");

            migrationBuilder.DropTable(
                name: "cinema_surcharge_infos_entity");

            migrationBuilder.DropTable(
                name: "movieFormatMovieInfoEntity");

            migrationBuilder.DropTable(
                name: "movieGenreMovieInfoEntity");

            migrationBuilder.DropTable(
                name: "order_details_info");

            migrationBuilder.DropTable(
                name: "seats_info_entity");

            migrationBuilder.DropTable(
                name: "user_profile_entity");

            migrationBuilder.DropTable(
                name: "user_role_info_entity");

            migrationBuilder.DropTable(
                name: "voucher_info_entity");

            migrationBuilder.DropTable(
                name: "user_segments_info_entity");

            migrationBuilder.DropTable(
                name: "movieGenreInfoEntity");

            migrationBuilder.DropTable(
                name: "movie_schedule_info_entity");

            migrationBuilder.DropTable(
                name: "order_info_entity");

            migrationBuilder.DropTable(
                name: "role_list_info_entity");

            migrationBuilder.DropTable(
                name: "auditorium_info_entity");

            migrationBuilder.DropTable(
                name: "movieInfoEntity");

            migrationBuilder.DropTable(
                name: "cinema_info_entity");

            migrationBuilder.DropTable(
                name: "movie_format_info_entity");

            migrationBuilder.DropTable(
                name: "movieRequiredAgeEntity");

            migrationBuilder.DropTable(
                name: "user_info_entity");
        }
    }
}
