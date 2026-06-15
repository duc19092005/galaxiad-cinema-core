using BusinessLayer.Dtos;
using BusinessLayer.Dtos.MovieManager.Responses;
using BusinessLayer.Factories.ApplicationFactories;
using BusinessLayer.Interfaces.IBehaviors;
using Shared.Enums;

public class MovieManagerReadMovie
{
    private readonly ReadFactory _readFactory;

    public MovieManagerReadMovie(
        ReadFactory readFactory
    )
    {
        this._readFactory = readFactory;
    }

    public async Task<BaseResponse<List<ResGetMovieInfosMovieManagerDto>>> GetAllMovieInfos(Guid? cinemaId = null)
    {
        var worker = GetWorker();
        if (worker is BusinessLayer.UseCases.MovieManager.MovieInfos.ReadMovieInfoUseCase readMovieUseCase)
        {
            return await readMovieUseCase.GetAll(cinemaId);
        }
        return await worker.GetAll();
    }

    public async Task<BaseResponse<ResGetMovieInfosMovieManagerDto>> GetMovieByMovieId(Guid id)
    {
        var worker = GetWorker();
        return await worker.GetById(id);
    }

    private IReadBehavior<ResGetMovieInfosMovieManagerDto> GetWorker()
    {
        return _readFactory.ReadData<ResGetMovieInfosMovieManagerDto>(WriteEnum.Movie);
    }
}