using BusinessLayer.Dtos;
using BusinessLayer.Dtos.facilities_manager.Auditoriums;
using BusinessLayer.Factories.ApplicationFactories;
using DataAccess.Enums;

namespace BusinessLayer.Services.facilities_manager.Auditoriums;

public class facilitiesManagerWriteAuditoriumService
{
    private readonly WriteFactory write_factory;

    public facilitiesManagerWriteAuditoriumService(WriteFactory writeFactory)
    {
        this.write_factory = writeFactory;
    }

    public async Task<BaseResponse<string>> AddAuditorium(AddReqAuditoriumDto addReqAuditoriumDto)
    {
        var objects = write_factory.wirte<AddReqAuditoriumDto, EditReqAuditoriumDto, string>(write_enum.Auditorium);

        var getResults = await objects.AddItem(addReqAuditoriumDto);
        
        return getResults;
    }

    public async Task<BaseResponse<string>> EditAuditorium(Guid auditoriumId,
        EditReqAuditoriumDto editReqAuditoriumDto)
    {
        var objects = write_factory.wirte<AddReqAuditoriumDto, EditReqAuditoriumDto, string>(write_enum.Auditorium);
        var getResults = await objects.UpdateItem(auditoriumId , editReqAuditoriumDto);
        return getResults;

    }
}