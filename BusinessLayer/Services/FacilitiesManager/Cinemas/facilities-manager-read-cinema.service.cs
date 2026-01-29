using BusinessLayer.Dtos;
using BusinessLayer.Dtos.FacilitiesManager.Cinemas;
using BusinessLayer.Factories.ApplicationFactories;
using DataAccess.Enums;

namespace BusinessLayer.Services.FacilitiesManager;

public class FacilitiesManagerReadCinemaService
{
    private readonly ReadFactory _readFactory;

    public FacilitiesManagerReadCinemaService(ReadFactory readFactory)
    {
        this._readFactory =  readFactory;
    }

    public async Task<BaseResponse<List<ResFacilitiesManagerCinema>>> GetAll()
    {
        var objects = _readFactory.ReadData<ResFacilitiesManagerCinema>(write_enum.Cinema);
        var results = await objects.GetAll();
        return results;
    }
    
    public async Task<BaseResponse<ResFacilitiesManagerCinema>> GetById(Guid id)
    {
        var objects = _readFactory.ReadData<ResFacilitiesManagerCinema>(write_enum.Cinema);
        var results = await objects.GetById(id);
        return results;
    }
}