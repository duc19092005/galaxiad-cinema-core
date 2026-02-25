using BusinessLayer.Dtos;
using BusinessLayer.Dtos.MovieManager;
using BusinessLayer.Dtos.TheaterManager.MovieSchedules;
using BusinessLayer.Factories.ApplicationFactories;
using Shared.Enums;

namespace BusinessLayer.Services.TheaterManager.MovieSchedules;

public class TheaterManagerWriteSchedulesService
{
    private readonly WriteFactory _writeFactory;

    public TheaterManagerWriteSchedulesService(WriteFactory writeFactory)
    {
        _writeFactory = writeFactory;
    }
    
    public async Task<BaseResponse<string>> AddItem(TheaterManagerAddMovieSchedulesRequest request)
    {
        var worker = 
            _writeFactory.Write<TheaterManagerAddMovieSchedulesRequest , TheaterManagerEditMovieSchedulesRequest , string> (WriteEnum.MovieSchedules);
        var getResults = await worker.AddItem(request);
        return getResults;
    }
}
