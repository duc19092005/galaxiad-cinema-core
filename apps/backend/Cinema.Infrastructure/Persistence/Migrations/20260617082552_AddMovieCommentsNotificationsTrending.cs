using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Cinema.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddMovieCommentsNotificationsTrending : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "MovieCommentEntity",
                columns: table => new
                {
                    CommentId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    MovieId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OrderId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    ParentCommentId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    Rating = table.Column<int>(type: "int", nullable: true),
                    Content = table.Column<string>(type: "nvarchar(1000)", nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false),
                    ModerationReason = table.Column<string>(type: "nvarchar(500)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MovieCommentEntity", x => x.CommentId);
                    table.ForeignKey(
                        name: "FK_MovieCommentEntity_MovieCommentEntity_ParentCommentId",
                        column: x => x.ParentCommentId,
                        principalTable: "MovieCommentEntity",
                        principalColumn: "CommentId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_MovieCommentEntity_MovieInfoEntity_MovieId",
                        column: x => x.MovieId,
                        principalTable: "MovieInfoEntity",
                        principalColumn: "MovieId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_MovieCommentEntity_OrderInfoEntity_OrderId",
                        column: x => x.OrderId,
                        principalTable: "OrderInfoEntity",
                        principalColumn: "OrderId",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_MovieCommentEntity_UserInfoEntity_UserId",
                        column: x => x.UserId,
                        principalTable: "UserInfoEntity",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "MovieViewEntity",
                columns: table => new
                {
                    MovieViewId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    MovieId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    ViewedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MovieViewEntity", x => x.MovieViewId);
                    table.ForeignKey(
                        name: "FK_MovieViewEntity_MovieInfoEntity_MovieId",
                        column: x => x.MovieId,
                        principalTable: "MovieInfoEntity",
                        principalColumn: "MovieId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "UserNotificationEntity",
                columns: table => new
                {
                    NotificationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(120)", nullable: false),
                    Message = table.Column<string>(type: "nvarchar(500)", nullable: false),
                    Type = table.Column<string>(type: "varchar(60)", nullable: false),
                    RelatedCommentId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    RelatedMovieId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    IsRead = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserNotificationEntity", x => x.NotificationId);
                    table.ForeignKey(
                        name: "FK_UserNotificationEntity_MovieCommentEntity_RelatedCommentId",
                        column: x => x.RelatedCommentId,
                        principalTable: "MovieCommentEntity",
                        principalColumn: "CommentId",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_UserNotificationEntity_MovieInfoEntity_RelatedMovieId",
                        column: x => x.RelatedMovieId,
                        principalTable: "MovieInfoEntity",
                        principalColumn: "MovieId",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_UserNotificationEntity_UserInfoEntity_UserId",
                        column: x => x.UserId,
                        principalTable: "UserInfoEntity",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_MovieCommentEntity_MovieId_Status_CreatedAt",
                table: "MovieCommentEntity",
                columns: new[] { "MovieId", "Status", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_MovieCommentEntity_OrderId",
                table: "MovieCommentEntity",
                column: "OrderId");

            migrationBuilder.CreateIndex(
                name: "IX_MovieCommentEntity_ParentCommentId",
                table: "MovieCommentEntity",
                column: "ParentCommentId");

            migrationBuilder.CreateIndex(
                name: "IX_MovieCommentEntity_UserId_MovieId_ParentCommentId",
                table: "MovieCommentEntity",
                columns: new[] { "UserId", "MovieId", "ParentCommentId" });

            migrationBuilder.CreateIndex(
                name: "IX_MovieViewEntity_MovieId_ViewedAt",
                table: "MovieViewEntity",
                columns: new[] { "MovieId", "ViewedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_UserNotificationEntity_RelatedCommentId",
                table: "UserNotificationEntity",
                column: "RelatedCommentId");

            migrationBuilder.CreateIndex(
                name: "IX_UserNotificationEntity_RelatedMovieId",
                table: "UserNotificationEntity",
                column: "RelatedMovieId");

            migrationBuilder.CreateIndex(
                name: "IX_UserNotificationEntity_UserId_IsRead_CreatedAt",
                table: "UserNotificationEntity",
                columns: new[] { "UserId", "IsRead", "CreatedAt" });

        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "MovieViewEntity");

            migrationBuilder.DropTable(
                name: "UserNotificationEntity");

            migrationBuilder.DropTable(
                name: "MovieCommentEntity");
        }
    }
}
