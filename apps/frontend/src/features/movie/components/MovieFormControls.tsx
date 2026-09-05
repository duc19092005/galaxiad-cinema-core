import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle, Image, Loader2, Search } from 'lucide-react';
import axios from 'axios';
import { movieApi } from '../../../api/movieApi';
import { showError } from '../../../utils/ToastUtils';
import type { ApiErrorResponse } from '../../../types/auth.types';
import type { ExternalPersonSearchItem } from '../../../types/movie.types';

export const RequiredMark: React.FC = () => (
    <span style={{ color: 'var(--danger)' }}>*</span>
);

export const fieldPanelStyle: React.CSSProperties = {
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(255,255,255,0.025)',
    borderRadius: 16,
    padding: 16,
};

export const optionGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap: 10,
};

export const FormPanel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div style={fieldPanelStyle}>{children}</div>
);

export const ChoiceGroup: React.FC<{
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

export const SelectableOption: React.FC<{
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
export const parsePeopleCsv = (raw: string): string[] =>
    raw
        .split(/[,;|]/)
        .map((s) => s.trim())
        .filter(Boolean);

/** Debounced TMDB person search. role separates director vs actor. Min 2 chars. */
export function useTmdbPersonSearch(query: string, role: 'director' | 'actor') {
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

export const PersonResultRow: React.FC<{
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
export const ExternalMoviePeoplePicker: React.FC<{
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

export const PosterUploadBox: React.FC<{ imagePreview: string | null; label: string; onClick: () => void }> = ({ imagePreview, label, onClick }) => {
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

export const notifyFormError = (
    message: string,
    setError: React.Dispatch<React.SetStateAction<string | null>>
) => {
    setError(message);
    showError(message, { duration: 4200 });
};

export const getMovieManagerError = (err: unknown, fallback: string) => {
    if (axios.isAxiosError(err) && err.response) {
        const data = err.response.data as ApiErrorResponse;
        return data.errors?.join(', ') || data.message || fallback;
    }
    return 'Unable to connect to server';
};

export const sameStringSet = (left: string[], right: string[]) => {
    if (left.length !== right.length) return false;
    const rightSet = new Set(right);
    return left.every(item => rightSet.has(item));
};
