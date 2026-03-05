
using BusinessLayer.Dtos;
using BusinessLayer.Dtos.FacilitiesManager.Cinemas.Requests;
using BusinessLayer.Factories.ApplicationFactories;
using Shared.Enums;

namespace BusinessLayer.Services.FacilitiesManager.Cinemas;

public class FacilitiesManagerWriteCinemaService
{
    private readonly WriteFactory _writeFactory;

    public FacilitiesManagerWriteCinemaService(WriteFactory writeFactory)
    {
        this._writeFactory = writeFactory;
    }

    public async Task<BaseResponse<string>> AddItem(AddCinemaReqDto addCinemaReqDto)
    {
        var objects = 
            _writeFactory.Write<AddCinemaReqDto , EditCinemaReqDto , string> (WriteEnum.Cinema);
        var getResults = await objects.AddItem(addCinemaReqDto);
        return getResults;
    }

    public async Task<BaseResponse<string>> EditItem(Guid cinemaId ,EditCinemaReqDto editCinemaReqDto)
    {
        var objects
            = _writeFactory.Write<AddCinemaReqDto, EditCinemaReqDto, string>(WriteEnum.Cinema);
        var getResults = await objects.UpdateItem(cinemaId,editCinemaReqDto);
        return getResults;
    }
}
