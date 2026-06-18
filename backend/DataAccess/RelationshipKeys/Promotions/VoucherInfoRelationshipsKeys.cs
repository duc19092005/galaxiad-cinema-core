using BusinessLayer.Entities.Vouchers;
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

    public static void AddUserVoucherRelationships(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<UserVoucherEntity>()
            .HasKey(x => x.UserVoucherId);

        modelBuilder.Entity<UserVoucherEntity>()
            .HasOne(x => x.UserInfoEntity)
            .WithMany(x => x.UserVouchers)
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<UserVoucherEntity>()
            .HasOne(x => x.VoucherInfoEntity)
            .WithMany(x => x.UserVouchers)
            .HasForeignKey(x => x.VoucherId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

