using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
// ReSharper disable All

namespace DataAccess.Entities.UserInfos;

public class StaffSalaryTotalLoggerEntity
{
    [Key]
    public Guid SalaryTotalLoggerId { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal TotalReceived { get; set; }

    public DateTime ReceivedDay { get; set; }

    [ForeignKey("StaffProfileEntity")]
    public Guid StaffId { get; set; }

    public Guid? PaidByUserId { get; set; }

    [Column(TypeName = "varchar(30)")]
    public string PaymentStatus { get; set; } = "Pending";

    public StaffProfileEntity StaffProfileEntity { get; set; } = null!;
    public UserInfoEntity? PaidByUser { get; set; }

    public List<StaffWorkingLoggerEntity> StaffWorkingLoggerEntities { get; set; } = [];
}
