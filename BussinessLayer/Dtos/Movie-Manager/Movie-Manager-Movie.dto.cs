using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;

namespace BussinessLayer.Dtos.Movie_Manager;

public class reqAddMovieManagerMovieDto
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
    public IFormFile MovieImage { get; set; } =  null!;

    [Required(ErrorMessage = "Movie Ended Date is required")]
    public DateTime EndedDate { get; set; }
    
    [Required(ErrorMessage = "Movie Started Date is required")]
    public DateTime StartedDate { get; set; }

    [Required(ErrorMessage = "Movie Format Ids is required")]
    public List<Guid> MovieFormatIds { get; set; } = [];

    [Required(ErrorMessage = "Movie Genre Ids is required")]
    public List<Guid> MovieGenreIds { get; set; } = [];
}

public class reqEditMovieManagerMovieDto
{
    public Guid? MovieRequiredAgeId { get; set; }
    
    [StringLength(50, MinimumLength = 1 , ErrorMessage = "Movie Name length must be between 1 and 50 characters")]
    public string? MovieName { get; set; } = string.Empty;
    
    [StringLength(200, MinimumLength = 1 , ErrorMessage = "Movie Descriptions length must be between 1 and 200 characters")]
    public string? MovieDescription { get; set; } 

    public IFormFile? MovieImage { get; set; } =  null!;

    public DateTime? EndedDate { get; set; }
    
    public DateTime? StartedDate { get; set; }

    public List<Guid>? MovieFormatIds { get; set; } = [];

    public List<Guid>? MovieGenreIds { get; set; } = [];
}

public class resGetMovieInfosMovieManagerDto
{
    public Guid MovieId { get; set; }
    
    public string MovieName { get; set; } = String.Empty;

    public string MovieDescriptions { get; set; } = string.Empty;
    
    public string MovieImageUrl { get; set; } = string.Empty;
    
    public DateTime EndedDate { get; set; }
    
    public DateTime StartedDate { get; set; }

    public List<string> MovieGenresInfos { get; set; } = [];

    public List<string> MovieVisualFormatInfos { get; set; } = [];
    
    public DateTime UpdatedAt { get; set; }
    
    public DateTime CreatedAt { get; set; }
    
    public DateTime UpdatedBy { get; set; }
    
    public DateTime CreatedBy { get; set; }
}