using Cinema.Application.Dtos.FacilitiesManager.MovieInfos.MovieFormats.Responses;

namespace Cinema.Application.Interfaces.Facilities;

public interface IMovieFormatRepository
{
    Task<List<ResFacilitiesManagerMovieFormatDto>> GetAllMovieFormatsAsync();
}
