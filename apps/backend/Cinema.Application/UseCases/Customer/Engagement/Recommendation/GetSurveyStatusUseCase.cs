using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Threading.Tasks;
using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Public.Responses;
using Cinema.Application.Interfaces.Comments;
using Cinema.Domain.Localization;

namespace Cinema.Application.UseCases.Customer.Engagement.Recommendation;

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
                Message = Messages.Recommendation.SurveyNotCompleted
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
            Message = Messages.Recommendation.SurveyCompleted
        };
    }
}

