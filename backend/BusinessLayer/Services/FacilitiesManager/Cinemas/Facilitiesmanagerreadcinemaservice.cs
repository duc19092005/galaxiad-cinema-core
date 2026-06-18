using BusinessLayer.Dtos;
using BusinessLayer.Dtos.FacilitiesManager.Cinemas.Responses;
using BusinessLayer.Factories.ApplicationFactories;
using Shared.Enums;

namespace BusinessLayer.Services.FacilitiesManager.Cinemas;

public class FacilitiesManagerReadCinemaService
{
    private readonly ReadFactory _readFactory;

    public FacilitiesManagerReadCinemaService(ReadFactory readFactory)
    {
        this._readFactory =  readFactory;
    }

    public async Task<BaseResponse<List<ResFacilitiesManagerCinema>>> GetAll()
    {
        var objects = _readFactory.ReadData<ResFacilitiesManagerCinema>(WriteEnum.Cinema);
        var results = await objects.GetAll();
        return results;
    }
    
    public async Task<BaseResponse<ResFacilitiesManagerCinema>> GetById(Guid id)
    {
        var objects = _readFactory.ReadData<ResFacilitiesManagerCinema>(WriteEnum.Cinema);
        var results = await objects.GetById(id);
        return results;
    }
}
