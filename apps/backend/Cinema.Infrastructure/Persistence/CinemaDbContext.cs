using Cinema.Infrastructure.Identity;
using Cinema.Domain.Entities.AuditLogs;
using Cinema.Domain.Entities.CinemaInfos;
using Cinema.Domain.Entities.MovieInfos;
using Cinema.Domain.Entities.Promotions;
using Cinema.Domain.Entities.ScheduleJob;
using Cinema.Domain.Entities.UserInfos;
using Cinema.Domain.Entities.GroupBooking;
using Cinema.Domain.Entities.Vouchers;
using Cinema.Domain.Entities.Banners;
using Cinema.Domain.Entities.AiResearch;
using Cinema.Domain.Entities.Concessions;
using Cinema.Domain.Entities.Cleaning;
using Cinema.Domain.Entities.Contracts;
using Cinema.Domain.Enums;
using Cinema.Infrastructure.Persistence.RelationshipKeys.MovieInfos;
using Cinema.Infrastructure.Persistence.SeedData;
using Cinema.Infrastructure.Persistence.RelationshipKeys.Facilities;
using Cinema.Infrastructure.Persistence.RelationshipKeys.IdentityAccess;
using Cinema.Infrastructure.Persistence.RelationshipKeys.Promotions;
using Cinema.Infrastructure.Persistence.RelationshipKeys.Common;
using Cinema.Infrastructure.Persistence.RelationshipKeys.UserInfos;
using Cinema.Infrastructure.Persistence.RelationshipKeys.Concessions;
using Cinema.Infrastructure.Persistence.RelationshipKeys.Cleaning;
using Microsoft.EntityFrameworkCore;

// ReSharper disable All


namespace Cinema.Infrastructure;

public class CinemaDbContext : DbContext
{
    private readonly UserIdentityCodeConstant user_identity_code_constant;

    public CinemaDbContext(DbContextOptions<CinemaDbContext> options , UserIdentityCodeConstant user_identity_code_constant) : base(options)
    {
        this.user_identity_code_constant = user_identity_code_constant;
    }
    
    public DbSet<UserInfoEntity> UserInfoEntity { get; set; }
    
    public DbSet<UserRoleInfoEntity>  UserRoleInfoEntity { get; set; }
    
    public DbSet<RoleListInfoEntity> RoleListInfoEntity { get; set; }
    
    // Permission & RBAC
    
    public DbSet<PermissionEntity> PermissionEntity { get; set; }
    
    public DbSet<PermissionForRoleEntity> PermissionForRoleEntity { get; set; }
    
    // Staff & Payroll
    
    public DbSet<StaffProfileEntity> StaffProfileEntity { get; set; }
    
    public DbSet<StaffWorkingLoggerEntity> StaffWorkingLoggerEntity { get; set; }
    
    public DbSet<StaffSalaryTotalLoggerEntity> StaffSalaryTotalLoggerEntity { get; set; }
    
    public DbSet<CustomerProfileEntity> CustomerProfileEntity { get; set; }
    
    // Shift Management
    
    public DbSet<CinemaShiftTemplateEntity> CinemaShiftTemplateEntity { get; set; }
    public DbSet<CinemaShiftScheduleEntity> CinemaShiftScheduleEntity { get; set; }
    
    public DbSet<StaffShiftRegistrationEntity> StaffShiftRegistrationEntity { get; set; }
    
    public DbSet<DepartmentEntity> DepartmentEntity { get; set; }
    
    public DbSet<AuditoriumInfoEntities>   AuditoriumInfoEntities { get; set; }
    
    public DbSet<CinemaInfoEntity>  CinemaInfoEntity { get; set; }
    
    public DbSet<MovieFormatInfoEntity>  MovieFormatInfoEntity { get; set; }
    
    public DbSet<SeatsInfoEntity> SeatsInfoEntity { get; set; }
    
    public DbSet<UserSegmentsInfoEntity> UserSegmentsInfoEntity { get; set; }
    
    // Movie Infos
    
    public DbSet<MovieInfoEntity> MovieInfoEntity { get; set; }
    
    public DbSet<MovieGenreMovieInfoEntity> MovieGenreMovieInfoEntity { get; set; }
    
    public DbSet<MovieGenreInfoEntity> MovieGenreInfoEntity { get; set; }
    
    public DbSet<movieFormatMovieInfoEntity> MovieFormatMovieInfoEntity { get; set; }
    
    public DbSet<movieRequiredAgeEntity> MovieRequiredAgeEntity { get; set; }
    
    public DbSet<MovieScheduleInfoEntity> MovieScheduleInfoEntity { get; set; }

    public DbSet<MovieCinemaEntity> MovieCinemaEntities { get; set; }

    public DbSet<MovieCommentEntity> MovieCommentEntity { get; set; }

    public DbSet<MovieViewEntity> MovieViewEntity { get; set; }

    public DbSet<MovieCoverImageEntity> MovieCoverImageEntity { get; set; }

