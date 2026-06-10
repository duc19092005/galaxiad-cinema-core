using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DataAccess.Migrations
{
    [Migration("20260610170000_AddAuditLogs")]
    public partial class AddAuditLogs : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AuditLogEntity",
                columns: table => new
                {
                    AuditLogId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Action = table.Column<string>(type: "varchar(50)", nullable: false),
                    EntityType = table.Column<string>(type: "varchar(80)", nullable: false),
                    EntityId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    EntityName = table.Column<string>(type: "nvarchar(300)", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(1000)", nullable: false),
                    ActorUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ActorName = table.Column<string>(type: "nvarchar(100)", nullable: false),
                    ActorPrimaryRole = table.Column<string>(type: "varchar(50)", nullable: false),
                    IsAdminAction = table.Column<bool>(type: "bit", nullable: false),
                    CinemaId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AuditLogEntity", x => x.AuditLogId);
                    table.ForeignKey(
                        name: "FK_AuditLogEntity_UserInfoEntity_ActorUserId",
                        column: x => x.ActorUserId,
                        principalTable: "UserInfoEntity",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AuditLogEntity_ActorUserId",
                table: "AuditLogEntity",
                column: "ActorUserId");

            migrationBuilder.CreateIndex(
                name: "IX_AuditLogEntity_CinemaId",
                table: "AuditLogEntity",
                column: "CinemaId");

            migrationBuilder.CreateIndex(
                name: "IX_AuditLogEntity_CreatedAt",
                table: "AuditLogEntity",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_AuditLogEntity_EntityType_EntityId",
                table: "AuditLogEntity",
                columns: new[] { "EntityType", "EntityId" });
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AuditLogEntity");
        }
    }
}
