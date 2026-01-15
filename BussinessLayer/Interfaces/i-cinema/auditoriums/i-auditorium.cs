using BussinessLayer.Dtos;
using BussinessLayer.Dtos.Auditoriums.facilities_manager;

namespace BussinessLayer.Interfaces.facilities_manager.auditoriums;

public interface i_auditorium
{
    Task<base_reponse<List<get_res_auditorium_dto>>> getByCinemaId(Guid cinemaId);
}