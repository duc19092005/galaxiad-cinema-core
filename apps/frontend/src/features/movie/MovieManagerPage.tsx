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
import type { Movie, MovieRequiredAge, MovieGenre, UpdateMovieFormData } from '../../types/movie.types';
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
import { useCinema } from '../../contexts/CinemaContext';
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
                            { icon: <Clock size={14} />, label: 'Duration', value: `${movie.duration} min` },
                            { icon: <Calendar size={14} />, label: 'Start Date', value: formatDate(movie.startedDate) },
                            { icon: <Calendar size={14} />, label: 'End Date', value: formatDate(movie.endedDate) },
                            {
                                icon: <Tag size={14} />, label: 'Formats',
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

                    <div>
                        <h3 style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Description
                        </h3>
                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 }}>
                            {movie.movieDescriptions || 'No description available.'}
                        </p>
                    </div>

                    {(movie.director || movie.actors) && (
                        <div style={{ marginTop: 16, display: 'flex', gap: 24 }}>
                            {movie.director && (
                                <div>
                                    <p style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: 2 }}>
                                        Director
                                    </p>
                                    <p style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500, margin: 0 }}>{movie.director}</p>
                                </div>
                            )}
                            {movie.actors && (
                                <div>
                                    <p style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: 2 }}>
                                        Actors
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

