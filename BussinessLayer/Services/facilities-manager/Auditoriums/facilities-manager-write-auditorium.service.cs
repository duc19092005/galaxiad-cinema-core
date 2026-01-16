using BussinessLayer.Dtos;
using BussinessLayer.Dtos.Auditoriums.facilities_manager;
using BussinessLayer.Factories;
using DataAccess.Enums;

namespace BussinessLayer.Services.facilities_manager.Auditoriums;

public class facilitiesManagerWriteAuditoriumService
{
    private readonly write_factory write_factory;

    public facilitiesManagerWriteAuditoriumService(write_factory writeFactory)
    {
        this.write_factory = writeFactory;
    }

    public async Task<base_reponse<string>> AddAuditorium(add_req_auditorium_dto add_req_auditorium_dto)
    {
        var objects = write_factory.wirte<add_req_auditorium_dto, edit_req_auditorium_dto, string>(write_enum.Auditorium);

        var getResults = await objects.AddItem(add_req_auditorium_dto);
        
        return getResults;
    }
}