    public DbSet<ShowtimeRecommendationBatchEntity> ShowtimeRecommendationBatchEntity { get; set; }

    public DbSet<ShowtimeRecommendationItemEntity> ShowtimeRecommendationItemEntity { get; set; }

    public DbSet<ShowtimeRecommendationActionEntity> ShowtimeRecommendationActionEntity { get; set; }
    
    public DbSet<AuditoriumFormatInfos> AuditoriumFormatInfosEntity { get; set; }
    
    public DbSet<ScheduleJobLogger> BackGroundJobLoggerEntity { get; set; }

    public DbSet<OrderInfoEntity> OrderInfoEntity { get; set; }

    public DbSet<OrderDetailsInfo> OrderDetailsInfoEntity { get; set; }

    public DbSet<AuditLogEntity> AuditLogEntity { get; set; }
    
    public DbSet<UserVoucherEntity> UserVoucherEntity { get; set; }

    public DbSet<VoucherMembershipRankEntity> VoucherMembershipRankEntity { get; set; }

    public DbSet<UserNotificationEntity> UserNotificationEntity { get; set; }

    public DbSet<UserGenreSurveyEntity> UserGenreSurveyEntity { get; set; }

    public DbSet<PricingPromotionEntity> PricingPromotionEntity { get; set; }

    public DbSet<PricingPromotionRuleEntity> PricingPromotionRuleEntity { get; set; }

    public DbSet<HolidayCalendarEntity> HolidayCalendarEntity { get; set; }

    // Banners

    public DbSet<Cinema.Domain.Entities.Banners.BannerEntity> BannerEntity { get; set; }

    // Group Booking (Social)

    public DbSet<GroupBookingSessionEntity> GroupBookingSessionEntity { get; set; }

    public DbSet<GroupBookingMemberEntity> GroupBookingMemberEntity { get; set; }

    public DbSet<GroupBookingSeatEntity> GroupBookingSeatEntity { get; set; }

    // AI Business Research
    public DbSet<AiResearchJobEntity> AiResearchJobEntity { get; set; }
    public DbSet<AiResearchClaimEntity> AiResearchClaimEntity { get; set; }
    public DbSet<AiResearchEvidenceEntity> AiResearchEvidenceEntity { get; set; }
    public DbSet<AiResearchReportEntity> AiResearchReportEntity { get; set; }
    public DbSet<AiResearchEventEntity> AiResearchEventEntity { get; set; }

    // Concession (Food & Beverage) & Inventory

    public DbSet<ConcessionProductEntity> ConcessionProductEntity { get; set; }

    public DbSet<ConcessionComboItemEntity> ConcessionComboItemEntity { get; set; }

    public DbSet<ConcessionInventoryEntity> ConcessionInventoryEntity { get; set; }

    public DbSet<InventoryTransactionEntity> InventoryTransactionEntity { get; set; }

    public DbSet<OrderConcessionDetailEntity> OrderConcessionDetailEntity { get; set; }

    public DbSet<StockRequestEntity> StockRequestEntity { get; set; }

    public DbSet<StockRequestItemEntity> StockRequestItemEntity { get; set; }

    public DbSet<WasteReportEntity> WasteReportEntity { get; set; }

    // Cleaning

    public DbSet<CleaningTaskEntity> CleaningTaskEntity { get; set; }

