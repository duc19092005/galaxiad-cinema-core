using Cinema.Domain.Entities.Concessions;
using Microsoft.EntityFrameworkCore;

namespace Cinema.Infrastructure.Persistence.RelationshipKeys.Concessions;

public static class ConcessionRelationships
{
    public static void AddConcessionRelationships(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<ConcessionProductEntity>(entity =>
        {
            entity.HasKey(x => x.ProductId);

            // SKU chi can duy nhat trong pham vi mot rap, khong duy nhat toan he thong,
            // vi moi rap tu quan ly danh muc rieng.
            entity.HasIndex(x => new { x.CinemaId, x.Sku }).IsUnique();
            entity.HasIndex(x => new { x.CinemaId, x.Category, x.IsActive });
            entity.HasIndex(x => new { x.CinemaId, x.IsAvailableOnline, x.IsActive });

            entity.Property(x => x.Category).HasConversion<int>();
            entity.Property(x => x.Unit).HasConversion<int>();

            entity.HasOne(x => x.CinemaInfoEntity)
                .WithMany(c => c.ConcessionProducts)
                .HasForeignKey(x => x.CinemaId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<ConcessionComboItemEntity>(entity =>
        {
            entity.HasKey(x => x.ComboItemId);

            entity.HasIndex(x => new { x.ComboProductId, x.ComponentProductId }).IsUnique();

            entity.HasOne(x => x.ComboProduct)
                .WithMany(p => p.ComboItems)
                .HasForeignKey(x => x.ComboProductId)
                .OnDelete(DeleteBehavior.Restrict);

            // Restrict o ca hai chieu: neu Cascade thi SQL Server bao loi
            // multiple cascade paths vi hai FK cung tro ve mot bang.
            entity.HasOne(x => x.ComponentProduct)
                .WithMany()
                .HasForeignKey(x => x.ComponentProductId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<ConcessionInventoryEntity>(entity =>
        {
            entity.HasKey(x => x.ProductId);

            entity.Property(x => x.RowVersion).IsRowVersion();

            entity.HasOne(x => x.ConcessionProductEntity)
                .WithOne(p => p.Inventory)
                .HasForeignKey<ConcessionInventoryEntity>(x => x.ProductId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<InventoryTransactionEntity>(entity =>
        {
            entity.HasKey(x => x.TransactionId);

            entity.HasIndex(x => new { x.ProductId, x.OccurredAt });
            entity.HasIndex(x => new { x.CinemaId, x.OccurredAt });
            entity.HasIndex(x => x.OrderId);

            entity.Property(x => x.TransactionType).HasConversion<int>();

            entity.HasOne(x => x.ConcessionProductEntity)
                .WithMany(p => p.InventoryTransactions)
                .HasForeignKey(x => x.ProductId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(x => x.CinemaInfoEntity)
                .WithMany(c => c.InventoryTransactions)
                .HasForeignKey(x => x.CinemaId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<OrderConcessionDetailEntity>(entity =>
        {
            entity.HasKey(x => x.OrderConcessionDetailId);

            entity.HasIndex(x => x.OrderId);
            entity.HasIndex(x => new { x.OrderId, x.ProductId });

            // Job huy don quet theo trang thai de tim cac dong con dang giu kho
            entity.HasIndex(x => x.StockState);

            entity.Property(x => x.StockState).HasConversion<int>();

            entity.HasOne(x => x.OrderInfoEntity)
                .WithMany(o => o.OrderConcessionDetails)
                .HasForeignKey(x => x.OrderId)
                .OnDelete(DeleteBehavior.Cascade);

            // Restrict de khong the xoa san pham khi con nam trong hoa don cu,
            // giu nguyen tinh toan ven cua lich su ban hang.
            entity.HasOne(x => x.ConcessionProductEntity)
                .WithMany()
                .HasForeignKey(x => x.ProductId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<StockRequestEntity>(entity =>
        {
            entity.HasKey(x => x.StockRequestId);
            entity.HasIndex(x => x.RequestCode).IsUnique();
            entity.HasIndex(x => new { x.CinemaId, x.Status });

            entity.Property(x => x.Status).HasConversion<int>();

            entity.HasOne(x => x.CinemaInfoEntity)
                .WithMany()
                .HasForeignKey(x => x.CinemaId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(x => x.RequestedByUser)
                .WithMany()
                .HasForeignKey(x => x.RequestedByUserId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(x => x.ApprovedByUser)
                .WithMany()
                .HasForeignKey(x => x.ApprovedByUserId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(x => x.ShippedByUser)
                .WithMany()
                .HasForeignKey(x => x.ShippedByUserId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(x => x.ReceivedByUser)
                .WithMany()
                .HasForeignKey(x => x.ReceivedByUserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<StockRequestItemEntity>(entity =>
        {
            entity.HasKey(x => x.StockRequestItemId);

            entity.HasOne(x => x.StockRequestEntity)
                .WithMany(r => r.Items)
                .HasForeignKey(x => x.StockRequestId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(x => x.ConcessionProductEntity)
                .WithMany()
                .HasForeignKey(x => x.ProductId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<WasteReportEntity>(entity =>
        {
            entity.HasKey(x => x.WasteReportId);
            entity.HasIndex(x => new { x.CinemaId, x.Status });

            entity.Property(x => x.Status).HasConversion<int>();

            entity.HasOne(x => x.CinemaInfoEntity)
                .WithMany()
                .HasForeignKey(x => x.CinemaId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(x => x.ConcessionProductEntity)
                .WithMany()
                .HasForeignKey(x => x.ProductId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(x => x.ReportedByUser)
                .WithMany()
                .HasForeignKey(x => x.ReportedByUserId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(x => x.ReviewedByUser)
                .WithMany()
                .HasForeignKey(x => x.ReviewedByUserId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }
}
