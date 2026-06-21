using Cinema.Application.Constants;
using Cinema.Domain.Entities.MovieInfos;
using Microsoft.EntityFrameworkCore;

namespace Cinema.Infrastructure.SeedData;

public static class MovieGenresSeedData
{
    public static void AddMovieGenreSeedData(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<MovieGenreInfoEntity>().HasData(new List<MovieGenreInfoEntity>()
        {
            new() {
                MovieGenreId = movieGenreConstant.Action,
                MovieGenreName = "Action",
                MovieGenreDescription = "Fast-paced movies with physical feats, stunts, and heroic battles."
            },
            new() {
                MovieGenreId = movieGenreConstant.Comedy,
                MovieGenreName = "Comedy",
                MovieGenreDescription = "Films designed to entertain and provoke laughter through humor."
            },
            new() {
                MovieGenreId = movieGenreConstant.Drama,
                MovieGenreName = "Drama",
                MovieGenreDescription = "Focuses on realistic characters and emotional themes of human conflict."
            },
            new() {
                MovieGenreId = movieGenreConstant.Horror,
                MovieGenreName = "Horror",
                MovieGenreDescription = "Intended to scare, shock, and thrill audiences with supernatural or dark themes."
            },
            new() {
                MovieGenreId = movieGenreConstant.SciFi,
                MovieGenreName = "Sci-Fi",
                MovieGenreDescription = "Exploring futuristic concepts, space travel, and advanced technology."
            },
            new() {
                MovieGenreId = movieGenreConstant.Romance,
                MovieGenreName = "Romance",
                MovieGenreDescription = "Focuses on romantic love relationships and emotional connections."
            },
            new() {
                MovieGenreId = movieGenreConstant.Animation,
                MovieGenreName = "Animation",
                MovieGenreDescription = "Feature films produced using traditional or computer-generated imagery."
            },
            new() {
                MovieGenreId = movieGenreConstant.Documentary,
                MovieGenreName = "Documentary",
                MovieGenreDescription = "Non-fictional films intended to document reality for instruction or history."
            },
            new() {
                MovieGenreId = movieGenreConstant.Thriller,
                MovieGenreName = "Thriller",
                MovieGenreDescription = "Movies characterized by excitement, suspense, and intense anticipation."
            },
            new() {
                MovieGenreId = movieGenreConstant.Adventure,
                MovieGenreName = "Adventure",
                MovieGenreDescription = "Exciting journeys to new places, often involving a quest or exploration."
            }
        });
    }
}

