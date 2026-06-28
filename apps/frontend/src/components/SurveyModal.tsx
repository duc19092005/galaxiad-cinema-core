// src/components/SurveyModal.tsx
import React, { useState, useEffect } from 'react';
import { X, Sparkles, ChevronRight, ChevronLeft } from 'lucide-react';
import * as Lucide from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { publicApi } from '../api/publicApi';
import { recommendationApi } from '../api/recommendationApi';

interface SurveyModalProps {
  onClose: () => void;
  onComplete: () => void;
}

const GENRE_ICONS: Record<string, React.ComponentType<any>> = {
  // Tiếng Việt
  'Hành Động': Lucide.Flame,
  'Tình Cảm': Lucide.Heart,
  'Kinh Dị': Lucide.Ghost,
  'Hài Hước': Lucide.Laugh,
  'Hài': Lucide.Laugh,
  'Khoa Học Viễn Tưởng': Lucide.Rocket,
  'Viễn Tưởng': Lucide.Rocket,
  'Hoạt Hình': Lucide.Palette,
  'Tâm Lý': Lucide.Brain,
  'Phiêu Lưu': Lucide.Compass,
  'Tội Phạm': Lucide.Fingerprint,
  'Lịch Sử': Lucide.Scroll,
  'Âm Nhạc': Lucide.Music,
  'Thể Thao': Lucide.Trophy,
  'Gia Đình': Lucide.Users,
  'Kinh Điển': Lucide.Film,
  'Bí Ẩn': Lucide.HelpCircle,
  'Tài Liệu': Lucide.Clapperboard,
  'Kịch Tính': Lucide.Skull,
  'Giật Gân': Lucide.Zap,
  'Chiến Tranh': Lucide.Shield,
  'Viễn Tây': Lucide.Compass,
  'Kỳ Ảo': Lucide.Sparkles,
  'Thần Thoại': Lucide.Sparkles,
  'thỏa mãn đam mê': Lucide.Sparkles,

  // English
  'Action': Lucide.Flame,
  'Romance': Lucide.Heart,
  'Horror': Lucide.Ghost,
  'Comedy': Lucide.Laugh,
  'Sci-Fi': Lucide.Rocket,
  'Animation': Lucide.Palette,
  'Drama': Lucide.Brain,
  'Adventure': Lucide.Compass,
  'Crime': Lucide.Fingerprint,
  'History': Lucide.Scroll,
  'Music': Lucide.Music,
  'Sport': Lucide.Trophy,
  'Family': Lucide.Users,
  'Classic': Lucide.Film,
  'Mystery': Lucide.HelpCircle,
  'Documentary': Lucide.Clapperboard,
  'Thriller': Lucide.Skull,
  'Fantasy': Lucide.Sparkles,
  'War': Lucide.Shield,
  'Western': Lucide.Compass,
};

const FALLBACK_GENRES = [
  { genreId: 'action', genreName: 'Action' },
  { genreId: 'romance', genreName: 'Romance' },
  { genreId: 'horror', genreName: 'Horror' },
  { genreId: 'comedy', genreName: 'Comedy' },
  { genreId: 'scifi', genreName: 'Sci-Fi' },
  { genreId: 'animation', genreName: 'Animation' },
  { genreId: 'drama', genreName: 'Drama' },
  { genreId: 'adventure', genreName: 'Adventure' },
];

