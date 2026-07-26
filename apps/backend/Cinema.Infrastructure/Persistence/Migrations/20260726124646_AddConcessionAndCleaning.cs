using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Cinema.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddConcessionAndCleaning : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "ConcessionSubtotal",
                table: "OrderInfoEntity",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.CreateTable(
                name: "CleaningTaskEntity",
                columns: table => new
                {
                    CleaningTaskId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CinemaId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    AuditoriumId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    MovieScheduleId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    ShiftScheduleId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    AssignedStaffId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    Status = table.Column<int>(type: "int", nullable: false),
                    TaskType = table.Column<int>(type: "int", nullable: false),
                    Priority = table.Column<int>(type: "int", nullable: false),
                    ScheduledAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    DueAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    StartedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CompletedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    VerifiedByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    VerifiedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Note = table.Column<string>(type: "nvarchar(1000)", nullable: true),
                    ProofImageUrl = table.Column<string>(type: "nvarchar(500)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CleaningTaskEntity", x => x.CleaningTaskId);
                    table.ForeignKey(
                        name: "FK_CleaningTaskEntity_AuditoriumInfoEntities_AuditoriumId",
                        column: x => x.AuditoriumId,
                        principalTable: "AuditoriumInfoEntities",
                        principalColumn: "AuditoriumId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_CleaningTaskEntity_CinemaInfoEntity_CinemaId",
                        column: x => x.CinemaId,
                        principalTable: "CinemaInfoEntity",
                        principalColumn: "CinemaId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_CleaningTaskEntity_CinemaShiftScheduleEntity_ShiftScheduleId",
                        column: x => x.ShiftScheduleId,
                        principalTable: "CinemaShiftScheduleEntity",
                        principalColumn: "ShiftScheduleId",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_CleaningTaskEntity_MovieScheduleInfoEntity_MovieScheduleId",
                        column: x => x.MovieScheduleId,
                        principalTable: "MovieScheduleInfoEntity",
                        principalColumn: "MovieScheduleInfoId",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_CleaningTaskEntity_StaffProfileEntity_AssignedStaffId",
                        column: x => x.AssignedStaffId,
                        principalTable: "StaffProfileEntity",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_CleaningTaskEntity_UserInfoEntity_VerifiedByUserId",
                        column: x => x.VerifiedByUserId,
                        principalTable: "UserInfoEntity",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "ConcessionProductEntity",
                columns: table => new
                {
                    ProductId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CinemaId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ProductName = table.Column<string>(type: "nvarchar(200)", nullable: false),
                    Sku = table.Column<string>(type: "varchar(50)", nullable: false),
                    Category = table.Column<int>(type: "int", nullable: false),
                    UnitPrice = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    CostPrice = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Unit = table.Column<int>(type: "int", nullable: false),
                    ImageUrl = table.Column<string>(type: "nvarchar(500)", nullable: true),
                    Description = table.Column<string>(type: "nvarchar(1000)", nullable: true),
                    IsAvailableOnline = table.Column<bool>(type: "bit", nullable: false),
                    IsCombo = table.Column<bool>(type: "bit", nullable: false),
                    LowStockThreshold = table.Column<int>(type: "int", nullable: false),
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
                    table.PrimaryKey("PK_ConcessionProductEntity", x => x.ProductId);
                    table.ForeignKey(
                        name: "FK_ConcessionProductEntity_CinemaInfoEntity_CinemaId",
                        column: x => x.CinemaId,
                        principalTable: "CinemaInfoEntity",
                        principalColumn: "CinemaId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ConcessionComboItemEntity",
                columns: table => new
                {
                    ComboItemId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ComboProductId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ComponentProductId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Quantity = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ConcessionComboItemEntity", x => x.ComboItemId);
                    table.ForeignKey(
                        name: "FK_ConcessionComboItemEntity_ConcessionProductEntity_ComboProductId",
                        column: x => x.ComboProductId,
                        principalTable: "ConcessionProductEntity",
                        principalColumn: "ProductId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ConcessionComboItemEntity_ConcessionProductEntity_ComponentProductId",
                        column: x => x.ComponentProductId,
                        principalTable: "ConcessionProductEntity",
                        principalColumn: "ProductId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ConcessionInventoryEntity",
                columns: table => new
                {
                    ProductId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    QuantityOnHand = table.Column<int>(type: "int", nullable: false),
                    QuantityReserved = table.Column<int>(type: "int", nullable: false),
                    LastRestockedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    LastCountedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    RowVersion = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ConcessionInventoryEntity", x => x.ProductId);
                    table.ForeignKey(
                        name: "FK_ConcessionInventoryEntity_ConcessionProductEntity_ProductId",
                        column: x => x.ProductId,
                        principalTable: "ConcessionProductEntity",
                        principalColumn: "ProductId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "InventoryTransactionEntity",
                columns: table => new
                {
                    TransactionId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ProductId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CinemaId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TransactionType = table.Column<int>(type: "int", nullable: false),
                    QuantityChange = table.Column<int>(type: "int", nullable: false),
                    QuantityOnHandAfter = table.Column<int>(type: "int", nullable: false),
                    QuantityReservedAfter = table.Column<int>(type: "int", nullable: false),
                    OrderId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    PerformedByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    Note = table.Column<string>(type: "nvarchar(500)", nullable: true),
                    OccurredAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_InventoryTransactionEntity", x => x.TransactionId);
                    table.ForeignKey(
                        name: "FK_InventoryTransactionEntity_CinemaInfoEntity_CinemaId",
                        column: x => x.CinemaId,
                        principalTable: "CinemaInfoEntity",
                        principalColumn: "CinemaId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_InventoryTransactionEntity_ConcessionProductEntity_ProductId",
                        column: x => x.ProductId,
                        principalTable: "ConcessionProductEntity",
                        principalColumn: "ProductId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "OrderConcessionDetailEntity",
                columns: table => new
                {
                    OrderConcessionDetailId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OrderId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ProductId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Quantity = table.Column<int>(type: "int", nullable: false),
                    UnitPriceSnapshot = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    LineTotal = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    ProductNameSnapshot = table.Column<string>(type: "nvarchar(200)", nullable: false),
                    StockState = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OrderConcessionDetailEntity", x => x.OrderConcessionDetailId);
                    table.ForeignKey(
                        name: "FK_OrderConcessionDetailEntity_ConcessionProductEntity_ProductId",
                        column: x => x.ProductId,
                        principalTable: "ConcessionProductEntity",
                        principalColumn: "ProductId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_OrderConcessionDetailEntity_OrderInfoEntity_OrderId",
                        column: x => x.OrderId,
                        principalTable: "OrderInfoEntity",
                        principalColumn: "OrderId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.UpdateData(
                table: "AiResearchReportEntity",
                keyColumn: "JobId",
                keyValue: new Guid("a1000001-0001-4000-8000-000000000001"),
                column: "SummaryJson",
                value: "{\r\n  \"reportStyle\": \"executive_feasibility\",\r\n  \"title\": \"BÁO CÁO SEED · ĐÁNH GIÁ KHẢ THI GIÁ VÉ TPHCM (DEMO)\",\r\n  \"abstract\": \"Báo cáo seed demo cho Admin AI Workspace. Dữ liệu minh họa khung giá vé 2D và phụ thu định dạng tại TPHCM, phục vụ demo UI Business Research.\",\r\n  \"executiveSummary\": \"Seed demo: khung giá 2D cuối tuần và phụ thu IMAX tại TPHCM đủ để minh họa shortlist quyết định giá. Cần báo giá thực tế trước khi chốt policy.\",\r\n  \"confidenceNote\": \"Mức độ tin cậy demo (seed) · Rủi ro dữ liệu: Trung bình\",\r\n  \"totalClaims\": 2,\r\n  \"resolvedClaims\": 2,\r\n  \"insufficientClaims\": 0,\r\n  \"referenceCount\": 2,\r\n  \"keyFindings\": [\r\n    \"Seed: Giá vé 2D cuối tuần tại TPHCM có biên độ tham chiếu từ nguồn demo [1].\",\r\n    \"Seed: Phụ thu IMAX/4DX là đòn bẩy doanh thu suất cao cấp [2].\"\r\n  ],\r\n  \"recommendations\": [\r\n    \"P0 (Hành động ngay): Rà soát bảng giá 2D cuối tuần theo cụm rạp TPHCM.\",\r\n    \"P1 (Thẩm định chuyên sâu): Thu thập bảng giá chuỗi đối thủ trước khi chỉnh phụ thu IMAX.\",\r\n    \"P2 (Theo dõi chiến lược): Theo dõi conversion suất midweek sau khi thử khuyến mãi.\"\r\n  ],\r\n  \"risksAndUnknowns\": [\r\n    \"Dữ liệu seed chỉ mang tính minh họa UI, không dùng cho quyết định đầu tư thật.\"\r\n  ],\r\n  \"resultsAndDiscussion\": \"### B. Chi phí & định giá (seed)\\n\\n- **Thực trạng thị trường:** Khung giá 2D và phụ thu định dạng tại TPHCM (demo) [1], [2].\\n- **Đánh giá rủi ro & độ tin cậy:** Mức độ tin cậy trung bình (seed data).\\n- **Tác động tới Galaxy Cinema (CapEx/OpEx/Doanh thu):** Dùng để demo luồng báo cáo điều hành trên Admin AI.\",\r\n  \"conclusion\": \"Seed demo hoàn tất. Chạy job live để có báo cáo multi-agent thật.\",\r\n  \"references\": [\r\n    {\r\n      \"id\": 1,\r\n      \"title\": \"Seed · Giá vé 2D TPHCM (demo)\",\r\n      \"url\": \"https://example.com/seed/pricing-hcm-2d\",\r\n      \"domain\": \"example.com\",\r\n      \"ieeeText\": \"[1] \\\"Seed · Giá vé 2D TPHCM (demo)\\\", example.com, [Online]. Available: https://example.com/seed/pricing-hcm-2d\"\r\n    },\r\n    {\r\n      \"id\": 2,\r\n      \"title\": \"Seed · Phụ thu IMAX (demo)\",\r\n      \"url\": \"https://example.com/seed/pricing-imax\",\r\n      \"domain\": \"example.com\",\r\n      \"ieeeText\": \"[2] \\\"Seed · Phụ thu IMAX (demo)\\\", example.com, [Online]. Available: https://example.com/seed/pricing-imax\"\r\n    }\r\n  ]\r\n}");

            migrationBuilder.UpdateData(
                table: "AiResearchReportEntity",
                keyColumn: "JobId",
                keyValue: new Guid("a1000001-0001-4000-8000-000000000002"),
                column: "SummaryJson",
                value: "{\r\n  \"reportStyle\": \"executive_feasibility\",\r\n  \"title\": \"BÁO CÁO SEED · KHẢ THI ĐỊA ĐIỂM KHU ĐÔNG TPHCM (DEMO)\",\r\n  \"abstract\": \"Báo cáo seed demo shortlist mặt bằng khu Đông TPHCM: biên độ thuê và tín hiệu footfall metro.\",\r\n  \"executiveSummary\": \"Seed demo: khu Đông có tín hiệu footfall và biên độ thuê tham chiếu. Cần site visit + báo giá độc lập trước IC.\",\r\n  \"confidenceNote\": \"Mức độ tin cậy demo (seed) · Rủi ro dữ liệu: Trung bình\",\r\n  \"totalClaims\": 2,\r\n  \"resolvedClaims\": 2,\r\n  \"insufficientClaims\": 0,\r\n  \"referenceCount\": 2,\r\n  \"keyFindings\": [\r\n    \"Seed: Biên độ thuê mặt bằng khu Đông mang tính tham chiếu [1].\",\r\n    \"Seed: Metro/vành đai hỗ trợ kỳ vọng footfall dài hạn [2].\"\r\n  ],\r\n  \"recommendations\": [\r\n    \"P0 (Hành động ngay): Lập shortlist 3-5 mặt bằng khu Đông 1.500-3.000m².\",\r\n    \"P1 (Thẩm định chuyên sâu): Kiểm tra PCCC, tải trọng sàn, điều khoản fit-out.\",\r\n    \"P2 (Theo dõi chiến lược): Bám tiến độ metro quanh shortlist.\"\r\n  ],\r\n  \"risksAndUnknowns\": [\r\n    \"Seed data không thay thế thẩm định pháp lý và khảo sát hiện trường.\"\r\n  ],\r\n  \"resultsAndDiscussion\": \"### A. Quy hoạch & địa điểm (seed)\\n\\n- **Thực trạng thị trường:** Biên độ thuê và footfall khu Đông (demo) [1], [2].\\n- **Đánh giá rủi ro & độ tin cậy:** Trung bình (seed).\\n- **Tác động tới Galaxy Cinema:** Demo báo cáo khả thi C-level trên Admin AI.\",\r\n  \"conclusion\": \"Seed demo site feasibility. Chạy pipeline live để cập nhật số liệu thị trường thật.\",\r\n  \"references\": [\r\n    {\r\n      \"id\": 1,\r\n      \"title\": \"Seed · Giá thuê khu Đông (demo)\",\r\n      \"url\": \"https://example.com/seed/lease-east-hcm\",\r\n      \"domain\": \"example.com\",\r\n      \"ieeeText\": \"[1] \\\"Seed · Giá thuê khu Đông (demo)\\\", example.com, [Online]. Available: https://example.com/seed/lease-east-hcm\"\r\n    },\r\n    {\r\n      \"id\": 2,\r\n      \"title\": \"Seed · Metro & footfall (demo)\",\r\n      \"url\": \"https://example.com/seed/metro-footfall\",\r\n      \"domain\": \"example.com\",\r\n      \"ieeeText\": \"[2] \\\"Seed · Metro & footfall (demo)\\\", example.com, [Online]. Available: https://example.com/seed/metro-footfall\"\r\n    }\r\n  ]\r\n}");

            migrationBuilder.InsertData(
                table: "ConcessionProductEntity",
                columns: new[] { "ProductId", "ActiveAt", "Category", "CinemaId", "CostPrice", "CreatedAt", "CreatedByUserId", "DeletedAt", "DeletedByUserId", "Description", "ImageUrl", "IsActive", "IsAvailableOnline", "IsCombo", "IsDeleted", "LowStockThreshold", "ProductName", "Sku", "Unit", "UnitPrice", "UpdatedAt", "UpdatedByUserId" },
                values: new object[,]
                {
                    { new Guid("fb000001-0000-4000-8000-000000000001"), new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc), 0, new Guid("11111111-1111-1111-1111-111111111111"), 18000m, new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, null, "Bắp rang bơ (vừa)", null, true, true, false, false, 15, "Bắp rang bơ (vừa)", "POP-M", 2, 55000m, new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc), null },
                    { new Guid("fb000001-0000-4000-8000-000000000002"), new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc), 0, new Guid("11111111-1111-1111-1111-111111111111"), 22000m, new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, null, "Bắp rang bơ (lớn)", null, true, true, false, false, 15, "Bắp rang bơ (lớn)", "POP-L", 2, 70000m, new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc), null },
                    { new Guid("fb000001-0000-4000-8000-000000000003"), new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc), 0, new Guid("11111111-1111-1111-1111-111111111111"), 28000m, new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, null, "Bắp phô mai (lớn)", null, true, true, false, false, 15, "Bắp phô mai (lớn)", "POP-CHS", 2, 80000m, new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc), null },
                    { new Guid("fb000001-0000-4000-8000-000000000004"), new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc), 1, new Guid("11111111-1111-1111-1111-111111111111"), 10000m, new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, null, "Coca-Cola (vừa)", null, true, true, false, false, 15, "Coca-Cola (vừa)", "DRK-COKE", 1, 35000m, new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc), null },
                    { new Guid("fb000001-0000-4000-8000-000000000005"), new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc), 1, new Guid("11111111-1111-1111-1111-111111111111"), 12000m, new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, null, "Pepsi (lớn)", null, true, true, false, false, 15, "Pepsi (lớn)", "DRK-PEPSI", 1, 42000m, new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc), null },
                    { new Guid("fb000001-0000-4000-8000-000000000006"), new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc), 1, new Guid("11111111-1111-1111-1111-111111111111"), 6000m, new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, null, "Nước suối Aquafina", null, true, true, false, false, 15, "Nước suối Aquafina", "DRK-WTR", 0, 20000m, new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc), null },
                    { new Guid("fb000001-0000-4000-8000-000000000007"), new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc), 2, new Guid("11111111-1111-1111-1111-111111111111"), 15000m, new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, null, "Khoai tây lắc phô mai", null, true, true, false, false, 15, "Khoai tây lắc phô mai", "SNK-FRY", 2, 45000m, new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc), null },
                    { new Guid("fb000001-0000-4000-8000-000000000008"), new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc), 2, new Guid("11111111-1111-1111-1111-111111111111"), 13000m, new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, null, "Xúc xích nướng", null, true, true, false, false, 15, "Xúc xích nướng", "SNK-SAU", 0, 38000m, new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc), null },
                    { new Guid("fb000001-0000-4000-8000-000000000009"), new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc), 4, new Guid("11111111-1111-1111-1111-111111111111"), 62000m, new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, null, "Combo Đôi (2 bắp lớn + 2 Coca)", null, true, true, true, false, 0, "Combo Đôi (2 bắp lớn + 2 Coca)", "CMB-COUPLE", 3, 189000m, new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc), null },
                    { new Guid("fb000001-0000-4000-8000-000000000010"), new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc), 4, new Guid("11111111-1111-1111-1111-111111111111"), 28000m, new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, null, "Combo Solo (1 bắp vừa + 1 Coca)", null, true, true, true, false, 0, "Combo Solo (1 bắp vừa + 1 Coca)", "CMB-SOLO", 3, 85000m, new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc), null },
                    { new Guid("fb000002-0000-4000-8000-000000000001"), new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc), 0, new Guid("22222222-2222-2222-2222-222222222222"), 18000m, new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, null, "Bắp rang bơ (vừa)", null, true, true, false, false, 15, "Bắp rang bơ (vừa)", "POP-M", 2, 55000m, new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc), null },
                    { new Guid("fb000002-0000-4000-8000-000000000002"), new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc), 0, new Guid("22222222-2222-2222-2222-222222222222"), 22000m, new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, null, "Bắp rang bơ (lớn)", null, true, true, false, false, 15, "Bắp rang bơ (lớn)", "POP-L", 2, 70000m, new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc), null },
                    { new Guid("fb000002-0000-4000-8000-000000000003"), new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc), 0, new Guid("22222222-2222-2222-2222-222222222222"), 28000m, new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, null, "Bắp phô mai (lớn)", null, true, true, false, false, 15, "Bắp phô mai (lớn)", "POP-CHS", 2, 80000m, new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc), null },
                    { new Guid("fb000002-0000-4000-8000-000000000004"), new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc), 1, new Guid("22222222-2222-2222-2222-222222222222"), 10000m, new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, null, "Coca-Cola (vừa)", null, true, true, false, false, 15, "Coca-Cola (vừa)", "DRK-COKE", 1, 35000m, new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc), null },
                    { new Guid("fb000002-0000-4000-8000-000000000005"), new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc), 1, new Guid("22222222-2222-2222-2222-222222222222"), 12000m, new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, null, "Pepsi (lớn)", null, true, true, false, false, 15, "Pepsi (lớn)", "DRK-PEPSI", 1, 42000m, new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc), null },
                    { new Guid("fb000002-0000-4000-8000-000000000006"), new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc), 1, new Guid("22222222-2222-2222-2222-222222222222"), 6000m, new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, null, "Nước suối Aquafina", null, true, true, false, false, 15, "Nước suối Aquafina", "DRK-WTR", 0, 20000m, new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc), null },
                    { new Guid("fb000002-0000-4000-8000-000000000007"), new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc), 2, new Guid("22222222-2222-2222-2222-222222222222"), 15000m, new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, null, "Khoai tây lắc phô mai", null, true, true, false, false, 15, "Khoai tây lắc phô mai", "SNK-FRY", 2, 45000m, new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc), null },
                    { new Guid("fb000002-0000-4000-8000-000000000008"), new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc), 2, new Guid("22222222-2222-2222-2222-222222222222"), 13000m, new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, null, "Xúc xích nướng", null, true, true, false, false, 15, "Xúc xích nướng", "SNK-SAU", 0, 38000m, new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc), null },
                    { new Guid("fb000002-0000-4000-8000-000000000009"), new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc), 4, new Guid("22222222-2222-2222-2222-222222222222"), 62000m, new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, null, "Combo Đôi (2 bắp lớn + 2 Coca)", null, true, true, true, false, 0, "Combo Đôi (2 bắp lớn + 2 Coca)", "CMB-COUPLE", 3, 189000m, new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc), null },
                    { new Guid("fb000002-0000-4000-8000-000000000010"), new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc), 4, new Guid("22222222-2222-2222-2222-222222222222"), 28000m, new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, null, "Combo Solo (1 bắp vừa + 1 Coca)", null, true, true, true, false, 0, "Combo Solo (1 bắp vừa + 1 Coca)", "CMB-SOLO", 3, 85000m, new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc), null },
                    { new Guid("fb000003-0000-4000-8000-000000000001"), new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc), 0, new Guid("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"), 18000m, new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, null, "Bắp rang bơ (vừa)", null, true, true, false, false, 15, "Bắp rang bơ (vừa)", "POP-M", 2, 55000m, new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc), null },
                    { new Guid("fb000003-0000-4000-8000-000000000002"), new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc), 0, new Guid("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"), 22000m, new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, null, "Bắp rang bơ (lớn)", null, true, true, false, false, 15, "Bắp rang bơ (lớn)", "POP-L", 2, 70000m, new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc), null },
                    { new Guid("fb000003-0000-4000-8000-000000000003"), new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc), 0, new Guid("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"), 28000m, new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, null, "Bắp phô mai (lớn)", null, true, true, false, false, 15, "Bắp phô mai (lớn)", "POP-CHS", 2, 80000m, new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc), null },
                    { new Guid("fb000003-0000-4000-8000-000000000004"), new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc), 1, new Guid("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"), 10000m, new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, null, "Coca-Cola (vừa)", null, true, true, false, false, 15, "Coca-Cola (vừa)", "DRK-COKE", 1, 35000m, new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc), null },
                    { new Guid("fb000003-0000-4000-8000-000000000005"), new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc), 1, new Guid("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"), 12000m, new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, null, "Pepsi (lớn)", null, true, true, false, false, 15, "Pepsi (lớn)", "DRK-PEPSI", 1, 42000m, new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc), null },
                    { new Guid("fb000003-0000-4000-8000-000000000006"), new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc), 1, new Guid("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"), 6000m, new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, null, "Nước suối Aquafina", null, true, true, false, false, 15, "Nước suối Aquafina", "DRK-WTR", 0, 20000m, new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc), null },
                    { new Guid("fb000003-0000-4000-8000-000000000007"), new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc), 2, new Guid("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"), 15000m, new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, null, "Khoai tây lắc phô mai", null, true, true, false, false, 15, "Khoai tây lắc phô mai", "SNK-FRY", 2, 45000m, new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc), null },
                    { new Guid("fb000003-0000-4000-8000-000000000008"), new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc), 2, new Guid("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"), 13000m, new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, null, "Xúc xích nướng", null, true, true, false, false, 15, "Xúc xích nướng", "SNK-SAU", 0, 38000m, new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc), null },
                    { new Guid("fb000003-0000-4000-8000-000000000009"), new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc), 4, new Guid("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"), 62000m, new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, null, "Combo Đôi (2 bắp lớn + 2 Coca)", null, true, true, true, false, 0, "Combo Đôi (2 bắp lớn + 2 Coca)", "CMB-COUPLE", 3, 189000m, new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc), null },
                    { new Guid("fb000003-0000-4000-8000-000000000010"), new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc), 4, new Guid("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"), 28000m, new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, null, "Combo Solo (1 bắp vừa + 1 Coca)", null, true, true, true, false, 0, "Combo Solo (1 bắp vừa + 1 Coca)", "CMB-SOLO", 3, 85000m, new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc), null }
                });

            migrationBuilder.InsertData(
                table: "PermissionEntity",
                columns: new[] { "PermissionId", "PermissionInfo" },
                values: new object[,]
                {
                    { new Guid("a1b2c3d4-1111-1111-1111-111111111024"), "ViewConcession" },
                    { new Guid("a1b2c3d4-1111-1111-1111-111111111025"), "ManageConcession" },
                    { new Guid("a1b2c3d4-1111-1111-1111-111111111026"), "SellConcession" },
                    { new Guid("a1b2c3d4-1111-1111-1111-111111111027"), "ViewInventory" },
                    { new Guid("a1b2c3d4-1111-1111-1111-111111111028"), "ManageInventory" },
                    { new Guid("a1b2c3d4-1111-1111-1111-111111111029"), "ViewInventoryHistory" },
                    { new Guid("a1b2c3d4-1111-1111-1111-111111111030"), "PerformCleaning" },
                    { new Guid("a1b2c3d4-1111-1111-1111-111111111031"), "ManageCleaning" },
                    { new Guid("a1b2c3d4-1111-1111-1111-111111111032"), "VerifyCleaning" }
                });

            migrationBuilder.InsertData(
                table: "RoleListInfoEntity",
                columns: new[] { "RoleId", "DiscountPercent", "RoleName", "RoleType", "SalaryPerHour" },
                values: new object[,]
                {
                    { new Guid("7a4b3c5d-e0f1-a2b3-c4d5-e6f7a8b9c0d1"), 0m, "Janitor", 4, 0m },
                    { new Guid("8b5c4d6e-f1a2-b3c4-d5e6-f7a8b9c0d1e2"), 0m, "InventoryManager", 3, 0m }
                });

            migrationBuilder.InsertData(
                table: "ConcessionComboItemEntity",
                columns: new[] { "ComboItemId", "ComboProductId", "ComponentProductId", "Quantity" },
                values: new object[,]
                {
                    { new Guid("cb000001-0000-4000-8000-000000000001"), new Guid("fb000001-0000-4000-8000-000000000009"), new Guid("fb000001-0000-4000-8000-000000000002"), 2 },
                    { new Guid("cb000001-0000-4000-8000-000000000002"), new Guid("fb000001-0000-4000-8000-000000000009"), new Guid("fb000001-0000-4000-8000-000000000004"), 2 },
                    { new Guid("cb000001-0000-4000-8000-000000000003"), new Guid("fb000001-0000-4000-8000-000000000010"), new Guid("fb000001-0000-4000-8000-000000000001"), 1 },
                    { new Guid("cb000001-0000-4000-8000-000000000004"), new Guid("fb000001-0000-4000-8000-000000000010"), new Guid("fb000001-0000-4000-8000-000000000004"), 1 },
                    { new Guid("cb000002-0000-4000-8000-000000000001"), new Guid("fb000002-0000-4000-8000-000000000009"), new Guid("fb000002-0000-4000-8000-000000000002"), 2 },
                    { new Guid("cb000002-0000-4000-8000-000000000002"), new Guid("fb000002-0000-4000-8000-000000000009"), new Guid("fb000002-0000-4000-8000-000000000004"), 2 },
                    { new Guid("cb000002-0000-4000-8000-000000000003"), new Guid("fb000002-0000-4000-8000-000000000010"), new Guid("fb000002-0000-4000-8000-000000000001"), 1 },
                    { new Guid("cb000002-0000-4000-8000-000000000004"), new Guid("fb000002-0000-4000-8000-000000000010"), new Guid("fb000002-0000-4000-8000-000000000004"), 1 },
                    { new Guid("cb000003-0000-4000-8000-000000000001"), new Guid("fb000003-0000-4000-8000-000000000009"), new Guid("fb000003-0000-4000-8000-000000000002"), 2 },
                    { new Guid("cb000003-0000-4000-8000-000000000002"), new Guid("fb000003-0000-4000-8000-000000000009"), new Guid("fb000003-0000-4000-8000-000000000004"), 2 },
                    { new Guid("cb000003-0000-4000-8000-000000000003"), new Guid("fb000003-0000-4000-8000-000000000010"), new Guid("fb000003-0000-4000-8000-000000000001"), 1 },
                    { new Guid("cb000003-0000-4000-8000-000000000004"), new Guid("fb000003-0000-4000-8000-000000000010"), new Guid("fb000003-0000-4000-8000-000000000004"), 1 }
                });

            migrationBuilder.InsertData(
                table: "ConcessionInventoryEntity",
                columns: new[] { "ProductId", "LastCountedAt", "LastRestockedAt", "QuantityOnHand", "QuantityReserved", "UpdatedAt" },
                values: new object[,]
                {
                    { new Guid("fb000001-0000-4000-8000-000000000001"), null, new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc), 120, 0, new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("fb000001-0000-4000-8000-000000000002"), null, new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc), 100, 0, new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("fb000001-0000-4000-8000-000000000003"), null, new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc), 60, 0, new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("fb000001-0000-4000-8000-000000000004"), null, new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc), 200, 0, new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("fb000001-0000-4000-8000-000000000005"), null, new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc), 180, 0, new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("fb000001-0000-4000-8000-000000000006"), null, new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc), 250, 0, new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("fb000001-0000-4000-8000-000000000007"), null, new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc), 80, 0, new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("fb000001-0000-4000-8000-000000000008"), null, new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc), 90, 0, new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("fb000002-0000-4000-8000-000000000001"), null, new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc), 120, 0, new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("fb000002-0000-4000-8000-000000000002"), null, new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc), 100, 0, new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("fb000002-0000-4000-8000-000000000003"), null, new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc), 60, 0, new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("fb000002-0000-4000-8000-000000000004"), null, new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc), 200, 0, new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("fb000002-0000-4000-8000-000000000005"), null, new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc), 180, 0, new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("fb000002-0000-4000-8000-000000000006"), null, new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc), 250, 0, new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("fb000002-0000-4000-8000-000000000007"), null, new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc), 80, 0, new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("fb000002-0000-4000-8000-000000000008"), null, new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc), 90, 0, new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("fb000003-0000-4000-8000-000000000001"), null, new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc), 120, 0, new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("fb000003-0000-4000-8000-000000000002"), null, new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc), 100, 0, new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("fb000003-0000-4000-8000-000000000003"), null, new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc), 60, 0, new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("fb000003-0000-4000-8000-000000000004"), null, new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc), 200, 0, new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("fb000003-0000-4000-8000-000000000005"), null, new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc), 180, 0, new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("fb000003-0000-4000-8000-000000000006"), null, new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc), 250, 0, new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("fb000003-0000-4000-8000-000000000007"), null, new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc), 80, 0, new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("fb000003-0000-4000-8000-000000000008"), null, new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc), 90, 0, new DateTime(2026, 3, 18, 0, 0, 0, 0, DateTimeKind.Utc) }
                });

            migrationBuilder.InsertData(
                table: "PermissionForRoleEntity",
                columns: new[] { "PermissionId", "RoleId" },
                values: new object[,]
                {
                    { new Guid("a1b2c3d4-1111-1111-1111-111111111001"), new Guid("7a4b3c5d-e0f1-a2b3-c4d5-e6f7a8b9c0d1") },
                    { new Guid("a1b2c3d4-1111-1111-1111-111111111001"), new Guid("8b5c4d6e-f1a2-b3c4-d5e6-f7a8b9c0d1e2") },
                    { new Guid("a1b2c3d4-1111-1111-1111-111111111012"), new Guid("7a4b3c5d-e0f1-a2b3-c4d5-e6f7a8b9c0d1") },
                    { new Guid("a1b2c3d4-1111-1111-1111-111111111013"), new Guid("7a4b3c5d-e0f1-a2b3-c4d5-e6f7a8b9c0d1") },
                    { new Guid("a1b2c3d4-1111-1111-1111-111111111014"), new Guid("7a4b3c5d-e0f1-a2b3-c4d5-e6f7a8b9c0d1") },
                    { new Guid("a1b2c3d4-1111-1111-1111-111111111016"), new Guid("7a4b3c5d-e0f1-a2b3-c4d5-e6f7a8b9c0d1") },
                    { new Guid("a1b2c3d4-1111-1111-1111-111111111019"), new Guid("8b5c4d6e-f1a2-b3c4-d5e6-f7a8b9c0d1e2") },
                    { new Guid("a1b2c3d4-1111-1111-1111-111111111024"), new Guid("1a8f7b9c-d4e5-4f6a-b7c8-9d0e1f2a3b4c") },
                    { new Guid("a1b2c3d4-1111-1111-1111-111111111024"), new Guid("3c0d9e1f-a6b7-c8d9-e0f1-2a3b4c5d6e7f") },
                    { new Guid("a1b2c3d4-1111-1111-1111-111111111024"), new Guid("5e2f1a3b-c8d9-e0f1-a2b3-4c5d6e7f8a9b") },
                    { new Guid("a1b2c3d4-1111-1111-1111-111111111024"), new Guid("8b5c4d6e-f1a2-b3c4-d5e6-f7a8b9c0d1e2") },
                    { new Guid("a1b2c3d4-1111-1111-1111-111111111025"), new Guid("3c0d9e1f-a6b7-c8d9-e0f1-2a3b4c5d6e7f") },
                    { new Guid("a1b2c3d4-1111-1111-1111-111111111025"), new Guid("8b5c4d6e-f1a2-b3c4-d5e6-f7a8b9c0d1e2") },
                    { new Guid("a1b2c3d4-1111-1111-1111-111111111026"), new Guid("1a8f7b9c-d4e5-4f6a-b7c8-9d0e1f2a3b4c") },
                    { new Guid("a1b2c3d4-1111-1111-1111-111111111026"), new Guid("3c0d9e1f-a6b7-c8d9-e0f1-2a3b4c5d6e7f") },
                    { new Guid("a1b2c3d4-1111-1111-1111-111111111027"), new Guid("3c0d9e1f-a6b7-c8d9-e0f1-2a3b4c5d6e7f") },
                    { new Guid("a1b2c3d4-1111-1111-1111-111111111027"), new Guid("5e2f1a3b-c8d9-e0f1-a2b3-4c5d6e7f8a9b") },
                    { new Guid("a1b2c3d4-1111-1111-1111-111111111027"), new Guid("8b5c4d6e-f1a2-b3c4-d5e6-f7a8b9c0d1e2") },
                    { new Guid("a1b2c3d4-1111-1111-1111-111111111028"), new Guid("3c0d9e1f-a6b7-c8d9-e0f1-2a3b4c5d6e7f") },
                    { new Guid("a1b2c3d4-1111-1111-1111-111111111028"), new Guid("8b5c4d6e-f1a2-b3c4-d5e6-f7a8b9c0d1e2") },
                    { new Guid("a1b2c3d4-1111-1111-1111-111111111029"), new Guid("3c0d9e1f-a6b7-c8d9-e0f1-2a3b4c5d6e7f") },
                    { new Guid("a1b2c3d4-1111-1111-1111-111111111029"), new Guid("5e2f1a3b-c8d9-e0f1-a2b3-4c5d6e7f8a9b") },
                    { new Guid("a1b2c3d4-1111-1111-1111-111111111029"), new Guid("8b5c4d6e-f1a2-b3c4-d5e6-f7a8b9c0d1e2") },
                    { new Guid("a1b2c3d4-1111-1111-1111-111111111030"), new Guid("3c0d9e1f-a6b7-c8d9-e0f1-2a3b4c5d6e7f") },
                    { new Guid("a1b2c3d4-1111-1111-1111-111111111030"), new Guid("7a4b3c5d-e0f1-a2b3-c4d5-e6f7a8b9c0d1") },
                    { new Guid("a1b2c3d4-1111-1111-1111-111111111031"), new Guid("3c0d9e1f-a6b7-c8d9-e0f1-2a3b4c5d6e7f") },
                    { new Guid("a1b2c3d4-1111-1111-1111-111111111031"), new Guid("5e2f1a3b-c8d9-e0f1-a2b3-4c5d6e7f8a9b") },
                    { new Guid("a1b2c3d4-1111-1111-1111-111111111032"), new Guid("3c0d9e1f-a6b7-c8d9-e0f1-2a3b4c5d6e7f") },
                    { new Guid("a1b2c3d4-1111-1111-1111-111111111032"), new Guid("5e2f1a3b-c8d9-e0f1-a2b3-4c5d6e7f8a9b") }
                });

            migrationBuilder.CreateIndex(
                name: "IX_CleaningTaskEntity_AssignedStaffId_Status",
                table: "CleaningTaskEntity",
                columns: new[] { "AssignedStaffId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_CleaningTaskEntity_AuditoriumId_ScheduledAt",
                table: "CleaningTaskEntity",
                columns: new[] { "AuditoriumId", "ScheduledAt" });

            migrationBuilder.CreateIndex(
                name: "IX_CleaningTaskEntity_CinemaId_Status_ScheduledAt",
                table: "CleaningTaskEntity",
                columns: new[] { "CinemaId", "Status", "ScheduledAt" });

            migrationBuilder.CreateIndex(
                name: "IX_CleaningTaskEntity_MovieScheduleId",
                table: "CleaningTaskEntity",
                column: "MovieScheduleId",
                unique: true,
                filter: "[MovieScheduleId] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_CleaningTaskEntity_ShiftScheduleId",
                table: "CleaningTaskEntity",
                column: "ShiftScheduleId");

            migrationBuilder.CreateIndex(
                name: "IX_CleaningTaskEntity_VerifiedByUserId",
                table: "CleaningTaskEntity",
                column: "VerifiedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_ConcessionComboItemEntity_ComboProductId_ComponentProductId",
                table: "ConcessionComboItemEntity",
                columns: new[] { "ComboProductId", "ComponentProductId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ConcessionComboItemEntity_ComponentProductId",
                table: "ConcessionComboItemEntity",
                column: "ComponentProductId");

            migrationBuilder.CreateIndex(
                name: "IX_ConcessionProductEntity_CinemaId_Category_IsActive",
                table: "ConcessionProductEntity",
                columns: new[] { "CinemaId", "Category", "IsActive" });

            migrationBuilder.CreateIndex(
                name: "IX_ConcessionProductEntity_CinemaId_IsAvailableOnline_IsActive",
                table: "ConcessionProductEntity",
                columns: new[] { "CinemaId", "IsAvailableOnline", "IsActive" });

            migrationBuilder.CreateIndex(
                name: "IX_ConcessionProductEntity_CinemaId_Sku",
                table: "ConcessionProductEntity",
                columns: new[] { "CinemaId", "Sku" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_InventoryTransactionEntity_CinemaId_OccurredAt",
                table: "InventoryTransactionEntity",
                columns: new[] { "CinemaId", "OccurredAt" });

            migrationBuilder.CreateIndex(
                name: "IX_InventoryTransactionEntity_OrderId",
                table: "InventoryTransactionEntity",
                column: "OrderId");

            migrationBuilder.CreateIndex(
                name: "IX_InventoryTransactionEntity_ProductId_OccurredAt",
                table: "InventoryTransactionEntity",
                columns: new[] { "ProductId", "OccurredAt" });

            migrationBuilder.CreateIndex(
                name: "IX_OrderConcessionDetailEntity_OrderId",
                table: "OrderConcessionDetailEntity",
                column: "OrderId");

            migrationBuilder.CreateIndex(
                name: "IX_OrderConcessionDetailEntity_OrderId_ProductId",
                table: "OrderConcessionDetailEntity",
                columns: new[] { "OrderId", "ProductId" });

            migrationBuilder.CreateIndex(
                name: "IX_OrderConcessionDetailEntity_ProductId",
                table: "OrderConcessionDetailEntity",
                column: "ProductId");

            migrationBuilder.CreateIndex(
                name: "IX_OrderConcessionDetailEntity_StockState",
                table: "OrderConcessionDetailEntity",
                column: "StockState");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CleaningTaskEntity");

            migrationBuilder.DropTable(
                name: "ConcessionComboItemEntity");

            migrationBuilder.DropTable(
                name: "ConcessionInventoryEntity");

            migrationBuilder.DropTable(
                name: "InventoryTransactionEntity");

            migrationBuilder.DropTable(
                name: "OrderConcessionDetailEntity");

            migrationBuilder.DropTable(
                name: "ConcessionProductEntity");

            migrationBuilder.DeleteData(
                table: "PermissionForRoleEntity",
                keyColumns: new[] { "PermissionId", "RoleId" },
                keyValues: new object[] { new Guid("a1b2c3d4-1111-1111-1111-111111111001"), new Guid("7a4b3c5d-e0f1-a2b3-c4d5-e6f7a8b9c0d1") });

            migrationBuilder.DeleteData(
                table: "PermissionForRoleEntity",
                keyColumns: new[] { "PermissionId", "RoleId" },
                keyValues: new object[] { new Guid("a1b2c3d4-1111-1111-1111-111111111001"), new Guid("8b5c4d6e-f1a2-b3c4-d5e6-f7a8b9c0d1e2") });

            migrationBuilder.DeleteData(
                table: "PermissionForRoleEntity",
                keyColumns: new[] { "PermissionId", "RoleId" },
                keyValues: new object[] { new Guid("a1b2c3d4-1111-1111-1111-111111111012"), new Guid("7a4b3c5d-e0f1-a2b3-c4d5-e6f7a8b9c0d1") });

            migrationBuilder.DeleteData(
                table: "PermissionForRoleEntity",
                keyColumns: new[] { "PermissionId", "RoleId" },
                keyValues: new object[] { new Guid("a1b2c3d4-1111-1111-1111-111111111013"), new Guid("7a4b3c5d-e0f1-a2b3-c4d5-e6f7a8b9c0d1") });

            migrationBuilder.DeleteData(
                table: "PermissionForRoleEntity",
                keyColumns: new[] { "PermissionId", "RoleId" },
                keyValues: new object[] { new Guid("a1b2c3d4-1111-1111-1111-111111111014"), new Guid("7a4b3c5d-e0f1-a2b3-c4d5-e6f7a8b9c0d1") });

            migrationBuilder.DeleteData(
                table: "PermissionForRoleEntity",
                keyColumns: new[] { "PermissionId", "RoleId" },
                keyValues: new object[] { new Guid("a1b2c3d4-1111-1111-1111-111111111016"), new Guid("7a4b3c5d-e0f1-a2b3-c4d5-e6f7a8b9c0d1") });

            migrationBuilder.DeleteData(
                table: "PermissionForRoleEntity",
                keyColumns: new[] { "PermissionId", "RoleId" },
                keyValues: new object[] { new Guid("a1b2c3d4-1111-1111-1111-111111111019"), new Guid("8b5c4d6e-f1a2-b3c4-d5e6-f7a8b9c0d1e2") });

            migrationBuilder.DeleteData(
                table: "PermissionForRoleEntity",
                keyColumns: new[] { "PermissionId", "RoleId" },
                keyValues: new object[] { new Guid("a1b2c3d4-1111-1111-1111-111111111024"), new Guid("1a8f7b9c-d4e5-4f6a-b7c8-9d0e1f2a3b4c") });

            migrationBuilder.DeleteData(
                table: "PermissionForRoleEntity",
                keyColumns: new[] { "PermissionId", "RoleId" },
                keyValues: new object[] { new Guid("a1b2c3d4-1111-1111-1111-111111111024"), new Guid("3c0d9e1f-a6b7-c8d9-e0f1-2a3b4c5d6e7f") });

            migrationBuilder.DeleteData(
                table: "PermissionForRoleEntity",
                keyColumns: new[] { "PermissionId", "RoleId" },
                keyValues: new object[] { new Guid("a1b2c3d4-1111-1111-1111-111111111024"), new Guid("5e2f1a3b-c8d9-e0f1-a2b3-4c5d6e7f8a9b") });

            migrationBuilder.DeleteData(
                table: "PermissionForRoleEntity",
                keyColumns: new[] { "PermissionId", "RoleId" },
                keyValues: new object[] { new Guid("a1b2c3d4-1111-1111-1111-111111111024"), new Guid("8b5c4d6e-f1a2-b3c4-d5e6-f7a8b9c0d1e2") });

            migrationBuilder.DeleteData(
                table: "PermissionForRoleEntity",
                keyColumns: new[] { "PermissionId", "RoleId" },
                keyValues: new object[] { new Guid("a1b2c3d4-1111-1111-1111-111111111025"), new Guid("3c0d9e1f-a6b7-c8d9-e0f1-2a3b4c5d6e7f") });

            migrationBuilder.DeleteData(
                table: "PermissionForRoleEntity",
                keyColumns: new[] { "PermissionId", "RoleId" },
                keyValues: new object[] { new Guid("a1b2c3d4-1111-1111-1111-111111111025"), new Guid("8b5c4d6e-f1a2-b3c4-d5e6-f7a8b9c0d1e2") });

            migrationBuilder.DeleteData(
                table: "PermissionForRoleEntity",
                keyColumns: new[] { "PermissionId", "RoleId" },
                keyValues: new object[] { new Guid("a1b2c3d4-1111-1111-1111-111111111026"), new Guid("1a8f7b9c-d4e5-4f6a-b7c8-9d0e1f2a3b4c") });

            migrationBuilder.DeleteData(
                table: "PermissionForRoleEntity",
                keyColumns: new[] { "PermissionId", "RoleId" },
                keyValues: new object[] { new Guid("a1b2c3d4-1111-1111-1111-111111111026"), new Guid("3c0d9e1f-a6b7-c8d9-e0f1-2a3b4c5d6e7f") });

            migrationBuilder.DeleteData(
                table: "PermissionForRoleEntity",
                keyColumns: new[] { "PermissionId", "RoleId" },
                keyValues: new object[] { new Guid("a1b2c3d4-1111-1111-1111-111111111027"), new Guid("3c0d9e1f-a6b7-c8d9-e0f1-2a3b4c5d6e7f") });

            migrationBuilder.DeleteData(
                table: "PermissionForRoleEntity",
                keyColumns: new[] { "PermissionId", "RoleId" },
                keyValues: new object[] { new Guid("a1b2c3d4-1111-1111-1111-111111111027"), new Guid("5e2f1a3b-c8d9-e0f1-a2b3-4c5d6e7f8a9b") });

            migrationBuilder.DeleteData(
                table: "PermissionForRoleEntity",
                keyColumns: new[] { "PermissionId", "RoleId" },
                keyValues: new object[] { new Guid("a1b2c3d4-1111-1111-1111-111111111027"), new Guid("8b5c4d6e-f1a2-b3c4-d5e6-f7a8b9c0d1e2") });

            migrationBuilder.DeleteData(
                table: "PermissionForRoleEntity",
                keyColumns: new[] { "PermissionId", "RoleId" },
                keyValues: new object[] { new Guid("a1b2c3d4-1111-1111-1111-111111111028"), new Guid("3c0d9e1f-a6b7-c8d9-e0f1-2a3b4c5d6e7f") });

            migrationBuilder.DeleteData(
                table: "PermissionForRoleEntity",
                keyColumns: new[] { "PermissionId", "RoleId" },
                keyValues: new object[] { new Guid("a1b2c3d4-1111-1111-1111-111111111028"), new Guid("8b5c4d6e-f1a2-b3c4-d5e6-f7a8b9c0d1e2") });

            migrationBuilder.DeleteData(
                table: "PermissionForRoleEntity",
                keyColumns: new[] { "PermissionId", "RoleId" },
                keyValues: new object[] { new Guid("a1b2c3d4-1111-1111-1111-111111111029"), new Guid("3c0d9e1f-a6b7-c8d9-e0f1-2a3b4c5d6e7f") });

            migrationBuilder.DeleteData(
                table: "PermissionForRoleEntity",
                keyColumns: new[] { "PermissionId", "RoleId" },
                keyValues: new object[] { new Guid("a1b2c3d4-1111-1111-1111-111111111029"), new Guid("5e2f1a3b-c8d9-e0f1-a2b3-4c5d6e7f8a9b") });

            migrationBuilder.DeleteData(
                table: "PermissionForRoleEntity",
                keyColumns: new[] { "PermissionId", "RoleId" },
                keyValues: new object[] { new Guid("a1b2c3d4-1111-1111-1111-111111111029"), new Guid("8b5c4d6e-f1a2-b3c4-d5e6-f7a8b9c0d1e2") });

            migrationBuilder.DeleteData(
                table: "PermissionForRoleEntity",
                keyColumns: new[] { "PermissionId", "RoleId" },
                keyValues: new object[] { new Guid("a1b2c3d4-1111-1111-1111-111111111030"), new Guid("3c0d9e1f-a6b7-c8d9-e0f1-2a3b4c5d6e7f") });

            migrationBuilder.DeleteData(
                table: "PermissionForRoleEntity",
                keyColumns: new[] { "PermissionId", "RoleId" },
                keyValues: new object[] { new Guid("a1b2c3d4-1111-1111-1111-111111111030"), new Guid("7a4b3c5d-e0f1-a2b3-c4d5-e6f7a8b9c0d1") });

            migrationBuilder.DeleteData(
                table: "PermissionForRoleEntity",
                keyColumns: new[] { "PermissionId", "RoleId" },
                keyValues: new object[] { new Guid("a1b2c3d4-1111-1111-1111-111111111031"), new Guid("3c0d9e1f-a6b7-c8d9-e0f1-2a3b4c5d6e7f") });

            migrationBuilder.DeleteData(
                table: "PermissionForRoleEntity",
                keyColumns: new[] { "PermissionId", "RoleId" },
                keyValues: new object[] { new Guid("a1b2c3d4-1111-1111-1111-111111111031"), new Guid("5e2f1a3b-c8d9-e0f1-a2b3-4c5d6e7f8a9b") });

            migrationBuilder.DeleteData(
                table: "PermissionForRoleEntity",
                keyColumns: new[] { "PermissionId", "RoleId" },
                keyValues: new object[] { new Guid("a1b2c3d4-1111-1111-1111-111111111032"), new Guid("3c0d9e1f-a6b7-c8d9-e0f1-2a3b4c5d6e7f") });

            migrationBuilder.DeleteData(
                table: "PermissionForRoleEntity",
                keyColumns: new[] { "PermissionId", "RoleId" },
                keyValues: new object[] { new Guid("a1b2c3d4-1111-1111-1111-111111111032"), new Guid("5e2f1a3b-c8d9-e0f1-a2b3-4c5d6e7f8a9b") });

            migrationBuilder.DeleteData(
                table: "PermissionEntity",
                keyColumn: "PermissionId",
                keyValue: new Guid("a1b2c3d4-1111-1111-1111-111111111024"));

            migrationBuilder.DeleteData(
                table: "PermissionEntity",
                keyColumn: "PermissionId",
                keyValue: new Guid("a1b2c3d4-1111-1111-1111-111111111025"));

            migrationBuilder.DeleteData(
                table: "PermissionEntity",
                keyColumn: "PermissionId",
                keyValue: new Guid("a1b2c3d4-1111-1111-1111-111111111026"));

            migrationBuilder.DeleteData(
                table: "PermissionEntity",
                keyColumn: "PermissionId",
                keyValue: new Guid("a1b2c3d4-1111-1111-1111-111111111027"));

            migrationBuilder.DeleteData(
                table: "PermissionEntity",
                keyColumn: "PermissionId",
                keyValue: new Guid("a1b2c3d4-1111-1111-1111-111111111028"));

            migrationBuilder.DeleteData(
                table: "PermissionEntity",
                keyColumn: "PermissionId",
                keyValue: new Guid("a1b2c3d4-1111-1111-1111-111111111029"));

            migrationBuilder.DeleteData(
                table: "PermissionEntity",
                keyColumn: "PermissionId",
                keyValue: new Guid("a1b2c3d4-1111-1111-1111-111111111030"));

            migrationBuilder.DeleteData(
                table: "PermissionEntity",
                keyColumn: "PermissionId",
                keyValue: new Guid("a1b2c3d4-1111-1111-1111-111111111031"));

            migrationBuilder.DeleteData(
                table: "PermissionEntity",
                keyColumn: "PermissionId",
                keyValue: new Guid("a1b2c3d4-1111-1111-1111-111111111032"));

            migrationBuilder.DeleteData(
                table: "RoleListInfoEntity",
                keyColumn: "RoleId",
                keyValue: new Guid("7a4b3c5d-e0f1-a2b3-c4d5-e6f7a8b9c0d1"));

            migrationBuilder.DeleteData(
                table: "RoleListInfoEntity",
                keyColumn: "RoleId",
                keyValue: new Guid("8b5c4d6e-f1a2-b3c4-d5e6-f7a8b9c0d1e2"));

            migrationBuilder.DropColumn(
                name: "ConcessionSubtotal",
                table: "OrderInfoEntity");

            migrationBuilder.UpdateData(
                table: "AiResearchReportEntity",
                keyColumn: "JobId",
                keyValue: new Guid("a1000001-0001-4000-8000-000000000001"),
                column: "SummaryJson",
                value: "{\n  \"reportStyle\": \"executive_feasibility\",\n  \"title\": \"BÁO CÁO SEED · ĐÁNH GIÁ KHẢ THI GIÁ VÉ TPHCM (DEMO)\",\n  \"abstract\": \"Báo cáo seed demo cho Admin AI Workspace. Dữ liệu minh họa khung giá vé 2D và phụ thu định dạng tại TPHCM, phục vụ demo UI Business Research.\",\n  \"executiveSummary\": \"Seed demo: khung giá 2D cuối tuần và phụ thu IMAX tại TPHCM đủ để minh họa shortlist quyết định giá. Cần báo giá thực tế trước khi chốt policy.\",\n  \"confidenceNote\": \"Mức độ tin cậy demo (seed) · Rủi ro dữ liệu: Trung bình\",\n  \"totalClaims\": 2,\n  \"resolvedClaims\": 2,\n  \"insufficientClaims\": 0,\n  \"referenceCount\": 2,\n  \"keyFindings\": [\n    \"Seed: Giá vé 2D cuối tuần tại TPHCM có biên độ tham chiếu từ nguồn demo [1].\",\n    \"Seed: Phụ thu IMAX/4DX là đòn bẩy doanh thu suất cao cấp [2].\"\n  ],\n  \"recommendations\": [\n    \"P0 (Hành động ngay): Rà soát bảng giá 2D cuối tuần theo cụm rạp TPHCM.\",\n    \"P1 (Thẩm định chuyên sâu): Thu thập bảng giá chuỗi đối thủ trước khi chỉnh phụ thu IMAX.\",\n    \"P2 (Theo dõi chiến lược): Theo dõi conversion suất midweek sau khi thử khuyến mãi.\"\n  ],\n  \"risksAndUnknowns\": [\n    \"Dữ liệu seed chỉ mang tính minh họa UI, không dùng cho quyết định đầu tư thật.\"\n  ],\n  \"resultsAndDiscussion\": \"### B. Chi phí & định giá (seed)\\n\\n- **Thực trạng thị trường:** Khung giá 2D và phụ thu định dạng tại TPHCM (demo) [1], [2].\\n- **Đánh giá rủi ro & độ tin cậy:** Mức độ tin cậy trung bình (seed data).\\n- **Tác động tới Galaxy Cinema (CapEx/OpEx/Doanh thu):** Dùng để demo luồng báo cáo điều hành trên Admin AI.\",\n  \"conclusion\": \"Seed demo hoàn tất. Chạy job live để có báo cáo multi-agent thật.\",\n  \"references\": [\n    {\n      \"id\": 1,\n      \"title\": \"Seed · Giá vé 2D TPHCM (demo)\",\n      \"url\": \"https://example.com/seed/pricing-hcm-2d\",\n      \"domain\": \"example.com\",\n      \"ieeeText\": \"[1] \\\"Seed · Giá vé 2D TPHCM (demo)\\\", example.com, [Online]. Available: https://example.com/seed/pricing-hcm-2d\"\n    },\n    {\n      \"id\": 2,\n      \"title\": \"Seed · Phụ thu IMAX (demo)\",\n      \"url\": \"https://example.com/seed/pricing-imax\",\n      \"domain\": \"example.com\",\n      \"ieeeText\": \"[2] \\\"Seed · Phụ thu IMAX (demo)\\\", example.com, [Online]. Available: https://example.com/seed/pricing-imax\"\n    }\n  ]\n}");

            migrationBuilder.UpdateData(
                table: "AiResearchReportEntity",
                keyColumn: "JobId",
                keyValue: new Guid("a1000001-0001-4000-8000-000000000002"),
                column: "SummaryJson",
                value: "{\n  \"reportStyle\": \"executive_feasibility\",\n  \"title\": \"BÁO CÁO SEED · KHẢ THI ĐỊA ĐIỂM KHU ĐÔNG TPHCM (DEMO)\",\n  \"abstract\": \"Báo cáo seed demo shortlist mặt bằng khu Đông TPHCM: biên độ thuê và tín hiệu footfall metro.\",\n  \"executiveSummary\": \"Seed demo: khu Đông có tín hiệu footfall và biên độ thuê tham chiếu. Cần site visit + báo giá độc lập trước IC.\",\n  \"confidenceNote\": \"Mức độ tin cậy demo (seed) · Rủi ro dữ liệu: Trung bình\",\n  \"totalClaims\": 2,\n  \"resolvedClaims\": 2,\n  \"insufficientClaims\": 0,\n  \"referenceCount\": 2,\n  \"keyFindings\": [\n    \"Seed: Biên độ thuê mặt bằng khu Đông mang tính tham chiếu [1].\",\n    \"Seed: Metro/vành đai hỗ trợ kỳ vọng footfall dài hạn [2].\"\n  ],\n  \"recommendations\": [\n    \"P0 (Hành động ngay): Lập shortlist 3-5 mặt bằng khu Đông 1.500-3.000m².\",\n    \"P1 (Thẩm định chuyên sâu): Kiểm tra PCCC, tải trọng sàn, điều khoản fit-out.\",\n    \"P2 (Theo dõi chiến lược): Bám tiến độ metro quanh shortlist.\"\n  ],\n  \"risksAndUnknowns\": [\n    \"Seed data không thay thế thẩm định pháp lý và khảo sát hiện trường.\"\n  ],\n  \"resultsAndDiscussion\": \"### A. Quy hoạch & địa điểm (seed)\\n\\n- **Thực trạng thị trường:** Biên độ thuê và footfall khu Đông (demo) [1], [2].\\n- **Đánh giá rủi ro & độ tin cậy:** Trung bình (seed).\\n- **Tác động tới Galaxy Cinema:** Demo báo cáo khả thi C-level trên Admin AI.\",\n  \"conclusion\": \"Seed demo site feasibility. Chạy pipeline live để cập nhật số liệu thị trường thật.\",\n  \"references\": [\n    {\n      \"id\": 1,\n      \"title\": \"Seed · Giá thuê khu Đông (demo)\",\n      \"url\": \"https://example.com/seed/lease-east-hcm\",\n      \"domain\": \"example.com\",\n      \"ieeeText\": \"[1] \\\"Seed · Giá thuê khu Đông (demo)\\\", example.com, [Online]. Available: https://example.com/seed/lease-east-hcm\"\n    },\n    {\n      \"id\": 2,\n      \"title\": \"Seed · Metro & footfall (demo)\",\n      \"url\": \"https://example.com/seed/metro-footfall\",\n      \"domain\": \"example.com\",\n      \"ieeeText\": \"[2] \\\"Seed · Metro & footfall (demo)\\\", example.com, [Online]. Available: https://example.com/seed/metro-footfall\"\n    }\n  ]\n}");
        }
    }
}
