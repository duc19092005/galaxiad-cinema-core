using BussinessLayer.Dtos;
using BussinessLayer.Dtos.facilities_manager.Cinemas;
using BussinessLayer.Dtos.Movie_Manager;
using BussinessLayer.Factories.ApplicationFactories;
using DataAccess.Enums;

namespace BussinessLayer.Services.Movie_manager;

public class movieManagerWriteMovieService
{
    private readonly write_factory write_factory;

    public movieManagerWriteMovieService(write_factory write_factory)
    {
        this.write_factory = write_factory;
    }

    public async Task<baseResponse<string>> AddItem(reqAddMovieManagerMovieDto request)
    {
        var worker = 
            write_factory.wirte<reqAddMovieManagerMovieDto , reqEditMovieManagerMovieDto , string> (write_enum.Movie);
        var getResults = await worker.AddItem(request);
        return getResults;
    }

    public async Task<baseResponse<string>> UpdateItem(Guid itemId , reqEditMovieManagerMovieDto request)
    {
        var worker = 
            write_factory.wirte<reqAddMovieManagerMovieDto , reqEditMovieManagerMovieDto , string> (write_enum.Movie);
        var getResults = await worker.UpdateItem(itemId, request);
        return getResults;
    }
}