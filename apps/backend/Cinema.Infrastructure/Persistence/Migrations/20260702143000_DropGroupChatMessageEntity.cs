using System;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Cinema.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    [DbContext(typeof(CinemaDbContext))]
    [Migration("20260702143000_DropGroupChatMessageEntity")]
    public partial class DropGroupChatMessageEntity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                IF OBJECT_ID(N'[GroupChatMessageEntity]', N'U') IS NOT NULL
                    DROP TABLE [GroupChatMessageEntity];
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "GroupChatMessageEntity",
                columns: table => new
                {
                    MessageId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    GroupSessionId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SenderId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    Content = table.Column<string>(type: "nvarchar(2000)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    MessageType = table.Column<int>(type: "int", nullable: false)
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

            migrationBuilder.CreateIndex(
                name: "IX_GroupChatMessageEntity_GroupSessionId_CreatedAt",
                table: "GroupChatMessageEntity",
                columns: new[] { "GroupSessionId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_GroupChatMessageEntity_SenderId",
                table: "GroupChatMessageEntity",
                column: "SenderId");
        }
    }
}
