using System;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Public.Responses;
using Cinema.Domain.Entities.UserInfos;
using Cinema.Application.Interfaces.Comments;
using Cinema.Domain.Interfaces.Persistence;

namespace Cinema.Application.UseCases.Comments.Recommendation;

public class SaveSurveyUseCase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IRecommendationRepository _repository;

    public SaveSurveyUseCase(IRecommendationRepository repository,
        IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
        _repository = repository;
    }

    public async Task<BaseResponse<object>> ExecuteAsync(Guid userId, SaveSurveyRequestDto dto)
    {
        var existingSurvey = await _repository.GetSurveyByUserIdAsync(userId);
        var genreIdsJson = JsonSerializer.Serialize(dto.PreferredGenreIds.Select(g => g.ToString()));

        if (existingSurvey != null)
        {
            existingSurvey.PreferredGenreIds = genreIdsJson;
            existingSurvey.PreferenceDescription = dto.PreferenceDescription;
            existingSurvey.UpdatedAt = DateTime.UtcNow;
            await _repository.UpdateSurveyAsync(existingSurvey);
        }
        else
        {
            var survey = new UserGenreSurveyEntity
            {
                SurveyId = Guid.NewGuid(),
                UserId = userId,
                PreferredGenreIds = genreIdsJson,
                PreferenceDescription = dto.PreferenceDescription,
                CreatedAt = DateTime.UtcNow
            };
            await _repository.AddSurveyAsync(survey);
        }

        await _unitOfWork.SaveChangesAsync();

        return new BaseResponse<object>
        {
            IsSuccess = true,
            Data = null,
            Message = "Saved recommendation preferences"
        };
    }
}
