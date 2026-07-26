using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Cinema.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddConcessionHotFlag : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsHot",
                table: "ConcessionProductEntity",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.UpdateData(
                table: "ConcessionProductEntity",
                keyColumn: "ProductId",
                keyValue: new Guid("fb000001-0000-4000-8000-000000000001"),
                column: "IsHot",
                value: false);

            migrationBuilder.UpdateData(
                table: "ConcessionProductEntity",
                keyColumn: "ProductId",
                keyValue: new Guid("fb000001-0000-4000-8000-000000000002"),
                column: "IsHot",
                value: false);

            migrationBuilder.UpdateData(
                table: "ConcessionProductEntity",
                keyColumn: "ProductId",
                keyValue: new Guid("fb000001-0000-4000-8000-000000000003"),
                column: "IsHot",
                value: true);

            migrationBuilder.UpdateData(
                table: "ConcessionProductEntity",
                keyColumn: "ProductId",
                keyValue: new Guid("fb000001-0000-4000-8000-000000000004"),
                column: "IsHot",
                value: true);

            migrationBuilder.UpdateData(
                table: "ConcessionProductEntity",
                keyColumn: "ProductId",
                keyValue: new Guid("fb000001-0000-4000-8000-000000000005"),
                column: "IsHot",
                value: false);

            migrationBuilder.UpdateData(
                table: "ConcessionProductEntity",
                keyColumn: "ProductId",
                keyValue: new Guid("fb000001-0000-4000-8000-000000000006"),
                column: "IsHot",
                value: false);

            migrationBuilder.UpdateData(
                table: "ConcessionProductEntity",
                keyColumn: "ProductId",
                keyValue: new Guid("fb000001-0000-4000-8000-000000000007"),
                column: "IsHot",
                value: false);

            migrationBuilder.UpdateData(
                table: "ConcessionProductEntity",
                keyColumn: "ProductId",
                keyValue: new Guid("fb000001-0000-4000-8000-000000000008"),
                column: "IsHot",
                value: false);

            migrationBuilder.UpdateData(
                table: "ConcessionProductEntity",
                keyColumn: "ProductId",
                keyValue: new Guid("fb000001-0000-4000-8000-000000000009"),
                column: "IsHot",
                value: true);

            migrationBuilder.UpdateData(
                table: "ConcessionProductEntity",
                keyColumn: "ProductId",
                keyValue: new Guid("fb000001-0000-4000-8000-000000000010"),
                column: "IsHot",
                value: true);

            migrationBuilder.UpdateData(
                table: "ConcessionProductEntity",
                keyColumn: "ProductId",
                keyValue: new Guid("fb000002-0000-4000-8000-000000000001"),
                column: "IsHot",
                value: false);

            migrationBuilder.UpdateData(
                table: "ConcessionProductEntity",
                keyColumn: "ProductId",
                keyValue: new Guid("fb000002-0000-4000-8000-000000000002"),
                column: "IsHot",
                value: false);

            migrationBuilder.UpdateData(
                table: "ConcessionProductEntity",
                keyColumn: "ProductId",
                keyValue: new Guid("fb000002-0000-4000-8000-000000000003"),
                column: "IsHot",
                value: true);

            migrationBuilder.UpdateData(
                table: "ConcessionProductEntity",
                keyColumn: "ProductId",
                keyValue: new Guid("fb000002-0000-4000-8000-000000000004"),
                column: "IsHot",
                value: true);

            migrationBuilder.UpdateData(
                table: "ConcessionProductEntity",
                keyColumn: "ProductId",
                keyValue: new Guid("fb000002-0000-4000-8000-000000000005"),
                column: "IsHot",
                value: false);

            migrationBuilder.UpdateData(
                table: "ConcessionProductEntity",
                keyColumn: "ProductId",
                keyValue: new Guid("fb000002-0000-4000-8000-000000000006"),
                column: "IsHot",
                value: false);

            migrationBuilder.UpdateData(
                table: "ConcessionProductEntity",
                keyColumn: "ProductId",
                keyValue: new Guid("fb000002-0000-4000-8000-000000000007"),
                column: "IsHot",
                value: false);

            migrationBuilder.UpdateData(
                table: "ConcessionProductEntity",
                keyColumn: "ProductId",
                keyValue: new Guid("fb000002-0000-4000-8000-000000000008"),
                column: "IsHot",
                value: false);

            migrationBuilder.UpdateData(
                table: "ConcessionProductEntity",
                keyColumn: "ProductId",
                keyValue: new Guid("fb000002-0000-4000-8000-000000000009"),
                column: "IsHot",
                value: true);

            migrationBuilder.UpdateData(
                table: "ConcessionProductEntity",
                keyColumn: "ProductId",
                keyValue: new Guid("fb000002-0000-4000-8000-000000000010"),
                column: "IsHot",
                value: true);

            migrationBuilder.UpdateData(
                table: "ConcessionProductEntity",
                keyColumn: "ProductId",
                keyValue: new Guid("fb000003-0000-4000-8000-000000000001"),
                column: "IsHot",
                value: false);

            migrationBuilder.UpdateData(
                table: "ConcessionProductEntity",
                keyColumn: "ProductId",
                keyValue: new Guid("fb000003-0000-4000-8000-000000000002"),
                column: "IsHot",
                value: false);

            migrationBuilder.UpdateData(
                table: "ConcessionProductEntity",
                keyColumn: "ProductId",
                keyValue: new Guid("fb000003-0000-4000-8000-000000000003"),
                column: "IsHot",
                value: true);

            migrationBuilder.UpdateData(
                table: "ConcessionProductEntity",
                keyColumn: "ProductId",
                keyValue: new Guid("fb000003-0000-4000-8000-000000000004"),
                column: "IsHot",
                value: true);

            migrationBuilder.UpdateData(
                table: "ConcessionProductEntity",
                keyColumn: "ProductId",
                keyValue: new Guid("fb000003-0000-4000-8000-000000000005"),
                column: "IsHot",
                value: false);

            migrationBuilder.UpdateData(
                table: "ConcessionProductEntity",
                keyColumn: "ProductId",
                keyValue: new Guid("fb000003-0000-4000-8000-000000000006"),
                column: "IsHot",
                value: false);

            migrationBuilder.UpdateData(
                table: "ConcessionProductEntity",
                keyColumn: "ProductId",
                keyValue: new Guid("fb000003-0000-4000-8000-000000000007"),
                column: "IsHot",
                value: false);

            migrationBuilder.UpdateData(
                table: "ConcessionProductEntity",
                keyColumn: "ProductId",
                keyValue: new Guid("fb000003-0000-4000-8000-000000000008"),
                column: "IsHot",
                value: false);

            migrationBuilder.UpdateData(
                table: "ConcessionProductEntity",
                keyColumn: "ProductId",
                keyValue: new Guid("fb000003-0000-4000-8000-000000000009"),
                column: "IsHot",
                value: true);

            migrationBuilder.UpdateData(
                table: "ConcessionProductEntity",
                keyColumn: "ProductId",
                keyValue: new Guid("fb000003-0000-4000-8000-000000000010"),
                column: "IsHot",
                value: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsHot",
                table: "ConcessionProductEntity");
        }
    }
}
