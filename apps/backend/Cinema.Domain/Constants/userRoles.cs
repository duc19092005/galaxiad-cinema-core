using System;

namespace Cinema.Domain.Constants;

public static class userRoles
{
    public static readonly Guid Cashier = Guid.Parse("1a8f7b9c-d4e5-4f6a-b7c8-9d0e1f2a3b4c");
    public static readonly Guid Customer = Guid.Parse("2b9c8d0e-f5a6-7b8c-d9e0-1f2a3b4c5d6e");
    public static readonly Guid Admin = Guid.Parse("3c0d9e1f-a6b7-c8d9-e0f1-2a3b4c5d6e7f");
    public static readonly Guid MovieManager = Guid.Parse("4d1e0f2a-b7c8-d9e0-f1a2-3b4c5d6e7f8a");
    public static readonly Guid TheaterManager = Guid.Parse("5e2f1a3b-c8d9-e0f1-a2b3-4c5d6e7f8a9b");
    public static readonly Guid FacilitiesManager = Guid.Parse("6f3a2b4c-d9e0-f1a2-b3c4-d5e6f7a8b9c0");

    /// <summary>Nhân viên quét dọn rạp</summary>
    public static readonly Guid Janitor = Guid.Parse("7a4b3c5d-e0f1-a2b3-c4d5-e6f7a8b9c0d1");

    /// <summary>Quản lý kho đồ ăn thức uống của một rạp</summary>
    public static readonly Guid InventoryManager = Guid.Parse("8b5c4d6e-f1a2-b3c4-d5e6-f7a8b9c0d1e2");

    /// <summary>Quản lý kho tổng phụ trách luân chuyển hàng F&B cho các rạp</summary>
    public static readonly Guid WarehouseManager = Guid.Parse("9c6d5e7f-2b3c-4d5e-6f7a-8b9c0d1e2f3a");
}
