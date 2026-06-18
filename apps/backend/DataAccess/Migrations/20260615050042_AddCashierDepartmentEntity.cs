using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DataAccess.Migrations
{
    /// <inheritdoc />
    public partial class AddCashierDepartmentEntity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CashierDepartmentEntity",
                columns: table => new
                {
                    DepartmentId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CinemaId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DepartmentName = table.Column<string>(type: "nvarchar(100)", nullable: false),
                    DepartmentType = table.Column<int>(type: "int", nullable: false),
                    SharedUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CashierDepartmentEntity", x => x.DepartmentId);
                    table.ForeignKey(
                        name: "FK_CashierDepartmentEntity_CinemaInfoEntity_CinemaId",
                        column: x => x.CinemaId,
                        principalTable: "CinemaInfoEntity",
                        principalColumn: "CinemaId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_CashierDepartmentEntity_UserInfoEntity_SharedUserId",
                        column: x => x.SharedUserId,
                        principalTable: "UserInfoEntity",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CashierDepartmentEntity_CinemaId",
                table: "CashierDepartmentEntity",
                column: "CinemaId");

            migrationBuilder.CreateIndex(
                name: "IX_CashierDepartmentEntity_SharedUserId",
                table: "CashierDepartmentEntity",
                column: "SharedUserId",
                unique: true,
                filter: "[SharedUserId] IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CashierDepartmentEntity");
        }
    }
}
