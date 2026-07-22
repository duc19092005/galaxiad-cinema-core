using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Cinema.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class SeedAiResearchDemoData : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "AiResearchJobEntity",
                columns: new[] { "JobId", "AnalysisType", "BudgetCap", "BudgetUsed", "City", "CompletedAt", "CreatedAt", "CreatedByUserId", "ErrorMessage", "Notes", "RunMode", "SelectedModulesJson", "Status" },
                values: new object[,]
                {
                    { new Guid("a1000001-0001-4000-8000-000000000001"), "PricingAnalysis", 30, 12, "HCM", new DateTime(2026, 7, 10, 8, 18, 0, 0, DateTimeKind.Utc), new DateTime(2026, 7, 10, 8, 0, 0, 0, DateTimeKind.Utc), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, "Seed demo · khung giá vé TPHCM cuối tuần", "RunAll", "[\"pricing\",\"promotion\",\"competition\",\"trend_demand\",\"background\"]", "done" },
                    { new Guid("a1000001-0001-4000-8000-000000000002"), "SiteLocationFeasibility", 40, 18, "HCM", new DateTime(2026, 7, 12, 9, 56, 0, 0, DateTimeKind.Utc), new DateTime(2026, 7, 12, 9, 30, 0, 0, DateTimeKind.Utc), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, "Seed demo · shortlist mặt bằng khu Đông", "SelectedModules", "[\"zoning_policy\",\"real_estate_price\",\"lease_cost\",\"infrastructure_trend\"]", "done" },
                    { new Guid("a1000001-0001-4000-8000-000000000003"), "PricingAnalysis", 20, 0, "HN", null, new DateTime(2026, 7, 22, 3, 0, 0, 0, DateTimeKind.Utc), new Guid("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c"), null, "Seed demo · job mẫu đang chờ (không auto-run)", "SelectedModules", "[\"pricing\",\"competition\"]", "queued" }
                });

            migrationBuilder.InsertData(
                table: "AiResearchClaimEntity",
                columns: new[] { "ClaimId", "Category", "Classification", "Confidence", "CreatedAt", "IsCritical", "IterationCount", "JobId", "Status", "Text", "UpdatedAt" },
                values: new object[,]
                {
                    { new Guid("a1000002-0001-4000-8000-000000000001"), "pricing", "fact", 0.90m, new DateTime(2026, 7, 10, 8, 5, 0, 0, DateTimeKind.Utc), true, 2, new Guid("a1000001-0001-4000-8000-000000000001"), "resolved", "Khung giá vé 2D cuối tuần tại TPHCM của chuỗi rạp lớn", new DateTime(2026, 7, 10, 8, 15, 0, 0, DateTimeKind.Utc) },
                    { new Guid("a1000002-0001-4000-8000-000000000002"), "pricing", "fact", 0.85m, new DateTime(2026, 7, 10, 8, 6, 0, 0, DateTimeKind.Utc), true, 1, new Guid("a1000001-0001-4000-8000-000000000001"), "resolved", "Mức phụ thu định dạng IMAX/4DX phổ biến cuối tuần", new DateTime(2026, 7, 10, 8, 14, 0, 0, DateTimeKind.Utc) },
                    { new Guid("a1000002-0002-4000-8000-000000000001"), "real_estate_price", "fact", 0.88m, new DateTime(2026, 7, 12, 9, 38, 0, 0, DateTimeKind.Utc), true, 2, new Guid("a1000001-0001-4000-8000-000000000002"), "resolved", "Biên độ giá thuê mặt bằng thương mại khu Đông TPHCM", new DateTime(2026, 7, 12, 9, 50, 0, 0, DateTimeKind.Utc) },
                    { new Guid("a1000002-0002-4000-8000-000000000002"), "infrastructure_trend", "fact", 0.82m, new DateTime(2026, 7, 12, 9, 39, 0, 0, DateTimeKind.Utc), false, 2, new Guid("a1000001-0001-4000-8000-000000000002"), "resolved", "Tác động metro/vành đai tới footfall khu vực tăng trưởng", new DateTime(2026, 7, 12, 9, 52, 0, 0, DateTimeKind.Utc) }
                });

            migrationBuilder.InsertData(
                table: "AiResearchEventEntity",
                columns: new[] { "EventId", "CreatedAt", "EventType", "JobId", "PayloadJson" },
                values: new object[,]
                {
                    { 900001L, new DateTime(2026, 7, 10, 8, 0, 0, 0, DateTimeKind.Utc), "queued", new Guid("a1000001-0001-4000-8000-000000000001"), "{\"jobId\":\"a1000001-0001-4000-8000-000000000001\",\"status\":\"queued\",\"message\":\"Seed: job vào hàng đợi\"}" },
                    { 900002L, new DateTime(2026, 7, 10, 8, 18, 0, 0, DateTimeKind.Utc), "done", new Guid("a1000001-0001-4000-8000-000000000001"), "{\"jobId\":\"a1000001-0001-4000-8000-000000000001\",\"status\":\"done\",\"budgetUsed\":12,\"budgetCap\":30,\"message\":\"Seed: báo cáo pricing hoàn thành\"}" },
                    { 900003L, new DateTime(2026, 7, 12, 9, 30, 0, 0, DateTimeKind.Utc), "queued", new Guid("a1000001-0001-4000-8000-000000000002"), "{\"jobId\":\"a1000001-0001-4000-8000-000000000002\",\"status\":\"queued\",\"message\":\"Seed: job site feasibility\"}" },
                    { 900004L, new DateTime(2026, 7, 12, 9, 56, 0, 0, DateTimeKind.Utc), "done", new Guid("a1000001-0001-4000-8000-000000000002"), "{\"jobId\":\"a1000001-0001-4000-8000-000000000002\",\"status\":\"done\",\"budgetUsed\":18,\"budgetCap\":40,\"message\":\"Seed: báo cáo site feasibility hoàn thành\"}" },
                    { 900005L, new DateTime(2026, 7, 22, 3, 0, 0, 0, DateTimeKind.Utc), "queued", new Guid("a1000001-0001-4000-8000-000000000003"), "{\"jobId\":\"a1000001-0001-4000-8000-000000000003\",\"status\":\"queued\",\"message\":\"Seed: demo queued job\"}" }
                });

            migrationBuilder.InsertData(
                table: "AiResearchReportEntity",
                columns: new[] { "JobId", "GeneratedAt", "SectionsJson", "SummaryJson" },
                values: new object[,]
                {
                    { new Guid("a1000001-0001-4000-8000-000000000001"), new DateTime(2026, 7, 10, 8, 18, 0, 0, DateTimeKind.Utc), "[]", "{\n  \"reportStyle\": \"executive_feasibility\",\n  \"title\": \"BÁO CÁO SEED · ĐÁNH GIÁ KHẢ THI GIÁ VÉ TPHCM (DEMO)\",\n  \"abstract\": \"Báo cáo seed demo cho Admin AI Workspace. Dữ liệu minh họa khung giá vé 2D và phụ thu định dạng tại TPHCM, phục vụ demo UI Business Research.\",\n  \"executiveSummary\": \"Seed demo: khung giá 2D cuối tuần và phụ thu IMAX tại TPHCM đủ để minh họa shortlist quyết định giá. Cần báo giá thực tế trước khi chốt policy.\",\n  \"confidenceNote\": \"Mức độ tin cậy demo (seed) · Rủi ro dữ liệu: Trung bình\",\n  \"totalClaims\": 2,\n  \"resolvedClaims\": 2,\n  \"insufficientClaims\": 0,\n  \"referenceCount\": 2,\n  \"keyFindings\": [\n    \"Seed: Giá vé 2D cuối tuần tại TPHCM có biên độ tham chiếu từ nguồn demo [1].\",\n    \"Seed: Phụ thu IMAX/4DX là đòn bẩy doanh thu suất cao cấp [2].\"\n  ],\n  \"recommendations\": [\n    \"P0 (Hành động ngay): Rà soát bảng giá 2D cuối tuần theo cụm rạp TPHCM.\",\n    \"P1 (Thẩm định chuyên sâu): Thu thập bảng giá chuỗi đối thủ trước khi chỉnh phụ thu IMAX.\",\n    \"P2 (Theo dõi chiến lược): Theo dõi conversion suất midweek sau khi thử khuyến mãi.\"\n  ],\n  \"risksAndUnknowns\": [\n    \"Dữ liệu seed chỉ mang tính minh họa UI, không dùng cho quyết định đầu tư thật.\"\n  ],\n  \"resultsAndDiscussion\": \"### B. Chi phí & định giá (seed)\\n\\n- **Thực trạng thị trường:** Khung giá 2D và phụ thu định dạng tại TPHCM (demo) [1], [2].\\n- **Đánh giá rủi ro & độ tin cậy:** Mức độ tin cậy trung bình (seed data).\\n- **Tác động tới Galaxy Cinema (CapEx/OpEx/Doanh thu):** Dùng để demo luồng báo cáo điều hành trên Admin AI.\",\n  \"conclusion\": \"Seed demo hoàn tất. Chạy job live để có báo cáo multi-agent thật.\",\n  \"references\": [\n    {\n      \"id\": 1,\n      \"title\": \"Seed · Giá vé 2D TPHCM (demo)\",\n      \"url\": \"https://example.com/seed/pricing-hcm-2d\",\n      \"domain\": \"example.com\",\n      \"ieeeText\": \"[1] \\\"Seed · Giá vé 2D TPHCM (demo)\\\", example.com, [Online]. Available: https://example.com/seed/pricing-hcm-2d\"\n    },\n    {\n      \"id\": 2,\n      \"title\": \"Seed · Phụ thu IMAX (demo)\",\n      \"url\": \"https://example.com/seed/pricing-imax\",\n      \"domain\": \"example.com\",\n      \"ieeeText\": \"[2] \\\"Seed · Phụ thu IMAX (demo)\\\", example.com, [Online]. Available: https://example.com/seed/pricing-imax\"\n    }\n  ]\n}" },
                    { new Guid("a1000001-0001-4000-8000-000000000002"), new DateTime(2026, 7, 12, 9, 56, 0, 0, DateTimeKind.Utc), "[]", "{\n  \"reportStyle\": \"executive_feasibility\",\n  \"title\": \"BÁO CÁO SEED · KHẢ THI ĐỊA ĐIỂM KHU ĐÔNG TPHCM (DEMO)\",\n  \"abstract\": \"Báo cáo seed demo shortlist mặt bằng khu Đông TPHCM: biên độ thuê và tín hiệu footfall metro.\",\n  \"executiveSummary\": \"Seed demo: khu Đông có tín hiệu footfall và biên độ thuê tham chiếu. Cần site visit + báo giá độc lập trước IC.\",\n  \"confidenceNote\": \"Mức độ tin cậy demo (seed) · Rủi ro dữ liệu: Trung bình\",\n  \"totalClaims\": 2,\n  \"resolvedClaims\": 2,\n  \"insufficientClaims\": 0,\n  \"referenceCount\": 2,\n  \"keyFindings\": [\n    \"Seed: Biên độ thuê mặt bằng khu Đông mang tính tham chiếu [1].\",\n    \"Seed: Metro/vành đai hỗ trợ kỳ vọng footfall dài hạn [2].\"\n  ],\n  \"recommendations\": [\n    \"P0 (Hành động ngay): Lập shortlist 3-5 mặt bằng khu Đông 1.500-3.000m².\",\n    \"P1 (Thẩm định chuyên sâu): Kiểm tra PCCC, tải trọng sàn, điều khoản fit-out.\",\n    \"P2 (Theo dõi chiến lược): Bám tiến độ metro quanh shortlist.\"\n  ],\n  \"risksAndUnknowns\": [\n    \"Seed data không thay thế thẩm định pháp lý và khảo sát hiện trường.\"\n  ],\n  \"resultsAndDiscussion\": \"### A. Quy hoạch & địa điểm (seed)\\n\\n- **Thực trạng thị trường:** Biên độ thuê và footfall khu Đông (demo) [1], [2].\\n- **Đánh giá rủi ro & độ tin cậy:** Trung bình (seed).\\n- **Tác động tới Galaxy Cinema:** Demo báo cáo khả thi C-level trên Admin AI.\",\n  \"conclusion\": \"Seed demo site feasibility. Chạy pipeline live để cập nhật số liệu thị trường thật.\",\n  \"references\": [\n    {\n      \"id\": 1,\n      \"title\": \"Seed · Giá thuê khu Đông (demo)\",\n      \"url\": \"https://example.com/seed/lease-east-hcm\",\n      \"domain\": \"example.com\",\n      \"ieeeText\": \"[1] \\\"Seed · Giá thuê khu Đông (demo)\\\", example.com, [Online]. Available: https://example.com/seed/lease-east-hcm\"\n    },\n    {\n      \"id\": 2,\n      \"title\": \"Seed · Metro & footfall (demo)\",\n      \"url\": \"https://example.com/seed/metro-footfall\",\n      \"domain\": \"example.com\",\n      \"ieeeText\": \"[2] \\\"Seed · Metro & footfall (demo)\\\", example.com, [Online]. Available: https://example.com/seed/metro-footfall\"\n    }\n  ]\n}" }
                });

            migrationBuilder.InsertData(
                table: "AiResearchEvidenceEntity",
                columns: new[] { "EvidenceId", "ClaimId", "CreatedAt", "DomainTrustTier", "ExtractedContent", "IterationAdded", "PublishedDate", "QueryUsed", "Relation", "Snippet", "SourceDomain", "SourceType", "Title", "Url" },
                values: new object[,]
                {
                    { new Guid("a1000003-0001-4000-8000-000000000001"), new Guid("a1000002-0001-4000-8000-000000000001"), new DateTime(2026, 7, 10, 8, 8, 0, 0, DateTimeKind.Utc), "medium", "", 1, new DateTime(2026, 6, 1, 0, 0, 0, 0, DateTimeKind.Utc), "giá vé 2D TPHCM cuối tuần", "supports", "Khung giá tham chiếu cuối tuần cho suất 2D tại TPHCM (dữ liệu seed).", "example.com", "seed", "Seed · Giá vé 2D TPHCM (demo)", "https://example.com/seed/pricing-hcm-2d" },
                    { new Guid("a1000003-0001-4000-8000-000000000002"), new Guid("a1000002-0001-4000-8000-000000000002"), new DateTime(2026, 7, 10, 8, 9, 0, 0, DateTimeKind.Utc), "medium", "", 1, new DateTime(2026, 6, 5, 0, 0, 0, 0, DateTimeKind.Utc), "phụ thu IMAX rạp TPHCM", "supports", "Phụ thu định dạng đặc biệt cuối tuần (dữ liệu seed).", "example.com", "seed", "Seed · Phụ thu IMAX (demo)", "https://example.com/seed/pricing-imax" },
                    { new Guid("a1000003-0002-4000-8000-000000000001"), new Guid("a1000002-0002-4000-8000-000000000001"), new DateTime(2026, 7, 12, 9, 40, 0, 0, DateTimeKind.Utc), "medium", "", 1, new DateTime(2026, 5, 20, 0, 0, 0, 0, DateTimeKind.Utc), "giá thuê mặt bằng khu Đông TPHCM", "supports", "Biên độ thuê mặt bằng thương mại khu Đông (dữ liệu seed).", "example.com", "seed", "Seed · Giá thuê khu Đông (demo)", "https://example.com/seed/lease-east-hcm" },
                    { new Guid("a1000003-0002-4000-8000-000000000002"), new Guid("a1000002-0002-4000-8000-000000000002"), new DateTime(2026, 7, 12, 9, 41, 0, 0, DateTimeKind.Utc), "medium", "", 1, new DateTime(2026, 5, 28, 0, 0, 0, 0, DateTimeKind.Utc), "metro TPHCM footfall TTTM", "supports", "Tín hiệu footfall quanh tuyến metro (dữ liệu seed).", "example.com", "seed", "Seed · Metro & footfall (demo)", "https://example.com/seed/metro-footfall" }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "AiResearchEventEntity",
                keyColumn: "EventId",
                keyValue: 900001L);

            migrationBuilder.DeleteData(
                table: "AiResearchEventEntity",
                keyColumn: "EventId",
                keyValue: 900002L);

            migrationBuilder.DeleteData(
                table: "AiResearchEventEntity",
                keyColumn: "EventId",
                keyValue: 900003L);

            migrationBuilder.DeleteData(
                table: "AiResearchEventEntity",
                keyColumn: "EventId",
                keyValue: 900004L);

            migrationBuilder.DeleteData(
                table: "AiResearchEventEntity",
                keyColumn: "EventId",
                keyValue: 900005L);

            migrationBuilder.DeleteData(
                table: "AiResearchEvidenceEntity",
                keyColumn: "EvidenceId",
                keyValue: new Guid("a1000003-0001-4000-8000-000000000001"));

            migrationBuilder.DeleteData(
                table: "AiResearchEvidenceEntity",
                keyColumn: "EvidenceId",
                keyValue: new Guid("a1000003-0001-4000-8000-000000000002"));

            migrationBuilder.DeleteData(
                table: "AiResearchEvidenceEntity",
                keyColumn: "EvidenceId",
                keyValue: new Guid("a1000003-0002-4000-8000-000000000001"));

            migrationBuilder.DeleteData(
                table: "AiResearchEvidenceEntity",
                keyColumn: "EvidenceId",
                keyValue: new Guid("a1000003-0002-4000-8000-000000000002"));

            migrationBuilder.DeleteData(
                table: "AiResearchReportEntity",
                keyColumn: "JobId",
                keyValue: new Guid("a1000001-0001-4000-8000-000000000001"));

            migrationBuilder.DeleteData(
                table: "AiResearchReportEntity",
                keyColumn: "JobId",
                keyValue: new Guid("a1000001-0001-4000-8000-000000000002"));

            migrationBuilder.DeleteData(
                table: "AiResearchClaimEntity",
                keyColumn: "ClaimId",
                keyValue: new Guid("a1000002-0001-4000-8000-000000000001"));

            migrationBuilder.DeleteData(
                table: "AiResearchClaimEntity",
                keyColumn: "ClaimId",
                keyValue: new Guid("a1000002-0001-4000-8000-000000000002"));

            migrationBuilder.DeleteData(
                table: "AiResearchClaimEntity",
                keyColumn: "ClaimId",
                keyValue: new Guid("a1000002-0002-4000-8000-000000000001"));

            migrationBuilder.DeleteData(
                table: "AiResearchClaimEntity",
                keyColumn: "ClaimId",
                keyValue: new Guid("a1000002-0002-4000-8000-000000000002"));

            migrationBuilder.DeleteData(
                table: "AiResearchJobEntity",
                keyColumn: "JobId",
                keyValue: new Guid("a1000001-0001-4000-8000-000000000003"));

            migrationBuilder.DeleteData(
                table: "AiResearchJobEntity",
                keyColumn: "JobId",
                keyValue: new Guid("a1000001-0001-4000-8000-000000000001"));

            migrationBuilder.DeleteData(
                table: "AiResearchJobEntity",
                keyColumn: "JobId",
                keyValue: new Guid("a1000001-0001-4000-8000-000000000002"));
        }
    }
}
