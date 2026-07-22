using System;
using Cinema.Domain.Entities.AiResearch;
using Microsoft.EntityFrameworkCore;

namespace Cinema.Infrastructure.Persistence.SeedData;

/// <summary>
/// Demo AI research jobs for Admin AI Workspace (Business Research tab).
/// Fixed GUIDs keep HasData migrations stable.
/// </summary>
public static class AiResearchSeedData
{
    // Same admin user as UserInfo seed (admin@cinema.com).
    private static readonly Guid AdminUserId = Guid.Parse("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c");

    private static readonly Guid JobPricingDone = Guid.Parse("a1000001-0001-4000-8000-000000000001");
    private static readonly Guid JobSiteDone = Guid.Parse("a1000001-0001-4000-8000-000000000002");
    private static readonly Guid JobQueuedDemo = Guid.Parse("a1000001-0001-4000-8000-000000000003");

    private static readonly Guid ClaimPricing1 = Guid.Parse("a1000002-0001-4000-8000-000000000001");
    private static readonly Guid ClaimPricing2 = Guid.Parse("a1000002-0001-4000-8000-000000000002");
    private static readonly Guid ClaimSite1 = Guid.Parse("a1000002-0002-4000-8000-000000000001");
    private static readonly Guid ClaimSite2 = Guid.Parse("a1000002-0002-4000-8000-000000000002");

    private static readonly Guid EvidenceP1 = Guid.Parse("a1000003-0001-4000-8000-000000000001");
    private static readonly Guid EvidenceP2 = Guid.Parse("a1000003-0001-4000-8000-000000000002");
    private static readonly Guid EvidenceS1 = Guid.Parse("a1000003-0002-4000-8000-000000000001");
    private static readonly Guid EvidenceS2 = Guid.Parse("a1000003-0002-4000-8000-000000000002");

