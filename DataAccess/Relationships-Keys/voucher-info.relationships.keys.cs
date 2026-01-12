using DataAccess.Entities.Vouchers;
using Microsoft.EntityFrameworkCore;

namespace DataAccess.status_management_relationships_keys;

public class voucher_info_relationships_keys
{
    public static void add_voucher_info_relationships(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<voucher_info_entity>()
            .HasOne(x => x.role_list_info_entity)
            .WithMany(x => x.voucher_info_entity)
            .HasForeignKey(x => x.roleId);
    }
    public static void add_voucher_info_keys(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<voucher_info_entity>().HasKey(x => x.voucherId);
        modelBuilder.Entity<voucher_info_entity>().HasIndex(x => x.voucherName).IsUnique();
        modelBuilder.Entity<voucher_info_entity>().HasIndex(x => x.voucherDescription).IsUnique();
    }
}