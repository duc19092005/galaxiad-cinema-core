using BussinessLayer.Dtos;
using BussinessLayer.Dtos.Auditoriums.facilities_manager;
using BussinessLayer.Factories;
using DataAccess.Enums;

namespace BussinessLayer.Services.facilities_manager.Auditoriums;

public class facilitiesManagerReadAuditoriumService
{
    private readonly read_factory _readFactory;
    
    private readCinemaFactory _readCinemaFactory;

    public facilitiesManagerReadAuditoriumService(read_factory readFactory, readCinemaFactory readCinemaFactory)
    {
        this._readFactory =  readFactory;
        _readCinemaFactory = readCinemaFactory;
    }

    public async Task<base_reponse<List<get_res_auditorium_dto>>> GetAll()
    {
        var objects = _readFactory.ReadData<get_res_auditorium_dto>(write_enum.Auditorium);
        var results = await objects.GetAll();
        return results;
    }
    
    public async Task<base_reponse<get_res_auditorium_dto>> GetById(Guid id)
    {
        var objects = _readFactory.ReadData<get_res_auditorium_dto>(write_enum.Auditorium);
        var results = await objects.GetById(id);
        return results;
    }

    public async Task<base_reponse<List<GetResAuditoriumDtoCinema>>> GetByCinemaId(Guid cinemaId)
    {
        var objects = _readCinemaFactory.ReadDataFromCinemaInfoFactory<GetResAuditoriumDtoCinema>(write_enum.Auditorium);
        var results = await objects.GetByCinemaId(cinemaId);
        return results;
    }
}