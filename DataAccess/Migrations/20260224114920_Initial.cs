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
                name: "MovieGenreInfoEntity",
                columns: table => new
                {
                    MovieGenreId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    MovieGenreName = table.Column<string>(type: "nvarchar(40)", nullable: false),
                    MovieGenreDescription = table.Column<string>(type: "nvarchar(200)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MovieGenreInfoEntity", x => x.MovieGenreId);
                });

            migrationBuilder.CreateTable(
                name: "MovieRequiredAgeEntity",
                columns: table => new
                {
                    MovieRequiredAgeId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    MovieRequiredAgeSymbol = table.Column<string>(type: "nchar(10)", nullable: false),
                    MovieRequiredAgeDescription = table.Column<string>(type: "nvarchar(2000)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MovieRequiredAgeEntity", x => x.MovieRequiredAgeId);
                });

            migrationBuilder.CreateTable(
                name: "RoleListInfoEntity",
                columns: table => new
                {
                    RoleId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RoleName = table.Column<string>(type: "nvarchar(50)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RoleListInfoEntity", x => x.RoleId);
                });

            migrationBuilder.CreateTable(
                name: "UserInfoEntity",
                columns: table => new
                {
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserEmail = table.Column<string>(type: "varchar(100)", nullable: false),
                    Password = table.Column<string>(type: "varchar(100)", nullable: false),
                    RefreshToken = table.Column<string>(type: "varchar(100)", nullable: true),
                    SubId = table.Column<string>(type: "varchar(50)", nullable: true),
                    RegisterMethod = table.Column<int>(type: "int", nullable: false),
                    AccountStatus = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserInfoEntity", x => x.UserId);
                });

            migrationBuilder.CreateTable(
                name: "UserSegmentsInfoEntity",
                columns: table => new
                {
                    UserSegmentId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserSegmentName = table.Column<string>(type: "nvarchar(50)", nullable: false),
                    UserSegmentDescription = table.Column<string>(type: "nvarchar(2000)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserSegmentsInfoEntity", x => x.UserSegmentId);
                });

            migrationBuilder.CreateTable(
                name: "VoucherInfoEntity",
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
                    table.PrimaryKey("PK_VoucherInfoEntity", x => x.voucherId);
                    table.ForeignKey(
                        name: "FK_VoucherInfoEntity_RoleListInfoEntity_roleId",
                        column: x => x.roleId,
                        principalTable: "RoleListInfoEntity",
                        principalColumn: "RoleId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CinemaInfoEntity",
                columns: table => new
                {
                    CinemaId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CinemaLocation = table.Column<string>(type: "nvarchar(100)", nullable: false),
                    CinemaName = table.Column<string>(type: "nvarchar(1000)", nullable: false),
                    CinemaHotLineNumber = table.Column<string>(type: "char(10)", nullable: false),
                    CinemaDescription = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ManagerId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ActiveAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UpdatedByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    DeletedByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CinemaInfoEntity", x => x.CinemaId);
                    table.ForeignKey(
                        name: "FK_CinemaInfoEntity_UserInfoEntity_CreatedByUserId",
                        column: x => x.CreatedByUserId,
                        principalTable: "UserInfoEntity",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_CinemaInfoEntity_UserInfoEntity_DeletedByUserId",
                        column: x => x.DeletedByUserId,
                        principalTable: "UserInfoEntity",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_CinemaInfoEntity_UserInfoEntity_ManagerId",
                        column: x => x.ManagerId,
                        principalTable: "UserInfoEntity",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_CinemaInfoEntity_UserInfoEntity_UpdatedByUserId",
                        column: x => x.UpdatedByUserId,
                        principalTable: "UserInfoEntity",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "MovieFormatInfoEntity",
                columns: table => new
                {
                    MovieFormatId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    MovieFormatName = table.Column<string>(type: "nvarchar(50)", nullable: false),
                    MovieFormatDescription = table.Column<string>(type: "nvarchar(2000)", nullable: false),
                    MovieFormatPrice = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ActiveAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UpdatedByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    DeletedByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MovieFormatInfoEntity", x => x.MovieFormatId);
                    table.ForeignKey(
                        name: "FK_MovieFormatInfoEntity_UserInfoEntity_CreatedByUserId",
                        column: x => x.CreatedByUserId,
                        principalTable: "UserInfoEntity",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_MovieFormatInfoEntity_UserInfoEntity_DeletedByUserId",
                        column: x => x.DeletedByUserId,
                        principalTable: "UserInfoEntity",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_MovieFormatInfoEntity_UserInfoEntity_UpdatedByUserId",
                        column: x => x.UpdatedByUserId,
                        principalTable: "UserInfoEntity",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "MovieInfoEntity",
                columns: table => new
                {
                    MovieId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    MovieRequiredAgeId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    MovieName = table.Column<string>(type: "nvarchar(100)", nullable: false),
                    MovieDescription = table.Column<string>(type: "varchar(2048)", nullable: false),
                    MovieImageUrl = table.Column<string>(type: "varchar(2048)", nullable: false),
                    EndedDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ManagerId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ActiveAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UpdatedByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    DeletedByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MovieInfoEntity", x => x.MovieId);
                    table.ForeignKey(
                        name: "FK_MovieInfoEntity_MovieRequiredAgeEntity_MovieRequiredAgeId",
                        column: x => x.MovieRequiredAgeId,
                        principalTable: "MovieRequiredAgeEntity",
                        principalColumn: "MovieRequiredAgeId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MovieInfoEntity_UserInfoEntity_CreatedByUserId",
                        column: x => x.CreatedByUserId,
                        principalTable: "UserInfoEntity",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_MovieInfoEntity_UserInfoEntity_DeletedByUserId",
                        column: x => x.DeletedByUserId,
                        principalTable: "UserInfoEntity",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_MovieInfoEntity_UserInfoEntity_ManagerId",
                        column: x => x.ManagerId,
                        principalTable: "UserInfoEntity",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_MovieInfoEntity_UserInfoEntity_UpdatedByUserId",
                        column: x => x.UpdatedByUserId,
                        principalTable: "UserInfoEntity",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "OrderInfoEntity",
                columns: table => new
                {
                    OrderId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    StaffId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    OrderStatus = table.Column<int>(type: "int", nullable: false),
                    PaymentMethod = table.Column<int>(type: "int", nullable: false),
                    TotalPrice = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    OrderDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    TotalQuantity = table.Column<int>(type: "int", nullable: false),
                    CustomerName = table.Column<string>(type: "nvarchar(50)", nullable: true),
                    CustomerAddress = table.Column<string>(type: "nvarchar(200)", nullable: true),
                    CustomerEmail = table.Column<string>(type: "varchar(40)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OrderInfoEntity", x => x.OrderId);
                    table.ForeignKey(
                        name: "FK_OrderInfoEntity_UserInfoEntity_StaffId",
                        column: x => x.StaffId,
                        principalTable: "UserInfoEntity",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "UserProfileEntity",
                columns: table => new
                {
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserName = table.Column<string>(type: "nvarchar(100)", nullable: false),
                    IdentityCode = table.Column<string>(type: "varchar(200)", nullable: false),
                    DateOfBirth = table.Column<DateTime>(type: "datetime2", nullable: false),
                    PhoneNumber = table.Column<string>(type: "char(10)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserProfileEntity", x => x.UserId);
                    table.ForeignKey(
                        name: "FK_UserProfileEntity_UserInfoEntity_UserId",
                        column: x => x.UserId,
                        principalTable: "UserInfoEntity",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "UserRoleInfoEntity",
                columns: table => new
                {
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RoleId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserRoleInfoEntity", x => new { x.RoleId, x.UserId });
                    table.ForeignKey(
                        name: "FK_UserRoleInfoEntity_RoleListInfoEntity_RoleId",
                        column: x => x.RoleId,
                        principalTable: "RoleListInfoEntity",
                        principalColumn: "RoleId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_UserRoleInfoEntity_UserInfoEntity_UserId",
                        column: x => x.UserId,
                        principalTable: "UserInfoEntity",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AuditoriumInfoEntities",
                columns: table => new
                {
                    AuditoriumId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    AuditoriumNumber = table.Column<string>(type: "varchar(100)", nullable: false),
                    MovieFormatId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CinemaId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ActiveAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UpdatedByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    DeletedByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AuditoriumInfoEntities", x => x.AuditoriumId);
                    table.ForeignKey(
                        name: "FK_AuditoriumInfoEntities_CinemaInfoEntity_CinemaId",
                        column: x => x.CinemaId,
                        principalTable: "CinemaInfoEntity",
                        principalColumn: "CinemaId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_AuditoriumInfoEntities_MovieFormatInfoEntity_MovieFormatId",
                        column: x => x.MovieFormatId,
                        principalTable: "MovieFormatInfoEntity",
                        principalColumn: "MovieFormatId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AuditoriumInfoEntities_UserInfoEntity_CreatedByUserId",
                        column: x => x.CreatedByUserId,
                        principalTable: "UserInfoEntity",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_AuditoriumInfoEntities_UserInfoEntity_DeletedByUserId",
                        column: x => x.DeletedByUserId,
                        principalTable: "UserInfoEntity",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_AuditoriumInfoEntities_UserInfoEntity_UpdatedByUserId",
                        column: x => x.UpdatedByUserId,
                        principalTable: "UserInfoEntity",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "CinemaDiscountInfoEntity",
                columns: table => new
                {
                    CinemaId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    MovieFormatId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DiscountPercent = table.Column<decimal>(type: "decimal(5,2)", nullable: false),
                    DiscountNote = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ActiveAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UpdatedByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    DeletedByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CinemaDiscountInfoEntity", x => new { x.CinemaId, x.MovieFormatId });
                    table.ForeignKey(
                        name: "FK_CinemaDiscountInfoEntity_CinemaInfoEntity_CinemaId",
                        column: x => x.CinemaId,
                        principalTable: "CinemaInfoEntity",
                        principalColumn: "CinemaId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_CinemaDiscountInfoEntity_MovieFormatInfoEntity_MovieFormatId",
                        column: x => x.MovieFormatId,
                        principalTable: "MovieFormatInfoEntity",
                        principalColumn: "MovieFormatId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_CinemaDiscountInfoEntity_UserInfoEntity_CreatedByUserId",
                        column: x => x.CreatedByUserId,
                        principalTable: "UserInfoEntity",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_CinemaDiscountInfoEntity_UserInfoEntity_DeletedByUserId",
                        column: x => x.DeletedByUserId,
                        principalTable: "UserInfoEntity",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_CinemaDiscountInfoEntity_UserInfoEntity_UpdatedByUserId",
                        column: x => x.UpdatedByUserId,
                        principalTable: "UserInfoEntity",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "CinemaSurchargeInfosEntity",
                columns: table => new
                {
                    CinemaId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    MovieFormatId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserSegmentId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SurchangePercent = table.Column<decimal>(type: "decimal(5,2)", nullable: false),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ActiveAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UpdatedByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    DeletedByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CinemaSurchargeInfosEntity", x => new { x.CinemaId, x.MovieFormatId });
                    table.ForeignKey(
                        name: "FK_CinemaSurchargeInfosEntity_CinemaInfoEntity_CinemaId",
                        column: x => x.CinemaId,
                        principalTable: "CinemaInfoEntity",
                        principalColumn: "CinemaId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CinemaSurchargeInfosEntity_MovieFormatInfoEntity_MovieFormatId",
                        column: x => x.MovieFormatId,
                        principalTable: "MovieFormatInfoEntity",
                        principalColumn: "MovieFormatId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CinemaSurchargeInfosEntity_UserInfoEntity_CreatedByUserId",
                        column: x => x.CreatedByUserId,
                        principalTable: "UserInfoEntity",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_CinemaSurchargeInfosEntity_UserInfoEntity_DeletedByUserId",
                        column: x => x.DeletedByUserId,
                        principalTable: "UserInfoEntity",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_CinemaSurchargeInfosEntity_UserInfoEntity_UpdatedByUserId",
                        column: x => x.UpdatedByUserId,
                        principalTable: "UserInfoEntity",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_CinemaSurchargeInfosEntity_UserSegmentsInfoEntity_UserSegmentId",
                        column: x => x.UserSegmentId,
                        principalTable: "UserSegmentsInfoEntity",
                        principalColumn: "UserSegmentId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MovieFormatMovieInfoEntity",
                columns: table => new
                {
                    MovieId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    FormatId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MovieFormatMovieInfoEntity", x => new { x.MovieId, x.FormatId });
                    table.ForeignKey(
                        name: "FK_MovieFormatMovieInfoEntity_MovieFormatInfoEntity_FormatId",
                        column: x => x.FormatId,
                        principalTable: "MovieFormatInfoEntity",
                        principalColumn: "MovieFormatId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_MovieFormatMovieInfoEntity_MovieInfoEntity_MovieId",
                        column: x => x.MovieId,
                        principalTable: "MovieInfoEntity",
                        principalColumn: "MovieId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "MovieGenreMovieInfoEntity",
                columns: table => new
                {
                    MovieId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    MovieGenreId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MovieGenreMovieInfoEntity", x => new { x.MovieGenreId, x.MovieId });
                    table.ForeignKey(
                        name: "FK_MovieGenreMovieInfoEntity_MovieGenreInfoEntity_MovieGenreId",
                        column: x => x.MovieGenreId,
                        principalTable: "MovieGenreInfoEntity",
                        principalColumn: "MovieGenreId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MovieGenreMovieInfoEntity_MovieInfoEntity_MovieId",
                        column: x => x.MovieId,
                        principalTable: "MovieInfoEntity",
                        principalColumn: "MovieId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MovieScheduleInfoEntity",
                columns: table => new
                {
                    MovieScheduleInfoId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    MovieId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    AuditoriumId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    MovieFormatId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    StartedTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    EndedTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ActiveAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UpdatedByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    DeletedByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MovieScheduleInfoEntity", x => x.MovieScheduleInfoId);
                    table.ForeignKey(
                        name: "FK_MovieScheduleInfoEntity_AuditoriumInfoEntities_AuditoriumId",
                        column: x => x.AuditoriumId,
                        principalTable: "AuditoriumInfoEntities",
                        principalColumn: "AuditoriumId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_MovieScheduleInfoEntity_MovieFormatInfoEntity_MovieFormatId",
                        column: x => x.MovieFormatId,
                        principalTable: "MovieFormatInfoEntity",
                        principalColumn: "MovieFormatId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MovieScheduleInfoEntity_MovieInfoEntity_MovieId",
                        column: x => x.MovieId,
                        principalTable: "MovieInfoEntity",
                        principalColumn: "MovieId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_MovieScheduleInfoEntity_UserInfoEntity_CreatedByUserId",
                        column: x => x.CreatedByUserId,
                        principalTable: "UserInfoEntity",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_MovieScheduleInfoEntity_UserInfoEntity_DeletedByUserId",
                        column: x => x.DeletedByUserId,
                        principalTable: "UserInfoEntity",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_MovieScheduleInfoEntity_UserInfoEntity_UpdatedByUserId",
                        column: x => x.UpdatedByUserId,
                        principalTable: "UserInfoEntity",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "SeatsInfoEntity",
                columns: table => new
                {
                    SeatId = table.Column<string>(type: "varchar(100)", nullable: false),
                    SeatNumber = table.Column<string>(type: "nvarchar(50)", nullable: false),
                    CoordX = table.Column<double>(type: "float", nullable: false),
                    CoordY = table.Column<double>(type: "float", nullable: false),
                    ColIndex = table.Column<int>(type: "int", nullable: false),
                    RowIndex = table.Column<int>(type: "int", nullable: false),
                    AuditoriumId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SeatsInfoEntity", x => x.SeatId);
                    table.ForeignKey(
                        name: "FK_SeatsInfoEntity_AuditoriumInfoEntities_AuditoriumId",
                        column: x => x.AuditoriumId,
                        principalTable: "AuditoriumInfoEntities",
                        principalColumn: "AuditoriumId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "OrderDetailsInfo",
                columns: table => new
                {
                    OrderId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    MovieScheduleId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SeatId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PriceEach = table.Column<decimal>(type: "decimal(18,2)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OrderDetailsInfo", x => new { x.OrderId, x.MovieScheduleId });
                    table.ForeignKey(
                        name: "FK_OrderDetailsInfo_MovieScheduleInfoEntity_MovieScheduleId",
                        column: x => x.MovieScheduleId,
                        principalTable: "MovieScheduleInfoEntity",
                        principalColumn: "MovieScheduleInfoId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_OrderDetailsInfo_OrderInfoEntity_OrderId",
                        column: x => x.OrderId,
                        principalTable: "OrderInfoEntity",
                        principalColumn: "OrderId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.InsertData(
                table: "MovieGenreInfoEntity",
                columns: new[] { "MovieGenreId", "MovieGenreDescription", "MovieGenreName" },
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
                table: "MovieRequiredAgeEntity",
                columns: new[] { "MovieRequiredAgeId", "MovieRequiredAgeDescription", "MovieRequiredAgeSymbol" },
                values: new object[,]
                {
                    { new Guid("2b3c4d5e-6f7a-4b8c-9d0e-1f2a3b4c5d6e"), "18+: Adult only. This film is restricted to audiences aged 18 and above.", "T18" },
                    { new Guid("3d8e9a2b-1f0c-4b5a-9d6e-7f2a1b4c3d0e"), "Parental Guidance: Films suitable for children under 13 with parental supervision.", "K" },
                    { new Guid("5c1b2d4e-8a9b-4c0d-7f6e-1d2c3b4a5e0f"), "13+: This film is restricted to audiences aged 13 and above.", "T13" },
                    { new Guid("7a2f4b1d-9c3e-4d5a-8b2c-6f1e0a9d4b5c"), "General Admission: Suitable for audiences of all ages.", "P" },
                    { new Guid("9f0e1d2c-3b4a-4d5e-6f7a-8b9c0d1e2f3a"), "16+: This film is restricted to audiences aged 16 and above.", "T16" }
                });

            migrationBuilder.InsertData(
                table: "RoleListInfoEntity",
                columns: new[] { "RoleId", "RoleName" },
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
                table: "UserInfoEntity",
                columns: new[] { "UserId", "AccountStatus", "Password", "RefreshToken", "RegisterMethod", "SubId", "UserEmail" },
                values: new object[,]
                {
                    { new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), 0, "$2a$12$Lcz0doBD1.jofXcNDWF8x.4TSmUsyJKR/pbdP.fIh4Fc9yDV5X39m", null, 0, null, "theater@cinema.com" },
                    { new Guid("7e272a3a-6288-4589-9d0e-f4203a5f3fe0"), 0, "$2a$12$HSYdRT84AjbFawIfnmluJ.AMrBqmqBtKyyn6kNZFTNW7olAMMgXPy", null, 0, null, "testAdminFacilitiesManager@gmail.com" },
                    { new Guid("a1b2c3d4-e5f6-7a8b-c9d0-e1f2a3b4c5d6"), 0, "$2a$12$HSYdRT84AjbFawIfnmluJ.AMrBqmqBtKyyn6kNZFTNW7olAMMgXPy", null, 0, null, "cashier@cinema.com" },
                    { new Guid("b2c3d4e5-f6a7-8b9c-d0e1-f2a3b4c5d6e7"), 0, "$2a$12$FhmQsQjdtTZIHEzJIpAjZumRH0WvleZ2xidk22wSd841kxaQNE7ke", null, 0, null, "moviemanager@cinema.com" },
                    { new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), 0, "$2a$12$ufIKVZZwGlxHfQ0WSZQRmeDDeCuneaflIghQhHC6RupR0LVYLU5bi", null, 0, null, "admin@cinema.com" },
                    { new Guid("f1a0e9b8-d7c6-5e4f-a3b2-1d0c9b8a7f6e"), 0, "$2a$12$v2nSRwPmr62wHUakVl6TCeZLPGLEaVJBqotgF3qXVff0KnlWNWHE2", null, 0, null, "facilities@cinema.com" }
                });

            migrationBuilder.InsertData(
                table: "UserSegmentsInfoEntity",
                columns: new[] { "UserSegmentId", "UserSegmentDescription", "UserSegmentName" },
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
                table: "MovieFormatInfoEntity",
                columns: new[] { "MovieFormatId", "ActiveAt", "CreatedAt", "CreatedByUserId", "DeletedAt", "DeletedByUserId", "IsActive", "IsDeleted", "MovieFormatDescription", "MovieFormatName", "MovieFormatPrice", "UpdatedAt", "UpdatedByUserId" },
                values: new object[,]
                {
                    { new Guid("1c2d3e4f-5a6b-4c7d-8e9f-0a1b2c3d4e5f"), new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, null, true, false, "Luxury bed-seating auditorium designed for ultimate comfort and couples.", "L'Amour", 600000m, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null },
                    { new Guid("3fbc4a32-15f5-47e0-b98a-784f1b8a9612"), new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, null, true, false, "Standard digital 2D format with crystal clear image quality.", "2D", 80000m, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null },
                    { new Guid("5d4c3b2a-1f0e-4d9c-8b7a-6e5d4c3b2a1f"), new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, null, true, false, "Multi-sensory experience featuring motion seats, wind, water, and scents.", "4DX", 180000m, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null },
                    { new Guid("7a5e82b1-c4d3-4a92-9e11-3f4b52c1a8d9"), new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, null, true, false, "Immersive three-dimensional visual experience with specialized glasses.", "3D", 110000m, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null },
                    { new Guid("9f8e7d6c-5b4a-4e3d-2c1b-0a9f8e7d6c5b"), new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, null, true, false, "Premium luxury seating with in-theater dining and personalized service.", "Gold Class", 300000m, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null },
                    { new Guid("a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d"), new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, null, true, false, "A revolutionary 270-degree panoramic cinematic experience.", "ScreenX", 160000m, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null },
                    { new Guid("d29b0f1c-8e2a-4c5b-bc3d-1a2f3e4d5c6b"), new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, null, true, false, "Giant screen format with unparalleled brightness and ultra-high resolution.", "IMAX", 250000m, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null },
                    { new Guid("f9e1d2c3-b4a5-4e6f-8d7c-9b0a1f2e3d4c"), new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, null, true, false, "State-of-the-art surround sound technology for a lifelike audio experience.", "Dolby Atmos", 130000m, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null }
                });

            migrationBuilder.InsertData(
                table: "UserProfileEntity",
                columns: new[] { "UserId", "DateOfBirth", "IdentityCode", "PhoneNumber", "UserName" },
                values: new object[,]
                {
                    { new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5"), new DateTime(1988, 3, 15, 0, 0, 0, 0, DateTimeKind.Unspecified), "Pk3VcB5Kk2xdhHerF74zBg==", "0922222222", "Cinema Operations Manager" },
                    { new Guid("7e272a3a-6288-4589-9d0e-f4203a5f3fe0"), new DateTime(1986, 3, 15, 0, 0, 0, 0, DateTimeKind.Unspecified), "fByrPlhQbK2U5YNuCLR5rA==", "0955555555", "Test Multi Role Account" },
                    { new Guid("a1b2c3d4-e5f6-7a8b-c9d0-e1f2a3b4c5d6"), new DateTime(1995, 12, 12, 0, 0, 0, 0, DateTimeKind.Unspecified), "pFoBRlv4RT1kyqKE1Ch3Hw==", "0944444444", "Main Cashier" },
                    { new Guid("b2c3d4e5-f6a7-8b9c-d0e1-f2a3b4c5d6e7"), new DateTime(1990, 5, 10, 0, 0, 0, 0, DateTimeKind.Unspecified), "pxc5zG8sfEcsJrHg1AjV3w==", "0911111111", "Movie Content Manager" },
                    { new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), new DateTime(1985, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), "NjItl/uAfIOjjzvtWPbnzg==", "0988123456", "System Administrator" },
                    { new Guid("f1a0e9b8-d7c6-5e4f-a3b2-1d0c9b8a7f6e"), new DateTime(1992, 8, 20, 0, 0, 0, 0, DateTimeKind.Unspecified), "cFobMOQzli9Um8tWi/vJZg==", "0933333333", "Technical Facilities Manager" }
                });

            migrationBuilder.InsertData(
                table: "UserRoleInfoEntity",
                columns: new[] { "RoleId", "UserId" },
                values: new object[,]
                {
                    { new Guid("1a8f7b9c-d4e5-4f6a-b7c8-9d0e1f2a3b4c"), new Guid("a1b2c3d4-e5f6-7a8b-c9d0-e1f2a3b4c5d6") },
                    { new Guid("3c0d9e1f-a6b7-c8d9-e0f1-2a3b4c5d6e7f"), new Guid("7e272a3a-6288-4589-9d0e-f4203a5f3fe0") },
                    { new Guid("3c0d9e1f-a6b7-c8d9-e0f1-2a3b4c5d6e7f"), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c") },
                    { new Guid("4d1e0f2a-b7c8-d9e0-f1a2-3b4c5d6e7f8a"), new Guid("b2c3d4e5-f6a7-8b9c-d0e1-f2a3b4c5d6e7") },
                    { new Guid("5e2f1a3b-c8d9-e0f1-a2b3-4c5d6e7f8a9b"), new Guid("7b5d2c1e-9f8a-3e7b-c1d2-a0e9f8c7b6a5") },
                    { new Guid("5e2f1a3b-c8d9-e0f1-a2b3-4c5d6e7f8a9b"), new Guid("7e272a3a-6288-4589-9d0e-f4203a5f3fe0") },
                    { new Guid("6f3a2b4c-d9e0-f1a2-b3c4-d5e6f7a8b9c0"), new Guid("f1a0e9b8-d7c6-5e4f-a3b2-1d0c9b8a7f6e") }
                });

            migrationBuilder.CreateIndex(
                name: "IX_AuditoriumInfoEntities_AuditoriumNumber_CinemaId",
                table: "AuditoriumInfoEntities",
                columns: new[] { "AuditoriumNumber", "CinemaId" },
                unique: true,
                filter: "[isDeleted] = CAST(0 AS BIT)");

            migrationBuilder.CreateIndex(
                name: "IX_AuditoriumInfoEntities_CinemaId",
                table: "AuditoriumInfoEntities",
                column: "CinemaId");

            migrationBuilder.CreateIndex(
                name: "IX_AuditoriumInfoEntities_CreatedByUserId",
                table: "AuditoriumInfoEntities",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_AuditoriumInfoEntities_DeletedByUserId",
                table: "AuditoriumInfoEntities",
                column: "DeletedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_AuditoriumInfoEntities_MovieFormatId",
                table: "AuditoriumInfoEntities",
                column: "MovieFormatId");

            migrationBuilder.CreateIndex(
                name: "IX_AuditoriumInfoEntities_UpdatedByUserId",
                table: "AuditoriumInfoEntities",
                column: "UpdatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_CinemaDiscountInfoEntity_CreatedByUserId",
                table: "CinemaDiscountInfoEntity",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_CinemaDiscountInfoEntity_DeletedByUserId",
                table: "CinemaDiscountInfoEntity",
                column: "DeletedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_CinemaDiscountInfoEntity_MovieFormatId",
                table: "CinemaDiscountInfoEntity",
                column: "MovieFormatId");

            migrationBuilder.CreateIndex(
                name: "IX_CinemaDiscountInfoEntity_UpdatedByUserId",
                table: "CinemaDiscountInfoEntity",
                column: "UpdatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_CinemaInfoEntity_CinemaHotLineNumber",
                table: "CinemaInfoEntity",
                column: "CinemaHotLineNumber",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CinemaInfoEntity_CinemaName",
                table: "CinemaInfoEntity",
                column: "CinemaName",
                unique: true,
                filter: "[isDeleted] = CAST(0 AS BIT)");

            migrationBuilder.CreateIndex(
                name: "IX_CinemaInfoEntity_CreatedByUserId",
                table: "CinemaInfoEntity",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_CinemaInfoEntity_DeletedByUserId",
                table: "CinemaInfoEntity",
                column: "DeletedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_CinemaInfoEntity_ManagerId",
                table: "CinemaInfoEntity",
                column: "ManagerId");

            migrationBuilder.CreateIndex(
                name: "IX_CinemaInfoEntity_UpdatedByUserId",
                table: "CinemaInfoEntity",
                column: "UpdatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_CinemaSurchargeInfosEntity_CreatedByUserId",
                table: "CinemaSurchargeInfosEntity",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_CinemaSurchargeInfosEntity_DeletedByUserId",
                table: "CinemaSurchargeInfosEntity",
                column: "DeletedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_CinemaSurchargeInfosEntity_MovieFormatId_UserSegmentId",
                table: "CinemaSurchargeInfosEntity",
                columns: new[] { "MovieFormatId", "UserSegmentId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CinemaSurchargeInfosEntity_UpdatedByUserId",
                table: "CinemaSurchargeInfosEntity",
                column: "UpdatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_CinemaSurchargeInfosEntity_UserSegmentId",
                table: "CinemaSurchargeInfosEntity",
                column: "UserSegmentId");

            migrationBuilder.CreateIndex(
                name: "IX_MovieFormatInfoEntity_CreatedByUserId",
                table: "MovieFormatInfoEntity",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_MovieFormatInfoEntity_DeletedByUserId",
                table: "MovieFormatInfoEntity",
                column: "DeletedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_MovieFormatInfoEntity_UpdatedByUserId",
                table: "MovieFormatInfoEntity",
                column: "UpdatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_MovieFormatMovieInfoEntity_FormatId",
                table: "MovieFormatMovieInfoEntity",
                column: "FormatId");

            migrationBuilder.CreateIndex(
                name: "IX_MovieGenreInfoEntity_MovieGenreDescription",
                table: "MovieGenreInfoEntity",
                column: "MovieGenreDescription",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MovieGenreInfoEntity_MovieGenreName",
                table: "MovieGenreInfoEntity",
                column: "MovieGenreName",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MovieGenreMovieInfoEntity_MovieId",
                table: "MovieGenreMovieInfoEntity",
                column: "MovieId");

            migrationBuilder.CreateIndex(
                name: "IX_MovieInfoEntity_CreatedByUserId",
                table: "MovieInfoEntity",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_MovieInfoEntity_DeletedByUserId",
                table: "MovieInfoEntity",
                column: "DeletedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_MovieInfoEntity_ManagerId",
                table: "MovieInfoEntity",
                column: "ManagerId");

            migrationBuilder.CreateIndex(
                name: "IX_MovieInfoEntity_MovieDescription",
                table: "MovieInfoEntity",
                column: "MovieDescription",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MovieInfoEntity_MovieImageUrl",
                table: "MovieInfoEntity",
                column: "MovieImageUrl",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MovieInfoEntity_MovieName",
                table: "MovieInfoEntity",
                column: "MovieName",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MovieInfoEntity_MovieRequiredAgeId",
                table: "MovieInfoEntity",
                column: "MovieRequiredAgeId");

            migrationBuilder.CreateIndex(
                name: "IX_MovieInfoEntity_UpdatedByUserId",
                table: "MovieInfoEntity",
                column: "UpdatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_MovieRequiredAgeEntity_MovieRequiredAgeDescription",
                table: "MovieRequiredAgeEntity",
                column: "MovieRequiredAgeDescription",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MovieRequiredAgeEntity_MovieRequiredAgeSymbol",
                table: "MovieRequiredAgeEntity",
                column: "MovieRequiredAgeSymbol",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MovieScheduleInfoEntity_AuditoriumId_StartedTime",
                table: "MovieScheduleInfoEntity",
                columns: new[] { "AuditoriumId", "StartedTime" },
                unique: true,
                filter: "[isDeleted] = 0");

            migrationBuilder.CreateIndex(
                name: "IX_MovieScheduleInfoEntity_CreatedByUserId",
                table: "MovieScheduleInfoEntity",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_MovieScheduleInfoEntity_DeletedByUserId",
                table: "MovieScheduleInfoEntity",
                column: "DeletedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_MovieScheduleInfoEntity_MovieFormatId",
                table: "MovieScheduleInfoEntity",
                column: "MovieFormatId");

            migrationBuilder.CreateIndex(
                name: "IX_MovieScheduleInfoEntity_MovieId",
                table: "MovieScheduleInfoEntity",
                column: "MovieId");

            migrationBuilder.CreateIndex(
                name: "IX_MovieScheduleInfoEntity_UpdatedByUserId",
                table: "MovieScheduleInfoEntity",
                column: "UpdatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_OrderDetailsInfo_MovieScheduleId",
                table: "OrderDetailsInfo",
                column: "MovieScheduleId");

            migrationBuilder.CreateIndex(
                name: "IX_OrderInfoEntity_StaffId",
                table: "OrderInfoEntity",
                column: "StaffId");

            migrationBuilder.CreateIndex(
                name: "IX_RoleListInfoEntity_RoleName",
                table: "RoleListInfoEntity",
                column: "RoleName",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SeatsInfoEntity_AuditoriumId",
                table: "SeatsInfoEntity",
                column: "AuditoriumId");

            migrationBuilder.CreateIndex(
                name: "IX_UserInfoEntity_RefreshToken",
                table: "UserInfoEntity",
                column: "RefreshToken",
                unique: true,
                filter: "[RefreshToken] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_UserInfoEntity_UserEmail",
                table: "UserInfoEntity",
                column: "UserEmail",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_UserProfileEntity_IdentityCode",
                table: "UserProfileEntity",
                column: "IdentityCode",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_UserProfileEntity_PhoneNumber",
                table: "UserProfileEntity",
                column: "PhoneNumber",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_UserRoleInfoEntity_UserId",
                table: "UserRoleInfoEntity",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_UserSegmentsInfoEntity_UserSegmentDescription",
                table: "UserSegmentsInfoEntity",
                column: "UserSegmentDescription",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_UserSegmentsInfoEntity_UserSegmentName",
                table: "UserSegmentsInfoEntity",
                column: "UserSegmentName",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_VoucherInfoEntity_roleId",
                table: "VoucherInfoEntity",
                column: "roleId");

            migrationBuilder.CreateIndex(
                name: "IX_VoucherInfoEntity_voucherDescription",
                table: "VoucherInfoEntity",
                column: "voucherDescription",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_VoucherInfoEntity_voucherName",
                table: "VoucherInfoEntity",
                column: "voucherName",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CinemaDiscountInfoEntity");

            migrationBuilder.DropTable(
                name: "CinemaSurchargeInfosEntity");

            migrationBuilder.DropTable(
                name: "MovieFormatMovieInfoEntity");

            migrationBuilder.DropTable(
                name: "MovieGenreMovieInfoEntity");

            migrationBuilder.DropTable(
                name: "OrderDetailsInfo");

            migrationBuilder.DropTable(
                name: "SeatsInfoEntity");

            migrationBuilder.DropTable(
                name: "UserProfileEntity");

            migrationBuilder.DropTable(
                name: "UserRoleInfoEntity");

            migrationBuilder.DropTable(
                name: "VoucherInfoEntity");

            migrationBuilder.DropTable(
                name: "UserSegmentsInfoEntity");

            migrationBuilder.DropTable(
                name: "MovieGenreInfoEntity");

            migrationBuilder.DropTable(
                name: "MovieScheduleInfoEntity");

            migrationBuilder.DropTable(
                name: "OrderInfoEntity");

            migrationBuilder.DropTable(
                name: "RoleListInfoEntity");

            migrationBuilder.DropTable(
                name: "AuditoriumInfoEntities");

            migrationBuilder.DropTable(
                name: "MovieInfoEntity");

            migrationBuilder.DropTable(
                name: "CinemaInfoEntity");

            migrationBuilder.DropTable(
                name: "MovieFormatInfoEntity");

            migrationBuilder.DropTable(
                name: "MovieRequiredAgeEntity");

            migrationBuilder.DropTable(
                name: "UserInfoEntity");
        }
    }
}
