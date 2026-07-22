// src/features/movie/MovieManagerPage.tsx
// Complete redesign with dark cinema theme - keeps all business logic

import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    User as UserIcon,
    AlertCircle,
    Film,
    Plus,
    Search,
    Edit,
    Eye,
    Loader2,
    Calendar,
    Clock,
    Tag,
    X,
    CheckCircle,
    Image,
    Trash2,
    UserPlus,
    LayoutDashboard,
} from 'lucide-react';
import { movieApi } from '../../api/movieApi';
import axios from 'axios';
import { dismissToast, showError, showLoading, showSuccess } from '../../utils/ToastUtils';
import { authApi } from '../../api/authApi';
import type { ApiErrorResponse } from '../../types/auth.types';
import type {
    Movie,
    MovieRequiredAge,
    MovieGenre,
    UpdateMovieFormData,
    MovieCoverImage,
    ExternalPersonSearchItem,
} from '../../types/movie.types';
import type { MovieFormat, Cinema } from '../../types/facilities.types';
import { facilitiesApi } from '../../api/facilitiesApi';
import LogoutModal from '../../components/LogoutModal';
import { useTranslation } from 'react-i18next';
import Cookies from 'js-cookie';
import { publicApi } from '../../api/publicApi';
import AssignRightsModal from '../admin/components/AssignRightsModal';
import ManagementDashboard from '../../components/ManagementDashboard';
import AppSidebar from '../../components/AppSidebar';
import type { SidebarSection } from '../../components/AppSidebar';
import ManagementChrome from '../../components/ManagementChrome';
import { formatVietnamDate, toVietnamDateTimeLocalValue, vietnamDateTimeLocalToOffsetString } from '../../utils/dateTimeUtils';

// =============================================
// MOVIE DETAIL MODAL
// =============================================

interface MovieDetailModalProps {
    movie: Movie;
    isOpen: boolean;
    onClose: () => void;
}

const MovieDetailModal: React.FC<MovieDetailModalProps> = ({ movie, isOpen, onClose }) => {
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

// =============================================
// CREATE MOVIE MODAL
// =============================================

interface CreateMovieModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    formats: MovieFormat[];
    requiredAges: MovieRequiredAge[];
    genres: MovieGenre[];
    cinemas: Cinema[];
}

const RequiredMark = () => <span style={{ color: 'var(--danger)' }}>*</span>;

const fieldPanelStyle: React.CSSProperties = {
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(255,255,255,0.025)',
    borderRadius: 16,
    padding: 16,
};

const optionGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap: 10,
};

const FormPanel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div style={fieldPanelStyle}>{children}</div>
);

const ChoiceGroup: React.FC<{
    label: string;
    required?: boolean;
    selectedCount: number;
    helper?: string;
    children: React.ReactNode;
    empty?: string;
    isEmpty?: boolean;
}> = ({ label, required, selectedCount, helper, children, empty, isEmpty }) => (
    <FormPanel>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 10, alignItems: 'flex-start' }}>
            <div>
                <label className="input-label" style={{ marginBottom: 4 }}>
                    {label} {required && <RequiredMark />}
                </label>
                {helper && <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 12, lineHeight: 1.5 }}>{helper}</p>}
            </div>
            <span
                style={{
                    border: '1px solid rgba(255,138,0,0.25)',
                    background: selectedCount > 0 ? 'rgba(255,138,0,0.14)' : 'rgba(255,255,255,0.04)',
                    color: selectedCount > 0 ? '#ffb77f' : 'var(--text-muted)',
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 800,
                    padding: '4px 9px',
                    whiteSpace: 'nowrap',
                }}
            >
                {selectedCount} selected
            </span>
        </div>
        {isEmpty ? (
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>{empty}</p>
        ) : (
            <div style={optionGridStyle}>{children}</div>
        )}
    </FormPanel>
);

const SelectableOption: React.FC<{
    label: string;
    description?: string;
    selected: boolean;
    onClick: () => void;
}> = ({ label, description, selected, onClick }) => (
    <button
        type="button"
        onClick={onClick}
        aria-pressed={selected}
        style={{
            minHeight: 64,
            textAlign: 'left',
            borderRadius: 14,
            padding: '12px 14px',
            border: selected ? '1px solid #ff8a00' : '1px solid rgba(255,255,255,0.1)',
            background: selected
                ? 'linear-gradient(135deg, rgba(255,138,0,0.24), rgba(255,183,127,0.09))'
                : 'rgba(255,255,255,0.035)',
            color: selected ? '#fff7ed' : 'var(--text-secondary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
            boxShadow: selected ? '0 0 0 1px rgba(255,138,0,0.18), 0 12px 28px rgba(255,138,0,0.1)' : 'none',
            transition: 'border-color 0.18s ease, background 0.18s ease, transform 0.18s ease',
        }}
        onMouseDown={(event) => {
            event.currentTarget.style.transform = 'scale(0.99)';
        }}
        onMouseUp={(event) => {
            event.currentTarget.style.transform = 'scale(1)';
        }}
        onMouseLeave={(event) => {
            event.currentTarget.style.transform = 'scale(1)';
        }}
    >
        <span
            style={{
                width: 20,
                height: 20,
                borderRadius: 999,
                border: selected ? '1px solid #ffb77f' : '1px solid rgba(255,255,255,0.18)',
                background: selected ? '#ff8a00' : 'rgba(255,255,255,0.04)',
                color: selected ? '#111' : 'transparent',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                flex: '0 0 auto',
                marginTop: 1,
            }}
        >
            <CheckCircle size={14} />
        </span>
        <span style={{ minWidth: 0 }}>
            <span style={{ display: 'block', fontSize: 13, fontWeight: 800, color: selected ? '#fff' : 'var(--text-primary)', lineHeight: 1.25 }}>
                {label}
            </span>
            {description && (
                <span style={{ display: 'block', marginTop: 4, fontSize: 11, color: selected ? '#ffd7b5' : 'var(--text-muted)', lineHeight: 1.35 }}>
                    {description}
                </span>
            )}
        </span>
    </button>
);

/** Parse "A, B, C" -> unique trimmed names */
const parsePeopleCsv = (raw: string): string[] =>
    raw
        .split(/[,;|]/)
        .map((s) => s.trim())
        .filter(Boolean);

/** Debounced TMDB person search. role separates director vs actor. Min 2 chars. */
function useTmdbPersonSearch(query: string, role: 'director' | 'actor') {
    const { t } = useTranslation();
    const [items, setItems] = useState<ExternalPersonSearchItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const seqRef = useRef(0);

    useEffect(() => {
        const q = query.trim();
        const seq = ++seqRef.current;

        if (q.length < 2) {
            setItems([]);
            setLoading(false);
            setError(null);
            return;
        }

        setLoading(true);
        setError(null);
        const timer = window.setTimeout(async () => {
            try {
                const res = await movieApi.searchExternalPeople(q, role);
                if (seq !== seqRef.current) return;
                setItems(res.data || []);
                if (!(res.data || []).length) {
                    setError(
                        role === 'director'
                            ? t('movieManager.tmdbNoDirectors', 'Không tìm thấy đạo diễn trên TMDB')
                            : t('movieManager.tmdbNoActors', 'Không tìm thấy diễn viên trên TMDB')
                    );
                }
            } catch (err: any) {
                if (seq !== seqRef.current) return;
                setItems([]);
                setError(err?.response?.data?.message || t('movieManager.tmdbPeopleError', 'Lỗi tìm người trên TMDB'));
            } finally {
                if (seq === seqRef.current) setLoading(false);
            }
        }, 320);
        return () => window.clearTimeout(timer);
    }, [query, role, t]);

    return { items, loading, error };
}