// Bear Mascot Component
const BearMascot: React.FC<{ state: 'idle' | 'selected' | 'typing' | 'loading' }> = ({ state }) => {
  return (
    <svg viewBox="0 0 200 220" className="w-full h-auto max-w-[120px] md:max-w-[150px] select-none">
      <defs>
        <radialGradient id="bearGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--accent-glow, rgba(255, 138, 0, 0.2))" />
          <stop offset="100%" stopColor="rgba(255, 138, 0, 0)" />
        </radialGradient>
        <linearGradient id="bearBody" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#543618" />
          <stop offset="100%" stopColor="#35210E" />
        </linearGradient>
        <linearGradient id="popcornStripes" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#EF4444" />
          <stop offset="100%" stopColor="#B91C1C" />
        </linearGradient>
      </defs>

      {/* Background Soft Glow */}
      <circle cx="100" cy="110" r="85" fill="url(#bearGlow)" />

      {/* Animated Bear Body Wrapper */}
      <g
        style={{
          transformOrigin: '100px 160px',
          animation: 'bearFloat 4.5s ease-in-out infinite',
        }}
      >
        {/* Ears */}
        {/* Left Ear */}
        <g
          style={{
            transformOrigin: '55px 75px',
            animation: state === 'selected' ? 'wiggleLeft 0.5s ease-in-out infinite alternate' : 'none',
          }}
        >
          <circle cx="58" cy="72" r="20" fill="#35210E" />
          <circle cx="58" cy="72" r="11" fill="#E59850" />
        </g>

        {/* Right Ear */}
        <g
          style={{
            transformOrigin: '145px 75px',
            animation: state === 'selected' ? 'wiggleRight 0.5s ease-in-out infinite alternate-reverse' : 'none',
          }}
        >
          <circle cx="142" cy="72" r="20" fill="#35210E" />
          <circle cx="142" cy="72" r="11" fill="#E59850" />
        </g>

        {/* Bear Head */}
        <ellipse cx="100" cy="120" rx="46" ry="40" fill="url(#bearBody)" stroke="#1F1308" strokeWidth="2" />

        {/* Snout */}
        <ellipse cx="100" cy="132" rx="17" ry="13" fill="#F8C088" />

        {/* Nose */}
        <path d="M92 127 H108 C108 127 107 134 100 134 C93 134 92 127 92 127 Z" fill="#1C1108" />

        {/* Mouth */}
        {state === 'typing' ? (
          <circle cx="100" cy="140" r="2.5" fill="#1C1108" />
        ) : state === 'selected' || state === 'loading' ? (
          <path d="M96 137 Q100 144 104 137" fill="none" stroke="#1C1108" strokeWidth="2" strokeLinecap="round" />
        ) : (
          <path d="M97 137 Q100 140 103 137" fill="none" stroke="#1C1108" strokeWidth="1.5" strokeLinecap="round" />
        )}

        {/* Eyes / Thinking / Glasses */}
        {state === 'typing' ? (
          <>
            <path d="M78 111 Q83 115 88 111" fill="none" stroke="#F8C088" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M112 111 Q117 115 122 111" fill="none" stroke="#F8C088" strokeWidth="2.5" strokeLinecap="round" />
          </>
        ) : (
          <>
            <circle cx="83" cy="109" r="4" fill="#1C1108" />
            <circle cx="117" cy="109" r="4" fill="#1C1108" />
            <circle cx="84.5" cy="107.5" r="1.2" fill="white" />
            <circle cx="118.5" cy="107.5" r="1.2" fill="white" />
          </>
        )}

        {/* Cinema 3D Glasses */}
        <g
          style={{
            transformOrigin: '100px 109px',
            animation: 'glassesGiggle 6s ease-in-out infinite',
          }}
        >
          <rect x="69" y="100" width="62" height="18" rx="4" fill="#1A1B1C" stroke="#000000" strokeWidth="1.5" />
          <rect x="95" y="105" width="10" height="5" fill="#1A1B1C" />
          {/* Lenses */}
          <rect x="73" y="103" width="20" height="12" rx="2" fill="rgba(239, 68, 68, 0.85)" />
          <rect x="107" y="103" width="20" height="12" rx="2" fill="rgba(6, 182, 212, 0.85)" />
          {/* Lens glare */}
          <path d="M75 105 L80 112" stroke="rgba(255,255,255,0.4)" strokeWidth="1" strokeLinecap="round" />
          <path d="M109 105 L114 112" stroke="rgba(255,255,255,0.4)" strokeWidth="1" strokeLinecap="round" />
        </g>

        {/* Cute blushing cheeks */}
        <circle cx="71" cy="122" r="4.5" fill="#EF4444" opacity="0.25" />
        <circle cx="129" cy="122" r="4.5" fill="#EF4444" opacity="0.25" />

        {/* Popcorn bucket */}
        <g
          style={{
            transformOrigin: '100px 180px',
            animation: state === 'selected' || state === 'loading' ? 'bounceBucket 0.8s ease-in-out infinite' : 'none',
          }}
        >
          <path d="M84 152 L87 185 H113 L116 152 Z" fill="#FFFFFF" stroke="#1C1108" strokeWidth="2" />
          {/* Stripes */}
          <path d="M89 152 L91 185 H95 L93 152 Z" fill="url(#popcornStripes)" />
          <path d="M99 152 L100 185 H104 L103 152 Z" fill="url(#popcornStripes)" />
          <path d="M108 152 L109 185 H112 L111 152 Z" fill="url(#popcornStripes)" />
          {/* Popcorn overflow */}
          <circle cx="86" cy="148" r="5" fill="#FEF3C7" stroke="#D97706" strokeWidth="0.8" />
          <circle cx="93" cy="146" r="6" fill="#FDE68A" stroke="#D97706" strokeWidth="0.8" />
          <circle cx="101" cy="147" r="6.5" fill="#FEF3C7" stroke="#D97706" strokeWidth="0.8" />
          <circle cx="109" cy="146" r="5.5" fill="#FDE68A" stroke="#D97706" strokeWidth="0.8" />
          <circle cx="114" cy="149" r="4.5" fill="#FEF3C7" stroke="#D97706" strokeWidth="0.8" />
        </g>
      </g>

      <style>{`
        @keyframes bearFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        @keyframes wiggleLeft {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(-10deg); }
        }
        @keyframes wiggleRight {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(10deg); }
        }
        @keyframes glassesGiggle {
          0%, 92%, 100% { transform: rotate(0deg); }
          94% { transform: rotate(-3deg); }
          96% { transform: rotate(3deg); }
        }
        @keyframes bounceBucket {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.08) translateY(-2px); }
        }
      `}</style>
    </svg>
  );
};

