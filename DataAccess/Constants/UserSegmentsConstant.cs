namespace DataAccess.Constants;

public static class user_segments_constant
{
    // --- Đối tượng phổ thông ---
    public static readonly Guid Adult = Guid.Parse("7b2e1a9d-3f5c-4e8b-91d2-a6b3c4d5e6f7");
    
    // --- Đối tượng ưu tiên (Thường có giảm giá) ---
    public static readonly Guid Student = Guid.Parse("1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d");
    public static readonly Guid Child = Guid.Parse("9f8e7d6c-5b4a-4e3d-2c1b-0a9f8e7d6c5b");
    public static readonly Guid SeniorCell = Guid.Parse("3d4e5f6a-7b8c-4d9e-0f1a-2b3c4d5e6f7a"); // Người cao tuổi

    // --- Đối tượng thành viên ---
    public static readonly Guid MemberStandard = Guid.Parse("5c6d7e8f-9a0b-4c1d-2e3f-4a5b6c7d8e9f");
    public static readonly Guid MemberVIP = Guid.Parse("d1e2f3a4-b5c6-4d7e-8f9a-0b1c2d3e4f5a");
}
