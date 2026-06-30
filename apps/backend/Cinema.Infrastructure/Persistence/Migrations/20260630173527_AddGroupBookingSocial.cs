using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Cinema.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddGroupBookingSocial : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "GroupBookingSessionEntity",
                columns: table => new
                {
                    GroupSessionId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    GroupCode = table.Column<string>(type: "varchar(12)", nullable: false),
                    CreatedByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    MovieScheduleId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    GroupName = table.Column<string>(type: "nvarchar(200)", nullable: true),
                    Status = table.Column<int>(type: "int", nullable: false),
                    MaxMembers = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    PaymentDeadlineAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    TotalGroupAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    CollectedAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    VoteMovieScheduleId = table.Column<int>(type: "int", nullable: false),
                    VotingOptionsJson = table.Column<string>(type: "nvarchar(500)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GroupBookingSessionEntity", x => x.GroupSessionId);
                    table.ForeignKey(
                        name: "FK_GroupBookingSessionEntity_MovieScheduleInfoEntity_MovieScheduleId",
                        column: x => x.MovieScheduleId,
                        principalTable: "MovieScheduleInfoEntity",
                        principalColumn: "MovieScheduleInfoId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_GroupBookingSessionEntity_UserInfoEntity_CreatedByUserId",
                        column: x => x.CreatedByUserId,
                        principalTable: "UserInfoEntity",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "GroupBookingMemberEntity",
                columns: table => new
                {
                    MemberId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    GroupSessionId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    IsHost = table.Column<bool>(type: "bit", nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false),
                    AmountToPay = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    AmountPaid = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    VnPayTransactionId = table.Column<string>(type: "varchar(100)", nullable: true),
                    CoverPaymentTransactionId = table.Column<string>(type: "varchar(100)", nullable: true),
                    JoinedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    PaidAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GroupBookingMemberEntity", x => x.MemberId);
                    table.ForeignKey(
                        name: "FK_GroupBookingMemberEntity_GroupBookingSessionEntity_GroupSessionId",
                        column: x => x.GroupSessionId,
                        principalTable: "GroupBookingSessionEntity",
                        principalColumn: "GroupSessionId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_GroupBookingMemberEntity_UserInfoEntity_UserId",
                        column: x => x.UserId,
                        principalTable: "UserInfoEntity",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "GroupChatMessageEntity",
                columns: table => new
                {
                    MessageId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    GroupSessionId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SenderId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    Content = table.Column<string>(type: "nvarchar(2000)", nullable: false),
                    MessageType = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GroupChatMessageEntity", x => x.MessageId);
                    table.ForeignKey(
                        name: "FK_GroupChatMessageEntity_GroupBookingSessionEntity_GroupSessionId",
                        column: x => x.GroupSessionId,
                        principalTable: "GroupBookingSessionEntity",
                        principalColumn: "GroupSessionId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_GroupChatMessageEntity_UserInfoEntity_SenderId",
                        column: x => x.SenderId,
                        principalTable: "UserInfoEntity",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "GroupBookingSeatEntity",
                columns: table => new
                {
                    GroupSeatId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    MemberId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SeatId = table.Column<string>(type: "varchar(100)", nullable: false),
                    IsConfirmed = table.Column<bool>(type: "bit", nullable: false),
                    PriceEach = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    SelectedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GroupBookingSeatEntity", x => x.GroupSeatId);
                    table.ForeignKey(
                        name: "FK_GroupBookingSeatEntity_GroupBookingMemberEntity_MemberId",
                        column: x => x.MemberId,
                        principalTable: "GroupBookingMemberEntity",
                        principalColumn: "MemberId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_GroupBookingSeatEntity_SeatsInfoEntity_SeatId",
                        column: x => x.SeatId,
                        principalTable: "SeatsInfoEntity",
                        principalColumn: "SeatId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_GroupBookingMemberEntity_GroupSessionId_UserId",
                table: "GroupBookingMemberEntity",
                columns: new[] { "GroupSessionId", "UserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_GroupBookingMemberEntity_UserId",
                table: "GroupBookingMemberEntity",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_GroupBookingSeatEntity_MemberId_SeatId",
                table: "GroupBookingSeatEntity",
                columns: new[] { "MemberId", "SeatId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_GroupBookingSeatEntity_SeatId",
                table: "GroupBookingSeatEntity",
                column: "SeatId");

            migrationBuilder.CreateIndex(
                name: "IX_GroupBookingSessionEntity_CreatedByUserId",
                table: "GroupBookingSessionEntity",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_GroupBookingSessionEntity_GroupCode",
                table: "GroupBookingSessionEntity",
                column: "GroupCode",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_GroupBookingSessionEntity_MovieScheduleId",
                table: "GroupBookingSessionEntity",
                column: "MovieScheduleId");

            migrationBuilder.CreateIndex(
                name: "IX_GroupBookingSessionEntity_Status",
                table: "GroupBookingSessionEntity",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_GroupChatMessageEntity_GroupSessionId_CreatedAt",
                table: "GroupChatMessageEntity",
                columns: new[] { "GroupSessionId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_GroupChatMessageEntity_SenderId",
                table: "GroupChatMessageEntity",
                column: "SenderId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "GroupBookingSeatEntity");

            migrationBuilder.DropTable(
                name: "GroupChatMessageEntity");

            migrationBuilder.DropTable(
                name: "GroupBookingMemberEntity");

            migrationBuilder.DropTable(
                name: "GroupBookingSessionEntity");
        }
    }
}
