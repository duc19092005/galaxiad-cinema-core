using BusinessLayer.Dtos;
using BusinessLayer.Dtos.MovieManager.Requests;
using BusinessLayer.Factories.ApplicationFactories;
using Shared.Enums;

namespace BusinessLayer.Services.MovieManager;

public class MovieManagerWriteMovieService
{
    private readonly WriteFactory _writeFactory;

    public MovieManagerWriteMovieService(WriteFactory writeFactory)
    {
        this._writeFactory = writeFactory;
    }

    public async Task<BaseResponse<string>> AddItem(ReqAddMovieManagerMovieDto request)
    {
        var worker = 
            _writeFactory.Write<ReqAddMovieManagerMovieDto , ReqEditMovieManagerMovieDto , string> (WriteEnum.Movie);
        var getResults = await worker.AddItem(request);
        return getResults;
    }

    public async Task<BaseResponse<string>> UpdateItem(Guid itemId , ReqEditMovieManagerMovieDto request)
    {
        var worker = 
            _writeFactory.Write<ReqAddMovieManagerMovieDto , ReqEditMovieManagerMovieDto , string> (WriteEnum.Movie);
        var getResults = await worker.UpdateItem(itemId, request);
        return getResults;
    }
}