    public static void AddAiResearchSeedData(ModelBuilder modelBuilder)
    {
        var createdPricing = new DateTime(2026, 7, 10, 8, 0, 0, DateTimeKind.Utc);
        var createdSite = new DateTime(2026, 7, 12, 9, 30, 0, DateTimeKind.Utc);
        var createdQueued = new DateTime(2026, 7, 22, 3, 0, 0, DateTimeKind.Utc);

        modelBuilder.Entity<AiResearchJobEntity>().HasData(
            new AiResearchJobEntity
            {
                JobId = JobPricingDone,
                City = "HCM",
                AnalysisType = "PricingAnalysis",
                RunMode = "RunAll",
                SelectedModulesJson = "[\"pricing\",\"promotion\",\"competition\",\"trend_demand\",\"background\"]",
                Notes = "Seed demo · khung giá vé TPHCM cuối tuần",
                Status = "done",
                BudgetUsed = 12,
                BudgetCap = 30,
                CreatedByUserId = AdminUserId,
                CreatedAt = createdPricing,
                CompletedAt = createdPricing.AddMinutes(18),
                ErrorMessage = null
            },
            new AiResearchJobEntity
            {
                JobId = JobSiteDone,
                City = "HCM",
                AnalysisType = "SiteLocationFeasibility",
                RunMode = "SelectedModules",
                SelectedModulesJson = "[\"zoning_policy\",\"real_estate_price\",\"lease_cost\",\"infrastructure_trend\"]",
                Notes = "Seed demo · shortlist mặt bằng khu Đông",
                Status = "done",
                BudgetUsed = 18,
                BudgetCap = 40,
                CreatedByUserId = AdminUserId,
                CreatedAt = createdSite,
                CompletedAt = createdSite.AddMinutes(26),
                ErrorMessage = null
            },
            new AiResearchJobEntity
            {
                JobId = JobQueuedDemo,
                City = "HN",
                AnalysisType = "PricingAnalysis",
                RunMode = "SelectedModules",
                SelectedModulesJson = "[\"pricing\",\"competition\"]",
                Notes = "Seed demo · job mẫu đang chờ (không auto-run)",
                Status = "queued",
                BudgetUsed = 0,
                BudgetCap = 20,
                CreatedByUserId = AdminUserId,
                CreatedAt = createdQueued,
                CompletedAt = null,
                ErrorMessage = null
            }
        );

        modelBuilder.Entity<AiResearchEventEntity>().HasData(
            new AiResearchEventEntity
            {
                EventId = 900001,
                JobId = JobPricingDone,
                EventType = "queued",
                PayloadJson = "{\"jobId\":\"" + JobPricingDone + "\",\"status\":\"queued\",\"message\":\"Seed: job vào hàng đợi\"}",
                CreatedAt = createdPricing
            },
            new AiResearchEventEntity
            {
                EventId = 900002,
                JobId = JobPricingDone,
                EventType = "done",
                PayloadJson = "{\"jobId\":\"" + JobPricingDone + "\",\"status\":\"done\",\"budgetUsed\":12,\"budgetCap\":30,\"message\":\"Seed: báo cáo pricing hoàn thành\"}",
                CreatedAt = createdPricing.AddMinutes(18)
            },
            new AiResearchEventEntity
            {
                EventId = 900003,
                JobId = JobSiteDone,
                EventType = "queued",
                PayloadJson = "{\"jobId\":\"" + JobSiteDone + "\",\"status\":\"queued\",\"message\":\"Seed: job site feasibility\"}",
                CreatedAt = createdSite
            },
            new AiResearchEventEntity
            {
                EventId = 900004,
                JobId = JobSiteDone,
                EventType = "done",
                PayloadJson = "{\"jobId\":\"" + JobSiteDone + "\",\"status\":\"done\",\"budgetUsed\":18,\"budgetCap\":40,\"message\":\"Seed: báo cáo site feasibility hoàn thành\"}",
                CreatedAt = createdSite.AddMinutes(26)
            },
            new AiResearchEventEntity
            {
                EventId = 900005,
                JobId = JobQueuedDemo,
                EventType = "queued",
                PayloadJson = "{\"jobId\":\"" + JobQueuedDemo + "\",\"status\":\"queued\",\"message\":\"Seed: demo queued job\"}",
                CreatedAt = createdQueued
            }
        );

        modelBuilder.Entity<AiResearchClaimEntity>().HasData(
            new AiResearchClaimEntity
            {
                ClaimId = ClaimPricing1,
                JobId = JobPricingDone,
                Text = "Khung giá vé 2D cuối tuần tại TPHCM của chuỗi rạp lớn",
                Category = "pricing",
                IsCritical = true,
                Status = "resolved",
                IterationCount = 2,
                Confidence = 0.90m,
                Classification = "fact",
                CreatedAt = createdPricing.AddMinutes(5),
                UpdatedAt = createdPricing.AddMinutes(15)
            },
            new AiResearchClaimEntity
            {
                ClaimId = ClaimPricing2,
                JobId = JobPricingDone,
                Text = "Mức phụ thu định dạng IMAX/4DX phổ biến cuối tuần",
                Category = "pricing",
                IsCritical = true,
                Status = "resolved",
                IterationCount = 1,
                Confidence = 0.85m,
                Classification = "fact",
                CreatedAt = createdPricing.AddMinutes(6),
                UpdatedAt = createdPricing.AddMinutes(14)
            },
            new AiResearchClaimEntity
            {
                ClaimId = ClaimSite1,
                JobId = JobSiteDone,
                Text = "Biên độ giá thuê mặt bằng thương mại khu Đông TPHCM",
                Category = "real_estate_price",
                IsCritical = true,
                Status = "resolved",
                IterationCount = 2,
                Confidence = 0.88m,
                Classification = "fact",
                CreatedAt = createdSite.AddMinutes(8),
                UpdatedAt = createdSite.AddMinutes(20)
            },
            new AiResearchClaimEntity
            {
                ClaimId = ClaimSite2,
                JobId = JobSiteDone,
                Text = "Tác động metro/vành đai tới footfall khu vực tăng trưởng",
                Category = "infrastructure_trend",
                IsCritical = false,
                Status = "resolved",
                IterationCount = 2,
                Confidence = 0.82m,
                Classification = "fact",
                CreatedAt = createdSite.AddMinutes(9),
                UpdatedAt = createdSite.AddMinutes(22)
            }
        );

        modelBuilder.Entity<AiResearchEvidenceEntity>().HasData(
            new AiResearchEvidenceEntity
            {
                EvidenceId = EvidenceP1,
                ClaimId = ClaimPricing1,
                Url = "https://example.com/seed/pricing-hcm-2d",
                Title = "Seed · Giá vé 2D TPHCM (demo)",
                Snippet = "Khung giá tham chiếu cuối tuần cho suất 2D tại TPHCM (dữ liệu seed).",
                ExtractedContent = "",
                PublishedDate = new DateTime(2026, 6, 1, 0, 0, 0, DateTimeKind.Utc),
                QueryUsed = "giá vé 2D TPHCM cuối tuần",
                SourceDomain = "example.com",
                SourceType = "seed",
                DomainTrustTier = "medium",
                Relation = "supports",
                IterationAdded = 1,
                CreatedAt = createdPricing.AddMinutes(8)
            },
            new AiResearchEvidenceEntity
            {
                EvidenceId = EvidenceP2,
                ClaimId = ClaimPricing2,
                Url = "https://example.com/seed/pricing-imax",
                Title = "Seed · Phụ thu IMAX (demo)",
                Snippet = "Phụ thu định dạng đặc biệt cuối tuần (dữ liệu seed).",
                ExtractedContent = "",
                PublishedDate = new DateTime(2026, 6, 5, 0, 0, 0, DateTimeKind.Utc),
                QueryUsed = "phụ thu IMAX rạp TPHCM",
                SourceDomain = "example.com",
                SourceType = "seed",
                DomainTrustTier = "medium",
                Relation = "supports",
                IterationAdded = 1,
                CreatedAt = createdPricing.AddMinutes(9)
            },
            new AiResearchEvidenceEntity
            {
                EvidenceId = EvidenceS1,
                ClaimId = ClaimSite1,
                Url = "https://example.com/seed/lease-east-hcm",
                Title = "Seed · Giá thuê khu Đông (demo)",
                Snippet = "Biên độ thuê mặt bằng thương mại khu Đông (dữ liệu seed).",
                ExtractedContent = "",
                PublishedDate = new DateTime(2026, 5, 20, 0, 0, 0, DateTimeKind.Utc),
                QueryUsed = "giá thuê mặt bằng khu Đông TPHCM",
                SourceDomain = "example.com",
                SourceType = "seed",
                DomainTrustTier = "medium",
                Relation = "supports",
                IterationAdded = 1,
                CreatedAt = createdSite.AddMinutes(10)
            },
            new AiResearchEvidenceEntity
            {
                EvidenceId = EvidenceS2,
                ClaimId = ClaimSite2,
                Url = "https://example.com/seed/metro-footfall",
                Title = "Seed · Metro & footfall (demo)",
                Snippet = "Tín hiệu footfall quanh tuyến metro (dữ liệu seed).",
                ExtractedContent = "",
                PublishedDate = new DateTime(2026, 5, 28, 0, 0, 0, DateTimeKind.Utc),
                QueryUsed = "metro TPHCM footfall TTTM",
                SourceDomain = "example.com",
                SourceType = "seed",
                DomainTrustTier = "medium",
                Relation = "supports",
                IterationAdded = 1,
                CreatedAt = createdSite.AddMinutes(11)
            }
        );

        var pricingSummaryJson =
            """
            {
              "reportStyle": "executive_feasibility",
              "title": "BÁO CÁO SEED · ĐÁNH GIÁ KHẢ THI GIÁ VÉ TPHCM (DEMO)",
              "abstract": "Báo cáo seed demo cho Admin AI Workspace. Dữ liệu minh họa khung giá vé 2D và phụ thu định dạng tại TPHCM, phục vụ demo UI Business Research.",
              "executiveSummary": "Seed demo: khung giá 2D cuối tuần và phụ thu IMAX tại TPHCM đủ để minh họa shortlist quyết định giá. Cần báo giá thực tế trước khi chốt policy.",
              "confidenceNote": "Mức độ tin cậy demo (seed) · Rủi ro dữ liệu: Trung bình",
              "totalClaims": 2,
              "resolvedClaims": 2,
              "insufficientClaims": 0,
              "referenceCount": 2,
              "keyFindings": [
                "Seed: Giá vé 2D cuối tuần tại TPHCM có biên độ tham chiếu từ nguồn demo [1].",
                "Seed: Phụ thu IMAX/4DX là đòn bẩy doanh thu suất cao cấp [2]."
              ],
              "recommendations": [
                "P0 (Hành động ngay): Rà soát bảng giá 2D cuối tuần theo cụm rạp TPHCM.",
                "P1 (Thẩm định chuyên sâu): Thu thập bảng giá chuỗi đối thủ trước khi chỉnh phụ thu IMAX.",
                "P2 (Theo dõi chiến lược): Theo dõi conversion suất midweek sau khi thử khuyến mãi."
              ],
              "risksAndUnknowns": [
                "Dữ liệu seed chỉ mang tính minh họa UI, không dùng cho quyết định đầu tư thật."
              ],
              "resultsAndDiscussion": "### B. Chi phí & định giá (seed)\n\n- **Thực trạng thị trường:** Khung giá 2D và phụ thu định dạng tại TPHCM (demo) [1], [2].\n- **Đánh giá rủi ro & độ tin cậy:** Mức độ tin cậy trung bình (seed data).\n- **Tác động tới Galaxy Cinema (CapEx/OpEx/Doanh thu):** Dùng để demo luồng báo cáo điều hành trên Admin AI.",
              "conclusion": "Seed demo hoàn tất. Chạy job live để có báo cáo multi-agent thật.",
              "references": [
                {
                  "id": 1,
                  "title": "Seed · Giá vé 2D TPHCM (demo)",
                  "url": "https://example.com/seed/pricing-hcm-2d",
                  "domain": "example.com",
                  "ieeeText": "[1] \"Seed · Giá vé 2D TPHCM (demo)\", example.com, [Online]. Available: https://example.com/seed/pricing-hcm-2d"
                },
                {
                  "id": 2,
                  "title": "Seed · Phụ thu IMAX (demo)",
                  "url": "https://example.com/seed/pricing-imax",
                  "domain": "example.com",
                  "ieeeText": "[2] \"Seed · Phụ thu IMAX (demo)\", example.com, [Online]. Available: https://example.com/seed/pricing-imax"
                }
              ]
            }
            """;

        var siteSummaryJson =
            """
            {
              "reportStyle": "executive_feasibility",
              "title": "BÁO CÁO SEED · KHẢ THI ĐỊA ĐIỂM KHU ĐÔNG TPHCM (DEMO)",
              "abstract": "Báo cáo seed demo shortlist mặt bằng khu Đông TPHCM: biên độ thuê và tín hiệu footfall metro.",
              "executiveSummary": "Seed demo: khu Đông có tín hiệu footfall và biên độ thuê tham chiếu. Cần site visit + báo giá độc lập trước IC.",
              "confidenceNote": "Mức độ tin cậy demo (seed) · Rủi ro dữ liệu: Trung bình",
              "totalClaims": 2,
              "resolvedClaims": 2,
              "insufficientClaims": 0,
              "referenceCount": 2,
              "keyFindings": [
                "Seed: Biên độ thuê mặt bằng khu Đông mang tính tham chiếu [1].",
                "Seed: Metro/vành đai hỗ trợ kỳ vọng footfall dài hạn [2]."
              ],
              "recommendations": [
                "P0 (Hành động ngay): Lập shortlist 3-5 mặt bằng khu Đông 1.500-3.000m².",
                "P1 (Thẩm định chuyên sâu): Kiểm tra PCCC, tải trọng sàn, điều khoản fit-out.",
                "P2 (Theo dõi chiến lược): Bám tiến độ metro quanh shortlist."
              ],
              "risksAndUnknowns": [
                "Seed data không thay thế thẩm định pháp lý và khảo sát hiện trường."
              ],
              "resultsAndDiscussion": "### A. Quy hoạch & địa điểm (seed)\n\n- **Thực trạng thị trường:** Biên độ thuê và footfall khu Đông (demo) [1], [2].\n- **Đánh giá rủi ro & độ tin cậy:** Trung bình (seed).\n- **Tác động tới Galaxy Cinema:** Demo báo cáo khả thi C-level trên Admin AI.",
              "conclusion": "Seed demo site feasibility. Chạy pipeline live để cập nhật số liệu thị trường thật.",
              "references": [
                {
                  "id": 1,
                  "title": "Seed · Giá thuê khu Đông (demo)",
                  "url": "https://example.com/seed/lease-east-hcm",
                  "domain": "example.com",
                  "ieeeText": "[1] \"Seed · Giá thuê khu Đông (demo)\", example.com, [Online]. Available: https://example.com/seed/lease-east-hcm"
                },
                {
                  "id": 2,
                  "title": "Seed · Metro & footfall (demo)",
                  "url": "https://example.com/seed/metro-footfall",
                  "domain": "example.com",
                  "ieeeText": "[2] \"Seed · Metro & footfall (demo)\", example.com, [Online]. Available: https://example.com/seed/metro-footfall"
                }
              ]
            }
            """;

        modelBuilder.Entity<AiResearchReportEntity>().HasData(
            new AiResearchReportEntity
            {
                JobId = JobPricingDone,
                GeneratedAt = createdPricing.AddMinutes(18),
                SectionsJson = "[]",
                SummaryJson = pricingSummaryJson.Trim()
            },
            new AiResearchReportEntity
            {
                JobId = JobSiteDone,
                GeneratedAt = createdSite.AddMinutes(26),
                SectionsJson = "[]",
                SummaryJson = siteSummaryJson.Trim()
            }
        );
    }
}