    // Film contracts and revenue sharing
    public DbSet<ContractTemplateEntity> ContractTemplateEntity { get; set; }
    public DbSet<DistributorEntity> DistributorEntity { get; set; }
    public DbSet<FilmContractEntity> FilmContractEntity { get; set; }
    public DbSet<ContractRevisionEntity> ContractRevisionEntity { get; set; }
    public DbSet<ContractDocumentEntity> ContractDocumentEntity { get; set; }
    public DbSet<ContractMovieLineEntity> ContractMovieLineEntity { get; set; }
    public DbSet<ContractSignOffEntity> ContractSignOffEntity { get; set; }
    public DbSet<ExhibitionRightEntity> ExhibitionRightEntity { get; set; }
    public DbSet<MovieChangeRequestEntity> MovieChangeRequestEntity { get; set; }
    public DbSet<TicketRevenueSnapshotEntity> TicketRevenueSnapshotEntity { get; set; }

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        await CaptureTicketRevenueSnapshotsAsync(cancellationToken);
        return await base.SaveChangesAsync(cancellationToken);
    }

    private async Task CaptureTicketRevenueSnapshotsAsync(CancellationToken ct)
    {
        var bookedOrders = ChangeTracker.Entries<OrderInfoEntity>()
            .Where(entry => entry.Entity.OrderStatus == OrderStatusEnum.Booked &&
                (entry.State == EntityState.Added ||
                 (entry.State == EntityState.Modified && entry.Property(x => x.OrderStatus).IsModified)))
            .Select(entry => entry.Entity)
            .ToList();
        if (bookedOrders.Count == 0) return;

        var orderIds = bookedOrders.Select(x => x.OrderId).ToList();
        var trackedDetails = ChangeTracker.Entries<OrderDetailsInfo>()
            .Where(x => orderIds.Contains(x.Entity.OrderId)).Select(x => x.Entity).ToList();
        var trackedKeys = trackedDetails.Select(x => new { x.OrderId, x.SeatId }).ToHashSet();
        var storedDetails = await OrderDetailsInfoEntity.AsNoTracking()
            .Where(x => orderIds.Contains(x.OrderId)).ToListAsync(ct);
        var details = trackedDetails.Concat(storedDetails.Where(x =>
            !trackedKeys.Contains(new { x.OrderId, x.SeatId }))).ToList();
        if (details.Count == 0) return;

        var existing = await TicketRevenueSnapshotEntity.AsNoTracking()
            .Where(x => orderIds.Contains(x.OrderId)).Select(x => new { x.OrderId, x.SeatId }).ToListAsync(ct);
        var existingKeys = existing.ToHashSet();
        var scheduleIds = details.Select(x => x.MovieScheduleId).Distinct().ToList();
        var schedules = await MovieScheduleInfoEntity.AsNoTracking()
            .Where(x => scheduleIds.Contains(x.MovieScheduleInfoId))
            .Select(x => new
            {
                x.MovieScheduleInfoId, x.MovieId, x.MovieFormatId, x.StartTime, x.EndedTime,
                CinemaId = x.AuditoriumInfoEntities!.CinemaId
            }).ToDictionaryAsync(x => x.MovieScheduleInfoId, ct);
        var movieIds = schedules.Values.Select(x => x.MovieId).Distinct().ToList();
        var rights = await ExhibitionRightEntity.AsNoTracking()
            .Where(x => movieIds.Contains(x.MovieId) && x.IsActive).ToListAsync(ct);
        var orderDates = bookedOrders.ToDictionary(x => x.OrderId, x => x.OrderDate);

        foreach (var detail in details)
        {
            if (existingKeys.Contains(new { detail.OrderId, detail.SeatId }) ||
                !schedules.TryGetValue(detail.MovieScheduleId, out var schedule)) continue;
            var right = rights.Where(x => x.MovieId == schedule.MovieId &&
                    (!x.CinemaId.HasValue || x.CinemaId == schedule.CinemaId) &&
                    (!x.FormatId.HasValue || x.FormatId == schedule.MovieFormatId) &&
                    x.StartsAt <= schedule.StartTime && x.EndsAt >= schedule.EndedTime)
                .OrderByDescending(x => x.CinemaId.HasValue).ThenByDescending(x => x.FormatId.HasValue)
                .ThenByDescending(x => x.StartsAt).FirstOrDefault();
            if (right == null) continue;
            var basis = detail.FinalPrice;
            var cinemaAmount = decimal.Round(basis * right.CinemaSharePercent / 100m, 0, MidpointRounding.AwayFromZero);
            TicketRevenueSnapshotEntity.Add(new TicketRevenueSnapshotEntity
            {
                TicketRevenueSnapshotId = Guid.NewGuid(), OrderId = detail.OrderId, SeatId = detail.SeatId,
                MovieScheduleId = detail.MovieScheduleId, MovieId = schedule.MovieId,
                ContractId = right.ContractId, ContractRevisionId = right.ContractRevisionId,
                SoldAt = orderDates.GetValueOrDefault(detail.OrderId, DateTime.UtcNow), ShowtimeAt = schedule.StartTime,
                TicketNetAmount = detail.FinalPrice, RefundedAmount = 0, RevenueBasisAmount = basis,
                CinemaSharePercent = right.CinemaSharePercent, CinemaShareAmount = cinemaAmount,
                DistributorShareAmount = basis - cinemaAmount
            });
        }
    }

    
   protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        var dateTimeConverter = new Microsoft.EntityFrameworkCore.Storage.ValueConversion.ValueConverter<DateTime, DateTime>(
            v => v.Kind == DateTimeKind.Utc ? v : DateTime.SpecifyKind(v, DateTimeKind.Utc),
            v => DateTime.SpecifyKind(v, DateTimeKind.Utc));

        var nullableDateTimeConverter = new Microsoft.EntityFrameworkCore.Storage.ValueConversion.ValueConverter<DateTime?, DateTime?>(
            v => !v.HasValue ? v : (v.Value.Kind == DateTimeKind.Utc ? v : DateTime.SpecifyKind(v.Value, DateTimeKind.Utc)),
            v => v.HasValue ? DateTime.SpecifyKind(v.Value, DateTimeKind.Utc) : null);

        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            foreach (var property in entityType.GetProperties())
            {
                if (property.ClrType == typeof(DateTime))
                {
                    property.SetValueConverter(dateTimeConverter);
                }
                else if (property.ClrType == typeof(DateTime?))
                {
                    property.SetValueConverter(nullableDateTimeConverter);
                }
            }
        }
        
        // Status Management status

        StatusManagementRelationships.AddRelationshipsCinemaInfo(modelBuilder);

        modelBuilder.Entity<AuditLogEntity>(entity =>
        {
            entity.HasIndex(x => x.CreatedAt);
            entity.HasIndex(x => x.CinemaId);
            entity.HasIndex(x => new { x.EntityType, x.EntityId });
        });

        modelBuilder.Entity<MovieCommentEntity>(entity =>
        {
            entity.HasKey(x => x.CommentId);
            entity.HasIndex(x => new { x.MovieId, x.Status, x.CreatedAt });
            entity.HasIndex(x => new { x.UserId, x.MovieId, x.ParentCommentId });
            entity.HasIndex(x => x.ParentCommentId);

            entity.HasOne(x => x.MovieInfoEntity)
                .WithMany(x => x.MovieCommentEntities)
                .HasForeignKey(x => x.MovieId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(x => x.UserInfoEntity)
                .WithMany(x => x.MovieCommentEntities)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(x => x.OrderInfoEntity)
                .WithMany()
                .HasForeignKey(x => x.OrderId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(x => x.ParentComment)
                .WithMany(x => x.Replies)
                .HasForeignKey(x => x.ParentCommentId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<MovieViewEntity>(entity =>
        {
            entity.HasKey(x => x.MovieViewId);
            entity.HasIndex(x => new { x.MovieId, x.ViewedAt });

            entity.HasOne(x => x.MovieInfoEntity)
                .WithMany(x => x.MovieViewEntities)
                .HasForeignKey(x => x.MovieId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<OrderInfoEntity>(entity =>
        {
            entity.HasIndex(o => o.BookingCode).IsUnique();
        });

        modelBuilder.Entity<ContractTemplateEntity>(entity =>
        {
            entity.HasIndex(x => new { x.Code, x.Version }).IsUnique();
            entity.Property(x => x.Status).HasConversion<int>();
        });
        modelBuilder.Entity<DistributorEntity>().HasIndex(x => x.LegalName);
        modelBuilder.Entity<FilmContractEntity>(entity =>
        {
            entity.HasIndex(x => x.InternalCode).IsUnique();
            entity.HasIndex(x => new { x.Status, x.AssignedMovieManagerId });
            entity.Property(x => x.Status).HasConversion<int>();
            entity.Property(x => x.ProcessingStatus).HasConversion<int>();
            entity.HasOne(x => x.PreviousContract).WithMany().HasForeignKey(x => x.PreviousContractId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(x => x.AssignedMovieManager).WithMany().HasForeignKey(x => x.AssignedMovieManagerId).OnDelete(DeleteBehavior.Restrict);
        });
        modelBuilder.Entity<ContractRevisionEntity>(entity =>
        {
            entity.HasIndex(x => new { x.ContractId, x.RevisionNumber }).IsUnique();
            entity.HasOne(x => x.Contract).WithMany(x => x.Revisions).HasForeignKey(x => x.ContractId).OnDelete(DeleteBehavior.Cascade);
        });
        modelBuilder.Entity<ContractDocumentEntity>(entity =>
        {
            entity.HasIndex(x => x.Sha256);
            entity.Property(x => x.Kind).HasConversion<int>();
            entity.HasOne(x => x.Revision).WithMany(x => x.Documents).HasForeignKey(x => x.ContractRevisionId).OnDelete(DeleteBehavior.Cascade);
        });
        modelBuilder.Entity<ContractMovieLineEntity>(entity =>
        {
            entity.Property(x => x.CinemaScopeState).HasConversion<int>();
            entity.Property(x => x.FormatScopeState).HasConversion<int>();
            entity.Property(x => x.SettlementCycle).HasConversion<int>();
            entity.HasOne(x => x.Revision).WithMany(x => x.MovieLines).HasForeignKey(x => x.ContractRevisionId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(x => x.Movie).WithMany().HasForeignKey(x => x.MovieId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<movieRequiredAgeEntity>().WithMany().HasForeignKey(x => x.MovieRequiredAgeId).OnDelete(DeleteBehavior.Restrict);
        });
        modelBuilder.Entity<ContractSignOffEntity>(entity =>
        {
            entity.HasIndex(x => new { x.ContractId, x.ContractRevisionId }).IsUnique();
            entity.HasOne<FilmContractEntity>().WithMany().HasForeignKey(x => x.ContractId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<ContractRevisionEntity>().WithMany().HasForeignKey(x => x.ContractRevisionId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<UserInfoEntity>().WithMany().HasForeignKey(x => x.SignedByUserId).OnDelete(DeleteBehavior.Restrict);
        });
        modelBuilder.Entity<ExhibitionRightEntity>(entity =>
        {
            entity.HasIndex(x => new { x.MovieId, x.CinemaId, x.FormatId, x.StartsAt, x.EndsAt });
            entity.HasIndex(x => new { x.ContractId, x.ContractMovieLineId });
            entity.HasOne<FilmContractEntity>().WithMany().HasForeignKey(x => x.ContractId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<ContractRevisionEntity>().WithMany().HasForeignKey(x => x.ContractRevisionId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<ContractMovieLineEntity>().WithMany().HasForeignKey(x => x.ContractMovieLineId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<MovieInfoEntity>().WithMany().HasForeignKey(x => x.MovieId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<CinemaInfoEntity>().WithMany().HasForeignKey(x => x.CinemaId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<MovieFormatInfoEntity>().WithMany().HasForeignKey(x => x.FormatId).OnDelete(DeleteBehavior.Restrict);
        });
        modelBuilder.Entity<MovieChangeRequestEntity>(entity =>
        {
            entity.Property(x => x.Status).HasConversion<int>();
            entity.HasIndex(x => new { x.MovieId, x.Status });
            entity.HasOne<MovieInfoEntity>().WithMany().HasForeignKey(x => x.MovieId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<UserInfoEntity>().WithMany().HasForeignKey(x => x.RequestedByUserId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<UserInfoEntity>().WithMany().HasForeignKey(x => x.ReviewedByUserId).OnDelete(DeleteBehavior.Restrict);
        });
        modelBuilder.Entity<TicketRevenueSnapshotEntity>(entity =>
        {
            entity.HasIndex(x => new { x.OrderId, x.SeatId }).IsUnique();
            entity.HasIndex(x => new { x.MovieId, x.ShowtimeAt });
            entity.HasOne<OrderInfoEntity>().WithMany().HasForeignKey(x => x.OrderId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<SeatsInfoEntity>().WithMany().HasForeignKey(x => x.SeatId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<MovieScheduleInfoEntity>().WithMany().HasForeignKey(x => x.MovieScheduleId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<MovieInfoEntity>().WithMany().HasForeignKey(x => x.MovieId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<FilmContractEntity>().WithMany().HasForeignKey(x => x.ContractId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<ContractRevisionEntity>().WithMany().HasForeignKey(x => x.ContractRevisionId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<ShowtimeRecommendationBatchEntity>(entity =>
        {
            entity.HasKey(x => x.BatchId);
            entity.HasIndex(x => new { x.CinemaId, x.CreatedAt });
            entity.HasIndex(x => x.RequestedByUserId);

            entity.HasOne(x => x.CinemaInfoEntity)
                .WithMany()
                .HasForeignKey(x => x.CinemaId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(x => x.RequestedByUser)
                .WithMany()
                .HasForeignKey(x => x.RequestedByUserId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(x => x.AuditoriumInfoEntity)
                .WithMany()
                .HasForeignKey(x => x.AuditoriumId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<ShowtimeRecommendationItemEntity>(entity =>
        {
            entity.HasKey(x => x.RecommendationId);
            entity.HasIndex(x => new { x.BatchId, x.Status });
            entity.HasIndex(x => new { x.CinemaId, x.StartTime });
            entity.Property(x => x.Status).HasConversion<int>();

            entity.HasOne(x => x.Batch)
                .WithMany(x => x.Items)
                .HasForeignKey(x => x.BatchId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(x => x.CinemaInfoEntity)
                .WithMany()
                .HasForeignKey(x => x.CinemaId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(x => x.AuditoriumInfoEntity)
                .WithMany()
                .HasForeignKey(x => x.AuditoriumId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(x => x.MovieInfoEntity)
                .WithMany()
                .HasForeignKey(x => x.MovieId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(x => x.MovieFormatInfoEntity)
                .WithMany()
                .HasForeignKey(x => x.FormatId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(x => x.AppliedSchedule)
                .WithMany()
                .HasForeignKey(x => x.AppliedScheduleId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(x => x.AppliedByUser)
                .WithMany()
                .HasForeignKey(x => x.AppliedByUserId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(x => x.DismissedByUser)
                .WithMany()
                .HasForeignKey(x => x.DismissedByUserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<ShowtimeRecommendationActionEntity>(entity =>
        {
            entity.HasKey(x => x.ActionId);
            entity.HasIndex(x => new { x.RecommendationId, x.CreatedAt });
            entity.HasIndex(x => x.ActorUserId);

            entity.HasOne(x => x.Recommendation)
                .WithMany(x => x.Actions)
                .HasForeignKey(x => x.RecommendationId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(x => x.ActorUser)
                .WithMany()
                .HasForeignKey(x => x.ActorUserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<UserNotificationEntity>(entity =>
        {
            entity.HasKey(x => x.NotificationId);
            entity.HasIndex(x => new { x.UserId, x.IsRead, x.CreatedAt });

            entity.HasOne(x => x.UserInfoEntity)
                .WithMany(x => x.UserNotificationEntities)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(x => x.RelatedComment)
                .WithMany()
                .HasForeignKey(x => x.RelatedCommentId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(x => x.RelatedMovie)
                .WithMany()
                .HasForeignKey(x => x.RelatedMovieId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<UserGenreSurveyEntity>(entity =>
        {
            entity.HasKey(x => x.SurveyId);
            entity.HasIndex(x => x.UserId).IsUnique(); // one survey per user

            entity.HasOne(x => x.UserInfoEntity)
                .WithMany()
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<PricingPromotionEntity>(entity =>
        {
            entity.HasKey(x => x.PricingPromotionId);
            entity.HasIndex(x => x.Slug).IsUnique();
            entity.HasIndex(x => new { x.IsActive, x.StartDate, x.EndDate });

            entity.HasOne(x => x.CreatedByUser)
                .WithMany()
                .HasForeignKey(x => x.CreatedBy)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(x => x.UpdatedByUser)
                .WithMany()
                .HasForeignKey(x => x.UpdatedBy)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<PricingPromotionRuleEntity>(entity =>
        {
            entity.HasKey(x => x.PricingPromotionRuleId);
            entity.HasIndex(x => new { x.IsActive, x.MovieFormatId, x.CinemaId, x.DaysOfWeekMask });
            entity.HasIndex(x => new { x.TimeFrom, x.TimeTo });

            entity.HasOne(x => x.PricingPromotionEntity)
                .WithMany(x => x.Rules)
                .HasForeignKey(x => x.PricingPromotionId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(x => x.MovieFormatInfoEntity)
                .WithMany()
                .HasForeignKey(x => x.MovieFormatId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(x => x.CinemaInfoEntity)
                .WithMany()
                .HasForeignKey(x => x.CinemaId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(x => x.AuditoriumInfoEntity)
                .WithMany()
                .HasForeignKey(x => x.AuditoriumId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(x => x.UserSegmentsInfoEntity)
                .WithMany()
                .HasForeignKey(x => x.UserSegmentId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<HolidayCalendarEntity>(entity =>
        {
            entity.HasKey(x => x.HolidayId);
            entity.HasIndex(x => x.Date).IsUnique();
        });

        modelBuilder.Entity<BannerEntity>(entity =>
        {
            entity.HasKey(x => x.BannerId);
            entity.HasIndex(x => x.DisplayOrder);
            entity.HasIndex(x => x.IsActive);
        });

        modelBuilder.Entity<AiResearchJobEntity>(entity =>
        {
            entity.HasIndex(x => new { x.CreatedByUserId, x.CreatedAt });
            entity.HasIndex(x => x.Status);
        });

        modelBuilder.Entity<AiResearchClaimEntity>(entity =>
        {
            entity.Property(x => x.Confidence).HasPrecision(5, 4);
            entity.HasIndex(x => new { x.JobId, x.Category, x.Status });
            entity.HasOne(x => x.Job)
                .WithMany(x => x.Claims)
                .HasForeignKey(x => x.JobId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<AiResearchEvidenceEntity>(entity =>
        {
            entity.HasIndex(x => new { x.ClaimId, x.SourceDomain });
            entity.HasOne(x => x.Claim)
                .WithMany(x => x.Evidence)
                .HasForeignKey(x => x.ClaimId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<AiResearchReportEntity>(entity =>
        {
            entity.HasOne(x => x.Job)
                .WithOne(x => x.Report)
                .HasForeignKey<AiResearchReportEntity>(x => x.JobId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<AiResearchEventEntity>(entity =>
        {
            entity.HasIndex(x => new { x.JobId, x.EventId });
            entity.HasOne(x => x.Job)
                .WithMany(x => x.Events)
                .HasForeignKey(x => x.JobId)
                .OnDelete(DeleteBehavior.Cascade);
        });
        
        // User Infos 
        
        UserInfoRelationshipsKeys.AddUserInfoKeys(modelBuilder);
        
        // Staff Profile (1-1 with User)
        
        modelBuilder.Entity<StaffProfileEntity>(entity =>
        {
            entity.HasOne(s => s.UserInfoEntity)
                .WithOne(u => u.StaffProfileEntity)
                .HasForeignKey<StaffProfileEntity>(s => s.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(s => s.CinemaInfoEntity)
                .WithMany()
                .HasForeignKey(s => s.CinemaId)
                .OnDelete(DeleteBehavior.Restrict);
        });
        
        // Customer Profile (1-1 with User)
        
        modelBuilder.Entity<CustomerProfileEntity>(entity =>
        {
            entity.HasOne(c => c.UserInfoEntity)
                .WithOne(u => u.CustomerProfileEntity)
                .HasForeignKey<CustomerProfileEntity>(c => c.UserId)
                .OnDelete(DeleteBehavior.Restrict);
        });
        
        // Staff Working Logger
        
        modelBuilder.Entity<StaffWorkingLoggerEntity>(entity =>
        {
            entity.HasIndex(e => new { e.StaffId, e.StartedShiftTime }).IsUnique();
        });
        
        // Shift Templates
        
        modelBuilder.Entity<CinemaShiftTemplateEntity>(entity =>
        {
            entity.HasOne(t => t.CinemaInfoEntity)
                .WithMany()
                .HasForeignKey(t => t.CinemaId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(t => t.RoleListInfoEntity)
                .WithMany()
                .HasForeignKey(t => t.RoleId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(t => t.DepartmentEntity)
                .WithMany()
                .HasForeignKey(t => t.DepartmentId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Shift Schedules
        
        modelBuilder.Entity<CinemaShiftScheduleEntity>(entity =>
        {
            entity.HasOne(t => t.CinemaInfoEntity)
                .WithMany()
                .HasForeignKey(t => t.CinemaId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(t => t.DepartmentEntity)
                .WithMany()
                .HasForeignKey(t => t.DepartmentId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(t => t.RoleListInfoEntity)
                .WithMany()
                .HasForeignKey(t => t.RoleId)
                .OnDelete(DeleteBehavior.Restrict);
        });
        
        // Shift Registration (Staff <-> Template/Schedule)
        
        modelBuilder.Entity<StaffShiftRegistrationEntity>(entity =>
        {
            entity.HasIndex(e => new { e.StaffId, e.ShiftTemplateId, e.RegistrationDate })
                .IsUnique()
                .HasFilter("[ShiftTemplateId] IS NOT NULL");

            entity.HasIndex(e => new { e.StaffId, e.ShiftScheduleId })
                .IsUnique()
                .HasFilter("[ShiftScheduleId] IS NOT NULL");
            
            entity.HasOne(r => r.ApprovedByUser)
                .WithMany()
                .HasForeignKey(r => r.ApprovedByUserId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(r => r.CinemaShiftTemplateEntity)
                .WithMany(t => t.StaffShiftRegistrationEntities)
                .HasForeignKey(r => r.ShiftTemplateId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(r => r.CinemaShiftScheduleEntity)
                .WithMany(s => s.StaffShiftRegistrationEntities)
                .HasForeignKey(r => r.ShiftScheduleId)
                .OnDelete(DeleteBehavior.Restrict);
        });
        
        // Salary Total Logger
        
        modelBuilder.Entity<StaffSalaryTotalLoggerEntity>(entity =>
        {
            entity.HasOne(s => s.PaidByUser)
                .WithMany()
                .HasForeignKey(s => s.PaidByUserId)
                .OnDelete(DeleteBehavior.Restrict);
        });
        
        // Departments
        
        modelBuilder.Entity<DepartmentEntity>(entity =>
        {
            entity.ToTable("DepartmentEntity");

            entity.HasOne(d => d.CinemaInfoEntity)
                .WithMany(c => c.Departments)
                .HasForeignKey(d => d.CinemaId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(d => d.SharedUserInfoEntity)
                .WithOne()
                .HasForeignKey<DepartmentEntity>(d => d.SharedUserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<StaffProfileEntity>(entity =>
        {
            entity.HasOne(s => s.DepartmentEntity)
                .WithMany()
                .HasForeignKey(s => s.DepartmentId)
                .OnDelete(DeleteBehavior.SetNull);
        });
        
        // AuditoriumInfoEntities
        
        AuditoriumInfoRelationshipsKeys.AddAuditoriumInfoRelationships(modelBuilder);
        AuditoriumInfoRelationshipsKeys.AddAuditoriumInfoKeys(modelBuilder);
        
        // CinemaInfoEntity
        
        CinemaInfoRelationshipsKeys.AddCinemaInfoKeys(modelBuilder);
        CinemaInfoRelationshipsKeys.AddCinemaInfoRelationships(modelBuilder);
        
        // Roles_entity
        
        RoleListsRelationshipsKeys.AddRoleListsKeys(modelBuilder);
        RoleListsRelationshipsKeys.AddRoleListsRelationships(modelBuilder);
        
        // Cinemas Discounts 
        
        CinemaDiscountsRelationshipsKeys.AddCinemaDiscountsKeys(modelBuilder);
        CinemaDiscountsRelationshipsKeys.AddCinemaDiscountsRelationships(modelBuilder);
        
        
        // User Segments
        
        UserSegmentsInfoRelationshipsKeys.AddUserSegmentsInfoRelationships(modelBuilder);
        UserSegmentsInfoRelationshipsKeys.AddUserSegmentsInfoKeys(modelBuilder);
        SeedDataUserSegmentsInfos.AddUserSegments(modelBuilder);
        
        // Vouchers
        
        VoucherInfoRelationshipsKeys.AddVoucherInfoKeys(modelBuilder);
        VoucherInfoRelationshipsKeys.AddVoucherInfoRelationships(modelBuilder);
        VoucherInfoRelationshipsKeys.AddUserVoucherRelationships(modelBuilder);
        
        // Cinema Surcharge info 
        
        CinemaSurchargeInfoRelationshipsKeys.AddCinemaSurchargeInfoKeys(modelBuilder);
        CinemaSurchargeInfoRelationshipsKeys.AddCinemaSurchargeInfoRelationships(modelBuilder);
        
        // Movies Infos
        
        MovieInfoRelationshipsKeys.AddMovieInfoKeys(modelBuilder);
        MovieInfoRelationshipsKeys.AddMovieInfoRelationships(modelBuilder);
        
        // Genres
        
        MovieGenreInfoRelationshipsKeys.AddMovieGenreInfoRelationships(modelBuilder);
        MovieGenreInfoRelationshipsKeys.AddMovieGenreInfoKeys(modelBuilder);
        
        // Movie infos - genre
        
        MovieGenreMovieInfoRelationshipsKeys.AddMovieGenreMovieInfoKeys(modelBuilder);
        MovieGenreMovieInfoRelationshipsKeys.AddMovieGenreMovieInfoRelationships(modelBuilder);
        
        // Movie Infos - Formats
        
        MovieFormatMovieInfoRelationshipsKeys.AddMovieFormatMovieInfoKeys(modelBuilder);
        MovieFormatMovieInfoRelationshipsKeys.AddMovieFormatMovieInfoRelationships(modelBuilder);
        
        // Required age
        
        MovieRequiredAgeInfoRelationshipsKeys.AddMovieRequiredAgeInfoRelationships(modelBuilder);
        MovieRequiredAgeInfoRelationshipsKeys.AddMovieRequiredAgeInfoKeys(modelBuilder);
        
        // Order Infos
        
        OrderInfoRelationshipsKeys.AddOrderInfoRelationships(modelBuilder);
        OrderInfoRelationshipsKeys.AddOrderInfoKeys(modelBuilder);
        
        // Movie Schedules
        
        MovieSheduleInfoRelationshipsKeys.AddMovieSheduleInfoKeys(modelBuilder);
        MovieSheduleInfoRelationshipsKeys.AddMovieSheduleInfoRelationships(modelBuilder);
        
        // Order details Infos
        
        OrderDetailsInfoRelationshipsKeys.AddOrderDetailsInfoRelationships(modelBuilder);
        OrderDetailsInfoRelationshipsKeys.AddOrderDetailsInfoKeys(modelBuilder);
        
        // Seeds datas for role lists
        
        SeedDataRoleLists.AddRoleListsSeedData(modelBuilder);
        
        // Seeds data for user infos - profiles - roles
        
        SeedDataUserInfos.AddUserInfos(modelBuilder , user_identity_code_constant);
        
        // Seeds data for movie format
        
        SeedDataMovieFormat.AddMovieFormatSeedData(modelBuilder);
        
        // Seed Genres 
        
        MovieGenresSeedData.AddMovieGenreSeedData(modelBuilder);
        
        // Seeds ages
        
        MovieRequiredAgeSeedData.AddMovieAgeSeedData(modelBuilder);

        // Seeds Cinema, Auditorium, Seats, Movie, Schedule (For Booking Flow)
        CinemaAndMovieSeedData.AddSeedData(modelBuilder);

        // Seeds multi cover / banner images for movie detail hero
        MovieCoverImageSeedData.AddMovieCoverImageSeedData(modelBuilder);
        
        // Seeds Cinema Surcharges for User Segments
        CinemaSurchargeSeedData.AddCinemaSurchargeSeedData(modelBuilder);
        
        // Seeds Permissions & PermissionForRole
        PermissionsSeedData.AddPermissionsSeedData(modelBuilder);

        // Seeds Vouchers
        VoucherSeedData.AddVoucherSeedData(modelBuilder);

        AiResearchSeedData.AddAiResearchSeedData(modelBuilder);

        // Concession (F&B) & Inventory

        ConcessionRelationships.AddConcessionRelationships(modelBuilder);

        ConcessionSeedData.AddConcessionSeedData(modelBuilder);

        // Cleaning

        CleaningRelationships.AddCleaningRelationships(modelBuilder);

        // Group Booking (Social)

        modelBuilder.Entity<GroupBookingSessionEntity>(entity =>
        {
            entity.HasKey(x => x.GroupSessionId);
            entity.HasIndex(x => x.GroupCode).IsUnique();
            entity.HasIndex(x => x.CreatedByUserId);
            entity.HasIndex(x => x.MovieScheduleId);
            entity.HasIndex(x => x.Status);

            entity.HasOne(x => x.UserInfoEntity)
                .WithMany()
                .HasForeignKey(x => x.CreatedByUserId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(x => x.MovieScheduleInfoEntity)
                .WithMany()
                .HasForeignKey(x => x.MovieScheduleId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<GroupBookingMemberEntity>(entity =>
        {
            entity.HasKey(x => x.MemberId);
            entity.HasIndex(x => new { x.GroupSessionId, x.UserId }).IsUnique();
            entity.HasIndex(x => x.UserId);

            entity.HasOne(x => x.GroupBookingSession)
                .WithMany(x => x.Members)
                .HasForeignKey(x => x.GroupSessionId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(x => x.UserInfoEntity)
                .WithMany()
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<GroupBookingSeatEntity>(entity =>
        {
            entity.HasKey(x => x.GroupSeatId);
            entity.HasIndex(x => new { x.MemberId, x.SeatId }).IsUnique();

            entity.HasOne(x => x.GroupBookingMember)
                .WithMany(x => x.SelectedSeats)
                .HasForeignKey(x => x.MemberId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(x => x.SeatsInfoEntity)
                .WithMany()
                .HasForeignKey(x => x.SeatId)
                .OnDelete(DeleteBehavior.Restrict);
        });

    }
    
}



