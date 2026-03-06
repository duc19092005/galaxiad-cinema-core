using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using DataAccess.Entities.UserInfos;

namespace DataAccess.Entities.CinemaInfos;
// ReSharper disable All

public class CinemaInfoEntity : BaseManagementStatus<UserInfoEntity>
{
    [Key]
    public Guid CinemaId { get; set; } 
    
    [Column(TypeName = "nvarchar(100)")]
    public string CinemaCity { get; set; } = null!;
    
    [Column(TypeName = "nvarchar(100)")]
    public string CinemaLocation { get; set; } = null!;
    
    [Column(TypeName = "nvarchar(1000)")]
    public string CinemaName { get; set; } = null!;

    [Column(TypeName = "char(10)")]
    public string CinemaHotLineNumber { get; set; } = null!;

    [Column(TypeName = "nvarchar(max)")]
    public string CinemaDescription { get; set; } = null!;
    
    public Guid ManagerId { get; set; }


    public List<AuditoriumInfoEntities> AuditoriumInfoEntities { get; set; } = [];

    public List<CinemaDiscountInfoEntity> CinemaDiscountInfoEntity { get; set; } = [];

    public List<CinemaSurchargeInfosEntity> CinemaSurchargeInfosEntity { get; set; } = [];
    public UserInfoEntity? manager { get; set; }
    
    

}

