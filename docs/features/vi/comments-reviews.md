# Bình luận & Đánh giá phim — Comments & Reviews

> Module bình luận, đánh giá phim với hệ thống reply, AI moderation, và trending.

## Tổng quan

Module cho phép khách hàng:
1. Viết bình luận và đánh giá (rating) cho phim
2. Trả lời bình luận
3. Xem bình luận trending và phim được đánh giá cao nhất
4. **AI Moderation**: Bình luận được kiểm duyệt tự động trước khi đăng

## Frontend

### Routes
Bình luận được nhúng trong trang chi tiết phim:
| Route | Component | Mô tả |
|---|---|---|
| `/movie/:movieId` | `MovieDetailPage` → `CommentsSection` | Bình luận trong chi tiết phim |

### Components chính
- **`CommentsFeed`**: Danh sách bình luận
- **`CommentCard`**: Card hiển thị bình luận (avatar, username, rating, content, timestamp)
- **`CommentForm`**: Form viết bình luận (text + rating sao)
- **`ReplyList`**: Danh sách reply của một comment
- **`ReplyForm`**: Form trả lời bình luận
- **`RatingStars`**: Hiển thị/nhập rating sao
- **`TrendingMoviesSection`**: Phim trending
- **`TopRatedMoviesSection`**: Phim đánh giá cao nhất

## Backend

### API Endpoints
| Method | Endpoint | Chức năng |
|---|---|---|
| GET | `api/v1/comments/movies/{movieId}` | Danh sách bình luận của phim |
| POST | `api/v1/comments/movies/{movieId}` | Thêm bình luận mới |
| GET | `api/v1/comments/movies/trending` | Phim trending |
| GET | `api/v1/comments/movies/top-rated` | Phim đánh giá cao nhất |
| GET | `api/v1/comments/{parentCommentId}/replies` | Danh sách reply |
| POST | `api/v1/comments/{parentCommentId}/replies` | Thêm reply |
| PUT | `api/v1/comments/{commentId}` | Cập nhật bình luận |
| DELETE | `api/v1/comments/{commentId}` | Xóa bình luận |

### Use Cases
| Use Case | Mô tả |
|---|---|
| `GetMovieCommentsUseCase` | Lấy bình luận của phim |
| `AddCommentUseCase` | Thêm bình luận (có AI moderation) |
| `UpdateCommentUseCase` | Cập nhật bình luận |
| `DeleteCommentUseCase` | Xóa bình luận |
| `GetRepliesUseCase` | Lấy reply của comment |
| `AddReplyUseCase` | Thêm reply |
| `GetTrendingMoviesUseCase` | Phim trending |
| `GetTopRatedMoviesUseCase` | Phim đánh giá cao nhất |

### Domain Entities
| Entity | Mô tả |
|---|---|
| `Comment` | Bình luận (MovieId, UserId, Content, Rating, Status, CreatedAt) |
| `CommentReply` | Trả lời bình luận (CommentId, UserId, Content, CreatedAt) |

### Enums
| Enum | Values |
|---|---|
| `CommentStatus` | Pending, Approved, Rejected, Deleted |

## Luồng xử lý

### Viết bình luận (có AI Moderation)
```
User → /movie/:movieId → Viết bình luận → POST comment →
Backend → AI Moderation check:
  - Nội dung có phù hợp?
  - Có spam/toxicity?
→ Nếu OK → Status = Approved → Hiển thị public
→ Nếu vi phạm → Status = Rejected → Thông báo cho user
→ Nếu cần review → Status = Pending → Chờ moderator duyệt
```

### Điều kiện viết bình luận
> [!NOTE]
> Chỉ user đã xem phim (vé đã thanh toán, suất chiếu đã kết thúc) mới được viết bình luận. Mỗi user chỉ được viết 1 review/phim.
