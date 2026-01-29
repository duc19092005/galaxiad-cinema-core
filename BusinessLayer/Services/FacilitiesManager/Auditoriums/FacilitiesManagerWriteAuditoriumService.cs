using BusinessLayer.Dtos;
using BusinessLayer.Dtos.FacilitiesManager.Auditoriums;
using BusinessLayer.Factories.ApplicationFactories;
using Shared.Enums;

namespace BusinessLayer.Services.FacilitiesManager.Auditoriums;

public class FacilitiesManagerWriteAuditoriumService
{
    private readonly WriteFactory _writeFactory;

    public FacilitiesManagerWriteAuditoriumService(WriteFactory writeFactory)
    {
        this._writeFactory = writeFactory;
    }

    public async Task<BaseResponse<string>> AddAuditorium(AddReqAuditoriumDto addReqAuditoriumDto)
    {
        var objects = _writeFactory.Write<AddReqAuditoriumDto, EditReqAuditoriumDto, string>(WriteEnum.Auditorium);

        var getResults = await objects.AddItem(addReqAuditoriumDto);
        
        return getResults;
    }

    public async Task<BaseResponse<string>> EditAuditorium(Guid auditoriumId,
        EditReqAuditoriumDto editReqAuditoriumDto)
    {
        var objects = _writeFactory.Write<AddReqAuditoriumDto, EditReqAuditoriumDto, string>(WriteEnum.Auditorium);
        var getResults = await objects.UpdateItem(auditoriumId , editReqAuditoriumDto);
        return getResults;

    }
}
