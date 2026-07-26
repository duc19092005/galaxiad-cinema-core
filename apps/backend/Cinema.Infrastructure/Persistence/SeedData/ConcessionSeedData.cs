using Cinema.Domain.Entities.Concessions;
using Cinema.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Cinema.Infrastructure.Persistence.SeedData;

public static class ConcessionSeedData
{
    /// <summary>
    /// Sinh menu bắp nước mặc định cho ba rạp đã seed sẵn.
    /// Mọi Guid và mốc thời gian đều cố định để EF không sinh migration diff rác.
    /// </summary>
    public static void AddConcessionSeedData(ModelBuilder modelBuilder)
    {
        var adminId = Guid.Parse("e4e1f7d8-c3b2-4a90-8c67-2f5a1b3d9e0c");
        var seedDate = new DateTime(2026, 3, 18, 0, 0, 0);

        var cinemaIds = new[]
        {
            Guid.Parse("11111111-1111-1111-1111-111111111111"),
            Guid.Parse("22222222-2222-2222-2222-222222222222"),
            Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb")
        };

        // Menu mẫu chuẩn kèm hình ảnh minh họa chất lượng cao cho ba rạp
        var template = new[]
        {
            new { Name = "Bắp rang bơ (vừa)",   Sku = "POP-M",    Cat = ConcessionCategory.Popcorn, Price = 55000m,  Cost = 18000m, Unit = ConcessionUnit.Box,   Stock = 120, Combo = false, Hot = false, Img = "https://images.unsplash.com/photo-1578849278619-e73505e9610f?w=600&auto=format&fit=crop&q=80" },
            new { Name = "Bắp rang bơ (lớn)",   Sku = "POP-L",    Cat = ConcessionCategory.Popcorn, Price = 70000m,  Cost = 22000m, Unit = ConcessionUnit.Box,   Stock = 100, Combo = false, Hot = false, Img = "https://images.unsplash.com/photo-1585647347384-2593bc35786b?w=600&auto=format&fit=crop&q=80" },
            new { Name = "Bắp phô mai (lớn)",   Sku = "POP-CHS",  Cat = ConcessionCategory.Popcorn, Price = 80000m,  Cost = 28000m, Unit = ConcessionUnit.Box,   Stock = 60,  Combo = false, Hot = true, Img = "https://images.unsplash.com/photo-1578849278619-e73505e9610f?w=600&auto=format&fit=crop&q=80" },
            new { Name = "Coca-Cola (vừa)",     Sku = "DRK-COKE", Cat = ConcessionCategory.Drink,   Price = 35000m,  Cost = 10000m, Unit = ConcessionUnit.Cup,   Stock = 200, Combo = false, Hot = true, Img = "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&auto=format&fit=crop&q=80" },
            new { Name = "Pepsi (lớn)",         Sku = "DRK-PEPSI",Cat = ConcessionCategory.Drink,   Price = 42000m,  Cost = 12000m, Unit = ConcessionUnit.Cup,   Stock = 180, Combo = false, Hot = false, Img = "https://images.unsplash.com/photo-1553456558-aff63285bdd1?w=600&auto=format&fit=crop&q=80" },
            new { Name = "Nước suối Aquafina",  Sku = "DRK-WTR",  Cat = ConcessionCategory.Drink,   Price = 20000m,  Cost = 6000m,  Unit = ConcessionUnit.Piece, Stock = 250, Combo = false, Hot = false, Img = "https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=600&auto=format&fit=crop&q=80" },
            new { Name = "Khoai tây lắc phô mai", Sku = "SNK-FRY",Cat = ConcessionCategory.Snack,   Price = 45000m,  Cost = 15000m, Unit = ConcessionUnit.Box,   Stock = 80,  Combo = false, Hot = false, Img = "https://images.unsplash.com/photo-1576107232684-1279f390859f?w=600&auto=format&fit=crop&q=80" },
            new { Name = "Xúc xích nướng",      Sku = "SNK-SAU",  Cat = ConcessionCategory.Snack,   Price = 38000m,  Cost = 13000m, Unit = ConcessionUnit.Piece, Stock = 90,  Combo = false, Hot = false, Img = "https://images.unsplash.com/photo-1619740455993-9e612b1af08a?w=600&auto=format&fit=crop&q=80" },
            new { Name = "Combo Đôi (2 bắp lớn + 2 Coca)", Sku = "CMB-COUPLE", Cat = ConcessionCategory.Combo, Price = 189000m, Cost = 62000m, Unit = ConcessionUnit.Combo, Stock = 0, Combo = true, Hot = true, Img = "https://images.unsplash.com/photo-1585647347384-2593bc35786b?w=600&auto=format&fit=crop&q=80" },
            new { Name = "Combo Solo (1 bắp vừa + 1 Coca)", Sku = "CMB-SOLO", Cat = ConcessionCategory.Combo, Price = 85000m,  Cost = 28000m, Unit = ConcessionUnit.Combo, Stock = 0, Combo = true, Hot = true, Img = "https://images.unsplash.com/photo-1578849278619-e73505e9610f?w=600&auto=format&fit=crop&q=80" }
        };

        var products = new List<ConcessionProductEntity>();
        var inventories = new List<ConcessionInventoryEntity>();
        var comboItems = new List<ConcessionComboItemEntity>();

        for (var ci = 0; ci < cinemaIds.Length; ci++)
        {
            var cinemaId = cinemaIds[ci];

            for (var pi = 0; pi < template.Length; pi++)
            {
                var t = template[pi];
                var productId = BuildProductId(ci, pi);

                products.Add(new ConcessionProductEntity
                {
                    ProductId = productId,
                    CinemaId = cinemaId,
                    ProductName = t.Name,
                    Sku = t.Sku,
                    Category = t.Cat,
                    UnitPrice = t.Price,
                    CostPrice = t.Cost,
                    Unit = t.Unit,
                    Description = t.Name,
                    ImageUrl = t.Img,
                    IsAvailableOnline = true,
                    IsHot = t.Hot,
                    IsCombo = t.Combo,
                    LowStockThreshold = t.Combo ? 0 : 15,
                    IsActive = true,
                    ActiveAt = seedDate,
                    CreatedAt = seedDate,
                    UpdatedAt = seedDate,
                    CreatedByUserId = adminId
                });

                if (!t.Combo)
                {
                    inventories.Add(new ConcessionInventoryEntity
                    {
                        ProductId = productId,
                        QuantityOnHand = t.Stock,
                        QuantityReserved = 0,
                        LastRestockedAt = seedDate,
                        UpdatedAt = seedDate
                    });
                }
            }

            comboItems.Add(new ConcessionComboItemEntity
            {
                ComboItemId = BuildComboItemId(ci, 0),
                ComboProductId = BuildProductId(ci, 8),
                ComponentProductId = BuildProductId(ci, 1),
                Quantity = 2
            });
            comboItems.Add(new ConcessionComboItemEntity
            {
                ComboItemId = BuildComboItemId(ci, 1),
                ComboProductId = BuildProductId(ci, 8),
                ComponentProductId = BuildProductId(ci, 3),
                Quantity = 2
            });

            comboItems.Add(new ConcessionComboItemEntity
            {
                ComboItemId = BuildComboItemId(ci, 2),
                ComboProductId = BuildProductId(ci, 9),
                ComponentProductId = BuildProductId(ci, 0),
                Quantity = 1
            });
            comboItems.Add(new ConcessionComboItemEntity
            {
                ComboItemId = BuildComboItemId(ci, 3),
                ComboProductId = BuildProductId(ci, 9),
                ComponentProductId = BuildProductId(ci, 3),
                Quantity = 1
            });
        }

        modelBuilder.Entity<ConcessionProductEntity>().HasData(products);
        modelBuilder.Entity<ConcessionInventoryEntity>().HasData(inventories);
        modelBuilder.Entity<ConcessionComboItemEntity>().HasData(comboItems);
    }

    private static Guid BuildProductId(int cinemaIndex, int productIndex)
        => Guid.Parse($"fb0000{cinemaIndex + 1:D2}-0000-4000-8000-{productIndex + 1:D12}");

    private static Guid BuildComboItemId(int cinemaIndex, int itemIndex)
        => Guid.Parse($"cb0000{cinemaIndex + 1:D2}-0000-4000-8000-{itemIndex + 1:D12}");
}
