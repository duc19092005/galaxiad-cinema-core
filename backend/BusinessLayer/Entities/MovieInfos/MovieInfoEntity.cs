// ReSharper disable All

using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using BusinessLayer.Entities.UserInfos;
using Shared.Enums;
using System.Reflection.Metadata.Ecma335;
using Shared.Exceptions;

namespace BusinessLayer.Entities.MovieInfos;

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

    [Column(TypeName = "varchar(2048)")]
    public string MovieBannerUrl { get; set; } = string.Empty;

    [Column(TypeName = "varchar(2048)")]
    public string TrailerUrl { get; set; } = string.Empty;

    [Column(TypeName = "nvarchar(200)")]
    public string Director { get; set; } = string.Empty;

    [Column(TypeName = "nvarchar(500)")]
    public string Actors { get; set; } = string.Empty;

    public int MovieDuration { get; set; }

    public bool IsCommingSoon { get; set; } = true;

    public DateTime EndedDate {get;set;}

    public Guid? MovieManagerId { get; set; }

    public UserInfoEntity? MovieManager { get; set; } = null!;

    public List<MovieGenreMovieInfoEntity> MovieGenreMovieInfoEntity { get; set; } = [];

    public List<MovieScheduleInfoEntity> MovieScheduleInfoEntity { get; set; } = [];
    public movieRequiredAgeEntity MovieRequiredAgeEntity { get; set; } = null!;

    public List<movieFormatMovieInfoEntity> MovieFormatMovieInfoEntity { get; set; } = [];

    public List<MovieCinemaEntity> MovieCinemaEntities { get; set; } = [];

    public List<MovieCommentEntity> MovieCommentEntities { get; set; } = [];

    public List<MovieViewEntity> MovieViewEntities { get; set; } = [];
}

