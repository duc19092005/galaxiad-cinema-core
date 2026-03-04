// ReSharper disable All

using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using DataAccess.Entities.UserInfos;
using Shared.Enums;
using DataAccess.RelationshipKeys.MovieInfos;
using System.Reflection.Metadata.Ecma335;
using Shared.Exceptions;

namespace DataAccess.Entities.MovieInfos;

public class MovieInfoEntity : BaseManagementStatus<UserInfoEntity>
{

    public Guid MovieId { get; set; }

    public Guid MovieRequiredAgeId { get; set; }

    [Column(TypeName = "nvarchar(100)")]
    public string MovieName { get; set; } = string.Empty;

    [Column(TypeName = "varchar(2048)")]
    public string MovieDescription { get; set; } = string.Empty;

    [Column(TypeName = "varchar(2048)")]
    public string MovieImageUrl { get; set; } = string.Empty;
    
    public int MovieDuration { get; set; }

    public bool IsCommingSoon { get; set; } = true;

    public DateTime EndedDate {get;set;}

    public Guid ManagerId { get; set; }

    public UserInfoEntity Manager { get; set; } = null!;

    public List<MovieGenreMovieInfoEntity> MovieGenreMovieInfoEntity = [];

    public List<MovieScheduleInfoEntity> MovieScheduleInfoEntity = [];
    public movieRequiredAgeEntity MovieRequiredAgeEntity { get; set; } = null!;

    public List<movieFormatMovieInfoEntity> MovieFormatMovieInfoEntity { get; set; } = [];
}



