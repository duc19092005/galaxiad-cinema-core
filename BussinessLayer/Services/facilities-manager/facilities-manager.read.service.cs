using BussinessLayer.Dtos;
using BussinessLayer.Dtos.cinemas.facilities_manager;
using BussinessLayer.Factories;
using DataAccess.Enums;

namespace BussinessLayer.Services.facilities_manager;

public class facilities_manager_read_service
{
    private readonly read_factory _readFactory;

    public facilities_manager_read_service(read_factory _readFactory)
    {
        this._readFactory =  _readFactory;
    }

    public async Task<base_reponse<List<res_facilities_manager_cinema>>> getAll()
    {
        var objects = _readFactory.ReadData<res_facilities_manager_cinema>(write_enum.Cinema);
        var results = await objects.getAll();
        return results;
    }
}