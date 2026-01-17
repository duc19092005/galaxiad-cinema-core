using DataAccess.Constants;
using DataAccess.Entities.Movie_infos;
using Microsoft.EntityFrameworkCore;

namespace DataAccess.SeedsData;

public static class movieRequiredAgeSeedData
{
    public static void AddMovieAgeSeedData(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<movieRequiredAgeEntity>().HasData(new List<movieRequiredAgeEntity>()
        {
            new() {
                movieRequiredAgeId = movieRequiredAgeConstants.AllAges,
                movieRequiredAgeSymbol = "P",
                movieRequiredAgeDescription = "General Admission: Suitable for audiences of all ages."
            },
            new() {
                movieRequiredAgeId = movieRequiredAgeConstants.Under13,
                movieRequiredAgeSymbol = "K",
                movieRequiredAgeDescription = "Parental Guidance: Films suitable for children under 13 with parental supervision."
            },
            new() {
                movieRequiredAgeId = movieRequiredAgeConstants.Teen13,
                movieRequiredAgeSymbol = "T13",
                movieRequiredAgeDescription = "13+: This film is restricted to audiences aged 13 and above."
            },
            new() {
                movieRequiredAgeId = movieRequiredAgeConstants.Teen16,
                movieRequiredAgeSymbol = "T16",
                movieRequiredAgeDescription = "16+: This film is restricted to audiences aged 16 and above."
            },
            new() {
                movieRequiredAgeId = movieRequiredAgeConstants.Adult18,
                movieRequiredAgeSymbol = "T18",
                movieRequiredAgeDescription = "18+: Adult only. This film is restricted to audiences aged 18 and above."
            }
        });
    }
}