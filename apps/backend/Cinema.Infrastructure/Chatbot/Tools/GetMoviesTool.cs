using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Cinema.Application.Interfaces.Chatbot;
using Cinema.Application.Interfaces.Admin;
using Cinema.Domain.Constants;

namespace Cinema.Infrastructure.Chatbot.Tools;

public class GetMoviesTool : IChatTool
{
    private readonly IAdminMovieManagementRepository _adminRepository;

    public GetMoviesTool(IAdminMovieManagementRepository adminRepository)
    {
        _adminRepository = adminRepository;
    }

    public string IntentName => ChatbotConstants.Intents.GetMovies;

    public async Task<string> ExecuteAsync(Dictionary<string, string> parameters)
    {
        // Fetch all movie infos as administrator (full scope) to get all movies
        var movies = await _adminRepository.GetMovieInfosAsync(null, true, null);
        
        // Filter out deleted/inactive movies for public safety if not admin
        var now = DateTime.UtcNow;
        var activeMovies = movies.Select(m => new
        {
            m.MovieId,
            m.MovieName,
            MovieDuration = m.Duration,
            m.Director,
            m.Actors,
            IsActive = now >= m.StartedDate && now <= m.EndedDate,
            IsCommingSoon = now < m.StartedDate,
            ActiveAt = m.StartedDate,
            m.EndedDate
        }).ToList();

        return JsonSerializer.Serialize(activeMovies);
    }
}

