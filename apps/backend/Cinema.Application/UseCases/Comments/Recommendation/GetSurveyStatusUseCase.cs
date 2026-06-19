using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Threading.Tasks;
using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Public.Responses;
using Cinema.Application.Interfaces.Comments;

namespace Cinema.Application.UseCases.Comments.Recommendation;

public class GetSurveyStatusUseCase
{
    private readonly IRecommendationRepository _repository;

    public GetSurveyStatusUseCase(IRecommendationRepository repository)
    {
        _repository = repository;
    }

    public async Task<BaseResponse<SurveyStatusRes>> ExecuteAsync(Guid userId)
    {
        var survey = await _repository.GetSurveyByUserIdAsync(userId);

        if (survey == null)
        {
            return new BaseResponse<SurveyStatusRes>
            {
                IsSuccess = true,
                Data = new SurveyStatusRes { HasCompletedSurvey = false },
                Message = "Survey not completed"
            };
        }

        var genreIds = JsonSerializer.Deserialize<List<string>>(survey.PreferredGenreIds) ?? [];

        return new BaseResponse<SurveyStatusRes>
        {
            IsSuccess = true,
            Data = new SurveyStatusRes
            {
                HasCompletedSurvey = true,
                PreferredGenreIds = genreIds,
                PreferenceDescription = survey.PreferenceDescription
            },
            Message = "Survey completed"
        };
    }
}
