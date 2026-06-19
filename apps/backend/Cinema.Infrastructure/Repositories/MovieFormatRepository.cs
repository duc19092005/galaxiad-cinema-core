using Cinema.Application.Dtos.FacilitiesManager.MovieInfos.MovieFormats.Responses;
using Cinema.Domain.Entities.MovieInfos;
using Cinema.Application.Interfaces.Facilities;
using Microsoft.EntityFrameworkCore;

namespace Cinema.Infrastructure.Repositories;

public class MovieFormatRepository : IMovieFormatRepository
{
    private readonly CinemaDbContext _dbContext;

    public MovieFormatRepository(CinemaDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<List<ResFacilitiesManagerMovieFormatDto>> GetAllMovieFormatsAsync()
    {
        return await _dbContext.Set<MovieFormatInfoEntity>()
            .Select(x => new ResFacilitiesManagerMovieFormatDto
            {
                FormatId = x.MovieFormatId,
                FormatName = x.MovieFormatName,
                FormatDescription = x.MovieFormatDescription,
                MovieFormatPrice = x.MovieFormatPrice
            })
            .ToListAsync();
    }
}
