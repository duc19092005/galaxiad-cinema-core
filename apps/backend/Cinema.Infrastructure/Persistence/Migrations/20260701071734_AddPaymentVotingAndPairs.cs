using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Cinema.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddPaymentVotingAndPairs : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "PaymentMethod",
                table: "GroupBookingSessionEntity",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PaymentMethodVoteResultJson",
                table: "GroupBookingSessionEntity",
                type: "nvarchar(2000)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "VoteStatus",
                table: "GroupBookingSessionEntity",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<Guid>(
                name: "PairId",
                table: "GroupBookingMemberEntity",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "GroupBookingPairEntity",
                columns: table => new
                {
                    PairId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    GroupSessionId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Member1Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Member2Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false),
                    RequestedByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    RespondedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GroupBookingPairEntity", x => x.PairId);
                    table.ForeignKey(
                        name: "FK_GroupBookingPairEntity_GroupBookingMemberEntity_Member1Id",
                        column: x => x.Member1Id,
                        principalTable: "GroupBookingMemberEntity",
                        principalColumn: "MemberId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_GroupBookingPairEntity_GroupBookingMemberEntity_Member2Id",
                        column: x => x.Member2Id,
                        principalTable: "GroupBookingMemberEntity",
                        principalColumn: "MemberId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_GroupBookingPairEntity_GroupBookingSessionEntity_GroupSessionId",
                        column: x => x.GroupSessionId,
                        principalTable: "GroupBookingSessionEntity",
                        principalColumn: "GroupSessionId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "GroupBookingPaymentFailureVoteEntity",
                columns: table => new
                {
                    FailureVoteId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    GroupSessionId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    FailedMemberId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Action = table.Column<int>(type: "int", nullable: false),
                    VoterUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    IsRaiseHand = table.Column<bool>(type: "bit", nullable: false),
                    VotedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GroupBookingPaymentFailureVoteEntity", x => x.FailureVoteId);
                    table.ForeignKey(
                        name: "FK_GroupBookingPaymentFailureVoteEntity_GroupBookingMemberEntity_FailedMemberId",
                        column: x => x.FailedMemberId,
                        principalTable: "GroupBookingMemberEntity",
                        principalColumn: "MemberId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_GroupBookingPaymentFailureVoteEntity_GroupBookingSessionEntity_GroupSessionId",
                        column: x => x.GroupSessionId,
                        principalTable: "GroupBookingSessionEntity",
                        principalColumn: "GroupSessionId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_GroupBookingPaymentFailureVoteEntity_UserInfoEntity_VoterUserId",
                        column: x => x.VoterUserId,
                        principalTable: "UserInfoEntity",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "GroupBookingPaymentVoteEntity",
                columns: table => new
                {
                    PaymentVoteId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    GroupSessionId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PaymentMethod = table.Column<int>(type: "int", nullable: false),
                    VotedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GroupBookingPaymentVoteEntity", x => x.PaymentVoteId);
                    table.ForeignKey(
                        name: "FK_GroupBookingPaymentVoteEntity_GroupBookingSessionEntity_GroupSessionId",
                        column: x => x.GroupSessionId,
                        principalTable: "GroupBookingSessionEntity",
                        principalColumn: "GroupSessionId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_GroupBookingPaymentVoteEntity_UserInfoEntity_UserId",
                        column: x => x.UserId,
                        principalTable: "UserInfoEntity",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_GroupBookingPairEntity_GroupSessionId",
                table: "GroupBookingPairEntity",
                column: "GroupSessionId");

            migrationBuilder.CreateIndex(
                name: "IX_GroupBookingPairEntity_Member1Id",
                table: "GroupBookingPairEntity",
                column: "Member1Id");

            migrationBuilder.CreateIndex(
                name: "IX_GroupBookingPairEntity_Member2Id",
                table: "GroupBookingPairEntity",
                column: "Member2Id");

            migrationBuilder.CreateIndex(
                name: "IX_GroupBookingPaymentFailureVoteEntity_FailedMemberId",
                table: "GroupBookingPaymentFailureVoteEntity",
                column: "FailedMemberId");

            migrationBuilder.CreateIndex(
                name: "IX_GroupBookingPaymentFailureVoteEntity_GroupSessionId",
                table: "GroupBookingPaymentFailureVoteEntity",
                column: "GroupSessionId");

            migrationBuilder.CreateIndex(
                name: "IX_GroupBookingPaymentFailureVoteEntity_VoterUserId",
                table: "GroupBookingPaymentFailureVoteEntity",
                column: "VoterUserId");

            migrationBuilder.CreateIndex(
                name: "IX_GroupBookingPaymentVoteEntity_GroupSessionId_UserId",
                table: "GroupBookingPaymentVoteEntity",
                columns: new[] { "GroupSessionId", "UserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_GroupBookingPaymentVoteEntity_UserId",
                table: "GroupBookingPaymentVoteEntity",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "GroupBookingPairEntity");

            migrationBuilder.DropTable(
                name: "GroupBookingPaymentFailureVoteEntity");

            migrationBuilder.DropTable(
                name: "GroupBookingPaymentVoteEntity");

            migrationBuilder.DropColumn(
                name: "PaymentMethod",
                table: "GroupBookingSessionEntity");

            migrationBuilder.DropColumn(
                name: "PaymentMethodVoteResultJson",
                table: "GroupBookingSessionEntity");

            migrationBuilder.DropColumn(
                name: "VoteStatus",
                table: "GroupBookingSessionEntity");

            migrationBuilder.DropColumn(
                name: "PairId",
                table: "GroupBookingMemberEntity");
        }
    }
}
