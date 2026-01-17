// ReSharper disable All

using System.ComponentModel.DataAnnotations.Schema;
using DataAccess.Entities.Movie_infos;
using DataAccess.Entities.User_Info;

namespace DataAccess.Entities.Cinema_Infos;

public class cinema_discount_info_entity : base_management_status<user_info_entity>
{
    public Guid cinemaId { get; set; }
    
    public Guid movieFormatId { get; set; }
    
    [Column(TypeName = "decimal(5,2)")] 
    public decimal discountPercent { get; set; }

    public string discountNote { get; set; } = string.Empty;

    public cinema_info_entity cinema_info_entity { get; set; } = null!;

    public movieFormatInfoEntity movie_format_info_entity { get; set; } = null!;
}