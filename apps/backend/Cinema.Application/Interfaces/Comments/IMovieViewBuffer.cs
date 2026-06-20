using System;
using System.Threading.Tasks;

namespace Cinema.Application.Interfaces.Comments;

public interface IMovieViewBuffer
{
    Task QueueMovieViewAsync(Guid movieId, Guid? userId, DateTime viewedAt);
}
