using BusinessLayer.Constants;
using BusinessLayer.Entities.MovieInfos;
using Microsoft.EntityFrameworkCore;

namespace DataAccess.SeedData;

public static class MovieRequiredAgeSeedData
{
    public static void AddMovieAgeSeedData(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<movieRequiredAgeEntity>().HasData(new List<movieRequiredAgeEntity>()
        {
            new() {
                MovieRequiredAgeId = movieRequiredAgeConstants.AllAges,
                MovieRequiredAgeSymbol = "P",
                MovieRequiredAgeDescription = "General Admission: Suitable for audiences of all ages."
            },
            new() {
                MovieRequiredAgeId = movieRequiredAgeConstants.Under13,
                MovieRequiredAgeSymbol = "K",
                MovieRequiredAgeDescription = "Parental Guidance: Films suitable for children under 13 with parental supervision."
            },
            new() {
                MovieRequiredAgeId = movieRequiredAgeConstants.Teen13,
                MovieRequiredAgeSymbol = "T13",
                MovieRequiredAgeDescription = "13+: This film is restricted to audiences aged 13 and above."
            },
            new() {
                MovieRequiredAgeId = movieRequiredAgeConstants.Teen16,
                MovieRequiredAgeSymbol = "T16",
                MovieRequiredAgeDescription = "16+: This film is restricted to audiences aged 16 and above."
            },
            new() {
                MovieRequiredAgeId = movieRequiredAgeConstants.Adult18,
                MovieRequiredAgeSymbol = "T18",
                MovieRequiredAgeDescription = "18+: Adult only. This film is restricted to audiences aged 18 and above."
            }
        });
    }
}
