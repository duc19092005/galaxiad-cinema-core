// src/components/SurveyModal.tsx
import React, { useState, useEffect } from 'react';
import { X, Sparkles, ChevronRight } from 'lucide-react';
import { publicApi } from '../api/publicApi';
import { recommendationApi } from '../api/recommendationApi';

interface SurveyModalProps {
  onClose: () => void;
  onComplete: () => void;
}

const GENRE_EMOJIS: Record<string, string> = {
  'Hành Động': '💥', 'Action': '💥',
  'Tình Cảm': '💕', 'Romance': '💕',
  'Kinh Dị': '👻', 'Horror': '👻',
  'Hài Hước': '😂', 'Comedy': '😂',
  'Hài': '😂',
  'Khoa Học Viễn Tưởng': '🚀', 'Sci-Fi': '🚀', 'Viễn Tưởng': '🚀',
  'Hoạt Hình': '🎨', 'Animation': '🎨',
  'Tâm Lý': '🧠', 'Drama': '🧠',
  'Phiêu Lưu': '🗺️', 'Adventure': '🗺️',
  'Tội Phạm': '🔍', 'Crime': '🔍',
  'Lịch Sử': '📜', 'History': '📜',
  'Âm Nhạc': '🎵', 'Music': '🎵',
  'Thể Thao': '⚽', 'Sport': '⚽',
  'Gia Đình': '👨‍👩‍👧', 'Family': '👨‍👩‍👧',
  'Kinh Điển': '🎞️', 'Classic': '🎞️',
  'Bí Ẩn': '🕵️', 'Mystery': '🕵️',
  'Siêu Anh Hùng': '🦸', 'Superhero': '🦸',
};

const FALLBACK_GENRES = [
  { genreId: 'action', genreName: 'Hành Động' },
  { genreId: 'romance', genreName: 'Tình Cảm' },
  { genreId: 'horror', genreName: 'Kinh Dị' },
  { genreId: 'comedy', genreName: 'Hài Hước' },
  { genreId: 'scifi', genreName: 'Khoa Học Viễn Tưởng' },
  { genreId: 'animation', genreName: 'Hoạt Hình' },
  { genreId: 'drama', genreName: 'Tâm Lý' },
  { genreId: 'adventure', genreName: 'Phiêu Lưu' },
];

