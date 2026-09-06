import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    Clock,
    Eye,
    Film,
    FilePenLine,
    Loader2,
    Search,
    User as UserIcon,
} from 'lucide-react';
import type { Movie } from '../../../types/movie.types';

export interface MoviesListTabProps {
    movies: Movie[];
    loading: boolean;
    searchTerm: string;
    onSearchChange: (v: string) => void;
    onMovieClick: (movie: Movie) => void;
    onChangeRequest: (movie: Movie) => void;
    formatDate: (d: string) => string;
}

export const MoviesListTab: React.FC<MoviesListTabProps> = ({
    movies,
    loading,
    searchTerm,
    onSearchChange,
    onMovieClick,
    onChangeRequest,
    formatDate,
}) => {
    const { t } = useTranslation();

    if (loading) {
        return (
            <div className="state-center" style={{ minHeight: 400 }}>
                <Loader2 size={32} style={{ color: 'var(--accent)', animation: 'spin 1s linear infinite' }} />
                <p style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>Loading movies...</p>
            </div>
        );
    }

    return (
        <div className="animate-in">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <div className="relative" style={{ flex: 1, maxWidth: 320 }}>
                    <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                        type="text"
                        placeholder={t('Search movies...')}
                        value={searchTerm}
                        onChange={e => onSearchChange(e.target.value)}
                        className="input"
                        style={{ paddingLeft: 36 }}
                    />
                </div>
                <span className="badge" style={{ color: 'var(--accent)' }}>Danh mục chỉ đọc</span>
            </div>

            {movies.length === 0 ? (
                <div className="state-center" style={{ minHeight: 400 }}>
                    <Film size={48} style={{ color: 'var(--text-muted)', opacity: 0.3, marginBottom: 16 }} />
                    <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px' }}>
                        {searchTerm ? 'No movies found' : 'No movies yet'}
                    </p>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
                        {searchTerm ? 'Try adjusting your search' : 'Phim sẽ xuất hiện sau khi Admin kích hoạt hợp đồng.'}
                    </p>
                </div>
            ) : (
                <div style={{
                    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: 16,
                }}>
                    {movies.map((movie) => (
                        <div
                            key={movie.movieId}
                            className="glass-card"
                            style={{
                                overflow: 'hidden', cursor: 'pointer',
                                transition: 'all 0.2s ease',
                            }}
                            onClick={() => onMovieClick(movie)}
                        >
                            {/* Poster */}
                            <div className="relative" style={{ height: 200, overflow: 'hidden', background: '#000' }}>
                                <img
                                    src={movie.movieImageUrl || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=400'}
                                    alt={movie.movieName}
                                    className="w-full h-full object-cover"
                                    onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=400'; }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-surface)] via-transparent to-transparent opacity-60" />

                                {/* Overlay on hover */}
                                <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 hover:opacity-100 transition-opacity duration-200" style={{ background: 'rgba(0,0,0,0.6)' }}>
                                    <button onClick={(e) => { e.stopPropagation(); onMovieClick(movie); }} className="btn-icon" style={{ background: 'rgba(255,255,255,0.1)' }}>
                                        <Eye size={16} />
                                    </button>
                                    <button title="Đề xuất điều chỉnh" onClick={(e) => { e.stopPropagation(); onChangeRequest(movie); }} className="btn-icon" style={{ background: 'rgba(255,138,0,.18)' }}>
                                        <FilePenLine size={16} />
                                    </button>
                                </div>

                                {/* Duration Badge */}
                                <div className="absolute top-3 right-3 px-2 py-1 rounded-lg" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
                                    <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <Clock size={12} /> {movie.duration}m
                                    </span>
                                </div>

                                {/* Format Tags */}
                                <div className="absolute top-3 left-3 flex flex-col gap-1">
                                    {(movie.movieVisualFormatInfos || []).slice(0, 2).map((format, i) => (
                                        <span key={i} className="badge" style={{ background: 'var(--accent)', color: '#fff', fontSize: 9 }}>
                                            {format}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Info */}
                            <div style={{ padding: '14px 16px' }}>
                                <h3 className="truncate" style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px' }}>
                                    {movie.movieName}
                                </h3>
                                <div className="flex flex-wrap gap-1.5 mb-2">
                                    {(movie.movieGenresInfos || []).slice(0, 3).map((genre, i) => (
                                        <span key={i} className="badge" style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--text-secondary)', fontSize: 9 }}>
                                            {genre}
                                        </span>
                                    ))}
                                </div>
                                <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 4px' }}>
                                    {formatDate(movie.startedDate)} - {formatDate(movie.endedDate)}
                                </p>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <UserIcon size={11} style={{ color: movie.managerName ? 'var(--accent)' : 'var(--danger)' }} />
                                    <span className="truncate" style={{ fontSize: 11, fontWeight: 600, color: movie.managerName ? 'var(--accent)' : 'var(--danger)' }}>
                                        {movie.managerName || 'No manager'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