const PersonResultRow: React.FC<{
    person: ExternalPersonSearchItem;
    selected: boolean;
    onSelect: () => void;
    roleLabel: string;
}> = ({ person, selected, onSelect, roleLabel }) => (
    <button
        type="button"
        onClick={onSelect}
        style={{
            display: 'flex',
            gap: 10,
            alignItems: 'center',
            textAlign: 'left',
            padding: 10,
            borderRadius: 12,
            border: selected ? '1px solid var(--accent)' : '1px solid var(--border-color)',
            background: selected ? 'rgba(255,138,0,0.14)' : 'rgba(255,255,255,0.03)',
            cursor: 'pointer',
            color: 'var(--text-primary)',
            width: '100%',
        }}
    >
        <div
            style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                overflow: 'hidden',
                background: '#222',
                flex: '0 0 auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                fontWeight: 800,
                color: 'var(--accent)',
            }}
        >
            {person.profileUrl ? (
                <img src={person.profileUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
                person.name.charAt(0)
            )}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 13 }}>{person.name}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                {roleLabel}
                {person.knownForDepartment ? ` · ${person.knownForDepartment}` : ''}
            </div>
        </div>
        {selected && <CheckCircle size={16} style={{ color: 'var(--accent)', flex: '0 0 auto' }} />}
    </button>
);

/**
 * TWO completely separate pickers:
 * 1) Đạo diễn — 1 search box, single select
 * 2) Diễn viên — 1 other search box, multi select
 * Both call TMDB person search (not movies).
 */
const ExternalMoviePeoplePicker: React.FC<{
    movieNameHint?: string;
    director: string;
    actorsCsv: string;
    onDirectorChange: (name: string) => void;
    onActorsChange: (csv: string) => void;
}> = ({ director, actorsCsv, onDirectorChange, onActorsChange }) => {
    const { t } = useTranslation();
    const [directorQuery, setDirectorQuery] = useState('');
    const [actorQuery, setActorQuery] = useState('');
    const directorSearch = useTmdbPersonSearch(directorQuery, 'director');
    const actorSearch = useTmdbPersonSearch(actorQuery, 'actor');
    const selectedActors = parsePeopleCsv(actorsCsv);

    const toggleActor = (name: string) => {
        const exists = selectedActors.some((a) => a.toLowerCase() === name.toLowerCase());
        const next = exists
            ? selectedActors.filter((a) => a.toLowerCase() !== name.toLowerCase())
            : [...selectedActors, name];
        onActorsChange(next.join(', '));
    };

    return (
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: '1fr',
                gap: 16,
            }}
        >
            {/* ========== ĐẠO DIỄN (riêng) ========== */}
            <FormPanel>
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        marginBottom: 10,
                        paddingBottom: 10,
                        borderBottom: '1px solid rgba(255,138,0,0.25)',
                    }}
                >
                    <span
                        style={{
                            fontSize: 11,
                            fontWeight: 900,
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                            color: '#111',
                            background: 'var(--accent)',
                            borderRadius: 999,
                            padding: '4px 10px',
                        }}
                    >
                        {t('movieManager.directorSection', 'Đạo diễn')}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {t('movieManager.directorSingle', 'Chọn đúng 1 người')}
                    </span>
                </div>

                {director ? (
                    <div style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span
                            className="badge"
                            style={{
                                background: 'rgba(255,138,0,0.18)',
                                color: 'var(--accent)',
                                border: '1px solid rgba(255,138,0,0.35)',
                                fontSize: 13,
                                padding: '6px 12px',
                            }}
                        >
                            {t('movieManager.selectedDirector', 'Đã chọn')}: {director}
                        </span>
                        <button
                            type="button"
                            className="btn btn-secondary"
                            style={{ padding: '4px 10px', fontSize: 11 }}
                            onClick={() => onDirectorChange('')}
                        >
                            {t('common.clear', 'Xóa')}
                        </button>
                    </div>
                ) : null}

                <label className="input-label" style={{ marginBottom: 6 }}>
                    {t('movieManager.searchDirector', 'Tìm đạo diễn (TMDB)')}
                </label>
                <div style={{ position: 'relative' }}>
                    <Search
                        size={14}
                        style={{
                            position: 'absolute',
                            left: 12,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: 'var(--text-muted)',
                            pointerEvents: 'none',
                        }}
                    />
                    <input
                        type="text"
                        className="input"
                        style={{
                            width: '100%',
                            paddingLeft: 36,
                            paddingRight: directorSearch.loading ? 40 : 12,
                            borderColor: 'rgba(255,138,0,0.35)',
                        }}
                        value={directorQuery}
                        onChange={(e) => setDirectorQuery(e.target.value)}
                        placeholder={t('movieManager.directorSearchPh', 'Gõ tên đạo diễn: Nolan, Villeneuve...')}
                        autoComplete="off"
                        name="tmdb-director-search"
                        id="tmdb-director-search"
                    />
                    {directorSearch.loading && (
                        <Loader2
                            size={14}
                            style={{
                                position: 'absolute',
                                right: 12,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                animation: 'spin 1s linear infinite',
                                color: 'var(--accent)',
                            }}
                        />
                    )}
                </div>
                {directorQuery.trim().length > 0 && directorQuery.trim().length < 2 && (
                    <p style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
                        {t('movieManager.typeMin2', 'Gõ tối thiểu 2 ký tự để tìm...')}
                    </p>
                )}
                {directorSearch.error && (
                    <p style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--danger)' }}>{directorSearch.error}</p>
                )}
                <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 240, overflowY: 'auto' }}>
                    {directorSearch.items.map((p) => (
                        <PersonResultRow
                            key={`director-${p.tmdbId}`}
                            person={p}
                            roleLabel={t('movieManager.director', 'Đạo diễn')}
                            selected={director.trim().toLowerCase() === p.name.toLowerCase()}
                            onSelect={() => onDirectorChange(p.name)}
                        />
                    ))}
                </div>
            </FormPanel>

            {/* ========== DIỄN VIÊN (riêng) ========== */}
            <FormPanel>
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        marginBottom: 10,
                        paddingBottom: 10,
                        borderBottom: '1px solid rgba(96,165,250,0.35)',
                    }}
                >
                    <span
                        style={{
                            fontSize: 11,
                            fontWeight: 900,
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                            color: '#0c1a2e',
                            background: '#60a5fa',
                            borderRadius: 999,
                            padding: '4px 10px',
                        }}
                    >
                        {t('movieManager.actorsSection', 'Diễn viên')}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {t('movieManager.actorsMulti', 'Chọn nhiều người')}
                        {selectedActors.length > 0 ? ` · ${selectedActors.length}` : ''}
                    </span>
                </div>

                {selectedActors.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                        {selectedActors.map((name) => (
                            <button
                                key={name}
                                type="button"
                                onClick={() => toggleActor(name)}
                                className="badge"
                                style={{
                                    background: 'rgba(96,165,250,0.18)',
                                    color: '#93c5fd',
                                    border: '1px solid rgba(96,165,250,0.4)',
                                    cursor: 'pointer',
                                    fontSize: 12,
                                    padding: '6px 10px',
                                }}
                                title={t('common.remove', 'Bỏ chọn')}
                            >
                                {name} ×
                            </button>
                        ))}
                    </div>
                )}

                <label className="input-label" style={{ marginBottom: 6 }}>
                    {t('movieManager.searchActors', 'Tìm diễn viên (TMDB)')}
                </label>
                <div style={{ position: 'relative' }}>
                    <Search
                        size={14}
                        style={{
                            position: 'absolute',
                            left: 12,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: 'var(--text-muted)',
                            pointerEvents: 'none',
                        }}
                    />
                    <input
                        type="text"
                        className="input"
                        style={{
                            width: '100%',
                            paddingLeft: 36,
                            paddingRight: actorSearch.loading ? 40 : 12,
                            borderColor: 'rgba(96,165,250,0.4)',
                        }}
                        value={actorQuery}
                        onChange={(e) => setActorQuery(e.target.value)}
                        placeholder={t('movieManager.actorsSearchPh', 'Gõ tên diễn viên: Pattinson, DiCaprio...')}
                        autoComplete="off"
                        name="tmdb-actor-search"
                        id="tmdb-actor-search"
                    />
                    {actorSearch.loading && (
                        <Loader2
                            size={14}
                            style={{
                                position: 'absolute',
                                right: 12,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                animation: 'spin 1s linear infinite',
                                color: '#60a5fa',
                            }}
                        />
                    )}
                </div>
                {actorQuery.trim().length > 0 && actorQuery.trim().length < 2 && (
                    <p style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
                        {t('movieManager.typeMin2', 'Gõ tối thiểu 2 ký tự để tìm...')}
                    </p>
                )}
                {actorSearch.error && (
                    <p style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--danger)' }}>{actorSearch.error}</p>
                )}
                <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 280, overflowY: 'auto' }}>
                    {actorSearch.items.map((p) => (
                        <PersonResultRow
                            key={`actor-${p.tmdbId}`}
                            person={p}
                            roleLabel={t('movieManager.actors', 'Diễn viên')}
                            selected={selectedActors.some((a) => a.toLowerCase() === p.name.toLowerCase())}
                            onSelect={() => toggleActor(p.name)}
                        />
                    ))}
                </div>
            </FormPanel>
        </div>
    );
};

