from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class ModuleTemplate:
    key: str
    label: str
    critical: bool
    claim_prompts: tuple[str, ...]
    seed_queries: tuple[str, ...]


@dataclass(frozen=True)
class AnalysisTemplate:
    key: str
    label: str
    modules: dict[str, ModuleTemplate]


TEMPLATES: dict[str, AnalysisTemplate] = {
    "PricingAnalysis": AnalysisTemplate(
        key="PricingAnalysis",
        label="Pricing Analysis",
        modules={
            "pricing": ModuleTemplate(
                "pricing",
                "Giá vé",
                True,
                (
                    "Mức giá vé 2D phổ biến của các chuỗi rạp lớn tại {city}",
                    "Chênh lệch giá vé ngày thường và cuối tuần tại {city}",
                    "Phụ thu theo định dạng IMAX, 4DX hoặc phòng chiếu đặc biệt tại {city}",
                ),
                ("giá vé rạp chiếu phim {city}", "bảng giá CGV Lotte Galaxy BHD Beta {city}"),
            ),
            "promotion": ModuleTemplate(
                "promotion",
                "Khuyến mãi",
                True,
                (
                    "Các chương trình member và ưu đãi giá vé đang áp dụng tại {city}",
                    "Các combo vé và bắp nước có ảnh hưởng đáng kể đến tổng chi tiêu",
                ),
                ("khuyến mãi vé xem phim {city}", "ưu đãi thành viên rạp chiếu phim {city}"),
            ),
            "competition": ModuleTemplate(
                "competition",
                "Đối thủ",
                False,
                (
                    "Vị thế giá tương đối giữa CGV, Lotte, Galaxy, BHD và Beta tại {city}",
                    "Mật độ và khu vực hoạt động nổi bật của các chuỗi rạp đối thủ tại {city}",
                ),
                ("hệ thống rạp CGV Lotte Galaxy BHD Beta {city}",),
            ),
            "trend_demand": ModuleTemplate(
                "trend_demand",
                "Xu hướng nhu cầu",
                False,
                ("Xu hướng điều chỉnh giá vé và nhu cầu xem phim gần đây tại {city}",),
                ("xu hướng giá vé rạp chiếu phim {city}",),
            ),
            "background": ModuleTemplate(
                "background",
                "Bối cảnh",
                False,
                ("Bối cảnh thị trường rạp chiếu phim tại {city}",),
                ("thị trường rạp chiếu phim {city}",),
            ),
        },
    ),
    "SiteLocationFeasibility": AnalysisTemplate(
        key="SiteLocationFeasibility",
        label="Site/Location Feasibility",
        modules={
            "zoning_policy": ModuleTemplate(
                "zoning_policy",
                "Quy hoạch",
                True,
                (
                    "Các khu đô thị, khu dân cư và quy hoạch thương mại đáng chú ý tại {city}",
                    "Các rủi ro pháp lý hoặc thay đổi quy hoạch có thể ảnh hưởng địa điểm rạp tại {city}",
                ),
                ("quy hoạch mới nhất {city} khu đô thị thương mại", "cổng thông tin quy hoạch {city}"),
            ),
            "real_estate_price": ModuleTemplate(
                "real_estate_price",
                "Giá bất động sản",
                True,
                (
                    "Mức giá thuê mặt bằng thương mại tham khảo tại các khu tăng trưởng của {city}",
                    "Biên độ giá thuê theo khu vực trung tâm và khu đô thị mới tại {city}",
                ),
                ("giá thuê mặt bằng thương mại {city}", "giá thuê trung tâm thương mại {city}"),
            ),
            "lease_cost": ModuleTemplate(
                "lease_cost",
                "Chi phí thuê",
                True,
                (
                    "Chi phí thuê ước tính cho mặt bằng rạp diện tích 1500-3000m2 tại {city}",
                    "Các khoản chi phí thuê và vận hành cần dự phòng ngoài giá thuê cơ bản",
                ),
                ("thuê mặt bằng 2000m2 mở rạp chiếu phim {city}",),
            ),
            "infrastructure_trend": ModuleTemplate(
                "infrastructure_trend",
                "Hạ tầng",
                False,
                (
                    "Các dự án metro, vành đai và hạ tầng 1-3 năm tới tác động đến lưu lượng tại {city}",
                    "Các trung tâm thương mại và cụm dân cư mới có tiềm năng tạo nhu cầu xem phim",
                ),
                ("dự án hạ tầng 2026 2027 2028 {city}", "trung tâm thương mại mới {city}"),
            ),
            "investment_incentive": ModuleTemplate(
                "investment_incentive",
                "Ưu đãi đầu tư",
                False,
                ("Các ưu đãi đầu tư hoặc chính sách hỗ trợ có liên quan đến dự án dịch vụ tại {city}",),
                ("ưu đãi đầu tư dự án dịch vụ văn hóa {city}",),
            ),
        },
    ),
}


CITY_LABELS = {"HCM": "TPHCM", "HN": "Hà Nội"}


def get_template(analysis_type: str) -> AnalysisTemplate:
    template = TEMPLATES.get(analysis_type)
    if template is None:
        raise ValueError(f"Unsupported analysis type: {analysis_type}")
    return template


def resolve_modules(analysis_type: str, selected_modules: list[str]) -> list[ModuleTemplate]:
    template = get_template(analysis_type)
    if not selected_modules:
        return list(template.modules.values())

    unknown = sorted(set(selected_modules) - set(template.modules))
    if unknown:
        raise ValueError(f"Unsupported modules: {', '.join(unknown)}")
    return [template.modules[key] for key in selected_modules]
