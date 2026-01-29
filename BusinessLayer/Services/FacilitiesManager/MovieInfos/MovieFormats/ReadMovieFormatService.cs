using BusinessLayer.Dtos;
using BusinessLayer.Dtos.FacilitiesManager.MovieInfos.MovieFormats;
using BusinessLayer.Factories.ApplicationFactories;
using Shared.Enums;

namespace BusinessLayer.Services.FacilitiesManager.MovieInfos.MovieFormats;

public class FacilitiesManagerReadMovieFormatService
{
    private readonly ReadFactory _readFactory;

    public FacilitiesManagerReadMovieFormatService(ReadFactory readFactory)
    {
        this._readFactory = readFactory;
    }

    public async Task<BaseResponse<List<ResFacilitiesManagerMovieFormatDto>>> ReadAllMovieFormat()
    {
        var objects = _readFactory.ReadData<ResFacilitiesManagerMovieFormatDto>(WriteEnum.MovieFormat);

        var getResults = await objects.GetAll();
        
        return getResults;
    }
}
