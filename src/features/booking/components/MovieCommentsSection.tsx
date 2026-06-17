import React, { useEffect, useMemo, useState } from 'react';
import { Loader2, MessageCircle, Reply, Send, Star, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { commentApi } from '../../../api/commentApi';
import { getUserInfoFromStorage } from '../../../utils/authUtils';
import { showError, showSuccess } from '../../../utils/ToastUtils';
import type { CommentEligibility, MovieComment, MovieCommentsSummary } from '../../../types/comment.types';

interface MovieCommentsSectionProps {
  movieId: string;
}

const emptySummary: MovieCommentsSummary = {
  averageRating: 0,
  reviewCount: 0,
  comments: [],
};

const MovieCommentsSection: React.FC<MovieCommentsSectionProps> = ({ movieId }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = getUserInfoFromStorage();
  const [summary, setSummary] = useState<MovieCommentsSummary>(emptySummary);
  const [eligibility, setEligibility] = useState<CommentEligibility | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [content, setContent] = useState('');
  const [rating, setRating] = useState(5);
  const [pendingComments, setPendingComments] = useState<MovieComment[]>([]);

  const visibleAndPending = useMemo(() => {
    const visibleIds = new Set(flattenComments(summary.comments).map(comment => comment.commentId));
    const freshPending = pendingComments.filter(comment => !visibleIds.has(comment.commentId));
    return [...freshPending, ...summary.comments];
  }, [pendingComments, summary.comments]);

  useEffect(() => {
    fetchAll();
  }, [movieId]);

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ type?: string }>).detail;
      if (detail?.type === 'CommentRejected') {
        setPendingComments([]);
        fetchAll();
      }
    };

    window.addEventListener('cinema-notification', handler);
    return () => window.removeEventListener('cinema-notification', handler);
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [commentsRes, eligibilityRes] = await Promise.all([
        commentApi.getMovieComments(movieId),
        commentApi.getEligibility(movieId),
      ]);
      setSummary(commentsRes.data || emptySummary);
      setEligibility(eligibilityRes.data);
      const visibleIds = new Set(flattenComments(commentsRes.data?.comments || []).map(comment => comment.commentId));
      setPendingComments(prev => prev.filter(comment => !visibleIds.has(comment.commentId) && Date.now() - new Date(comment.createdAt).getTime() < 30000));
    } catch {
      showError(t('movieComment.loadError', 'Could not load comments at this time.'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    const value = content.trim();
    if (!value) {
      showError(t('movieComment.enterContent', 'Please enter your comment.'));
      return;
    }

    setSubmitting(true);
    try {
      const res = await commentApi.createComment(movieId, { content: value, rating });
      if (res.data) {
        setPendingComments(prev => [res.data, ...prev]);
      }
      setContent('');
      showSuccess(t('movieComment.pendingModeration', 'Comment is pending moderation.'));
      window.setTimeout(fetchAll, 2500);
      window.setTimeout(fetchAll, 9000);
    } catch (error: any) {
      showError(error?.response?.data?.message || t('movieComment.submitError', 'Could not submit comment.'));
    } finally {
      setSubmitting(false);
    }
  };

  const eligibilityMessage = eligibility?.message || t('movieComment.checkingEligibility', 'Checking comment eligibility.');

  return (
    <section className="px-6 md:px-16 pb-20 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)] gap-8 lg:gap-12">
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 md:p-8 h-fit">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 rounded-xl bg-[#ff8a00]/15 border border-[#ff8a00]/25 flex items-center justify-center text-[#ffb77f]">
              <Star size={22} fill="currentColor" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white m-0" style={{ fontFamily: "'Montserrat', sans-serif" }}>{t('movieComment.ratingTitle', 'Movie Rating')}</h2>
              <p className="text-sm text-[#ddc1ae]/75 m-0">{t('movieComment.ratingSubtitle', 'Reviews from customers who have watched the movie.')}</p>
            </div>
          </div>

          <div className="flex items-end gap-3 mb-6">
            <span className="text-5xl font-black text-white leading-none">{summary.averageRating.toFixed(1)}</span>
            <div className="pb-1">
              <StarRow value={Math.round(summary.averageRating)} readOnly />
              <p className="text-xs text-[#ddc1ae]/70 mt-1">{summary.reviewCount} {t('movieComment.reviewCount', 'reviews')}</p>
            </div>
          </div>

          {eligibility?.canComment ? (
            <div className="space-y-4">
              <StarRow value={rating} onChange={setRating} />
              <textarea
                value={content}
                onChange={(event) => setContent(event.target.value)}
                placeholder={t('movieComment.ratingPlaceholder', 'Share your thoughts about the movie...')}
                className="w-full min-h-[130px] resize-none rounded-xl bg-[#171616] border border-white/10 px-4 py-3 text-sm text-white placeholder:text-[#ddc1ae]/45 outline-none focus:border-[#ff8a00]/70 transition-colors"
                maxLength={1000}
              />
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#ff8a00] px-5 py-3 text-sm font-bold text-black border-none cursor-pointer transition-transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {submitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                {t("movieComment.submitRating", "Submit Rating")}
              </button>
            </div>
          ) : (
            <div className="rounded-xl border border-white/10 bg-[#171616] p-4">
              <p className="text-sm text-[#ddc1ae] leading-relaxed m-0">{eligibilityMessage}</p>
              {eligibility?.status === 'NotLoggedIn' && (
                <button
                  onClick={() => navigate('/login')}
                  className="mt-4 rounded-xl bg-[#ff8a00] px-4 py-2 text-sm font-bold text-black border-none cursor-pointer active:scale-[0.98]"
                >
                  {t("movieComment.login", "Sign In")}
                </button>
              )}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 md:p-6">
          <div className="flex items-center justify-between gap-4 mb-5">
            <div className="flex items-center gap-3">
              <MessageCircle size={22} className="text-[#ffb77f]" />
              <h3 className="text-xl font-bold text-white m-0" style={{ fontFamily: "'Montserrat', sans-serif" }}>{t('movieComment.commentTitle', 'Comments')}</h3>
            </div>
            <button
              onClick={fetchAll}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-[#ddc1ae] hover:text-white hover:bg-white/10 cursor-pointer"
            >
              {t("movieComment.refresh", "Refresh")}
            </button>
          </div>

          {loading ? (
            <CommentSkeleton />
          ) : visibleAndPending.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/10 bg-[#131212] py-12 px-5 text-center">
              <MessageCircle size={32} className="mx-auto text-[#ffb77f]/70 mb-3" />
              <p className="text-white font-semibold m-0">{t('movieComment.noComments', 'No comments yet.')}</p>
              <p className="text-sm text-[#ddc1ae]/70 mt-2 mb-0">{t('movieComment.noCommentsDesc', 'Be the first to share your thoughts after watching the movie.')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {visibleAndPending.map(comment => (
                <CommentNode key={comment.commentId} comment={comment} userId={user?.userId} onChanged={fetchAll} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

const CommentNode: React.FC<{
  comment: MovieComment;
  userId?: string;
  onChanged: () => void;
  depth?: number;
}> = ({ comment, userId, onChanged, depth = 0 }) => {
  const { t } = useTranslation();
  const [replying, setReplying] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [localReplies, setLocalReplies] = useState<MovieComment[]>([]);
  const isPending = comment.status === 'PendingModeration';

  const submitReply = async () => {
    const value = replyText.trim();
    if (!value) {
      showError(t('movieComment.enterReply', 'Please enter your reply.'));
      return;
    }

    setSubmittingReply(true);
    try {
      const res = await commentApi.createReply(comment.commentId, { content: value });
      if (res.data) {
        setLocalReplies(prev => [...prev, res.data]);
      }
      setReplyText('');
      setReplying(false);
      showSuccess(t('movieComment.replyPending', 'Reply is pending moderation.'));
      window.setTimeout(onChanged, 2500);
      window.setTimeout(onChanged, 9000);
    } catch (error: any) {
      showError(error?.response?.data?.message || t('movieComment.replyError', 'Could not submit reply.'));
    } finally {
      setSubmittingReply(false);
    }
  };

  const deleteComment = async () => {
    try {
      await commentApi.deleteComment(comment.commentId);
      showSuccess(t('movieComment.deleted', 'Comment deleted.'));
      onChanged();
    } catch {
      showError(t('movieComment.deleteError', 'Could not delete comment.'));
    }
  };

  const replies = [...comment.replies, ...localReplies];

  return (
    <div className={`${depth > 0 ? 'ml-5 md:ml-8 border-l border-white/10 pl-4 md:pl-5' : ''}`}>
      <article className={`rounded-xl border p-4 transition-opacity ${isPending ? 'border-[#ff8a00]/25 bg-[#ff8a00]/5 opacity-80' : 'border-white/10 bg-[#151414]'}`}>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-[#252321] border border-white/10 flex items-center justify-center text-[#ffb77f] font-bold shrink-0">
            {comment.userAvatarUrl ? <img src={comment.userAvatarUrl} alt={comment.userName} className="w-full h-full object-cover" /> : comment.userName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-bold text-white">{comment.userName}</span>
              {comment.rating ? <StarRow value={comment.rating} readOnly compact /> : null}
              {isPending && (
                <span className="inline-flex items-center gap-1 rounded-full border border-[#ff8a00]/25 bg-[#ff8a00]/10 px-2 py-0.5 text-[11px] font-semibold text-[#ffb77f]">
                  <Loader2 size={12} className="animate-spin" />
                    {t("movieComment.pending", "Pending")}
                </span>
              )}
            </div>
            <p className="mt-2 mb-3 text-sm leading-relaxed text-[#e5e2e1] whitespace-pre-wrap break-words">{comment.content}</p>
            <div className="flex flex-wrap items-center gap-3 text-xs text-[#ddc1ae]/65">
              <span>{formatCommentDate(comment.createdAt)}</span>
              {!isPending && (
                <button onClick={() => setReplying(prev => !prev)} className="inline-flex items-center gap-1 text-[#ffb77f] hover:text-[#ff8a00] bg-transparent border-none cursor-pointer p-0 font-semibold">
                  <Reply size={14} />
                    {t("movieComment.reply", "Reply")}
                </button>
              )}
              {userId === comment.userId && (
                <button onClick={deleteComment} className="inline-flex items-center gap-1 text-red-300 hover:text-red-200 bg-transparent border-none cursor-pointer p-0 font-semibold">
                  <Trash2 size={14} />
                    {t("movieComment.delete", "Delete")}
                </button>
              )}
            </div>
          </div>
        </div>

        {replying && (
          <div className="mt-4 pl-0 md:pl-[52px]">
            <textarea
              value={replyText}
              onChange={(event) => setReplyText(event.target.value)}
              placeholder={t('movieComment.replyPlaceholder', 'Write a reply...')}
              className="w-full min-h-[86px] resize-none rounded-xl bg-[#1d1b1a] border border-white/10 px-4 py-3 text-sm text-white placeholder:text-[#ddc1ae]/45 outline-none focus:border-[#ff8a00]/70"
              maxLength={1000}
            />
            <div className="mt-2 flex justify-end gap-2">
              <button onClick={() => setReplying(false)} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-[#ddc1ae] cursor-pointer">{t('movieComment.cancel', 'Cancel')}</button>
              <button onClick={submitReply} disabled={submittingReply} className="inline-flex items-center gap-2 rounded-lg bg-[#ff8a00] px-3 py-2 text-xs font-bold text-black border-none cursor-pointer disabled:opacity-70">
                {submittingReply ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                {t("movieComment.send", "Send")}
              </button>
            </div>
          </div>
        )}
      </article>

      {replies.length > 0 && (
        <div className="mt-3 space-y-3">
          {replies.map(reply => (
            <CommentNode key={reply.commentId} comment={reply} userId={userId} onChanged={onChanged} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

const StarRow: React.FC<{ value: number; onChange?: (value: number) => void; readOnly?: boolean; compact?: boolean }> = ({ value, onChange, readOnly, compact }) => {
  const { t } = useTranslation();
  return (
    <div className={`flex items-center ${compact ? 'gap-0.5' : 'gap-1.5'}`}>
      {[1, 2, 3, 4, 5].map(star => {
        const active = star <= value;
        return (
          <button
            key={star}
            type="button"
            onClick={() => !readOnly && onChange?.(star)}
            disabled={readOnly}
            className={`bg-transparent border-none p-0 ${readOnly ? 'cursor-default' : 'cursor-pointer active:scale-95'}`}
            aria-label={`${star} ${t('movieComment.star', 'star')}`}
          >
            <Star size={compact ? 14 : 22} className={active ? 'text-[#ffb77f]' : 'text-white/20'} fill={active ? 'currentColor' : 'none'} />
          </button>
        );
      })}
    </div>
  );
};

const CommentSkeleton = () => (
  <div className="space-y-4">
    {[1, 2, 3].map(item => (
      <div key={item} className="rounded-xl border border-white/10 bg-[#151414] p-4 animate-pulse">
        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-full bg-white/10" />
          <div className="flex-1 space-y-3">
            <div className="h-3 w-32 rounded bg-white/10" />
            <div className="h-3 w-full rounded bg-white/10" />
            <div className="h-3 w-2/3 rounded bg-white/10" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

const flattenComments = (comments: MovieComment[]): MovieComment[] =>
  comments.flatMap(comment => [comment, ...flattenComments(comment.replies || [])]);

const formatCommentDate = (date: string) =>
  new Date(date).toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

export default MovieCommentsSection;