const SurveyModal: React.FC<SurveyModalProps> = ({ onClose, onComplete }) => {
  const [genres, setGenres] = useState<Array<{ genreId: string; genreName: string }>>([]);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [preference, setPreference] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingGenres, setFetchingGenres] = useState(true);

  useEffect(() => {
    publicApi
      .getMovieGenres()
      .then(res => {
        const raw: any[] = res.data || [];
        const mapped = raw.map((g: any) => ({
          genreId: g.genreId ?? String(Math.random()),
          genreName: g.genreName ?? 'Unknown',
        }));
        setGenres(mapped.length > 0 ? mapped : FALLBACK_GENRES);
      })
      .catch(() => setGenres(FALLBACK_GENRES))
      .finally(() => setFetchingGenres(false));
  }, []);

  const toggleGenre = (genreId: string) => {
    setSelectedGenres(prev =>
      prev.includes(genreId) ? prev.filter(g => g !== genreId) : [...prev, genreId]
    );
  };

  const handleSubmit = async () => {
    if (selectedGenres.length === 0) return;
    setLoading(true);
    try {
      await recommendationApi.saveSurvey(selectedGenres, preference);
      onComplete();
    } catch (err) {
      console.error('Failed to save survey', err);
    } finally {
      setLoading(false);
    }
  };

  // Close on backdrop click
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      onClick={handleBackdropClick}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        animation: 'surveyFadeIn 0.3s ease',
      }}
    >
      <style>{`
        @keyframes surveyFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes surveySlideUp {
          from { transform: translateY(40px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        .survey-genre-card { transition: all 0.18s ease; }
        .survey-genre-card:hover { transform: translateY(-3px) scale(1.02); }
        .survey-genre-card:active { transform: scale(0.97); }
        .survey-modal-body::-webkit-scrollbar { width: 4px; }
        .survey-modal-body::-webkit-scrollbar-track { background: transparent; }
        .survey-modal-body::-webkit-scrollbar-thumb { background: rgba(255,138,0,0.3); border-radius: 4px; }
      `}</style>

      {/* Modal Container */}
      <div
        className="survey-modal-body"
        style={{
          background: 'linear-gradient(135deg, rgba(12,16,36,0.99) 0%, rgba(18,24,50,0.99) 100%)',
          border: '1px solid rgba(255,138,0,0.25)',
          borderRadius: 24,
          padding: 'clamp(24px, 4vw, 40px)',
          maxWidth: 620,
          width: '90vw',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 40px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,138,0,0.08), inset 0 1px 0 rgba(255,255,255,0.04)',
          animation: 'surveySlideUp 0.35s cubic-bezier(0.34,1.56,0.64,1)',
          position: 'relative',
        }}
      >
        {/* Decorative glow */}
        <div style={{
          position: 'absolute', top: -60, left: '50%', transform: 'translateX(-50%)',
          width: 200, height: 120,
          background: 'radial-gradient(ellipse, rgba(255,138,0,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* ── Header ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, position: 'relative', zIndex: 1 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'rgba(255,138,0,0.15)',
                border: '1px solid rgba(255,138,0,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Sparkles size={17} style={{ color: 'var(--accent)' }} />
              </div>
              <span style={{
                fontSize: 11, color: 'var(--accent)', fontWeight: 700,
                letterSpacing: '0.18em', textTransform: 'uppercase',
              }}>
                Cá Nhân Hóa
              </span>
            </div>
            <h2 style={{
              fontFamily: "'Montserrat', sans-serif",
              fontSize: 'clamp(18px, 4vw, 24px)',
              fontWeight: 800, color: 'white', margin: 0, lineHeight: 1.3,
            }}>
              Bạn thích phim thể loại nào?
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, marginTop: 8, marginBottom: 0, lineHeight: 1.6 }}>
              Chọn ít nhất 1 thể loại để nhận gợi ý phim phù hợp với bạn
            </p>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 10, padding: 8,
              cursor: 'pointer', color: 'rgba(255,255,255,0.5)',
              flexShrink: 0, transition: 'all 0.2s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.1)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.05)'; }}
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Genre Grid ── */}
        {fetchingGenres ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'rgba(255,255,255,0.35)' }}>
            <div style={{ width: 28, height: 28, border: '2px solid rgba(255,138,0,0.4)', borderTopColor: 'var(--accent)', borderRadius: '50%', margin: '0 auto 14px', animation: 'spin 0.8s linear infinite' }} />
            Đang tải thể loại...
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
            gap: 12, marginBottom: 26,
          }}>
            {genres.map(genre => {
              const isSelected = selectedGenres.includes(genre.genreId);
              const emoji = GENRE_EMOJIS[genre.genreName] || '🎬';
              return (
                <button
                  key={genre.genreId}
                  className="survey-genre-card"
                  onClick={() => toggleGenre(genre.genreId)}
                  style={{
                    padding: '14px 10px',
                    borderRadius: 14,
                    border: `1.5px solid ${isSelected ? 'rgba(255,138,0,0.7)' : 'rgba(255,255,255,0.07)'}`,
                    background: isSelected
                      ? 'rgba(255,138,0,0.13)'
                      : 'rgba(255,255,255,0.03)',
                    color: isSelected ? 'var(--accent)' : 'rgba(255,255,255,0.65)',
                    cursor: 'pointer',
                    textAlign: 'center',
                    fontWeight: isSelected ? 700 : 500,
                    fontSize: 13,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                    boxShadow: isSelected ? '0 0 20px rgba(255,138,0,0.18)' : 'none',
                    position: 'relative', overflow: 'hidden',
                  }}
                >
                  {/* Selected highlight overlay */}
                  {isSelected && (
                    <div style={{
                      position: 'absolute', inset: 0,
                      background: 'radial-gradient(ellipse at 50% 0%, rgba(255,138,0,0.08) 0%, transparent 70%)',
                      pointerEvents: 'none',
                    }} />
                  )}
                  <span style={{ fontSize: 22, lineHeight: 1 }}>{emoji}</span>
                  <span style={{ lineHeight: 1.3 }}>{genre.genreName}</span>
                  {isSelected && (
                    <span style={{
                      fontSize: 9, background: 'var(--accent)', color: 'black',
                      borderRadius: 4, padding: '1px 6px', fontWeight: 800,
                    }}>✓ ĐÃ CHỌN</span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* ── Preference Text ── */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', display: 'block', marginBottom: 8 }}>
            Mô tả thêm sở thích của bạn <span style={{ color: 'rgba(255,255,255,0.25)' }}>(tuỳ chọn)</span>
          </label>
          <textarea
            value={preference}
            onChange={e => setPreference(e.target.value)}
            placeholder="Ví dụ: Tôi thích phim có cốt truyện phức tạp, twist cuối bất ngờ, hình ảnh đẹp..."
            rows={3}
            style={{
              width: '100%', padding: '12px 14px', borderRadius: 12,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.09)',
              color: 'white', fontSize: 13, resize: 'vertical',
              outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
              transition: 'border-color 0.2s',
            }}
            onFocus={e => { (e.currentTarget).style.borderColor = 'rgba(255,138,0,0.4)'; }}
            onBlur={e => { (e.currentTarget).style.borderColor = 'rgba(255,255,255,0.09)'; }}
          />
        </div>

        {/* ── Action Buttons ── */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', alignItems: 'center' }}>
          {selectedGenres.length > 0 && (
            <span style={{ fontSize: 12, color: 'var(--accent)', marginRight: 'auto', fontWeight: 600 }}>
              Đã chọn {selectedGenres.length} thể loại
            </span>
          )}

          <button
            onClick={onClose}
            style={{
              padding: '11px 22px', borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'transparent', color: 'rgba(255,255,255,0.45)',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { (e.currentTarget).style.color = 'rgba(255,255,255,0.8)'; }}
            onMouseLeave={e => { (e.currentTarget).style.color = 'rgba(255,255,255,0.45)'; }}
          >
            Bỏ qua
          </button>

          <button
            onClick={handleSubmit}
            disabled={selectedGenres.length === 0 || loading}
            style={{
              padding: '11px 28px', borderRadius: 10, border: 'none',
              background: selectedGenres.length === 0
                ? 'rgba(255,138,0,0.25)'
                : 'linear-gradient(135deg, #ff8a00, #ff6b00)',
              color: selectedGenres.length === 0 ? 'rgba(255,255,255,0.25)' : 'black',
              fontSize: 13, fontWeight: 700,
              cursor: selectedGenres.length === 0 ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: 8,
              transition: 'all 0.2s',
              boxShadow: selectedGenres.length > 0 ? '0 4px 20px rgba(255,138,0,0.3)' : 'none',
            }}
          >
            {loading
              ? 'Đang lưu...'
              : (<>Xem Gợi Ý <ChevronRight size={16} /></>)
            }
          </button>
        </div>
      </div>
    </div>
  );
};

export default SurveyModal;