const SurveyModal: React.FC<SurveyModalProps> = ({ onClose, onComplete }) => {
  const [genres, setGenres] = useState<Array<{ genreId: string; genreName: string }>>([]);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [preference, setPreference] = useState('');
  const [isPrefFocused, setIsPrefFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchingGenres, setFetchingGenres] = useState(true);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(0);
  const [slideDirection, setSlideDirection] = useState(0); // -1 for Left, 1 for Right

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

  const totalPages = Math.ceil(genres.length / 9);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 0 && newPage < totalPages) {
      setSlideDirection(newPage > currentPage ? 1 : -1);
      setCurrentPage(newPage);
    }
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

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  // Determine Bear state
  let bearState: 'idle' | 'selected' | 'typing' | 'loading' = 'idle';
  if (loading) {
    bearState = 'loading';
  } else if (isPrefFocused) {
    bearState = 'typing';
  } else if (selectedGenres.length > 0) {
    bearState = 'selected';
  }

  // Dialogue bubble messages
  const getDialogueMessage = () => {
    switch (bearState) {
      case 'loading':
        return 'Đang phân tích gu xem phim và lập danh sách đề xuất cực phẩm cho bạn đây... Đợi tớ một xíu nhé! 🍿🍿';
      case 'typing':
        return 'Tớ đang nghe nè! Tả cụ thể một xíu sở thích xem phim hôm nay (ví dụ: kết buồn, nhiều cú twist) để tớ gợi ý chuẩn đét nha! ✍️🐻';
      case 'selected':
        return `Tuyệt quá! Đã chọn được ${selectedGenres.length} thể loại rồi. Chọn thêm nữa đi hoặc bấm "Xem Gợi Ý" để nhận phim hay nhé! ✨🎬`;
      default:
        return 'Chào bạn! Tớ là Gấu Cinema. Hãy chọn các thể loại phim bạn yêu thích dưới đây để tớ tìm phim chuẩn gu nhất cho bạn nha! 🐻🍿';
    }
  };

  const pageGenres = genres.slice(currentPage * 9, (currentPage + 1) * 9);

  return (
    <AnimatePresence>
      <div
        onClick={handleBackdropClick}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--bg-overlay, rgba(15, 15, 20, 0.85))',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', stiffness: 350, damping: 28 }}
          style={{
            background: 'linear-gradient(145deg, var(--bg-surface) 0%, var(--bg-base) 100%)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-xl, 24px)',
            padding: 'clamp(20px, 3.5vw, 36px)',
            maxWidth: 820,
            width: '92vw',
            maxHeight: '90vh',
            boxShadow: 'var(--shadow-elevated, 0 32px 64px rgba(0,0,0,0.8)), inset 0 1px 0 rgba(255,255,255,0.06)',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Subtle Ambient Accent Glow */}
          <div
            style={{
              position: 'absolute',
              top: -80,
              right: -80,
              width: 250,
              height: 250,
              background: 'radial-gradient(circle, var(--accent-glow, rgba(255,138,0,0.1)) 0%, transparent 70%)',
              pointerEvents: 'none',
              filter: 'blur(20px)',
            }}
          />

          {/* Close button */}
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              position: 'absolute',
              top: 20,
              right: 20,
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md, 12px)',
              padding: 10,
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              zIndex: 10,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'var(--bg-hover)';
              e.currentTarget.style.color = 'var(--text-primary)';
              e.currentTarget.style.borderColor = 'var(--accent)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'var(--bg-elevated)';
              e.currentTarget.style.color = 'var(--text-secondary)';
              e.currentTarget.style.borderColor = 'var(--border-color)';
            }}
          >
            <X size={16} />
          </button>

          {/* Title Area */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: 'var(--accent-soft)',
                border: '1px solid var(--accent-glow)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Sparkles size={15} style={{ color: 'var(--accent)' }} />
            </div>
            <span
              style={{
                fontFamily: "'Outfit', 'Cabinet Grotesk', sans-serif",
                fontSize: 11,
                color: 'var(--accent)',
                fontWeight: 700,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
              }}
            >
              Trợ lý cá nhân hóa
            </span>
          </div>

          {/* Main Content Layout Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr',
              gap: 24,
              overflowY: 'auto',
              flex: 1,
              paddingRight: 6,
            }}
            className="survey-scrollbar"
          >
            <style>{`
              .survey-scrollbar::-webkit-scrollbar { width: 5px; }
              .survey-scrollbar::-webkit-scrollbar-track { background: transparent; }
              .survey-scrollbar::-webkit-scrollbar-thumb { background: var(--border-color); border-radius: 4px; }
              .survey-scrollbar::-webkit-scrollbar-thumb:hover { background: var(--accent); }
              
              .genre-card { transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1); }
              .genre-card:hover { transform: translateY(-2px); border-color: var(--accent); }
              .genre-card:active { transform: scale(0.97); }
            `}</style>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr',
                gap: 24,
              }}
              // Desktop layout override dynamically simulated via inline grid configuration
              ref={el => {
                if (el) {
                  if (window.innerWidth >= 768) {
                    el.style.gridTemplateColumns = '240px 1fr';
                  } else {
                    el.style.gridTemplateColumns = '1fr';
                  }
                }
              }}
            >
              {/* LEFT COLUMN: Bear Mascot & Dialogue */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 16,
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 18,
                  padding: 16,
                  alignSelf: 'start',
                }}
              >
                <BearMascot state={bearState} />

                {/* Animated Speech Bubble */}
                <div
                  style={{
                    position: 'relative',
                    background: 'var(--accent-soft)',
                    border: '1px solid var(--accent-glow)',
                    borderRadius: 14,
                    padding: '12px 14px',
                    width: '100%',
                    boxSizing: 'border-box',
                  }}
                >
                  {/* Speech Bubble Arrow */}
                  <div
                    style={{
                      position: 'absolute',
                      top: -8,
                      left: '50%',
                      transform: 'translateX(-50%) rotate(45deg)',
                      width: 14,
                      height: 14,
                      background: 'var(--bg-surface)',
                      borderLeft: '1px solid var(--accent-glow)',
                      borderTop: '1px solid var(--accent-glow)',
                    }}
                  />
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={bearState}
                      initial={{ opacity: 0, y: 3 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -3 }}
                      transition={{ duration: 0.2 }}
                      style={{
                        fontSize: 12.5,
                        color: 'var(--text-primary)',
                        margin: 0,
                        lineHeight: 1.5,
                        textAlign: 'center',
                        fontWeight: 500,
                      }}
                    >
                      {getDialogueMessage()}
                    </motion.p>
                  </AnimatePresence>
                </div>
              </div>

              {/* RIGHT COLUMN: Question & Selection Grid */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <h2
                    style={{
                      fontFamily: "'Outfit', sans-serif",
                      fontSize: 'clamp(18px, 3.5vw, 22px)',
                      fontWeight: 800,
                      color: 'var(--text-primary)',
                      margin: 0,
                      letterSpacing: '-0.02em',
                    }}
                  >
                    Thể loại yêu thích của bạn?
                  </h2>
                  <p
                    style={{
                      color: 'var(--text-secondary)',
                      fontSize: 12.5,
                      marginTop: 6,
                      marginBottom: 0,
                      lineHeight: 1.5,
                    }}
                  >
                    Chọn các thể loại bên dưới để nhận các đề xuất phim chuẩn xác.
                  </p>
                </div>

                {/* Paginated 3x3 Grid (Y coordinate: 3 values, X coordinate: n values, max 9 per page) */}
                {fetchingGenres ? (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)', fontSize: 13 }}>
                    <div
                      style={{
                        width: 24,
                        height: 24,
                        border: '2px solid var(--border-color)',
                        borderTopColor: 'var(--accent)',
                        borderRadius: '50%',
                        margin: '0 auto 12px',
                        animation: 'spin 0.8s linear infinite',
                      }}
                    />
                    Đang kết nối kho thể loại phim...
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {/* Grid wrapper container with overflow safety & slide animation container */}
                    <div style={{ position: 'relative', overflow: 'hidden', minHeight: 250 }}>
                      <AnimatePresence initial={false} custom={slideDirection} mode="wait">
                        <motion.div
                          key={currentPage}
                          custom={slideDirection}
                          variants={{
                            enter: (dir: number) => ({
                              x: dir > 0 ? 120 : dir < 0 ? -120 : 0,
                              opacity: 0,
                            }),
                            center: {
                              x: 0,
                              opacity: 1,
                            },
                            exit: (dir: number) => ({
                              x: dir > 0 ? -120 : dir < 0 ? 120 : 0,
                              opacity: 0,
                            }),
                          }}
                          initial="enter"
                          animate="center"
                          exit="exit"
                          transition={{
                            x: { type: 'spring', stiffness: 320, damping: 28 },
                            opacity: { duration: 0.18 },
                          }}
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            gridTemplateRows: 'repeat(3, auto)',
                            gap: 10,
                            width: '100%',
                          }}
                        >
                          {pageGenres.map(genre => {
                            const isSelected = selectedGenres.includes(genre.genreId);
                            const IconComponent = GENRE_ICONS[genre.genreName] || Lucide.Clapperboard;
                            return (
                              <button
                                key={genre.genreId}
                                onClick={() => toggleGenre(genre.genreId)}
                                className="genre-card"
                                style={{
                                  padding: '12px 6px',
                                  borderRadius: 'var(--radius-md, 14px)',
                                  border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--border-color)'}`,
                                  background: isSelected
                                    ? 'var(--accent-soft)'
                                    : 'var(--bg-surface)',
                                  color: isSelected ? 'var(--accent)' : 'var(--text-primary)',
                                  cursor: 'pointer',
                                  textAlign: 'center',
                                  fontWeight: isSelected ? 700 : 500,
                                  fontSize: 12,
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  gap: 5,
                                  boxShadow: isSelected ? 'var(--shadow-glow)' : 'none',
                                  boxSizing: 'border-box',
                                  height: '70px',
                                  justifyContent: 'center',
                                }}
                              >
                                <IconComponent size={20} style={{ opacity: isSelected ? 1 : 0.8 }} />
                                <span
                                  style={{
                                    display: 'block',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    width: '100%',
                                  }}
                                >
                                  {genre.genreName}
                                </span>
                              </button>
                            );
                          })}
                        </motion.div>
                      </AnimatePresence>
                    </div>

                    {/* Pagination controller */}
                    {totalPages > 1 && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 16,
                          marginTop: 4,
                        }}
                      >
                        <button
                          disabled={currentPage === 0}
                          onClick={() => handlePageChange(currentPage - 1)}
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            background: 'var(--bg-elevated)',
                            border: '1px solid var(--border-color)',
                            color: 'var(--text-primary)',
                            cursor: currentPage === 0 ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            opacity: currentPage === 0 ? 0.3 : 1,
                            transition: 'all 0.2s ease',
                          }}
                          onMouseEnter={e => {
                            if (currentPage !== 0) {
                              e.currentTarget.style.borderColor = 'var(--accent)';
                              e.currentTarget.style.color = 'var(--accent)';
                            }
                          }}
                          onMouseLeave={e => {
                            if (currentPage !== 0) {
                              e.currentTarget.style.borderColor = 'var(--border-color)';
                              e.currentTarget.style.color = 'var(--text-primary)';
                            }
                          }}
                        >
                          <ChevronLeft size={16} />
                        </button>

                        <div style={{ display: 'flex', gap: 6 }}>
                          {Array.from({ length: totalPages }).map((_, idx) => (
                            <button
                              key={idx}
                              onClick={() => handlePageChange(idx)}
                              style={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                background: idx === currentPage ? 'var(--accent)' : 'var(--border-color)',
                                border: 'none',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                transform: idx === currentPage ? 'scale(1.2)' : 'scale(1)',
                              }}
                            />
                          ))}
                        </div>

                        <button
                          disabled={currentPage === totalPages - 1}
                          onClick={() => handlePageChange(currentPage + 1)}
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            background: 'var(--bg-elevated)',
                            border: '1px solid var(--border-color)',
                            color: 'var(--text-primary)',
                            cursor: currentPage === totalPages - 1 ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            opacity: currentPage === totalPages - 1 ? 0.3 : 1,
                            transition: 'all 0.2s ease',
                          }}
                          onMouseEnter={e => {
                            if (currentPage !== totalPages - 1) {
                              e.currentTarget.style.borderColor = 'var(--accent)';
                              e.currentTarget.style.color = 'var(--accent)';
                            }
                          }}
                          onMouseLeave={e => {
                            if (currentPage !== totalPages - 1) {
                              e.currentTarget.style.borderColor = 'var(--border-color)';
                              e.currentTarget.style.color = 'var(--text-primary)';
                            }
                          }}
                        >
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Preference Input */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label
                    style={{
                      fontSize: 12.5,
                      color: 'var(--text-secondary)',
                      fontWeight: 500,
                    }}
                  >
                    Chia sẻ thêm gu phim hôm nay của bạn <span style={{ color: 'var(--text-muted)' }}>(tùy chọn)</span>
                  </label>
                  <textarea
                    value={preference}
                    onChange={e => setPreference(e.target.value)}
                    onFocus={() => setIsPrefFocused(true)}
                    onBlur={() => setIsPrefFocused(false)}
                    placeholder="Ví dụ: Thích xem phim trinh thám hack não, nhịp độ nhanh, kịch tính, kết thúc bất ngờ..."
                    rows={2.5}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-md, 14px)',
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-primary)',
                      fontSize: 13,
                      resize: 'none',
                      outline: 'none',
                      fontFamily: 'inherit',
                      boxSizing: 'border-box',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={e => {
                      if (!isPrefFocused) e.currentTarget.style.borderColor = 'var(--accent-glow)';
                    }}
                    onMouseLeave={e => {
                      if (!isPrefFocused) e.currentTarget.style.borderColor = 'var(--border-color)';
                    }}
                    ref={el => {
                      if (el) {
                        if (isPrefFocused) {
                          el.style.borderColor = 'var(--accent)';
                          el.style.boxShadow = '0 0 12px var(--accent-soft)';
                          el.style.background = 'var(--bg-hover)';
                        } else {
                          el.style.borderColor = 'var(--border-color)';
                          el.style.boxShadow = 'none';
                          el.style.background = 'var(--bg-elevated)';
                        }
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div
            style={{
              display: 'flex',
              gap: 12,
              justifyContent: 'flex-end',
              alignItems: 'center',
              marginTop: 20,
              paddingTop: 16,
              borderTop: '1px solid var(--border-color)',
            }}
          >
            {selectedGenres.length > 0 && (
              <span
                style={{
                  fontSize: 12,
                  color: 'var(--accent)',
                  marginRight: 'auto',
                  fontWeight: 600,
                  fontFamily: "'Outfit', sans-serif",
                }}
              >
                Đã chọn {selectedGenres.length} thể loại phim
              </span>
            )}

            <button
              onClick={onClose}
              style={{
                padding: '10px 20px',
                borderRadius: 'var(--radius-md, 12px)',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-elevated)',
                color: 'var(--text-secondary)',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.color = 'var(--text-primary)';
                e.currentTarget.style.background = 'var(--bg-hover)';
                e.currentTarget.style.borderColor = 'var(--accent)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = 'var(--text-secondary)';
                e.currentTarget.style.background = 'var(--bg-elevated)';
                e.currentTarget.style.borderColor = 'var(--border-color)';
              }}
            >
              Bỏ qua
            </button>

            <button
              onClick={handleSubmit}
              disabled={selectedGenres.length === 0 || loading}
              style={{
                padding: '10px 24px',
                borderRadius: 'var(--radius-md, 12px)',
                border: 'none',
                background:
                  selectedGenres.length === 0
                    ? 'var(--accent-glow, rgba(255,138,0,0.22))'
                    : 'linear-gradient(135deg, var(--accent), var(--accent-hover))',
                color: selectedGenres.length === 0 ? 'var(--text-muted)' : '#000',
                fontSize: 13,
                fontWeight: 700,
                cursor: selectedGenres.length === 0 || loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 0.2s ease',
                boxShadow: selectedGenres.length > 0 ? '0 4px 20px var(--accent-glow)' : 'none',
              }}
              onMouseEnter={e => {
                if (selectedGenres.length > 0 && !loading) {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 6px 24px var(--accent-glow)';
                }
              }}
              onMouseLeave={e => {
                if (selectedGenres.length > 0 && !loading) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 20px var(--accent-glow)';
                }
              }}
            >
              {loading ? (
                <>Đang lưu...</>
              ) : (
                <>
                  Xem Gợi Ý <ChevronRight size={15} />
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default SurveyModal;
