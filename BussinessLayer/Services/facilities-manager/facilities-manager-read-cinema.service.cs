using BussinessLayer.Dtos;
using BussinessLayer.Dtos.cinemas.facilities_manager;
using BussinessLayer.Factories;
using DataAccess.Enums;

namespace BussinessLayer.Services.facilities_manager;

public class facilitiesManagerReadCinemaService
{
    private readonly read_factory _readFactory;

    public facilitiesManagerReadCinemaService(read_factory _readFactory)
    {
        this._readFactory =  _readFactory;
    }

    public async Task<base_reponse<List<res_facilities_manager_cinema>>> GetAll()
    {
        var objects = _readFactory.ReadData<res_facilities_manager_cinema>(write_enum.Cinema);
        var results = await objects.GetAll();
        return results;
    }
    
    public async Task<base_reponse<res_facilities_manager_cinema>> GetById(Guid id)
    {
        var objects = _readFactory.ReadData<res_facilities_manager_cinema>(write_enum.Cinema);
        var results = await objects.GetById(id);
        return results;
    }
}