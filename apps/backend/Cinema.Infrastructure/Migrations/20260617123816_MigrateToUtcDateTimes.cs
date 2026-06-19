using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Cinema.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class MigrateToUtcDateTimes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // BaseManagementStatus tables that do not have other custom DateTime properties
            var baseTables = new[]
            {
                "AuditoriumInfoEntities",
                "CinemaDiscountInfoEntity",
                "CinemaInfoEntity",
                "CinemaSurchargeInfosEntity",
                "MovieFormatInfoEntity"
            };

            foreach (var table in baseTables)
            {
                migrationBuilder.Sql($@"
                    UPDATE [{table}]
                    SET 
                        ActiveAt   = CASE WHEN ActiveAt > '1900-01-01' THEN DATEADD(HOUR, -7, ActiveAt) ELSE ActiveAt END,
                        CreatedAt  = CASE WHEN CreatedAt > '1900-01-01' THEN DATEADD(HOUR, -7, CreatedAt) ELSE CreatedAt END,
                        UpdatedAt  = CASE WHEN UpdatedAt > '1900-01-01' THEN DATEADD(HOUR, -7, UpdatedAt) ELSE UpdatedAt END,
                        DeletedAt  = CASE WHEN DeletedAt > '1900-01-01' THEN DATEADD(HOUR, -7, DeletedAt) ELSE DeletedAt END
                ");
            }

            // MovieInfoEntity: EndedDate + BaseManagementStatus fields
            migrationBuilder.Sql(@"
                UPDATE [MovieInfoEntity]
                SET 
                    EndedDate  = CASE WHEN EndedDate > '1900-01-01' THEN DATEADD(HOUR, -7, EndedDate) ELSE EndedDate END,
                    ActiveAt   = CASE WHEN ActiveAt > '1900-01-01' THEN DATEADD(HOUR, -7, ActiveAt) ELSE ActiveAt END,
                    CreatedAt  = CASE WHEN CreatedAt > '1900-01-01' THEN DATEADD(HOUR, -7, CreatedAt) ELSE CreatedAt END,
                    UpdatedAt  = CASE WHEN UpdatedAt > '1900-01-01' THEN DATEADD(HOUR, -7, UpdatedAt) ELSE UpdatedAt END,
                    DeletedAt  = CASE WHEN DeletedAt > '1900-01-01' THEN DATEADD(HOUR, -7, DeletedAt) ELSE DeletedAt END
            ");

            // MovieScheduleInfoEntity: StartTime, EndedTime + BaseManagementStatus fields
            migrationBuilder.Sql(@"
                UPDATE [MovieScheduleInfoEntity]
                SET 
                    StartTime  = CASE WHEN StartTime > '1900-01-01' THEN DATEADD(HOUR, -7, StartTime) ELSE StartTime END,
                    EndedTime  = CASE WHEN EndedTime > '1900-01-01' THEN DATEADD(HOUR, -7, EndedTime) ELSE EndedTime END,
                    ActiveAt   = CASE WHEN ActiveAt > '1900-01-01' THEN DATEADD(HOUR, -7, ActiveAt) ELSE ActiveAt END,
                    CreatedAt  = CASE WHEN CreatedAt > '1900-01-01' THEN DATEADD(HOUR, -7, CreatedAt) ELSE CreatedAt END,
                    UpdatedAt  = CASE WHEN UpdatedAt > '1900-01-01' THEN DATEADD(HOUR, -7, UpdatedAt) ELSE UpdatedAt END,
                    DeletedAt  = CASE WHEN DeletedAt > '1900-01-01' THEN DATEADD(HOUR, -7, DeletedAt) ELSE DeletedAt END
            ");

            // AuditLogEntity: CreatedAt
            migrationBuilder.Sql(@"
                UPDATE [AuditLogEntity]
                SET CreatedAt = CASE WHEN CreatedAt > '1900-01-01' THEN DATEADD(HOUR, -7, CreatedAt) ELSE CreatedAt END
            ");

            // MovieCommentEntity: CreatedAt, UpdatedAt
            migrationBuilder.Sql(@"
                UPDATE [MovieCommentEntity]
                SET 
                    CreatedAt = CASE WHEN CreatedAt > '1900-01-01' THEN DATEADD(HOUR, -7, CreatedAt) ELSE CreatedAt END,
                    UpdatedAt = CASE WHEN UpdatedAt > '1900-01-01' THEN DATEADD(HOUR, -7, UpdatedAt) ELSE UpdatedAt END
            ");

            // MovieViewEntity: ViewedAt
            migrationBuilder.Sql(@"
                UPDATE [MovieViewEntity]
                SET ViewedAt = CASE WHEN ViewedAt > '1900-01-01' THEN DATEADD(HOUR, -7, ViewedAt) ELSE ViewedAt END
            ");

            // BackGroundJobLoggerEntity: StartedTime, FinishedTime
            migrationBuilder.Sql(@"
                UPDATE [BackGroundJobLoggerEntity]
                SET 
                    StartedTime  = CASE WHEN StartedTime > '1900-01-01' THEN DATEADD(HOUR, -7, StartedTime) ELSE StartedTime END,
                    FinishedTime = CASE WHEN FinishedTime > '1900-01-01' THEN DATEADD(HOUR, -7, FinishedTime) ELSE FinishedTime END
            ");

            // OrderInfoEntity: OrderDate
            migrationBuilder.Sql(@"
                UPDATE [OrderInfoEntity]
                SET OrderDate = CASE WHEN OrderDate > '1900-01-01' THEN DATEADD(HOUR, -7, OrderDate) ELSE OrderDate END
            ");

            // StaffSalaryTotalLoggerEntity: ReceivedDay
            migrationBuilder.Sql(@"
                UPDATE [StaffSalaryTotalLoggerEntity]
                SET ReceivedDay = CASE WHEN ReceivedDay > '1900-01-01' THEN DATEADD(HOUR, -7, ReceivedDay) ELSE ReceivedDay END
            ");

            // StaffShiftRegistrationEntity: RegistrationDate, ApprovedAt
            migrationBuilder.Sql(@"
                UPDATE [StaffShiftRegistrationEntity]
                SET 
                    RegistrationDate = CASE WHEN RegistrationDate > '1900-01-01' THEN DATEADD(HOUR, -7, RegistrationDate) ELSE RegistrationDate END,
                    ApprovedAt       = CASE WHEN ApprovedAt > '1900-01-01' THEN DATEADD(HOUR, -7, ApprovedAt) ELSE ApprovedAt END
            ");

            // StaffWorkingLoggerEntity: StartedShiftTime, EndedShiftTime, WorkingDate
            migrationBuilder.Sql(@"
                UPDATE [StaffWorkingLoggerEntity]
                SET 
                    StartedShiftTime = CASE WHEN StartedShiftTime > '1900-01-01' THEN DATEADD(HOUR, -7, StartedShiftTime) ELSE StartedShiftTime END,
                    EndedShiftTime   = CASE WHEN EndedShiftTime > '1900-01-01' THEN DATEADD(HOUR, -7, EndedShiftTime) ELSE EndedShiftTime END,
                    WorkingDate      = CASE WHEN WorkingDate > '1900-01-01' THEN DATEADD(HOUR, -7, WorkingDate) ELSE WorkingDate END
            ");

            // UserNotificationEntity: CreatedAt
            migrationBuilder.Sql(@"
                UPDATE [UserNotificationEntity]
                SET CreatedAt = CASE WHEN CreatedAt > '1900-01-01' THEN DATEADD(HOUR, -7, CreatedAt) ELSE CreatedAt END
            ");

            // UserVoucherEntity: PurchasedAt, UsedAt
            migrationBuilder.Sql(@"
                UPDATE [UserVoucherEntity]
                SET 
                    PurchasedAt = CASE WHEN PurchasedAt > '1900-01-01' THEN DATEADD(HOUR, -7, PurchasedAt) ELSE PurchasedAt END,
                    UsedAt      = CASE WHEN UsedAt > '1900-01-01' THEN DATEADD(HOUR, -7, UsedAt) ELSE UsedAt END
            ");

            // VoucherInfoEntity: ValidFrom, ValidTo
            migrationBuilder.Sql(@"
                UPDATE [VoucherInfoEntity]
                SET 
                    ValidFrom = CASE WHEN ValidFrom > '1900-01-01' THEN DATEADD(HOUR, -7, ValidFrom) ELSE ValidFrom END,
                    ValidTo   = CASE WHEN ValidTo > '1900-01-01' THEN DATEADD(HOUR, -7, ValidTo) ELSE ValidTo END
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            var baseTables = new[]
            {
                "AuditoriumInfoEntities",
                "CinemaDiscountInfoEntity",
                "CinemaInfoEntity",
                "CinemaSurchargeInfosEntity",
                "MovieFormatInfoEntity"
            };

            foreach (var table in baseTables)
            {
                migrationBuilder.Sql($@"
                    UPDATE [{table}]
                    SET 
                        ActiveAt   = CASE WHEN ActiveAt > '1900-01-01' THEN DATEADD(HOUR, 7, ActiveAt) ELSE ActiveAt END,
                        CreatedAt  = CASE WHEN CreatedAt > '1900-01-01' THEN DATEADD(HOUR, 7, CreatedAt) ELSE CreatedAt END,
                        UpdatedAt  = CASE WHEN UpdatedAt > '1900-01-01' THEN DATEADD(HOUR, 7, UpdatedAt) ELSE UpdatedAt END,
                        DeletedAt  = CASE WHEN DeletedAt > '1900-01-01' THEN DATEADD(HOUR, 7, DeletedAt) ELSE DeletedAt END
                ");
            }

            migrationBuilder.Sql(@"
                UPDATE [MovieInfoEntity]
                SET 
                    EndedDate  = CASE WHEN EndedDate > '1900-01-01' THEN DATEADD(HOUR, 7, EndedDate) ELSE EndedDate END,
                    ActiveAt   = CASE WHEN ActiveAt > '1900-01-01' THEN DATEADD(HOUR, 7, ActiveAt) ELSE ActiveAt END,
                    CreatedAt  = CASE WHEN CreatedAt > '1900-01-01' THEN DATEADD(HOUR, 7, CreatedAt) ELSE CreatedAt END,
                    UpdatedAt  = CASE WHEN UpdatedAt > '1900-01-01' THEN DATEADD(HOUR, 7, UpdatedAt) ELSE UpdatedAt END,
                    DeletedAt  = CASE WHEN DeletedAt > '1900-01-01' THEN DATEADD(HOUR, 7, DeletedAt) ELSE DeletedAt END
            ");

            migrationBuilder.Sql(@"
                UPDATE [MovieScheduleInfoEntity]
                SET 
                    StartTime  = CASE WHEN StartTime > '1900-01-01' THEN DATEADD(HOUR, 7, StartTime) ELSE StartTime END,
                    EndedTime  = CASE WHEN EndedTime > '1900-01-01' THEN DATEADD(HOUR, 7, EndedTime) ELSE EndedTime END,
                    ActiveAt   = CASE WHEN ActiveAt > '1900-01-01' THEN DATEADD(HOUR, 7, ActiveAt) ELSE ActiveAt END,
                    CreatedAt  = CASE WHEN CreatedAt > '1900-01-01' THEN DATEADD(HOUR, 7, CreatedAt) ELSE CreatedAt END,
                    UpdatedAt  = CASE WHEN UpdatedAt > '1900-01-01' THEN DATEADD(HOUR, 7, UpdatedAt) ELSE UpdatedAt END,
                    DeletedAt  = CASE WHEN DeletedAt > '1900-01-01' THEN DATEADD(HOUR, 7, DeletedAt) ELSE DeletedAt END
            ");

            migrationBuilder.Sql("UPDATE [AuditLogEntity] SET CreatedAt = CASE WHEN CreatedAt > '1900-01-01' THEN DATEADD(HOUR, 7, CreatedAt) ELSE CreatedAt END");
            migrationBuilder.Sql("UPDATE [MovieCommentEntity] SET CreatedAt = CASE WHEN CreatedAt > '1900-01-01' THEN DATEADD(HOUR, 7, CreatedAt) ELSE CreatedAt END, UpdatedAt = CASE WHEN UpdatedAt > '1900-01-01' THEN DATEADD(HOUR, 7, UpdatedAt) ELSE UpdatedAt END");
            migrationBuilder.Sql("UPDATE [MovieViewEntity] SET ViewedAt = CASE WHEN ViewedAt > '1900-01-01' THEN DATEADD(HOUR, 7, ViewedAt) ELSE ViewedAt END");
            migrationBuilder.Sql("UPDATE [BackGroundJobLoggerEntity] SET StartedTime = CASE WHEN StartedTime > '1900-01-01' THEN DATEADD(HOUR, 7, StartedTime) ELSE StartedTime END, FinishedTime = CASE WHEN FinishedTime > '1900-01-01' THEN DATEADD(HOUR, 7, FinishedTime) ELSE FinishedTime END");
            migrationBuilder.Sql("UPDATE [OrderInfoEntity] SET OrderDate = CASE WHEN OrderDate > '1900-01-01' THEN DATEADD(HOUR, 7, OrderDate) ELSE OrderDate END");
            migrationBuilder.Sql("UPDATE [StaffSalaryTotalLoggerEntity] SET ReceivedDay = CASE WHEN ReceivedDay > '1900-01-01' THEN DATEADD(HOUR, 7, ReceivedDay) ELSE ReceivedDay END");
            migrationBuilder.Sql("UPDATE [StaffShiftRegistrationEntity] SET RegistrationDate = CASE WHEN RegistrationDate > '1900-01-01' THEN DATEADD(HOUR, 7, RegistrationDate) ELSE RegistrationDate END, ApprovedAt = CASE WHEN ApprovedAt > '1900-01-01' THEN DATEADD(HOUR, 7, ApprovedAt) ELSE ApprovedAt END");
            migrationBuilder.Sql("UPDATE [StaffWorkingLoggerEntity] SET StartedShiftTime = CASE WHEN StartedShiftTime > '1900-01-01' THEN DATEADD(HOUR, 7, StartedShiftTime) ELSE StartedShiftTime END, EndedShiftTime = CASE WHEN EndedShiftTime > '1900-01-01' THEN DATEADD(HOUR, 7, EndedShiftTime) ELSE EndedShiftTime END, WorkingDate = CASE WHEN WorkingDate > '1900-01-01' THEN DATEADD(HOUR, 7, WorkingDate) ELSE WorkingDate END");
            migrationBuilder.Sql("UPDATE [UserNotificationEntity] SET CreatedAt = CASE WHEN CreatedAt > '1900-01-01' THEN DATEADD(HOUR, 7, CreatedAt) ELSE CreatedAt END");
            migrationBuilder.Sql("UPDATE [UserVoucherEntity] SET PurchasedAt = CASE WHEN PurchasedAt > '1900-01-01' THEN DATEADD(HOUR, 7, PurchasedAt) ELSE PurchasedAt END, UsedAt = CASE WHEN UsedAt > '1900-01-01' THEN DATEADD(HOUR, 7, UsedAt) ELSE UsedAt END");
            migrationBuilder.Sql("UPDATE [VoucherInfoEntity] SET ValidFrom = CASE WHEN ValidFrom > '1900-01-01' THEN DATEADD(HOUR, 7, ValidFrom) ELSE ValidFrom END, ValidTo = CASE WHEN ValidTo > '1900-01-01' THEN DATEADD(HOUR, 7, ValidTo) ELSE ValidTo END");
        }
    }
}
