import React from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, Clock, Tag, X } from 'lucide-react';
import type { Movie } from '../../../types/movie.types';
import { formatVietnamDate } from '../../../utils/dateTimeUtils';

export interface MovieDetailModalProps {
    movie: Movie;
    isOpen: boolean;
    onClose: () => void;
}

export const MovieDetailModal: React.FC<MovieDetailModalProps> = ({ movie, isOpen, onClose }) => {
    const { t } = useTranslation();
    if (!isOpen) return null;

    const formatDate = formatVietnamDate;

    return (
        <div className="modal-overlay" style={{ zIndex: 70 }}>
            <div className="modal-content" style={{ maxWidth: 860 }} onClick={e => e.stopPropagation()}>
                <div className="relative h-48 sm:h-56 overflow-hidden" style={{ background: 'rgba(0,0,0,0.4)' }}>
                    <img
                        src={movie.movieImageUrl || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800'}
                        alt={movie.movieName}
                        onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800'; }}
                        className="w-full h-full object-contain object-center"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-surface)] via-black/30 to-transparent" />
                    <button onClick={onClose} className="absolute top-4 right-4 btn-icon" style={{ background: 'rgba(0,0,0,0.5)' }}>
                        <X className="w-5 h-5" />
                    </button>
                    <div className="absolute bottom-4 left-6 right-6">
                        <h2 className="text-2xl font-black" style={{ color: 'var(--text-primary)', marginBottom: 8 }}>
                            {movie.movieName}
                        </h2>
                        <div className="flex flex-wrap gap-2">
                            {(movie.movieGenresInfos || []).map((genre, i) => (
                                <span key={i} className="badge" style={{ background: 'var(--accent)', color: '#fff' }}>{genre}</span>
                            ))}
                            {movie.movieCinemas?.map((cinema) => (
                                <span key={cinema.cinemaId} className="badge" style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#93c5fd' }}>{cinema.cinemaName}</span>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="modal-body">
                    <div style={{
                        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                        gap: 12, marginBottom: 24,
                    }}>
                        {[
                            { icon: <Clock size={14} />, label: t('movieManager.duration'), value: `${movie.duration} ${t('movieManager.minutes')}` },
                            { icon: <Calendar size={14} />, label: t('movieManager.startDate'), value: formatDate(movie.startedDate) },
                            { icon: <Calendar size={14} />, label: t('movieManager.endDate'), value: formatDate(movie.endedDate) },
                            {
                                icon: <Tag size={14} />, label: t('movieManager.requiredAgeRating'),
                                value: movie.movieRequiredAgeSymbol || 'N/A',
                            },
                            {
                                icon: <Tag size={14} />, label: t('movieManager.formats'),
                                value: (movie.movieVisualFormatInfos || []).join(', ') || 'N/A',
                            },
                        ].map((item, i) => (
                            <div key={i} className="glass-card" style={{ padding: '12px 16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                    <span style={{ color: 'var(--accent)' }}>{item.icon}</span>
                                    <span style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                                        {item.label}
                                    </span>
                                </div>
                                <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{item.value}</p>
                            </div>
                        ))}
                    </div>

                    {(movie.coverImages && movie.coverImages.length > 0) && (
                        <div style={{ marginBottom: 20 }}>
                            <h3 style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                {t('movieManager.coverImages', 'Ảnh bìa')}
                            </h3>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                {movie.coverImages.map((c) => (
                                    <div key={c.movieCoverImageId} style={{ width: 96, height: 56, borderRadius: 8, overflow: 'hidden', border: c.isPrimary ? '2px solid var(--accent)' : '1px solid var(--border-color)' }}>
                                        <img src={c.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div>
                        <h3 style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            {t('movieManager.description')}
                        </h3>
                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 }}>
                            {movie.movieDescriptions || t('movieManager.noDescription')}
                        </p>
                    </div>

                    {(movie.director || movie.actors) && (
                        <div style={{ marginTop: 16, display: 'flex', gap: 24 }}>
                            {movie.director && (
                                <div>
                                    <p style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: 2 }}>
                                        {t('movieManager.director')}
                                    </p>
                                    <p style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500, margin: 0 }}>{movie.director}</p>
                                </div>
                            )}
                            {movie.actors && (
                                <div>
                                    <p style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: 2 }}>
                                        {t('movieManager.actors')}
                                    </p>
                                    <p style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500, margin: 0 }}>{movie.actors}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="modal-footer">
                    <button onClick={onClose} className="btn btn-secondary">{t('close')}</button>
                </div>
            </div>
        </div>
    );
};
