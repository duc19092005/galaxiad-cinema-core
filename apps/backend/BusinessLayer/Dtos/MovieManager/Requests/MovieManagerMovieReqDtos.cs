using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;

namespace BusinessLayer.Dtos.MovieManager.Requests;

public class ReqAddMovieManagerMovieDto
{
    [Required(ErrorMessage = "Movie Required Age is required")]
    public Guid MovieRequiredAgeId { get; set; }

    [Required(ErrorMessage = "Movie Name is required")]
    [StringLength(50, MinimumLength = 1 , ErrorMessage = "Movie Name length must be between 1 and 50 characters")]
    public string MovieName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Movie Descriptions is required")]
    [StringLength(200, MinimumLength = 1 , ErrorMessage = "Movie Descriptions length must be between 1 and 200 characters")]
    public string MovieDescription { get; set; } = string.Empty;

    [Required(ErrorMessage = "Movie Image is required")]
    public IFormFile MovieImage { get; set; } = null!;

    public IFormFile? MovieBanner { get; set; }

    [Required(ErrorMessage = "Movie Ended Date is required")]
    public DateTime EndedDate { get; set; }

    [Required(ErrorMessage = "Movie Started Date is required")]
    public DateTime StartedDate { get; set; }

    [Required(ErrorMessage = "Movie Format Ids is required")]
    public List<Guid> MovieFormatIds { get; set; } = [];

    [Required(ErrorMessage = "Movie Genre Ids is required")]
    public List<Guid> MovieGenreIds { get; set; } = [];

    [Required(ErrorMessage = "Movie Duration is Required")]
    public int Duration { get; set; }

    [StringLength(2048)]
    public string TrailerUrl { get; set; } = string.Empty;

    [Required(ErrorMessage = "Director is required")]
    [StringLength(200, MinimumLength = 1)]
    public string Director { get; set; } = string.Empty;

    [Required(ErrorMessage = "Actors is required")]
    [StringLength(500, MinimumLength = 1)]
    public string Actors { get; set; } = string.Empty;

    [Required(ErrorMessage = "Cinema Ids are required")]
    public List<Guid> CinemaIds { get; set; } = [];
}

public class ReqEditMovieManagerMovieDto
{
    public Guid? MovieRequiredAgeId { get; set; }
    
    [StringLength(50, MinimumLength = 1 , ErrorMessage = "Movie Name length must be between 1 and 50 characters")]
    public string? MovieName { get; set; }
    
    [StringLength(200, MinimumLength = 1 , ErrorMessage = "Movie Descriptions length must be between 1 and 200 characters")]
    public string? MovieDescription { get; set; } 

    public IFormFile? MovieImage { get; set; }

    public IFormFile? MovieBanner { get; set; }

    public DateTime? EndedDate { get; set; }
    
    public DateTime? StartedDate { get; set; }

    public List<Guid>? MovieFormatIds { get; set; } = [];

    public List<Guid>? MovieGenreIds { get; set; } = [];
    
    public int? Duration { get; set; }
    
    [StringLength(2048)]
    public string? TrailerUrl { get; set; }
    
    [StringLength(200)]
    public string? Director { get; set; }
    
    [StringLength(500)]
    public string? Actors { get; set; }

    public List<Guid>? CinemaIds { get; set; } = [];
}
