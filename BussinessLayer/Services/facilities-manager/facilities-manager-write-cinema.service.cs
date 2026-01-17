// ReSharper disable All
using BussinessLayer.Dtos;
using BussinessLayer.Dtos.facilities_manager.Cinemas;
using BussinessLayer.Factories;
using BussinessLayer.Factories.ApplicationFactories;
using DataAccess.Enums;

namespace BussinessLayer.Services.facilities_manager;

public class facilitiesManagerWriteCinemaService
{
    private readonly write_factory write_factory;

    public facilitiesManagerWriteCinemaService(write_factory write_factory)
    {
        this.write_factory = write_factory;
    }

    public async Task<baseResponse<string>> AddItem(add_cinema_req_dto addCinemaReqDto)
    {
        var objects = 
            write_factory.wirte<add_cinema_req_dto , edit_cinema_req_dto , string> (write_enum.Cinema);
        var getResults = await objects.AddItem(addCinemaReqDto);
        return getResults;
    }

    public async Task<baseResponse<string>> EditItem(Guid cinemaId ,edit_cinema_req_dto editCinemaReqDto)
    {
        var objects
            = write_factory.wirte<add_cinema_req_dto, edit_cinema_req_dto, string>(write_enum.Cinema);
        var getResults = await objects.UpdateItem(cinemaId,editCinemaReqDto);
        return getResults;
    }
}