const PosterUploadBox: React.FC<{ imagePreview: string | null; label: string; onClick: () => void }> = ({ imagePreview, label, onClick }) => {
    const { t } = useTranslation();
    return (
        <div
            onClick={onClick}
            className="border-2 border-dashed rounded-xl cursor-pointer interactive"
            style={{
                borderColor: imagePreview ? 'rgba(255,138,0,0.3)' : 'rgba(255,255,255,0.1)',
                background: imagePreview ? 'rgba(255,138,0,0.04)' : 'rgba(255,255,255,0.02)',
                padding: imagePreview ? 16 : 32,
                minHeight: imagePreview ? undefined : 160,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                position: 'relative',
            }}
        >
            {imagePreview ? (
                <>
                    <img src={imagePreview} alt="Preview" className="w-[80%] max-w-[220px] h-52 object-contain object-center rounded-lg mx-auto" />
                    <span
                        style={{
                            position: 'absolute',
                            right: 12,
                            bottom: 12,
                            borderRadius: 999,
                            padding: '7px 12px',
                            background: '#ff8a00',
                            color: '#111',
                            fontSize: 12,
                            fontWeight: 900,
                        }}
                    >
                        {t('movieManager.changePoster')}
                    </span>
                </>
            ) : (
                <div style={{ textAlign: 'center', padding: 20 }}>
                    <Image size={42} style={{ color: '#ffb77f', marginBottom: 10 }} />
                    <p style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 800, margin: 0 }}>{label}</p>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '6px 0 0' }}>{t('movieManager.imageHint')}</p>
                </div>
            )}
        </div>
    );
};

const notifyFormError = (
    message: string,
    setError: React.Dispatch<React.SetStateAction<string | null>>
) => {
    setError(message);
    showError(message, { duration: 4200 });
};

const getMovieManagerError = (err: unknown, fallback: string) => {
    if (axios.isAxiosError(err) && err.response) {
        const data = err.response.data as ApiErrorResponse;
        return data.errors?.join(', ') || data.message || fallback;
    }
    return 'Unable to connect to server';
};

const sameStringSet = (left: string[], right: string[]) => {
    if (left.length !== right.length) return false;
    const rightSet = new Set(right);
    return left.every(item => rightSet.has(item));
};

