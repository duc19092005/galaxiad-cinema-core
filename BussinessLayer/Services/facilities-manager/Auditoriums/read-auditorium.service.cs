using BussinessLayer.Dtos;
using BussinessLayer.Dtos.Auditoriums.facilities_manager;
using BussinessLayer.Factories;
using DataAccess.Enums;

namespace BussinessLayer.Services.facilities_manager.Auditoriums;

public class read_auditorium_service_auditorium_service
{
    private readonly read_factory _readFactory;

    public read_auditorium_service_auditorium_service(read_factory _readFactory)
    {
        this._readFactory =  _readFactory;
    }

    public async Task<base_reponse<List<get_res_auditorium_dto>>> getAll()
    {
        var objects = _readFactory.ReadData<get_res_auditorium_dto>(write_enum.Auditorium);
        var results = await objects.getAll();
        return results;
    }
    
    public async Task<base_reponse<get_res_auditorium_dto>> getById(Guid id)
    {
        var objects = _readFactory.ReadData<get_res_auditorium_dto>(write_enum.Auditorium);
        var results = await objects.getById(id);
        return results;
    }
}