const PosterUploadBox: React.FC<{
    imagePreview: string | null;
    label: string;
    onClick: () => void;
}> = ({ imagePreview, label, onClick }) => (
    <div
        onClick={onClick}
        className="upload-zone"
        style={{
            minHeight: 230,
            border: imagePreview ? '1px solid rgba(255,138,0,0.55)' : '1px dashed rgba(255,255,255,0.18)',
            background: imagePreview ? 'rgba(255,138,0,0.055)' : 'rgba(255,255,255,0.025)',
            borderRadius: 16,
            display: 'flex',
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
                    Change poster
                </span>
            </>
        ) : (
            <div style={{ textAlign: 'center', padding: 20 }}>
                <Image size={42} style={{ color: '#ffb77f', marginBottom: 10 }} />
                <p style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 800, margin: 0 }}>{label}</p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '6px 0 0' }}>PNG, JPG or WebP poster image</p>
            </div>
        )}
    </div>
);

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
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [bannerPreview, setBannerPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const bannerFileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({
        movieName: '',
        movieDescription: '',
        movieImage: null as File | null,
        movieBanner: null as File | null,
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

    const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFormData(prev => ({ ...prev, movieBanner: file }));
            const reader = new FileReader();
            reader.onloadend = () => setBannerPreview(reader.result as string);
            reader.readAsDataURL(file);
        }
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

        if (!formData.movieName.trim()) { notifyFormError('Please enter movie name', setError); return; }
        if (!formData.movieImage) { notifyFormError('Please select a movie poster image', setError); return; }
        if (!formData.movieBanner) { notifyFormError('Please select a movie banner image', setError); return; }
        if (!formData.startedDate) { notifyFormError('Please select start date', setError); return; }
        if (!formData.endedDate) { notifyFormError('Please select end date', setError); return; }
        if (!formData.duration || parseInt(formData.duration) <= 0) { notifyFormError('Please enter valid duration', setError); return; }
        if (formData.movieFormatIds.length === 0) { notifyFormError('Please select at least one format', setError); return; }
        if (formData.movieRequiredAgeId === '00000000-0000-0000-0000-000000000000') { notifyFormError('Please select a required age rating', setError); return; }
        if (formData.cinemaIds.length === 0) { notifyFormError('Please select at least one cinema', setError); return; }

        setLoading(true);
        const toastId = showLoading('Creating movie...');
        try {
            const submissionData = {
                movieRequiredAgeId: formData.movieRequiredAgeId,
                movieName: formData.movieName.trim(),
                movieDescription: formData.movieDescription.trim(),
                movieImage: formData.movieImage,
                movieBanner: formData.movieBanner,
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
            showSuccess('Movie added successfully!');
            onSuccess();
            setTimeout(() => onClose(), 1200);
        } catch (err) {
            dismissToast(toastId);
            const message = getMovieManagerError(err, 'Failed to create movie');
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
                        <h2 className="text-xl font-black" style={{ color: 'var(--text-primary)', margin: 0 }}>Add New Movie</h2>
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
                            <span>Movie added successfully!</span>
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
                                <label className="input-label">Poster Image <RequiredMark /></label>
                                <PosterUploadBox
                                    imagePreview={imagePreview}
                                    label="Upload poster image"
                                    onClick={() => fileInputRef.current?.click()}
                                />
                                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                            </div>
                            <div>
                                <label className="input-label">Banner Image <RequiredMark /></label>
                                <PosterUploadBox
                                    imagePreview={bannerPreview}
                                    label="Upload banner image"
                                    onClick={() => bannerFileInputRef.current?.click()}
                                />
                                <input ref={bannerFileInputRef} type="file" accept="image/*" onChange={handleBannerChange} className="hidden" />
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
                            <label className="input-label">Duration (minutes) <RequiredMark /></label>
                            <input type="number" name="duration" value={formData.duration} onChange={handleInputChange} className="input" placeholder="e.g. 120" min={1} />
                        </div>

                        <div>
                            <label className="input-label">Description</label>
                            <textarea name="movieDescription" value={formData.movieDescription} onChange={handleInputChange} rows={3} className="input resize-none" placeholder="Enter movie description" maxLength={200} />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <div>
                                <label className="input-label">Trailer URL</label>
                                <input type="url" name="trailerUrl" value={formData.trailerUrl} onChange={handleInputChange} className="input" placeholder="YouTube trailer URL" />
                            </div>
                            <div>
                                <label className="input-label">Director</label>
                                <input type="text" name="director" value={formData.director} onChange={handleInputChange} className="input" placeholder="Director name" />
                            </div>
                        </div>

                        <div>
                            <label className="input-label">Actors</label>
                            <input type="text" name="actors" value={formData.actors} onChange={handleInputChange} className="input" placeholder="Actors (comma separated)" />
                        </div>

                        <div>
                            <label className="input-label">Required Age <RequiredMark /></label>
                            <select name="movieRequiredAgeId" value={formData.movieRequiredAgeId} onChange={handleInputChange as any} className="input select">
                                <option value="00000000-0000-0000-0000-000000000000" disabled>Select required age rating</option>
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
                            helper="Select every screening format that this movie can use."
                            isEmpty={formats.length === 0}
                            empty="No formats available."
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
                            helper="Selected genres are highlighted and will appear on public movie cards."
                            isEmpty={genres.length === 0}
                            empty="No genres available."
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
                            helper="Only selected cinemas can schedule and sell tickets for this movie."
                            isEmpty={cinemas.length === 0}
                            empty="No cinemas available."
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
                                Cancel
                            </button>
                            <button type="submit" disabled={loading} className="btn btn-primary">
                                {loading ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Creating...</> : <><Plus size={14} /> Create Movie</>}
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
    const [loading, setLoading] = useState(false);

    const formatDateForInput = toVietnamDateTimeLocalValue;
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(movie.movieImageUrl);
    const [bannerPreview, setBannerPreview] = useState<string | null>(movie.movieBannerUrl || null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const bannerFileInputRef = useRef<HTMLInputElement>(null);

    const initialFormData = {
        movieName: movie.movieName,
        movieDescription: movie.movieDescriptions,
        movieImage: null as File | null,
        movieBanner: null as File | null,
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

    const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFormData(prev => ({ ...prev, movieBanner: file }));
            const reader = new FileReader();
            reader.onloadend = () => setBannerPreview(reader.result as string);
            reader.readAsDataURL(file);
        }
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

        if (movieNameChanged && !formData.movieName.trim()) { notifyFormError('Please enter movie name', setError); return; }
        if (startedDateChanged && !formData.startedDate) { notifyFormError('Please select start date', setError); return; }
        if (endedDateChanged && !formData.endedDate) { notifyFormError('Please select end date', setError); return; }
        if ((startedDateChanged || endedDateChanged) && formData.startedDate && formData.endedDate && formData.startedDate >= formData.endedDate) {
            notifyFormError('Started Date must be lower than the ended date.', setError);
            return;
        }
        if (durationChanged && (!formData.duration || parseInt(formData.duration) <= 0)) { notifyFormError('Please enter valid duration', setError); return; }
        if (formatChanged && formData.movieFormatIds.length === 0) { notifyFormError('Please select at least one format', setError); return; }
        if (requiredAgeChanged && formData.movieRequiredAgeId === '00000000-0000-0000-0000-000000000000') { notifyFormError('Please select a required age rating', setError); return; }
        if (cinemaChanged && formData.cinemaIds.length === 0) { notifyFormError('Please select at least one cinema', setError); return; }

        const submissionData: UpdateMovieFormData = {};
        if (requiredAgeChanged) submissionData.movieRequiredAgeId = formData.movieRequiredAgeId;
        if (movieNameChanged) submissionData.movieName = formData.movieName.trim();
        if (descriptionChanged) submissionData.movieDescription = formData.movieDescription.trim();
        if (formData.movieImage) submissionData.movieImage = formData.movieImage;
        if (formData.movieBanner) submissionData.movieBanner = formData.movieBanner;
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
            showSuccess('Movie updated successfully!');
            onSuccess();
            setTimeout(() => onClose(), 1200);
        } catch (err) {
            dismissToast(toastId);
            const message = getMovieManagerError(err, 'Failed to update movie');
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
                            <span>Movie updated successfully!</span>
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
                                    label="Upload a new poster image"
                                    onClick={() => fileInputRef.current?.click()}
                                />
                                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                            </div>
                            <div>
                                <label className="input-label">Banner Image</label>
                                <PosterUploadBox
                                    imagePreview={bannerPreview}
                                    label="Upload a new banner image"
                                    onClick={() => bannerFileInputRef.current?.click()}
                                />
                                <input ref={bannerFileInputRef} type="file" accept="image/*" onChange={handleBannerChange} className="hidden" />
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
                            <label className="input-label">Duration (minutes) <RequiredMark /></label>
                            <input type="number" name="duration" value={formData.duration} onChange={handleInputChange} className="input" placeholder="e.g. 120" min={1} />
                        </div>

                        <div>
                            <label className="input-label">Description</label>
                            <textarea name="movieDescription" value={formData.movieDescription} onChange={handleInputChange} rows={3} className="input resize-none" placeholder="Enter movie description" maxLength={200} />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <div>
                                <label className="input-label">Trailer URL</label>
                                <input type="url" name="trailerUrl" value={formData.trailerUrl} onChange={handleInputChange} className="input" placeholder="YouTube trailer URL" />
                            </div>
                            <div>
                                <label className="input-label">Director</label>
                                <input type="text" name="director" value={formData.director} onChange={handleInputChange} className="input" placeholder="Director name" />
                            </div>
                        </div>

                        <div>
                            <label className="input-label">Actors</label>
                            <input type="text" name="actors" value={formData.actors} onChange={handleInputChange} className="input" placeholder="Actors (comma separated)" />
                        </div>

                        <div>
                            <label className="input-label">Required Age <RequiredMark /></label>
                            <select name="movieRequiredAgeId" value={formData.movieRequiredAgeId} onChange={handleInputChange as any} className="input select">
                                <option value="00000000-0000-0000-0000-000000000000" disabled>Select required age rating</option>
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
                            helper="Select every screening format that this movie can use."
                            isEmpty={formats.length === 0}
                            empty="No formats available."
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
                            helper="Selected genres are highlighted and will appear on public movie cards."
                            isEmpty={genres.length === 0}
                            empty="No genres available."
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
                            helper="Only selected cinemas can schedule and sell tickets for this movie."
                            isEmpty={cinemas.length === 0}
                            empty="No cinemas available."
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
                                    onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=400'; }}
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
    const { activeCinemaId, activeCinemaName, setActiveCinemaId } = useCinema();
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
            items: [
                { id: 'dashboard', label: t('Dashboard'), icon: <LayoutDashboard size={18} /> },
                { id: 'movies', label: t('Movies'), icon: <Film size={18} /> },
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