const CreateMovieModal: React.FC<CreateMovieModalProps> = ({ isOpen, onClose, onSuccess, formats, requiredAges, genres, cinemas }) => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [bannerPreviews, setBannerPreviews] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const bannerFileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({
        movieName: '',
        movieDescription: '',
        movieImage: null as File | null,
        movieBanners: [] as File[],
        startedDate: '',
        endedDate: '',
        duration: '',
        movieFormatIds: [] as string[],
        movieGenreIds: [] as string[],
        movieRequiredAgeId: '00000000-0000-0000-0000-000000000000',
        trailerUrl: '',
        director: '',
        actors: '',
        cinemaIds: [] as string[],
    });

    if (!isOpen) return null;

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFormData(prev => ({ ...prev, movieImage: file }));
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleBannersChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;
        setFormData(prev => ({ ...prev, movieBanners: [...prev.movieBanners, ...files] }));
        files.forEach((file) => {
            const reader = new FileReader();
            reader.onloadend = () => setBannerPreviews(prev => [...prev, reader.result as string]);
            reader.readAsDataURL(file);
        });
        e.target.value = '';
    };

    const removeBannerAt = (index: number) => {
        setFormData(prev => ({ ...prev, movieBanners: prev.movieBanners.filter((_, i) => i !== index) }));
        setBannerPreviews(prev => prev.filter((_, i) => i !== index));
    };

    const handleFormatToggle = (formatId: string) => {
        setFormData(prev => ({
            ...prev,
            movieFormatIds: prev.movieFormatIds.includes(formatId)
                ? prev.movieFormatIds.filter(id => id !== formatId)
                : [...prev.movieFormatIds, formatId],
        }));
    };

    const handleGenreToggle = (genreId: string) => {
        setFormData(prev => ({
            ...prev,
            movieGenreIds: prev.movieGenreIds.includes(genreId)
                ? prev.movieGenreIds.filter(id => id !== genreId)
                : [...prev.movieGenreIds, genreId],
        }));
    };

    const handleCinemaToggle = (cinemaId: string) => {
        setFormData(prev => ({
            ...prev,
            cinemaIds: prev.cinemaIds.includes(cinemaId)
                ? prev.cinemaIds.filter(id => id !== cinemaId)
                : [...prev.cinemaIds, cinemaId],
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(false);

        if (!formData.movieName.trim()) { notifyFormError(t('movieManager.pleaseEnterName'), setError); return; }
        if (!formData.movieImage) { notifyFormError(t('movieManager.pleaseSelectPoster'), setError); return; }
        if (formData.movieBanners.length === 0) { notifyFormError(t('movieManager.pleaseSelectBanner'), setError); return; }
        if (!formData.startedDate) { notifyFormError(t('movieManager.pleaseSelectStartDate'), setError); return; }
        if (!formData.endedDate) { notifyFormError(t('movieManager.pleaseSelectEndDate'), setError); return; }
        if (!formData.duration || parseInt(formData.duration) <= 0) { notifyFormError(t('movieManager.pleaseEnterDuration'), setError); return; }
        if (formData.movieFormatIds.length === 0) { notifyFormError(t('movieManager.pleaseSelectFormat'), setError); return; }
        if (formData.movieRequiredAgeId === '00000000-0000-0000-0000-000000000000') { notifyFormError(t('movieManager.pleaseSelectAge'), setError); return; }
        if (formData.cinemaIds.length === 0) { notifyFormError(t('movieManager.pleaseSelectCinema'), setError); return; }

        setLoading(true);
        const toastId = showLoading(t('movieManager.creating'));
        try {
            const submissionData = {
                movieRequiredAgeId: formData.movieRequiredAgeId,
                movieName: formData.movieName.trim(),
                movieDescription: formData.movieDescription.trim(),
                movieImage: formData.movieImage,
                movieBanner: formData.movieBanners[0],
                movieBanners: formData.movieBanners,
                startedDate: vietnamDateTimeLocalToOffsetString(formData.startedDate) ?? formData.startedDate,
                endedDate: vietnamDateTimeLocalToOffsetString(formData.endedDate) ?? formData.endedDate,
                duration: parseInt(formData.duration),
                movieFormatIds: formData.movieFormatIds,
                movieGenreIds: formData.movieGenreIds,
                trailerUrl: formData.trailerUrl.trim() || undefined,
                director: formData.director.trim() || undefined,
                actors: formData.actors.trim() || undefined,
                cinemaIds: formData.cinemaIds,
            };

            await movieApi.createMovie(submissionData);
            dismissToast(toastId);
            setSuccess(true);
            showSuccess(t('movieManager.addSuccess'));
            onSuccess();
            setTimeout(() => onClose(), 1200);
        } catch (err) {
            dismissToast(toastId);
            const message = getMovieManagerError(err, t('movieManager.failCreate'));
            setError(message);
            showError(message, { duration: 4800 });
        } finally { setLoading(false); }
    };

    return (
        <div className="modal-overlay" style={{ zIndex: 70 }}>
            <div className="modal-content" style={{ maxWidth: 860 }} onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <div className="flex items-center gap-3">
                        <div style={{
                            width: 44, height: 44, borderRadius: 12,
                            background: 'linear-gradient(135deg, #ff8a00, #ea580c)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <Plus className="w-5 h-5 text-white" />
                        </div>
                        <h2 className="text-xl font-black" style={{ color: 'var(--text-primary)', margin: 0 }}>{t('movieManager.addNewMovie')}</h2>
                    </div>
                    {!loading && (
                        <button onClick={onClose} className="btn-icon">
                            <X size={18} />
                        </button>
                    )}
                </div>

                <div className="modal-body" style={{ overflowY: 'auto' }}>
                    {success && (
                        <div className="alert alert-success">
                            <CheckCircle size={16} />
                            <span>{t('movieManager.addSuccess')}</span>
                        </div>
                    )}
                    {error && (
                        <div className="alert alert-error">
                            <AlertCircle size={16} />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div>
                            <label className="input-label">Movie Name <RequiredMark /></label>
                            <input type="text" name="movieName" value={formData.movieName} onChange={handleInputChange} className="input" placeholder="Enter movie name" maxLength={50} />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <div>
                                <label className="input-label">{t('movieManager.posterImage')} <RequiredMark /></label>
                                <PosterUploadBox
                                    imagePreview={imagePreview}
                                    label={t('movieManager.uploadPosterImage')}
                                    onClick={() => fileInputRef.current?.click()}
                                />
                                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                            </div>
                            <div>
                                <label className="input-label">{t('movieManager.bannerImage')} <RequiredMark /></label>
                                <PosterUploadBox
                                    imagePreview={bannerPreviews[0] || null}
                                    label={t('movieManager.uploadBannerImage')}
                                    onClick={() => bannerFileInputRef.current?.click()}
                                />
                                <input ref={bannerFileInputRef} type="file" accept="image/*" multiple onChange={handleBannersChange} className="hidden" />
                                <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '6px 0 0' }}>{t('movieManager.multiBannerHint', 'Có thể chọn nhiều ảnh bìa (banner/cover).')}</p>
                                {bannerPreviews.length > 0 && (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                                        {bannerPreviews.map((src, idx) => (
                                            <div key={idx} style={{ position: 'relative', width: 72, height: 44, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                                                <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                <button type="button" onClick={() => removeBannerAt(idx)} style={{ position: 'absolute', top: 2, right: 2, border: 'none', borderRadius: 4, background: 'rgba(0,0,0,0.65)', color: '#fff', width: 18, height: 18, fontSize: 10, cursor: 'pointer', padding: 0 }}>×</button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <div>
                                <label className="input-label">{t('movieManager.startDate')} <RequiredMark /></label>
                                <input type="datetime-local" name="startedDate" value={formData.startedDate} onChange={handleInputChange} className="input" />
                            </div>
                            <div>
                                <label className="input-label">{t('movieManager.endDate')} <RequiredMark /></label>
                                <input type="datetime-local" name="endedDate" value={formData.endedDate} onChange={handleInputChange} className="input" />
                            </div>
                        </div>

                        <div>
                            <label className="input-label">{t('movieManager.duration')} <RequiredMark /></label>
                            <input type="number" name="duration" value={formData.duration} onChange={handleInputChange} className="input" placeholder="e.g. 120" min={1} />
                        </div>

                        <div>
                            <label className="input-label">{t('movieManager.description')}</label>
                            <textarea name="movieDescription" value={formData.movieDescription} onChange={handleInputChange} rows={3} className="input resize-none" placeholder={t('movieManager.description')} maxLength={200} />
                        </div>

                        <div>
                            <label className="input-label">{t('movieManager.trailerUrl')}</label>
                            <input type="url" name="trailerUrl" value={formData.trailerUrl} onChange={handleInputChange} className="input" placeholder="YouTube trailer URL" />
                        </div>

                        <ExternalMoviePeoplePicker
                            movieNameHint={formData.movieName}
                            director={formData.director}
                            actorsCsv={formData.actors}
                            onDirectorChange={(name) => setFormData((prev) => ({ ...prev, director: name }))}
                            onActorsChange={(csv) => setFormData((prev) => ({ ...prev, actors: csv }))}
                        />

                        <div>
                            <label className="input-label">{t('movieManager.requiredAgeRating')} <RequiredMark /></label>
                            <select name="movieRequiredAgeId" value={formData.movieRequiredAgeId} onChange={handleInputChange as any} className="input select">
                                <option value="00000000-0000-0000-0000-000000000000" disabled>{t('movieManager.selectAgeRating')}</option>
                                {requiredAges.map((age: MovieRequiredAge) => (
                                    <option key={age.movieRequiredAgeSymbolId} value={age.movieRequiredAgeSymbolId} title={age.movieRequiredAgeDescription}>
                                        {age.movieRequiredAgeSymbol} - {age.movieRequiredAgeDescription}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <ChoiceGroup
                            label="Visual Formats"
                            required
                            selectedCount={formData.movieFormatIds.length}
                            helper={t('movieManager.formatHelper')}
                            isEmpty={formats.length === 0}
                            empty={t('movieManager.noFormats')}
                        >
                            {formats.map((f: MovieFormat) => (
                                <SelectableOption
                                    key={f.formatId}
                                    label={f.formatName}
                                    description={f.formatDescription}
                                    selected={formData.movieFormatIds.includes(f.formatId)}
                                    onClick={() => handleFormatToggle(f.formatId)}
                                />
                            ))}
                        </ChoiceGroup>

                        <ChoiceGroup
                            label="Genres"
                            selectedCount={formData.movieGenreIds.length}
                            helper={t('movieManager.genreHelper')}
                            isEmpty={genres.length === 0}
                            empty={t('movieManager.noGenres')}
                        >
                            {genres.map((g: MovieGenre) => (
                                <SelectableOption
                                    key={g.movieGenreId}
                                    label={g.movieGenreName}
                                    description={g.movieGenreDescription}
                                    selected={formData.movieGenreIds.includes(g.movieGenreId)}
                                    onClick={() => handleGenreToggle(g.movieGenreId)}
                                />
                            ))}
                        </ChoiceGroup>

                        <ChoiceGroup
                            label="Authorized Cinemas"
                            required
                            selectedCount={formData.cinemaIds.length}
                            helper={t('movieManager.cinemaHelper')}
                            isEmpty={cinemas.length === 0}
                            empty={t('movieManager.noCinemas')}
                        >
                            {cinemas.map((c: Cinema) => (
                                <SelectableOption
                                    key={c.cinemaId}
                                    label={c.cinemaName}
                                    description={[c.cinemaCity, c.cinemaLocation].filter(Boolean).join(' - ')}
                                    selected={formData.cinemaIds.includes(c.cinemaId)}
                                    onClick={() => handleCinemaToggle(c.cinemaId)}
                                />
                            ))}
                        </ChoiceGroup>

                        <div className="flex justify-end gap-3 pt-4">
                            <button type="button" onClick={onClose} disabled={loading} className="btn btn-secondary">
                                                                {t('common.cancel')}
                            </button>
                            <button type="submit" disabled={loading} className="btn btn-primary">
                                {loading ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> {t('movieManager.creating')}</> : <><Plus size={14} /> {t('movieManager.createMovie')}</>}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

// =============================================
// UPDATE MOVIE MODAL
// =============================================

interface UpdateMovieModalProps {
    movie: Movie;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    formats: MovieFormat[];
    requiredAges: MovieRequiredAge[];
    genres: MovieGenre[];
    cinemas: Cinema[];
}

const UpdateMovieModal: React.FC<UpdateMovieModalProps> = ({ movie, isOpen, onClose, onSuccess, formats, requiredAges, genres, cinemas }) => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);

    const formatDateForInput = toVietnamDateTimeLocalValue;
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(movie.movieImageUrl);
    const [existingCovers, setExistingCovers] = useState<MovieCoverImage[]>(movie.coverImages || []);
    const [removeCoverImageIds, setRemoveCoverImageIds] = useState<string[]>([]);
    const [newBannerPreviews, setNewBannerPreviews] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const bannerFileInputRef = useRef<HTMLInputElement>(null);

    const initialFormData = {
        movieName: movie.movieName,
        movieDescription: movie.movieDescriptions,
        movieImage: null as File | null,
        movieBanners: [] as File[],
        startedDate: formatDateForInput(movie.startedDate),
        endedDate: formatDateForInput(movie.endedDate),
        duration: movie.duration.toString(),
        movieFormatIds: formats
            .filter((f: MovieFormat) => (movie.movieVisualFormatInfos || []).includes(f.formatName))
            .map((f: MovieFormat) => f.formatId),
        movieGenreIds: genres
            .filter((g: MovieGenre) => (movie.movieGenresInfos || []).includes(g.movieGenreName))
            .map((g: MovieGenre) => g.movieGenreId),
        movieRequiredAgeId: requiredAges.find((a: MovieRequiredAge) => (movie.movieVisualFormatInfos || []).some((info: string) => info.includes(a.movieRequiredAgeSymbol)))?.movieRequiredAgeSymbolId || '00000000-0000-0000-0000-000000000000',
        trailerUrl: movie.trailerUrl || '',
        director: movie.director || '',
        actors: movie.actors || '',
        cinemaIds: movie.movieCinemas?.map(c => c.cinemaId) || [] as string[],
    };

    const [formData, setFormData] = useState(initialFormData);

    if (!isOpen) return null;

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFormData(prev => ({ ...prev, movieImage: file }));
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleBannersChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;
        setFormData(prev => ({ ...prev, movieBanners: [...prev.movieBanners, ...files] }));
        files.forEach((file) => {
            const reader = new FileReader();
            reader.onloadend = () => setNewBannerPreviews(prev => [...prev, reader.result as string]);
            reader.readAsDataURL(file);
        });
        e.target.value = '';
    };

    const markCoverRemoved = (id: string) => {
        setRemoveCoverImageIds(prev => prev.includes(id) ? prev : [...prev, id]);
        setExistingCovers(prev => prev.filter(c => c.movieCoverImageId !== id));
    };

    const removeNewBannerAt = (index: number) => {
        setFormData(prev => ({ ...prev, movieBanners: prev.movieBanners.filter((_, i) => i !== index) }));
        setNewBannerPreviews(prev => prev.filter((_, i) => i !== index));
    };


    const handleFormatToggle = (formatId: string) => {
        setFormData(prev => ({
            ...prev,
            movieFormatIds: prev.movieFormatIds.includes(formatId)
                ? prev.movieFormatIds.filter(id => id !== formatId)
                : [...prev.movieFormatIds, formatId],
        }));
    };

    const handleGenreToggle = (genreId: string) => {
        setFormData(prev => ({
            ...prev,
            movieGenreIds: prev.movieGenreIds.includes(genreId)
                ? prev.movieGenreIds.filter(id => id !== genreId)
                : [...prev.movieGenreIds, genreId],
        }));
    };

    const handleCinemaToggle = (cinemaId: string) => {
        setFormData(prev => ({
            ...prev,
            cinemaIds: prev.cinemaIds.includes(cinemaId)
                ? prev.cinemaIds.filter(id => id !== cinemaId)
                : [...prev.cinemaIds, cinemaId],
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(false);

        const movieNameChanged = formData.movieName.trim() !== initialFormData.movieName.trim();
        const descriptionChanged = formData.movieDescription.trim() !== initialFormData.movieDescription.trim();
        const startedDateChanged = formData.startedDate !== initialFormData.startedDate;
        const endedDateChanged = formData.endedDate !== initialFormData.endedDate;
        const durationChanged = formData.duration !== initialFormData.duration;
        const formatChanged = !sameStringSet(formData.movieFormatIds, initialFormData.movieFormatIds);
        const genreChanged = !sameStringSet(formData.movieGenreIds, initialFormData.movieGenreIds);
        const requiredAgeChanged = formData.movieRequiredAgeId !== initialFormData.movieRequiredAgeId;
        const trailerChanged = formData.trailerUrl.trim() !== initialFormData.trailerUrl.trim();
        const directorChanged = formData.director.trim() !== initialFormData.director.trim();
        const actorsChanged = formData.actors.trim() !== initialFormData.actors.trim();
        const cinemaChanged = !sameStringSet(formData.cinemaIds, initialFormData.cinemaIds);

        if (movieNameChanged && !formData.movieName.trim()) { notifyFormError(t('movieManager.pleaseEnterName'), setError); return; }
        if (startedDateChanged && !formData.startedDate) { notifyFormError(t('movieManager.pleaseSelectStartDate'), setError); return; }
        if (endedDateChanged && !formData.endedDate) { notifyFormError(t('movieManager.pleaseSelectEndDate'), setError); return; }
        if ((startedDateChanged || endedDateChanged) && formData.startedDate && formData.endedDate && formData.startedDate >= formData.endedDate) {
            notifyFormError('Started Date must be lower than the ended date.', setError);
            return;
        }
        if (durationChanged && (!formData.duration || parseInt(formData.duration) <= 0)) { notifyFormError(t('movieManager.pleaseEnterDuration'), setError); return; }
        if (formatChanged && formData.movieFormatIds.length === 0) { notifyFormError(t('movieManager.pleaseSelectFormat'), setError); return; }
        if (requiredAgeChanged && formData.movieRequiredAgeId === '00000000-0000-0000-0000-000000000000') { notifyFormError(t('movieManager.pleaseSelectAge'), setError); return; }
        if (cinemaChanged && formData.cinemaIds.length === 0) { notifyFormError(t('movieManager.pleaseSelectCinema'), setError); return; }

        const submissionData: UpdateMovieFormData = {};
        if (requiredAgeChanged) submissionData.movieRequiredAgeId = formData.movieRequiredAgeId;
        if (movieNameChanged) submissionData.movieName = formData.movieName.trim();
        if (descriptionChanged) submissionData.movieDescription = formData.movieDescription.trim();
        if (formData.movieImage) submissionData.movieImage = formData.movieImage;
        if (formData.movieBanners.length > 0) {
            submissionData.movieBanners = formData.movieBanners;
            submissionData.movieBanner = formData.movieBanners[0];
        }
        if (removeCoverImageIds.length > 0) submissionData.removeCoverImageIds = removeCoverImageIds;
        if (startedDateChanged) submissionData.startedDate = vietnamDateTimeLocalToOffsetString(formData.startedDate) ?? formData.startedDate;
        if (endedDateChanged) submissionData.endedDate = vietnamDateTimeLocalToOffsetString(formData.endedDate) ?? formData.endedDate;
        if (durationChanged) submissionData.duration = parseInt(formData.duration);
        if (formatChanged) submissionData.movieFormatIds = formData.movieFormatIds;
        if (genreChanged) submissionData.movieGenreIds = formData.movieGenreIds;
        if (trailerChanged) submissionData.trailerUrl = formData.trailerUrl.trim();
        if (directorChanged) submissionData.director = formData.director.trim();
        if (actorsChanged) submissionData.actors = formData.actors.trim();
        if (cinemaChanged) submissionData.cinemaIds = formData.cinemaIds;

        if (Object.keys(submissionData).length === 0) {
            notifyFormError('No changes to save.', setError);
            return;
        }

        setLoading(true);
        const toastId = showLoading('Saving movie changes...');
        try {
            await movieApi.updateMovie(movie.movieId!, submissionData);
            dismissToast(toastId);
            setSuccess(true);
            showSuccess(t('movieManager.updateSuccess'));
            onSuccess();
            setTimeout(() => onClose(), 1200);
        } catch (err) {
            dismissToast(toastId);
            const message = getMovieManagerError(err, t('movieManager.failUpdate'));
            setError(message);
            showError(message, { duration: 4800 });
        } finally { setLoading(false); }
    };

    return (
        <div className="modal-overlay" style={{ zIndex: 70 }}>
            <div className="modal-content" style={{ maxWidth: 860 }} onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <div className="flex items-center gap-3">
                        <div style={{
                            width: 44, height: 44, borderRadius: 12,
                            background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <Edit className="w-5 h-5 text-white" />
                        </div>
                        <h2 className="text-xl font-black" style={{ color: 'var(--text-primary)', margin: 0 }}>Update Movie</h2>
                    </div>
                    {!loading && (
                        <button onClick={onClose} className="btn-icon">
                            <X size={18} />
                        </button>
                    )}
                </div>

                <div className="modal-body" style={{ overflowY: 'auto' }}>
                    {success && (
                        <div className="alert alert-success">
                            <CheckCircle size={16} />
                            <span>{t('movieManager.updateSuccess')}</span>
                        </div>
                    )}
                    {error && (
                        <div className="alert alert-error">
                            <AlertCircle size={16} />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div>
                            <label className="input-label">Movie Name <RequiredMark /></label>
                            <input type="text" name="movieName" value={formData.movieName} onChange={handleInputChange} className="input" placeholder="Enter movie name" maxLength={50} />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <div>
                                <label className="input-label">Poster Image</label>
                                <PosterUploadBox
                                    imagePreview={imagePreview}
                                    label={t('movieManager.uploadNewPosterImage')}
                                    onClick={() => fileInputRef.current?.click()}
                                />
                                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                            </div>
                            <div>
                                <label className="input-label">{t('movieManager.bannerImage')}</label>
                                <PosterUploadBox
                                    imagePreview={newBannerPreviews[0] || existingCovers[0]?.imageUrl || movie.movieBannerUrl || null}
                                    label={t('movieManager.uploadNewBannerImage')}
                                    onClick={() => bannerFileInputRef.current?.click()}
                                />
                                <input ref={bannerFileInputRef} type="file" accept="image/*" multiple onChange={handleBannersChange} className="hidden" />
                                <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '6px 0 0' }}>{t('movieManager.multiBannerHint', 'Thêm nhiều ảnh bìa / cover. Ảnh đầu là primary.')}</p>
                                {(existingCovers.length > 0 || newBannerPreviews.length > 0) && (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                                        {existingCovers.map((c) => (
                                            <div key={c.movieCoverImageId} style={{ position: 'relative', width: 72, height: 44, borderRadius: 8, overflow: 'hidden', border: c.isPrimary ? '2px solid var(--accent)' : '1px solid var(--border-color)' }}>
                                                <img src={c.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                <button type="button" onClick={() => markCoverRemoved(c.movieCoverImageId)} style={{ position: 'absolute', top: 2, right: 2, border: 'none', borderRadius: 4, background: 'rgba(0,0,0,0.65)', color: '#fff', width: 18, height: 18, fontSize: 10, cursor: 'pointer', padding: 0 }}>×</button>
                                            </div>
                                        ))}
                                        {newBannerPreviews.map((src, idx) => (
                                            <div key={`new-${idx}`} style={{ position: 'relative', width: 72, height: 44, borderRadius: 8, overflow: 'hidden', border: '1px dashed var(--accent)' }}>
                                                <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                <button type="button" onClick={() => removeNewBannerAt(idx)} style={{ position: 'absolute', top: 2, right: 2, border: 'none', borderRadius: 4, background: 'rgba(0,0,0,0.65)', color: '#fff', width: 18, height: 18, fontSize: 10, cursor: 'pointer', padding: 0 }}>×</button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <div>
                                <label className="input-label">Start Date <RequiredMark /></label>
                                <input type="datetime-local" name="startedDate" value={formData.startedDate} onChange={handleInputChange} className="input" />
                            </div>
                            <div>
                                <label className="input-label">End Date <RequiredMark /></label>
                                <input type="datetime-local" name="endedDate" value={formData.endedDate} onChange={handleInputChange} className="input" />
                            </div>
                        </div>

                        <div>
                            <label className="input-label">{t('movieManager.duration')} <RequiredMark /></label>
                            <input type="number" name="duration" value={formData.duration} onChange={handleInputChange} className="input" placeholder="e.g. 120" min={1} />
                        </div>

                        <div>
                            <label className="input-label">{t('movieManager.description')}</label>
                            <textarea name="movieDescription" value={formData.movieDescription} onChange={handleInputChange} rows={3} className="input resize-none" placeholder={t('movieManager.description')} maxLength={200} />
                        </div>

                        <div>
                            <label className="input-label">{t('movieManager.trailerUrl')}</label>
                            <input type="url" name="trailerUrl" value={formData.trailerUrl} onChange={handleInputChange} className="input" placeholder="YouTube trailer URL" />
                        </div>

                        <ExternalMoviePeoplePicker
                            movieNameHint={formData.movieName}
                            director={formData.director}
                            actorsCsv={formData.actors}
                            onDirectorChange={(name) => setFormData((prev) => ({ ...prev, director: name }))}
                            onActorsChange={(csv) => setFormData((prev) => ({ ...prev, actors: csv }))}
                        />

                        <div>
                            <label className="input-label">{t('movieManager.requiredAgeRating')} <RequiredMark /></label>
                            <select name="movieRequiredAgeId" value={formData.movieRequiredAgeId} onChange={handleInputChange as any} className="input select">
                                <option value="00000000-0000-0000-0000-000000000000" disabled>{t('movieManager.selectAgeRating')}</option>
                                {requiredAges.map((age: MovieRequiredAge) => (
                                    <option key={age.movieRequiredAgeSymbolId} value={age.movieRequiredAgeSymbolId} title={age.movieRequiredAgeDescription}>
                                        {age.movieRequiredAgeSymbol} - {age.movieRequiredAgeDescription}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <ChoiceGroup
                            label="Visual Formats"
                            required
                            selectedCount={formData.movieFormatIds.length}
                            helper={t('movieManager.formatHelper')}
                            isEmpty={formats.length === 0}
                            empty={t('movieManager.noFormats')}
                        >
                            {formats.map((f: MovieFormat) => (
                                <SelectableOption
                                    key={f.formatId}
                                    label={f.formatName}
                                    description={f.formatDescription}
                                    selected={formData.movieFormatIds.includes(f.formatId)}
                                    onClick={() => handleFormatToggle(f.formatId)}
                                />
                            ))}
                        </ChoiceGroup>

                        <ChoiceGroup
                            label="Genres"
                            selectedCount={formData.movieGenreIds.length}
                            helper={t('movieManager.genreHelper')}
                            isEmpty={genres.length === 0}
                            empty={t('movieManager.noGenres')}
                        >
                            {genres.map((g: MovieGenre) => (
                                <SelectableOption
                                    key={g.movieGenreId}
                                    label={g.movieGenreName}
                                    description={g.movieGenreDescription}
                                    selected={formData.movieGenreIds.includes(g.movieGenreId)}
                                    onClick={() => handleGenreToggle(g.movieGenreId)}
                                />
                            ))}
                        </ChoiceGroup>

                        <ChoiceGroup
                            label="Authorized Cinemas"
                            required
                            selectedCount={formData.cinemaIds.length}
                            helper={t('movieManager.cinemaHelper')}
                            isEmpty={cinemas.length === 0}
                            empty={t('movieManager.noCinemas')}
                        >
                            {cinemas.map((c: Cinema) => (
                                <SelectableOption
                                    key={c.cinemaId}
                                    label={c.cinemaName}
                                    description={[c.cinemaCity, c.cinemaLocation].filter(Boolean).join(' - ')}
                                    selected={formData.cinemaIds.includes(c.cinemaId)}
                                    onClick={() => handleCinemaToggle(c.cinemaId)}
                                />
                            ))}
                        </ChoiceGroup>

                        <div className="flex justify-end gap-3 pt-4">
                            <button type="button" onClick={onClose} disabled={loading} className="btn btn-secondary">Cancel</button>
                            <button type="submit" disabled={loading} className="btn btn-primary">
                                {loading ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Updating...</> : <><Edit size={14} /> Save Changes</>}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

// =============================================
// MOVIES LIST TAB
// =============================================

interface MoviesListTabProps {
    movies: Movie[];
    loading: boolean;
    searchTerm: string;
    onSearchChange: (v: string) => void;
    onCreateClick: () => void;
    onMovieClick: (movie: Movie) => void;
    onEditClick: (movie: Movie) => void;
    onDeleteClick: (movie: Movie) => void;
    onAssignClick: (id: string, name: string) => void;
    isAdmin: boolean;
    formatDate: (d: string) => string;
}

const MoviesListTab: React.FC<MoviesListTabProps> = ({
    movies, loading, searchTerm, onSearchChange,
    onCreateClick, onMovieClick, onEditClick, onDeleteClick, onAssignClick,
    isAdmin, formatDate,
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
                <button onClick={onCreateClick} className="btn btn-primary">
                    <Plus size={14} />
                    {t('Add New Movie')}
                </button>
            </div>

            {movies.length === 0 ? (
                <div className="state-center" style={{ minHeight: 400 }}>
                    <Film size={48} style={{ color: 'var(--text-muted)', opacity: 0.3, marginBottom: 16 }} />
                    <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px' }}>
                        {searchTerm ? 'No movies found' : 'No movies yet'}
                    </p>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
                        {searchTerm ? 'Try adjusting your search' : 'Click "Add New Movie" to get started'}
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
                                    <button onClick={(e) => { e.stopPropagation(); onEditClick(movie); }} className="btn-icon" style={{ background: 'rgba(59, 130, 246, 0.2)' }}>
                                        <Edit size={16} />
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); onDeleteClick(movie); }} className="btn-icon" style={{ background: 'rgba(239, 68, 68, 0.2)' }}>
                                        <Trash2 size={16} />
                                    </button>
                                    {isAdmin && (
                                        <button onClick={(e) => { e.stopPropagation(); onAssignClick(movie.movieId!, movie.movieName); }} className="btn-icon" style={{ background: 'rgba(139, 92, 246, 0.2)' }}>
                                            <UserPlus size={16} />
                                        </button>
                                    )}
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

// =============================================
// MAIN MOVIE MANAGER PAGE
// =============================================

const MovieManagerPage: React.FC = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [user, setUser] = useState<{ username: string; roles?: string[]; selectedRole?: string } | null>(null);

    const [movies, setMovies] = useState<Movie[]>([]);
    const [formats, setFormats] = useState<MovieFormat[]>([]);
    const [requiredAges, setRequiredAges] = useState<MovieRequiredAge[]>([]);
    const [genres, setGenres] = useState<MovieGenre[]>([]);
    const [cinemas, setCinemas] = useState<Cinema[]>([]);
    const [loading, setLoading] = useState(true);
    const [_error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [logoutError, setLogoutError] = useState<string | null>(null);
    const [logoutLoading, setLogoutLoading] = useState(false);
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

    // Sidebar
    const [activeTab, setActiveTab] = useState('dashboard');
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Modals
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
    const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
    const [movieToUpdate, setMovieToUpdate] = useState<Movie | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

    // Assign Rights Modal state
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [itemToAssign, setItemToAssign] = useState<{ id: string; name: string } | null>(null);

    // Check if user is Admin
    const isAdmin = !!user?.roles?.includes('Admin');
    const handleDeleteMovie = async (movie: Movie) => {
        if (!window.confirm(`Are you sure you want to delete movie "${movie.movieName}"?`)) return;
        try {
            await movieApi.deleteMovie(movie.movieId!);
            showSuccess('Movie deleted successfully');
            fetchMovies();
        } catch (_err: any) {
            const msg = _err.response?.data?.message || 'Không thể xóa phim này';
            showError(msg);
        }
    };

    useEffect(() => {
        const storedUser = localStorage.getItem('user_info');
        if (!storedUser) { navigate('/login'); return; }
        try {
            const parsed = JSON.parse(storedUser);
            const roles = parsed.roles || [];
            if (!roles.includes('MovieManager') && !roles.includes('Admin')) { navigate('/role-selection'); return; }
            setUser(parsed);
            fetchFormats();
            fetchRequiredAges();
            fetchGenres();
            fetchCinemas();
        } catch { navigate('/login'); }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [navigate]);

    useEffect(() => {
        if (user) {
            fetchMovies();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const fetchMovies = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await movieApi.getMovieList();
            setMovies(res.data || []);
        } catch (err) {
            if (axios.isAxiosError(err) && err.response) {
                const data = err.response.data as ApiErrorResponse;
                if (data.statusCode === 401) {
                    localStorage.removeItem('user_info');
                    Cookies.remove('X-Access-Token');
                    navigate('/login');
                    return;
                }
                setError(data.message || 'Cannot load movies list.');
            } else if (axios.isAxiosError(err) && err.request) {
                setError('Cannot connect to server. Please check your network connection.');
            } else {
                setError('An unknown error occurred.');
            }
        } finally { setLoading(false); }
    };

    const fetchFormats = async () => {
        try { const res = await movieApi.getMovieFormats(); setFormats(res.data || []); } catch { }
    };

    const fetchRequiredAges = async () => {
        try { const res = await movieApi.getMovieRequiredAges(); setRequiredAges(res.data || []); } catch { }
    };

    const fetchGenres = async () => {
        try {
            const res = await publicApi.getMovieGenres();
            const genresData: MovieGenre[] = (res.data || []).map(g => ({
                movieGenreId: g.genreId,
                movieGenreName: g.genreName,
                movieGenreDescription: g.description,
            }));
            setGenres(genresData);
        } catch { }
    };

    const fetchCinemas = async () => {
        try { const res = await facilitiesApi.getCinemaList(); setCinemas(res.data || []); } catch { }
    };

    const handleLogoutConfirm = async () => {
        setLogoutError(null);
        setLogoutLoading(true);
        try {
            await authApi.logout();
            localStorage.removeItem('user_info');
            Cookies.remove('X-Access-Token');
            setIsLogoutModalOpen(false);
            navigate('/login');
        } catch (error: unknown) {
            if (axios.isAxiosError(error) && error.response) {
                const data = error.response.data as ApiErrorResponse;
                setLogoutError(data.message || 'Logout failed.');
            } else { setLogoutError('Unable to connect to server.'); }
        } finally { setLogoutLoading(false); }
    };

    const filteredMovies = movies.filter((m) =>
        m.movieName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (m.movieDescriptions || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatDate = formatVietnamDate;

    const sidebarSections: SidebarSection[] = [
        {
            id: 'movie-menu',
            label: t('Management', 'Chức năng'),
            description: t('Movies & catalog', 'Phim & danh mục'),
            icon: <Film size={18} />,
            defaultOpen: true,
            collapsible: true,
            items: [
                { id: 'dashboard', label: t('Dashboard'), icon: <LayoutDashboard size={16} /> },
                { id: 'movies', label: t('Movies'), icon: <Film size={16} /> },
            ],
        },
    ];

    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return <ManagementDashboard role="movie" />;
            case 'movies':
                return (
                    <MoviesListTab
                        movies={filteredMovies}
                        loading={loading}
                        searchTerm={searchTerm}
                        onSearchChange={setSearchTerm}
                        onCreateClick={() => setIsCreateModalOpen(true)}
                        onMovieClick={(movie) => { setSelectedMovie(movie); setIsDetailModalOpen(true); }}
                        onEditClick={(movie) => { setMovieToUpdate(movie); setIsUpdateModalOpen(true); }}
                        onDeleteClick={handleDeleteMovie}
                        onAssignClick={(id, name) => { setItemToAssign({ id, name }); setIsAssignModalOpen(true); }}
                        isAdmin={isAdmin}
                        formatDate={formatDate}
                    />
                );
            default:
                return <ManagementDashboard role="movie" />;
        }
    };

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
            <AppSidebar
                isOpen={sidebarOpen}
                onToggle={() => setSidebarOpen((open) => !open)}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                sections={sidebarSections}
                role="Movie Manager"
                collapsibleDesktop
            />

            <ManagementChrome
                sidebarOpen={sidebarOpen}
                onSidebarToggle={() => setSidebarOpen((open) => !open)}
            />

            <main className={`main-content ${sidebarOpen ? 'sidebar-open' : 'sidebar-collapsed'}`}>
                <div className="page-container">
                    {renderContent()}
                </div>
            </main>

            {/* Modals */}
            <CreateMovieModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={fetchMovies}
                formats={formats}
                requiredAges={requiredAges}
                genres={genres}
                cinemas={cinemas}
            />
            {isUpdateModalOpen && movieToUpdate && (
                <UpdateMovieModal
                        isOpen={isUpdateModalOpen}
                    onClose={() => { setIsUpdateModalOpen(false); setMovieToUpdate(null); }}
                    onSuccess={fetchMovies}
                    movie={movieToUpdate}
                    formats={formats}
                    requiredAges={requiredAges}
                    genres={genres}
                    cinemas={cinemas}
                />
            )}
            {selectedMovie && (
                <MovieDetailModal
                    movie={selectedMovie}
                    isOpen={isDetailModalOpen}
                    onClose={() => { setIsDetailModalOpen(false); setSelectedMovie(null); }}
                />
            )}
            <LogoutModal
                isOpen={isLogoutModalOpen}
                onClose={() => setIsLogoutModalOpen(false)}
                onConfirm={handleLogoutConfirm}
                loading={logoutLoading}
                error={logoutError}
            />

            {/* Assign Rights Modal */}
            {isAdmin && itemToAssign && (
                <AssignRightsModal
                    isOpen={isAssignModalOpen}
                    onClose={() => { setIsAssignModalOpen(false); setItemToAssign(null); }}
                    itemId={itemToAssign.id}
                    itemName={itemToAssign.name}
                    type={3}
                    onSuccess={() => fetchMovies()}
                />
            )}
        </div>
    );
};

export default MovieManagerPage;
