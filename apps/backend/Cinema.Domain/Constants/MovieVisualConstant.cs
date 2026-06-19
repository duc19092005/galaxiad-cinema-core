namespace Cinema.Application.Constants;

public static class movie_visual_constant
{
    // --- Định dạng tiêu chuẩn ---
    public static readonly Guid Format2D = Guid.Parse("3fbc4a32-15f5-47e0-b98a-784f1b8a9612");
    public static readonly Guid Format3D = Guid.Parse("7a5e82b1-c4d3-4a92-9e11-3f4b52c1a8d9");

    // --- Định dạng âm thanh & màn hình lớn ---
    public static readonly Guid Imax = Guid.Parse("d29b0f1c-8e2a-4c5b-bc3d-1a2f3e4d5c6b");
    public static readonly Guid DolbyAtmos = Guid.Parse("f9e1d2c3-b4a5-4e6f-8d7c-9b0a1f2e3d4c");

    // --- Định dạng trải nghiệm đặc biệt ---
    public static readonly Guid ScreenX = Guid.Parse("a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d");
    public static readonly Guid FourDX = Guid.Parse("5d4c3b2a-1f0e-4d9c-8b7a-6e5d4c3b2a1f");

    // --- Định dạng cao cấp ---
    public static readonly Guid GoldClass = Guid.Parse("9f8e7d6c-5b4a-4e3d-2c1b-0a9f8e7d6c5b");
    public static readonly Guid LAmour = Guid.Parse("1c2d3e4f-5a6b-4c7d-8e9f-0a1b2c3d4e5f");
}
