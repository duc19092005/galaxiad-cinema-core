// ReSharper disable All

using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using DataAccess.Entities.User_Info;
using DataAccess.Enums;
using DataAccess.status_management_relationships_keys.movie_infos;

namespace DataAccess.Entities.Movie_infos;

public class movie_info_entity : base_management_status<user_info_entity>
{
    
    public Guid movieId { get; set; }

    public Guid managerId { get; set; }
    
    public Guid movieRequiredAgeId { get; set; }
    
    [Column(TypeName = "nvarchar(100)")]
    public string movieName { get; set; } = string.Empty;
    
    [Column(TypeName = "varchar(2048)")]
    public string movieDescription { get; set; } = string.Empty;

    [Column(TypeName = "varchar(2048)")]
    public string movieImageUrl { get; set; } = string.Empty;

    public user_info_entity manager { get; set; } = null!;
    
    public DateTime endedDate { get; set; }

    public List<movie_genre_movie_info_entity> movie_genre_movie_info_entity = [];

    public List<movie_schedule_info_entity> movie_schedule_info_entity = [];
    public movie_required_age_entity movie_required_age_entity { get; set; } = null!;
}

