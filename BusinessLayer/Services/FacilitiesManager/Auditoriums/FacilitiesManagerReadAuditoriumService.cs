using BusinessLayer.Dtos;
using BusinessLayer.Dtos.FacilitiesManager.Auditoriums;
using BusinessLayer.Factories;
using BusinessLayer.Factories.ApplicationFactories;
using Shared.Enums;

namespace BusinessLayer.Services.FacilitiesManager.Auditoriums;

public class FacilitiesManagerReadAuditoriumService
{
    private readonly ReadFactory _readFactory;
    
    private readonly ReadDataFromCinemaFactory _readCinemaFactory;

    public FacilitiesManagerReadAuditoriumService(ReadFactory readFactory, ReadDataFromCinemaFactory readCinemaFactory)
    {
        _readFactory =  readFactory;
        _readCinemaFactory = readCinemaFactory;
    }

    public async Task<BaseResponse<List<GetResAuditoriumDto>>> GetAll()
    {
        var objects = _readFactory.ReadData<GetResAuditoriumDto>(WriteEnum.Auditorium);
        var results = await objects.GetAll();
        return results;
    }
    
    public async Task<BaseResponse<GetResAuditoriumDto>> GetById(Guid id)
    {
        var objects = _readFactory.ReadData<GetResAuditoriumDto>(WriteEnum.Auditorium);
        var results = await objects.GetById(id);
        return results;
    }

    public async Task<BaseResponse<List<GetResAuditoriumDtoCinema>>> GetByCinemaId(Guid cinemaId)
    {
        var objects = _readCinemaFactory.ReadDataFromCinemaInfoFactory<GetResAuditoriumDtoCinema>(WriteEnum.Auditorium);
        var results = await objects.GetByCinemaId(cinemaId);
        return results;
    }
}
