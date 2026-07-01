# Movie Comments & Reviews

> Customer comments and ratings with reply system, AI moderation, and trending movies.

## Overview

Allows customers to:
1. Write comments and ratings for movies
2. Reply to comments
3. View trending and top-rated movies
4. **AI Moderation**: Comments auto-moderated before publishing

## Frontend

### Routes
Comments are embedded in the movie detail page:
| Route | Component | Description |
|---|---|---|
| `/movie/:movieId` | `MovieDetailPage` → `CommentsSection` | Comments in movie detail |

### Key Components
- **`CommentsFeed`**: Comment list
- **`CommentCard`**: Comment display (avatar, username, rating, content, timestamp)
- **`CommentForm`**: Comment form (text + star rating)
- **`ReplyList`**: Replies for a comment
- **`ReplyForm`**: Reply form
- **`RatingStars`**: Star rating display/input
- **`TrendingMoviesSection`**: Trending movies
- **`TopRatedMoviesSection`**: Top-rated movies

## Backend

### API Endpoints
| Method | Endpoint | Description |
|---|---|---|
| GET | `api/v1/comments/movies/{movieId}` | Movie comments list |
| POST | `api/v1/comments/movies/{movieId}` | Add comment |
| GET | `api/v1/comments/movies/trending` | Trending movies |
| GET | `api/v1/comments/movies/top-rated` | Top-rated movies |
| GET | `api/v1/comments/{parentCommentId}/replies` | Comment replies |
| POST | `api/v1/comments/{parentCommentId}/replies` | Add reply |
| PUT | `api/v1/comments/{commentId}` | Update comment |
| DELETE | `api/v1/comments/{commentId}` | Delete comment |

### Use Cases
| Use Case | Description |
|---|---|
| `GetMovieCommentsUseCase` | Get comments for movie |
| `AddCommentUseCase` | Add comment (with AI moderation) |
| `UpdateCommentUseCase` | Update comment |
| `DeleteCommentUseCase` | Delete comment |
| `GetRepliesUseCase` | Get comment replies |
| `AddReplyUseCase` | Add reply |
| `GetTrendingMoviesUseCase` | Trending movies |
| `GetTopRatedMoviesUseCase` | Top-rated movies |

### Domain Entities
| Entity | Description |
|---|---|
| `Comment` | Comment (MovieId, UserId, Content, Rating, Status) |
| `CommentReply` | Reply (CommentId, UserId, Content, CreatedAt) |

### Enums
| Enum | Values |
|---|---|
| `CommentStatus` | Pending, Approved, Rejected, Deleted |

## Data Flow

### Write Comment (with AI Moderation)
```
User → /movie/:movieId → Write comment → POST →
Backend → AI Moderation check:
  - Content appropriate?
  - Spam/toxicity detected?
→ If OK → Status = Approved → Public display
→ If violation → Status = Rejected → Notify user
→ If needs review → Status = Pending → Wait for moderator
```

### Eligibility
> [!NOTE]
> Only users who have watched the movie (paid ticket, showtime ended) can comment. One review per movie per customer.
