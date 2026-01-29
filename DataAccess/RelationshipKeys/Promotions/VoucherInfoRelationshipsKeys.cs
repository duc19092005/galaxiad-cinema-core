using DataAccess.Entities.Vouchers;
using Microsoft.EntityFrameworkCore;

namespace DataAccess.RelationshipKeys.Promotions;

public static class VoucherInfoRelationshipsKeys
{
    public static void AddVoucherInfoRelationships(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<VoucherInfoEntity>()
            .HasOne(x => x.RoleListInfoEntity)
            .WithMany(x => x.VoucherInfoEntity)
            .HasForeignKey(x => x.roleId);
    }
    public static void AddVoucherInfoKeys(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<VoucherInfoEntity>().HasKey(x => x.voucherId);
        modelBuilder.Entity<VoucherInfoEntity>().HasIndex(x => x.voucherName).IsUnique();
        modelBuilder.Entity<VoucherInfoEntity>().HasIndex(x => x.voucherDescription).IsUnique();
    }
}

