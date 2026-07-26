using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Cinema.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class RestoreStockRequestsWasteAndSeedJanitorial : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "StockRequestEntity",
                columns: table => new
                {
                    StockRequestId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RequestCode = table.Column<string>(type: "varchar(50)", nullable: false),
                    CinemaId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false),
                    RequestedByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ApprovedByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    ShippedByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    ReceivedByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    Note = table.Column<string>(type: "nvarchar(500)", nullable: true),
                    RejectReason = table.Column<string>(type: "nvarchar(500)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ApprovedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ShippedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ReceivedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StockRequestEntity", x => x.StockRequestId);
                    table.ForeignKey(
                        name: "FK_StockRequestEntity_CinemaInfoEntity_CinemaId",
                        column: x => x.CinemaId,
                        principalTable: "CinemaInfoEntity",
                        principalColumn: "CinemaId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_StockRequestEntity_UserInfoEntity_ApprovedByUserId",
                        column: x => x.ApprovedByUserId,
                        principalTable: "UserInfoEntity",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_StockRequestEntity_UserInfoEntity_ReceivedByUserId",
                        column: x => x.ReceivedByUserId,
                        principalTable: "UserInfoEntity",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_StockRequestEntity_UserInfoEntity_RequestedByUserId",
                        column: x => x.RequestedByUserId,
                        principalTable: "UserInfoEntity",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_StockRequestEntity_UserInfoEntity_ShippedByUserId",
                        column: x => x.ShippedByUserId,
                        principalTable: "UserInfoEntity",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "WasteReportEntity",
                columns: table => new
                {
                    WasteReportId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CinemaId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ProductId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Quantity = table.Column<int>(type: "int", nullable: false),
                    Reason = table.Column<string>(type: "nvarchar(500)", nullable: false),
                    ProofImageUrl = table.Column<string>(type: "nvarchar(500)", nullable: true),
                    Status = table.Column<int>(type: "int", nullable: false),
                    ReportedByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ReviewedByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    ReviewNote = table.Column<string>(type: "nvarchar(500)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ReviewedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WasteReportEntity", x => x.WasteReportId);
                    table.ForeignKey(
                        name: "FK_WasteReportEntity_CinemaInfoEntity_CinemaId",
                        column: x => x.CinemaId,
                        principalTable: "CinemaInfoEntity",
                        principalColumn: "CinemaId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_WasteReportEntity_ConcessionProductEntity_ProductId",
                        column: x => x.ProductId,
                        principalTable: "ConcessionProductEntity",
                        principalColumn: "ProductId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_WasteReportEntity_UserInfoEntity_ReportedByUserId",
                        column: x => x.ReportedByUserId,
                        principalTable: "UserInfoEntity",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_WasteReportEntity_UserInfoEntity_ReviewedByUserId",
                        column: x => x.ReviewedByUserId,
                        principalTable: "UserInfoEntity",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "StockRequestItemEntity",
                columns: table => new
                {
                    StockRequestItemId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    StockRequestId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ProductId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RequestedQuantity = table.Column<int>(type: "int", nullable: false),
                    ApprovedQuantity = table.Column<int>(type: "int", nullable: false),
                    ReceivedQuantity = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StockRequestItemEntity", x => x.StockRequestItemId);
                    table.ForeignKey(
                        name: "FK_StockRequestItemEntity_ConcessionProductEntity_ProductId",
                        column: x => x.ProductId,
                        principalTable: "ConcessionProductEntity",
                        principalColumn: "ProductId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_StockRequestItemEntity_StockRequestEntity_StockRequestId",
                        column: x => x.StockRequestId,
                        principalTable: "StockRequestEntity",
                        principalColumn: "StockRequestId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.UpdateData(
                table: "ConcessionProductEntity",
                keyColumn: "ProductId",
                keyValue: new Guid("fb000001-0000-4000-8000-000000000001"),
                column: "ImageUrl",
                value: "https://images.unsplash.com/photo-1578849278619-e73505e9610f?w=600&auto=format&fit=crop&q=80");

            migrationBuilder.UpdateData(
                table: "ConcessionProductEntity",
                keyColumn: "ProductId",
                keyValue: new Guid("fb000001-0000-4000-8000-000000000002"),
                column: "ImageUrl",
                value: "https://images.unsplash.com/photo-1585647347384-2593bc35786b?w=600&auto=format&fit=crop&q=80");

            migrationBuilder.UpdateData(
                table: "ConcessionProductEntity",
                keyColumn: "ProductId",
                keyValue: new Guid("fb000001-0000-4000-8000-000000000003"),
                column: "ImageUrl",
                value: "https://images.unsplash.com/photo-1578849278619-e73505e9610f?w=600&auto=format&fit=crop&q=80");

            migrationBuilder.UpdateData(
                table: "ConcessionProductEntity",
                keyColumn: "ProductId",
                keyValue: new Guid("fb000001-0000-4000-8000-000000000004"),
                column: "ImageUrl",
                value: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&auto=format&fit=crop&q=80");

            migrationBuilder.UpdateData(
                table: "ConcessionProductEntity",
                keyColumn: "ProductId",
                keyValue: new Guid("fb000001-0000-4000-8000-000000000005"),
                column: "ImageUrl",
                value: "https://images.unsplash.com/photo-1553456558-aff63285bdd1?w=600&auto=format&fit=crop&q=80");

            migrationBuilder.UpdateData(
                table: "ConcessionProductEntity",
                keyColumn: "ProductId",
                keyValue: new Guid("fb000001-0000-4000-8000-000000000006"),
                column: "ImageUrl",
                value: "https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=600&auto=format&fit=crop&q=80");

            migrationBuilder.UpdateData(
                table: "ConcessionProductEntity",
                keyColumn: "ProductId",
                keyValue: new Guid("fb000001-0000-4000-8000-000000000007"),
                column: "ImageUrl",
                value: "https://images.unsplash.com/photo-1576107232684-1279f390859f?w=600&auto=format&fit=crop&q=80");

            migrationBuilder.UpdateData(
                table: "ConcessionProductEntity",
                keyColumn: "ProductId",
                keyValue: new Guid("fb000001-0000-4000-8000-000000000008"),
                column: "ImageUrl",
                value: "https://images.unsplash.com/photo-1619740455993-9e612b1af08a?w=600&auto=format&fit=crop&q=80");

            migrationBuilder.UpdateData(
                table: "ConcessionProductEntity",
                keyColumn: "ProductId",
                keyValue: new Guid("fb000001-0000-4000-8000-000000000009"),
                column: "ImageUrl",
                value: "https://images.unsplash.com/photo-1585647347384-2593bc35786b?w=600&auto=format&fit=crop&q=80");

            migrationBuilder.UpdateData(
                table: "ConcessionProductEntity",
                keyColumn: "ProductId",
                keyValue: new Guid("fb000001-0000-4000-8000-000000000010"),
                column: "ImageUrl",
                value: "https://images.unsplash.com/photo-1578849278619-e73505e9610f?w=600&auto=format&fit=crop&q=80");

            migrationBuilder.UpdateData(
                table: "ConcessionProductEntity",
                keyColumn: "ProductId",
                keyValue: new Guid("fb000002-0000-4000-8000-000000000001"),
                column: "ImageUrl",
                value: "https://images.unsplash.com/photo-1578849278619-e73505e9610f?w=600&auto=format&fit=crop&q=80");

            migrationBuilder.UpdateData(
                table: "ConcessionProductEntity",
                keyColumn: "ProductId",
                keyValue: new Guid("fb000002-0000-4000-8000-000000000002"),
                column: "ImageUrl",
                value: "https://images.unsplash.com/photo-1585647347384-2593bc35786b?w=600&auto=format&fit=crop&q=80");

            migrationBuilder.UpdateData(
                table: "ConcessionProductEntity",
                keyColumn: "ProductId",
                keyValue: new Guid("fb000002-0000-4000-8000-000000000003"),
                column: "ImageUrl",
                value: "https://images.unsplash.com/photo-1578849278619-e73505e9610f?w=600&auto=format&fit=crop&q=80");

            migrationBuilder.UpdateData(
                table: "ConcessionProductEntity",
                keyColumn: "ProductId",
                keyValue: new Guid("fb000002-0000-4000-8000-000000000004"),
                column: "ImageUrl",
                value: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&auto=format&fit=crop&q=80");

            migrationBuilder.UpdateData(
                table: "ConcessionProductEntity",
                keyColumn: "ProductId",
                keyValue: new Guid("fb000002-0000-4000-8000-000000000005"),
                column: "ImageUrl",
                value: "https://images.unsplash.com/photo-1553456558-aff63285bdd1?w=600&auto=format&fit=crop&q=80");

            migrationBuilder.UpdateData(
                table: "ConcessionProductEntity",
                keyColumn: "ProductId",
                keyValue: new Guid("fb000002-0000-4000-8000-000000000006"),
                column: "ImageUrl",
                value: "https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=600&auto=format&fit=crop&q=80");

            migrationBuilder.UpdateData(
                table: "ConcessionProductEntity",
                keyColumn: "ProductId",
                keyValue: new Guid("fb000002-0000-4000-8000-000000000007"),
                column: "ImageUrl",
                value: "https://images.unsplash.com/photo-1576107232684-1279f390859f?w=600&auto=format&fit=crop&q=80");

            migrationBuilder.UpdateData(
                table: "ConcessionProductEntity",
                keyColumn: "ProductId",
                keyValue: new Guid("fb000002-0000-4000-8000-000000000008"),
                column: "ImageUrl",
                value: "https://images.unsplash.com/photo-1619740455993-9e612b1af08a?w=600&auto=format&fit=crop&q=80");

            migrationBuilder.UpdateData(
                table: "ConcessionProductEntity",
                keyColumn: "ProductId",
                keyValue: new Guid("fb000002-0000-4000-8000-000000000009"),
                column: "ImageUrl",
                value: "https://images.unsplash.com/photo-1585647347384-2593bc35786b?w=600&auto=format&fit=crop&q=80");

            migrationBuilder.UpdateData(
                table: "ConcessionProductEntity",
                keyColumn: "ProductId",
                keyValue: new Guid("fb000002-0000-4000-8000-000000000010"),
                column: "ImageUrl",
                value: "https://images.unsplash.com/photo-1578849278619-e73505e9610f?w=600&auto=format&fit=crop&q=80");

            migrationBuilder.UpdateData(
                table: "ConcessionProductEntity",
                keyColumn: "ProductId",
                keyValue: new Guid("fb000003-0000-4000-8000-000000000001"),
                column: "ImageUrl",
                value: "https://images.unsplash.com/photo-1578849278619-e73505e9610f?w=600&auto=format&fit=crop&q=80");

            migrationBuilder.UpdateData(
                table: "ConcessionProductEntity",
                keyColumn: "ProductId",
                keyValue: new Guid("fb000003-0000-4000-8000-000000000002"),
                column: "ImageUrl",
                value: "https://images.unsplash.com/photo-1585647347384-2593bc35786b?w=600&auto=format&fit=crop&q=80");

            migrationBuilder.UpdateData(
                table: "ConcessionProductEntity",
                keyColumn: "ProductId",
                keyValue: new Guid("fb000003-0000-4000-8000-000000000003"),
                column: "ImageUrl",
                value: "https://images.unsplash.com/photo-1578849278619-e73505e9610f?w=600&auto=format&fit=crop&q=80");

            migrationBuilder.UpdateData(
                table: "ConcessionProductEntity",
                keyColumn: "ProductId",
                keyValue: new Guid("fb000003-0000-4000-8000-000000000004"),
                column: "ImageUrl",
                value: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&auto=format&fit=crop&q=80");

            migrationBuilder.UpdateData(
                table: "ConcessionProductEntity",
                keyColumn: "ProductId",
                keyValue: new Guid("fb000003-0000-4000-8000-000000000005"),
                column: "ImageUrl",
                value: "https://images.unsplash.com/photo-1553456558-aff63285bdd1?w=600&auto=format&fit=crop&q=80");

            migrationBuilder.UpdateData(
                table: "ConcessionProductEntity",
                keyColumn: "ProductId",
                keyValue: new Guid("fb000003-0000-4000-8000-000000000006"),
                column: "ImageUrl",
                value: "https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=600&auto=format&fit=crop&q=80");

            migrationBuilder.UpdateData(
                table: "ConcessionProductEntity",
                keyColumn: "ProductId",
                keyValue: new Guid("fb000003-0000-4000-8000-000000000007"),
                column: "ImageUrl",
                value: "https://images.unsplash.com/photo-1576107232684-1279f390859f?w=600&auto=format&fit=crop&q=80");

            migrationBuilder.UpdateData(
                table: "ConcessionProductEntity",
                keyColumn: "ProductId",
                keyValue: new Guid("fb000003-0000-4000-8000-000000000008"),
                column: "ImageUrl",
                value: "https://images.unsplash.com/photo-1619740455993-9e612b1af08a?w=600&auto=format&fit=crop&q=80");

            migrationBuilder.UpdateData(
                table: "ConcessionProductEntity",
                keyColumn: "ProductId",
                keyValue: new Guid("fb000003-0000-4000-8000-000000000009"),
                column: "ImageUrl",
                value: "https://images.unsplash.com/photo-1585647347384-2593bc35786b?w=600&auto=format&fit=crop&q=80");

            migrationBuilder.UpdateData(
                table: "ConcessionProductEntity",
                keyColumn: "ProductId",
                keyValue: new Guid("fb000003-0000-4000-8000-000000000010"),
                column: "ImageUrl",
                value: "https://images.unsplash.com/photo-1578849278619-e73505e9610f?w=600&auto=format&fit=crop&q=80");

            migrationBuilder.InsertData(
                table: "DepartmentEntity",
                columns: new[] { "DepartmentId", "CashierType", "CinemaId", "DepartmentName", "DepartmentType", "IsActive", "SharedUserId" },
                values: new object[,]
                {
                    { new Guid("d1111111-1111-1111-1111-333333333333"), 0, new Guid("11111111-1111-1111-1111-111111111111"), "Bộ phận vệ sinh", 1, true, null },
                    { new Guid("d2222222-2222-2222-2222-333333333333"), 0, new Guid("22222222-2222-2222-2222-222222222222"), "Bộ phận vệ sinh", 1, true, null },
                    { new Guid("dbbbbbbb-bbbb-bbbb-bbbb-333333333333"), 0, new Guid("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"), "Bộ phận vệ sinh", 1, true, null }
                });

            migrationBuilder.InsertData(
                table: "CinemaShiftTemplateEntity",
                columns: new[] { "ShiftTemplateId", "CinemaId", "DepartmentId", "EndTime", "IsActive", "MaxStaff", "RoleId", "ShiftName", "ShiftType", "StartTime" },
                values: new object[,]
                {
                    { new Guid("a1111111-1111-1111-1111-666666666666"), new Guid("11111111-1111-1111-1111-111111111111"), new Guid("d1111111-1111-1111-1111-333333333333"), new TimeSpan(0, 16, 0, 0, 0), true, 4, new Guid("7a4b3c5d-e0f1-a2b3-c4d5-e6f7a8b9c0d1"), "Ca vệ sinh Full-time", 1, new TimeSpan(0, 8, 0, 0, 0) },
                    { new Guid("b2222222-2222-2222-2222-666666666666"), new Guid("22222222-2222-2222-2222-222222222222"), new Guid("d2222222-2222-2222-2222-333333333333"), new TimeSpan(0, 16, 0, 0, 0), true, 4, new Guid("7a4b3c5d-e0f1-a2b3-c4d5-e6f7a8b9c0d1"), "Ca vệ sinh Full-time", 1, new TimeSpan(0, 8, 0, 0, 0) },
                    { new Guid("c3333333-3333-3333-3333-666666666666"), new Guid("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"), new Guid("dbbbbbbb-bbbb-bbbb-bbbb-333333333333"), new TimeSpan(0, 16, 0, 0, 0), true, 4, new Guid("7a4b3c5d-e0f1-a2b3-c4d5-e6f7a8b9c0d1"), "Ca vệ sinh Full-time", 1, new TimeSpan(0, 8, 0, 0, 0) }
                });

            migrationBuilder.CreateIndex(
                name: "IX_StockRequestEntity_ApprovedByUserId",
                table: "StockRequestEntity",
                column: "ApprovedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_StockRequestEntity_CinemaId_Status",
                table: "StockRequestEntity",
                columns: new[] { "CinemaId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_StockRequestEntity_ReceivedByUserId",
                table: "StockRequestEntity",
                column: "ReceivedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_StockRequestEntity_RequestCode",
                table: "StockRequestEntity",
                column: "RequestCode",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_StockRequestEntity_RequestedByUserId",
                table: "StockRequestEntity",
                column: "RequestedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_StockRequestEntity_ShippedByUserId",
                table: "StockRequestEntity",
                column: "ShippedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_StockRequestItemEntity_ProductId",
                table: "StockRequestItemEntity",
                column: "ProductId");

            migrationBuilder.CreateIndex(
                name: "IX_StockRequestItemEntity_StockRequestId",
                table: "StockRequestItemEntity",
                column: "StockRequestId");

            migrationBuilder.CreateIndex(
                name: "IX_WasteReportEntity_CinemaId_Status",
                table: "WasteReportEntity",
                columns: new[] { "CinemaId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_WasteReportEntity_ProductId",
                table: "WasteReportEntity",
                column: "ProductId");

            migrationBuilder.CreateIndex(
                name: "IX_WasteReportEntity_ReportedByUserId",
                table: "WasteReportEntity",
                column: "ReportedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_WasteReportEntity_ReviewedByUserId",
                table: "WasteReportEntity",
                column: "ReviewedByUserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "StockRequestItemEntity");

            migrationBuilder.DropTable(
                name: "WasteReportEntity");

            migrationBuilder.DropTable(
                name: "StockRequestEntity");

            migrationBuilder.DeleteData(
                table: "CinemaShiftTemplateEntity",
                keyColumn: "ShiftTemplateId",
                keyValue: new Guid("a1111111-1111-1111-1111-666666666666"));

            migrationBuilder.DeleteData(
                table: "CinemaShiftTemplateEntity",
                keyColumn: "ShiftTemplateId",
                keyValue: new Guid("b2222222-2222-2222-2222-666666666666"));

            migrationBuilder.DeleteData(
                table: "CinemaShiftTemplateEntity",
                keyColumn: "ShiftTemplateId",
                keyValue: new Guid("c3333333-3333-3333-3333-666666666666"));

            migrationBuilder.DeleteData(
                table: "DepartmentEntity",
                keyColumn: "DepartmentId",
                keyValue: new Guid("d1111111-1111-1111-1111-333333333333"));

            migrationBuilder.DeleteData(
                table: "DepartmentEntity",
                keyColumn: "DepartmentId",
                keyValue: new Guid("d2222222-2222-2222-2222-333333333333"));

            migrationBuilder.DeleteData(
                table: "DepartmentEntity",
                keyColumn: "DepartmentId",
                keyValue: new Guid("dbbbbbbb-bbbb-bbbb-bbbb-333333333333"));

            migrationBuilder.UpdateData(
                table: "ConcessionProductEntity",
                keyColumn: "ProductId",
                keyValue: new Guid("fb000001-0000-4000-8000-000000000001"),
                column: "ImageUrl",
                value: null);

            migrationBuilder.UpdateData(
                table: "ConcessionProductEntity",
                keyColumn: "ProductId",
                keyValue: new Guid("fb000001-0000-4000-8000-000000000002"),
                column: "ImageUrl",
                value: null);

            migrationBuilder.UpdateData(
                table: "ConcessionProductEntity",
                keyColumn: "ProductId",
                keyValue: new Guid("fb000001-0000-4000-8000-000000000003"),
                column: "ImageUrl",
                value: null);

            migrationBuilder.UpdateData(
                table: "ConcessionProductEntity",
                keyColumn: "ProductId",
                keyValue: new Guid("fb000001-0000-4000-8000-000000000004"),
                column: "ImageUrl",
                value: null);

            migrationBuilder.UpdateData(
                table: "ConcessionProductEntity",
                keyColumn: "ProductId",
                keyValue: new Guid("fb000001-0000-4000-8000-000000000005"),
                column: "ImageUrl",
                value: null);

            migrationBuilder.UpdateData(
                table: "ConcessionProductEntity",
                keyColumn: "ProductId",
                keyValue: new Guid("fb000001-0000-4000-8000-000000000006"),
                column: "ImageUrl",
                value: null);

            migrationBuilder.UpdateData(
                table: "ConcessionProductEntity",
                keyColumn: "ProductId",
                keyValue: new Guid("fb000001-0000-4000-8000-000000000007"),
                column: "ImageUrl",
                value: null);

            migrationBuilder.UpdateData(
                table: "ConcessionProductEntity",
                keyColumn: "ProductId",
                keyValue: new Guid("fb000001-0000-4000-8000-000000000008"),
                column: "ImageUrl",
                value: null);

            migrationBuilder.UpdateData(
                table: "ConcessionProductEntity",
                keyColumn: "ProductId",
                keyValue: new Guid("fb000001-0000-4000-8000-000000000009"),
                column: "ImageUrl",
                value: null);

            migrationBuilder.UpdateData(
                table: "ConcessionProductEntity",
                keyColumn: "ProductId",
                keyValue: new Guid("fb000001-0000-4000-8000-000000000010"),
                column: "ImageUrl",
                value: null);

            migrationBuilder.UpdateData(
                table: "ConcessionProductEntity",
                keyColumn: "ProductId",
                keyValue: new Guid("fb000002-0000-4000-8000-000000000001"),
                column: "ImageUrl",
                value: null);

            migrationBuilder.UpdateData(
                table: "ConcessionProductEntity",
                keyColumn: "ProductId",
                keyValue: new Guid("fb000002-0000-4000-8000-000000000002"),
                column: "ImageUrl",
                value: null);

            migrationBuilder.UpdateData(
                table: "ConcessionProductEntity",
                keyColumn: "ProductId",
                keyValue: new Guid("fb000002-0000-4000-8000-000000000003"),
                column: "ImageUrl",
                value: null);

            migrationBuilder.UpdateData(
                table: "ConcessionProductEntity",
                keyColumn: "ProductId",
                keyValue: new Guid("fb000002-0000-4000-8000-000000000004"),
                column: "ImageUrl",
                value: null);

            migrationBuilder.UpdateData(
                table: "ConcessionProductEntity",
                keyColumn: "ProductId",
                keyValue: new Guid("fb000002-0000-4000-8000-000000000005"),
                column: "ImageUrl",
                value: null);

            migrationBuilder.UpdateData(
                table: "ConcessionProductEntity",
                keyColumn: "ProductId",
                keyValue: new Guid("fb000002-0000-4000-8000-000000000006"),
                column: "ImageUrl",
                value: null);

            migrationBuilder.UpdateData(
                table: "ConcessionProductEntity",
                keyColumn: "ProductId",
                keyValue: new Guid("fb000002-0000-4000-8000-000000000007"),
                column: "ImageUrl",
                value: null);

            migrationBuilder.UpdateData(
                table: "ConcessionProductEntity",
                keyColumn: "ProductId",
                keyValue: new Guid("fb000002-0000-4000-8000-000000000008"),
                column: "ImageUrl",
                value: null);

            migrationBuilder.UpdateData(
                table: "ConcessionProductEntity",
                keyColumn: "ProductId",
                keyValue: new Guid("fb000002-0000-4000-8000-000000000009"),
                column: "ImageUrl",
                value: null);

            migrationBuilder.UpdateData(
                table: "ConcessionProductEntity",
                keyColumn: "ProductId",
                keyValue: new Guid("fb000002-0000-4000-8000-000000000010"),
                column: "ImageUrl",
                value: null);

            migrationBuilder.UpdateData(
                table: "ConcessionProductEntity",
                keyColumn: "ProductId",
                keyValue: new Guid("fb000003-0000-4000-8000-000000000001"),
                column: "ImageUrl",
                value: null);

            migrationBuilder.UpdateData(
                table: "ConcessionProductEntity",
                keyColumn: "ProductId",
                keyValue: new Guid("fb000003-0000-4000-8000-000000000002"),
                column: "ImageUrl",
                value: null);

            migrationBuilder.UpdateData(
                table: "ConcessionProductEntity",
                keyColumn: "ProductId",
                keyValue: new Guid("fb000003-0000-4000-8000-000000000003"),
                column: "ImageUrl",
                value: null);

            migrationBuilder.UpdateData(
                table: "ConcessionProductEntity",
                keyColumn: "ProductId",
                keyValue: new Guid("fb000003-0000-4000-8000-000000000004"),
                column: "ImageUrl",
                value: null);

            migrationBuilder.UpdateData(
                table: "ConcessionProductEntity",
                keyColumn: "ProductId",
                keyValue: new Guid("fb000003-0000-4000-8000-000000000005"),
                column: "ImageUrl",
                value: null);

            migrationBuilder.UpdateData(
                table: "ConcessionProductEntity",
                keyColumn: "ProductId",
                keyValue: new Guid("fb000003-0000-4000-8000-000000000006"),
                column: "ImageUrl",
                value: null);

            migrationBuilder.UpdateData(
                table: "ConcessionProductEntity",
                keyColumn: "ProductId",
                keyValue: new Guid("fb000003-0000-4000-8000-000000000007"),
                column: "ImageUrl",
                value: null);

            migrationBuilder.UpdateData(
                table: "ConcessionProductEntity",
                keyColumn: "ProductId",
                keyValue: new Guid("fb000003-0000-4000-8000-000000000008"),
                column: "ImageUrl",
                value: null);

            migrationBuilder.UpdateData(
                table: "ConcessionProductEntity",
                keyColumn: "ProductId",
                keyValue: new Guid("fb000003-0000-4000-8000-000000000009"),
                column: "ImageUrl",
                value: null);

            migrationBuilder.UpdateData(
                table: "ConcessionProductEntity",
                keyColumn: "ProductId",
                keyValue: new Guid("fb000003-0000-4000-8000-000000000010"),
                column: "ImageUrl",
                value: null);
        }
    }
}
