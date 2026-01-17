using DataAccess.Constants;
using DataAccess.Entities.Movie_infos;
using Microsoft.EntityFrameworkCore;

namespace DataAccess.SeedsData;

public static class movieGenresSeedData
{
    public static void AddMovieGenreSeedData(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<movie_genre_info_entity>().HasData(new List<movie_genre_info_entity>()
        {
            new() {
                movieGenreId = movieGenreConstant.Action,
                movieGenreName = "Action",
                movieGenreDescription = "Fast-paced movies with physical feats, stunts, and heroic battles."
            },
            new() {
                movieGenreId = movieGenreConstant.Comedy,
                movieGenreName = "Comedy",
                movieGenreDescription = "Films designed to entertain and provoke laughter through humor."
            },
            new() {
                movieGenreId = movieGenreConstant.Drama,
                movieGenreName = "Drama",
                movieGenreDescription = "Focuses on realistic characters and emotional themes of human conflict."
            },
            new() {
                movieGenreId = movieGenreConstant.Horror,
                movieGenreName = "Horror",
                movieGenreDescription = "Intended to scare, shock, and thrill audiences with supernatural or dark themes."
            },
            new() {
                movieGenreId = movieGenreConstant.SciFi,
                movieGenreName = "Sci-Fi",
                movieGenreDescription = "Exploring futuristic concepts, space travel, and advanced technology."
            },
            new() {
                movieGenreId = movieGenreConstant.Romance,
                movieGenreName = "Romance",
                movieGenreDescription = "Focuses on romantic love relationships and emotional connections."
            },
            new() {
                movieGenreId = movieGenreConstant.Animation,
                movieGenreName = "Animation",
                movieGenreDescription = "Feature films produced using traditional or computer-generated imagery."
            },
            new() {
                movieGenreId = movieGenreConstant.Documentary,
                movieGenreName = "Documentary",
                movieGenreDescription = "Non-fictional films intended to document reality for instruction or history."
            },
            new() {
                movieGenreId = movieGenreConstant.Thriller,
                movieGenreName = "Thriller",
                movieGenreDescription = "Movies characterized by excitement, suspense, and intense anticipation."
            },
            new() {
                movieGenreId = movieGenreConstant.Adventure,
                movieGenreName = "Adventure",
                movieGenreDescription = "Exciting journeys to new places, often involving a quest or exploration."
            }
        });
    }
}