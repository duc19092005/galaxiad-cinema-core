using BussinessLayer.Dtos;
using BussinessLayer.Dtos.facilities_manager.Auditoriums;
using BussinessLayer.Factories.ApplicationFactories;
using DataAccess.Enums;

namespace BussinessLayer.Services.facilities_manager.Auditoriums;

public class facilitiesManagerWriteAuditoriumService
{
    private readonly write_factory write_factory;

    public facilitiesManagerWriteAuditoriumService(write_factory writeFactory)
    {
        this.write_factory = writeFactory;
    }

    public async Task<baseResponse<string>> AddAuditorium(add_req_auditorium_dto addReqAuditoriumDto)
    {
        var objects = write_factory.wirte<add_req_auditorium_dto, edit_req_auditorium_dto, string>(write_enum.Auditorium);

        var getResults = await objects.AddItem(addReqAuditoriumDto);
        
        return getResults;
    }

    public async Task<baseResponse<string>> EditAuditorium(Guid auditoriumId,
        edit_req_auditorium_dto editReqAuditoriumDto)
    {
        var objects = write_factory.wirte<add_req_auditorium_dto, edit_req_auditorium_dto, string>(write_enum.Auditorium);
        var getResults = await objects.UpdateItem(auditoriumId , editReqAuditoriumDto);
        return getResults;

    }
}