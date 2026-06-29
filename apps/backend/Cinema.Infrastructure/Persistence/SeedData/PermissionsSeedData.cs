using Cinema.Domain.Constants;
using Cinema.Domain.Entities.UserInfos;
using Microsoft.EntityFrameworkCore;

namespace Cinema.Infrastructure.SeedData;

public static class PermissionsSeedData
{
    public static void AddPermissionsSeedData(ModelBuilder modelBuilder)
    {
        // Seed Permissions
        modelBuilder.Entity<PermissionEntity>().HasData(
            new PermissionEntity { PermissionId = userPermissions.ViewCinema, PermissionInfo = "ViewCinema" },
            new PermissionEntity { PermissionId = userPermissions.ManageCinema, PermissionInfo = "ManageCinema" },
            new PermissionEntity { PermissionId = userPermissions.ViewAuditorium, PermissionInfo = "ViewAuditorium" },
            new PermissionEntity { PermissionId = userPermissions.ManageAuditorium, PermissionInfo = "ManageAuditorium" },
            new PermissionEntity { PermissionId = userPermissions.ViewMovie, PermissionInfo = "ViewMovie" },
            new PermissionEntity { PermissionId = userPermissions.ManageMovie, PermissionInfo = "ManageMovie" },
            new PermissionEntity { PermissionId = userPermissions.ViewSchedule, PermissionInfo = "ViewSchedule" },
            new PermissionEntity { PermissionId = userPermissions.ManageSchedule, PermissionInfo = "ManageSchedule" },
            new PermissionEntity { PermissionId = userPermissions.BookTicket, PermissionInfo = "BookTicket" },
            new PermissionEntity { PermissionId = userPermissions.SellTicket, PermissionInfo = "SellTicket" },
            new PermissionEntity { PermissionId = userPermissions.ViewHistory, PermissionInfo = "ViewHistory" },
            new PermissionEntity { PermissionId = userPermissions.ClockIn, PermissionInfo = "ClockIn" },
            new PermissionEntity { PermissionId = userPermissions.ClockOut, PermissionInfo = "ClockOut" },
            new PermissionEntity { PermissionId = userPermissions.RegisterShift, PermissionInfo = "RegisterShift" },
            new PermissionEntity { PermissionId = userPermissions.ApproveShift, PermissionInfo = "ApproveShift" },
            new PermissionEntity { PermissionId = userPermissions.ViewPayroll, PermissionInfo = "ViewPayroll" },
            new PermissionEntity { PermissionId = userPermissions.ProcessPayroll, PermissionInfo = "ProcessPayroll" },
            new PermissionEntity { PermissionId = userPermissions.ManageUsers, PermissionInfo = "ManageUsers" },
            new PermissionEntity { PermissionId = userPermissions.ViewAuditLogs, PermissionInfo = "ViewAuditLogs" },
            new PermissionEntity { PermissionId = userPermissions.ManageVouchers, PermissionInfo = "ManageVouchers" },
            new PermissionEntity { PermissionId = userPermissions.ManageFormats, PermissionInfo = "ManageFormats" },
            new PermissionEntity { PermissionId = userPermissions.ManageSurcharges, PermissionInfo = "ManageSurcharges" },
            new PermissionEntity { PermissionId = userPermissions.ManageStaffProfiles, PermissionInfo = "ManageStaffProfiles" }
        );

        // Helper to create PermissionForRole seed entries
        var allPermissionIds = new[]
        {
            userPermissions.ViewCinema, userPermissions.ManageCinema,
            userPermissions.ViewAuditorium, userPermissions.ManageAuditorium,
            userPermissions.ViewMovie, userPermissions.ManageMovie,
            userPermissions.ViewSchedule, userPermissions.ManageSchedule,
            userPermissions.BookTicket, userPermissions.SellTicket,
            userPermissions.ViewHistory, userPermissions.ClockIn,
            userPermissions.ClockOut, userPermissions.RegisterShift,
            userPermissions.ApproveShift, userPermissions.ViewPayroll,
            userPermissions.ProcessPayroll, userPermissions.ManageUsers,
            userPermissions.ViewAuditLogs, userPermissions.ManageVouchers,
            userPermissions.ManageFormats, userPermissions.ManageSurcharges,
            userPermissions.ManageStaffProfiles
        };

        // Admin gets ALL permissions
        var adminPerms = allPermissionIds.Select(pid => new PermissionForRoleEntity
        {
            PermissionId = pid,
            RoleId = userRoles.Admin
        }).ToList();
        modelBuilder.Entity<PermissionForRoleEntity>().HasData(adminPerms);

        // Cashier permissions
        modelBuilder.Entity<PermissionForRoleEntity>().HasData(
            new PermissionForRoleEntity { PermissionId = userPermissions.SellTicket, RoleId = userRoles.Cashier },
            new PermissionForRoleEntity { PermissionId = userPermissions.BookTicket, RoleId = userRoles.Cashier },
            new PermissionForRoleEntity { PermissionId = userPermissions.ViewHistory, RoleId = userRoles.Cashier },
            new PermissionForRoleEntity { PermissionId = userPermissions.ClockIn, RoleId = userRoles.Cashier },
            new PermissionForRoleEntity { PermissionId = userPermissions.ClockOut, RoleId = userRoles.Cashier },
            new PermissionForRoleEntity { PermissionId = userPermissions.RegisterShift, RoleId = userRoles.Cashier },
            new PermissionForRoleEntity { PermissionId = userPermissions.ViewCinema, RoleId = userRoles.Cashier },
            new PermissionForRoleEntity { PermissionId = userPermissions.ViewSchedule, RoleId = userRoles.Cashier },
            new PermissionForRoleEntity { PermissionId = userPermissions.ViewPayroll, RoleId = userRoles.Cashier }
        );

        // Customer permissions
        modelBuilder.Entity<PermissionForRoleEntity>().HasData(
            new PermissionForRoleEntity { PermissionId = userPermissions.BookTicket, RoleId = userRoles.Customer },
            new PermissionForRoleEntity { PermissionId = userPermissions.ViewHistory, RoleId = userRoles.Customer },
            new PermissionForRoleEntity { PermissionId = userPermissions.ViewCinema, RoleId = userRoles.Customer },
            new PermissionForRoleEntity { PermissionId = userPermissions.ViewMovie, RoleId = userRoles.Customer },
            new PermissionForRoleEntity { PermissionId = userPermissions.ViewSchedule, RoleId = userRoles.Customer }
        );

        // TheaterManager permissions
        modelBuilder.Entity<PermissionForRoleEntity>().HasData(
            new PermissionForRoleEntity { PermissionId = userPermissions.ViewCinema, RoleId = userRoles.TheaterManager },
            new PermissionForRoleEntity { PermissionId = userPermissions.ViewAuditorium, RoleId = userRoles.TheaterManager },
            new PermissionForRoleEntity { PermissionId = userPermissions.ViewMovie, RoleId = userRoles.TheaterManager },
            new PermissionForRoleEntity { PermissionId = userPermissions.ViewSchedule, RoleId = userRoles.TheaterManager },
            new PermissionForRoleEntity { PermissionId = userPermissions.ManageSchedule, RoleId = userRoles.TheaterManager },
            new PermissionForRoleEntity { PermissionId = userPermissions.ApproveShift, RoleId = userRoles.TheaterManager },
            new PermissionForRoleEntity { PermissionId = userPermissions.ViewPayroll, RoleId = userRoles.TheaterManager },
            new PermissionForRoleEntity { PermissionId = userPermissions.ManageStaffProfiles, RoleId = userRoles.TheaterManager },
            new PermissionForRoleEntity { PermissionId = userPermissions.ViewAuditLogs, RoleId = userRoles.TheaterManager }
        );

        // FacilitiesManager permissions
        modelBuilder.Entity<PermissionForRoleEntity>().HasData(
            new PermissionForRoleEntity { PermissionId = userPermissions.ViewCinema, RoleId = userRoles.FacilitiesManager },
            new PermissionForRoleEntity { PermissionId = userPermissions.ManageCinema, RoleId = userRoles.FacilitiesManager },
            new PermissionForRoleEntity { PermissionId = userPermissions.ViewAuditorium, RoleId = userRoles.FacilitiesManager },
            new PermissionForRoleEntity { PermissionId = userPermissions.ManageAuditorium, RoleId = userRoles.FacilitiesManager },
            new PermissionForRoleEntity { PermissionId = userPermissions.ManageFormats, RoleId = userRoles.FacilitiesManager },
            new PermissionForRoleEntity { PermissionId = userPermissions.ManageSurcharges, RoleId = userRoles.FacilitiesManager },
            new PermissionForRoleEntity { PermissionId = userPermissions.ViewAuditLogs, RoleId = userRoles.FacilitiesManager }
        );

        // MovieManager permissions
        modelBuilder.Entity<PermissionForRoleEntity>().HasData(
            new PermissionForRoleEntity { PermissionId = userPermissions.ViewMovie, RoleId = userRoles.MovieManager },
            new PermissionForRoleEntity { PermissionId = userPermissions.ManageMovie, RoleId = userRoles.MovieManager },
            new PermissionForRoleEntity { PermissionId = userPermissions.ViewSchedule, RoleId = userRoles.MovieManager },
            new PermissionForRoleEntity { PermissionId = userPermissions.ViewAuditLogs, RoleId = userRoles.MovieManager }
        );

    }
}
