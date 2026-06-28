namespace Cinema.Application.Policies.TheaterManager.ShowtimeRecommendations;

public static class ShowtimeRecommendationDemandLevel
{
    public static string FromScore(decimal score)
    {
        if (score >= 75) return "High";
        if (score >= 45) return "Medium";
        return "Low";
    }
}
