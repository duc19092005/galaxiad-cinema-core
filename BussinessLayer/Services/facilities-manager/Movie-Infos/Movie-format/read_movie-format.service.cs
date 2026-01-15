using BussinessLayer.Dtos;
using BussinessLayer.Dtos.Auditoriums.facilities_manager;
using BussinessLayer.Dtos.Movie_Infos.Movie_Format;
using BussinessLayer.Factories;
using DataAccess.Enums;

namespace BussinessLayer.Services.facilities_manager.Movie_Infos.Movie_format;

public class facilities_manager_read_movie_format_service
{
    private readonly read_factory _readFactory;

    public facilities_manager_read_movie_format_service(read_factory _readFactory)
    {
        this._readFactory = _readFactory;
    }

    public async Task<base_reponse<List<facilities_manager_res_movie_format_dto>>> ReadAllMovieFormat()
    {
        var objects = _readFactory.ReadData<facilities_manager_res_movie_format_dto>(write_enum.MovieFormat);

        var getResults = await objects.getAll();
        
        return getResults;
    }
}