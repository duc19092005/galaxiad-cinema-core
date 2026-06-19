// ReSharper disable All

using System.ComponentModel.DataAnnotations.Schema;
using Cinema.Domain.Entities.MovieInfos;
using Cinema.Domain.Entities.UserInfos;

namespace Cinema.Domain.Entities.CinemaInfos;

public class CinemaDiscountInfoEntity : BaseManagementStatus<UserInfoEntity>
{
    public Guid CinemaId { get; set; }
    
    public Guid MovieFormatId { get; set; }
    
    [Column(TypeName = "decimal(5,2)")] 
    public decimal DiscountPercent { get; set; }

    public string DiscountNote { get; set; } = string.Empty;

    public CinemaInfoEntity CinemaInfoEntity { get; set; } = null!;

    public MovieFormatInfoEntity MovieFormatInfoEntity { get; set; } = null!;
}


