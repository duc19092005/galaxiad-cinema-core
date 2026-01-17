using BussinessLayer.Dtos;
using BussinessLayer.Dtos.facilities_manager.Movie_Infos.Movie_Format;
using BussinessLayer.Factories;
using BussinessLayer.Factories.ApplicationFactories;
using DataAccess.Enums;

namespace BussinessLayer.Services.facilities_manager.Movie_Infos.Movie_format;

public class facilitiesManagerReadMovieFormatService
{
    private readonly read_factory _readFactory;

    public facilitiesManagerReadMovieFormatService(read_factory _readFactory)
    {
        this._readFactory = _readFactory;
    }

    public async Task<baseResponse<List<resFacilitiesManagerMovieFormatDto>>> ReadAllMovieFormat()
    {
        var objects = _readFactory.ReadData<resFacilitiesManagerMovieFormatDto>(write_enum.MovieFormat);

        var getResults = await objects.GetAll();
        
        return getResults;
    }
}