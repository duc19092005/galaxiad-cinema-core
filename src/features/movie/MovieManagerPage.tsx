// src/features/movie/MovieManagerPage.tsx
// Complete redesign with dark cinema theme - keeps all business logic

import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    User as UserIcon,
    LogOut,
    UserCircle,
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
    Menu,
    ChevronDown,
    LayoutDashboard,
    DollarSign,
    Ticket,
    TrendingUp,
    Building2,
} from 'lucide-react';
import { movieApi } from '../../api/movieApi';
import axios from 'axios';
import { showSuccess, showError } from '../../utils/ToastUtils';
import { authApi } from '../../api/authApi';
import type { ApiErrorResponse } from '../../types/auth.types';
import type { Movie, MovieRequiredAge, MovieGenre } from '../../types/movie.types';
import type { MovieFormat, Cinema } from '../../types/facilities.types';
import { facilitiesApi } from '../../api/facilitiesApi';
import LogoutModal from '../../components/LogoutModal';
import { useTranslation } from 'react-i18next';
import Cookies from 'js-cookie';
import { publicApi } from '../../api/publicApi';
import AssignRightsModal from '../admin/components/AssignRightsModal';
import ManagementDashboard from '../../components/ManagementDashboard';
import AppSidebar, { SidebarSection } from '../../components/AppSidebar';
import Header from '../../components/Header';
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
    if (!isOpen) return null;

    const formatDate = formatVietnamDate;

    return (
        <div className="modal-overlay" style={{ zIndex: 70 }}>
            <div className="modal-content" style={{ maxWidth: 672 }} onClick={e => e.stopPropagation()}>
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

const CreateMovieModal: React.FC<CreateMovieModalProps> = ({ isOpen, onClose, onSuccess, formats, requiredAges, genres, cinemas }) => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({
        movieName: '',
        movieDescription: '',
        movieImage: null as File | null,
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
        setLoading(true);

        try {
            if (!formData.movieName.trim()) { setError('Please enter movie name'); setLoading(false); return; }
            if (!formData.movieImage) { setError('Please select a movie poster image'); setLoading(false); return; }
            if (!formData.startedDate) { setError('Please select start date'); setLoading(false); return; }
            if (!formData.endedDate) { setError('Please select end date'); setLoading(false); return; }
            if (!formData.duration || parseInt(formData.duration) <= 0) { setError('Please enter valid duration'); setLoading(false); return; }
            if (formData.movieFormatIds.length === 0) { setError('Please select at least one format'); setLoading(false); return; }
            if (formData.movieRequiredAgeId === '00000000-0000-0000-0000-000000000000') { setError('Please select a required age rating'); setLoading(false); return; }
            if (formData.cinemaIds.length === 0) { setError('Please select at least one cinema'); setLoading(false); return; }

            const submissionData = {
                movieRequiredAgeId: formData.movieRequiredAgeId,
                movieName: formData.movieName.trim(),
                movieDescription: formData.movieDescription.trim(),
                movieImage: formData.movieImage,
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
            setSuccess(true);
            onSuccess();
            setTimeout(() => onClose(), 1200);
        } catch (err) {
            if (axios.isAxiosError(err) && err.response) {
                const data = err.response.data as ApiErrorResponse;
                setError(data.errors?.join(', ') || data.message || 'Failed to create movie');
            } else {
                setError('Unable to connect to server');
            }
        } finally { setLoading(false); }
    };

    return (
        <div className="modal-overlay" style={{ zIndex: 70 }}>
            <div className="modal-content" style={{ maxWidth: 672 }} onClick={e => e.stopPropagation()}>
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
                            <label className="input-label">Movie Name <span style={{ color: 'var(--danger)' }}>*</span></label>
                            <input type="text" name="movieName" value={formData.movieName} onChange={handleInputChange} className="input" placeholder="Enter movie name" maxLength={50} />
                        </div>

                        <div>
                            <label className="input-label">Poster Image <span style={{ color: 'var(--danger)' }}>*</span></label>
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="upload-zone"
                            >
                                {imagePreview ? (
                                    <img src={imagePreview} alt="Preview" className="w-[80%] max-w-[200px] h-48 object-contain object-center rounded-lg mx-auto" />
                                ) : (
                                    <>
                                        <Image size={40} style={{ color: 'var(--text-muted)', marginBottom: 8 }} />
                                        <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Click to upload poster image</p>
                                    </>
                                )}
                            </div>
                            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <div>
                                <label className="input-label">Start Date <span style={{ color: 'var(--danger)' }}>*</span></label>
                                <input type="datetime-local" name="startedDate" value={formData.startedDate} onChange={handleInputChange} className="input" />
                            </div>
                            <div>
                                <label className="input-label">End Date <span style={{ color: 'var(--danger)' }}>*</span></label>
                                <input type="datetime-local" name="endedDate" value={formData.endedDate} onChange={handleInputChange} className="input" />
                            </div>
                        </div>

                        <div>
                            <label className="input-label">Duration (minutes) <span style={{ color: 'var(--danger)' }}>*</span></label>
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
                            <label className="input-label">Required Age <span style={{ color: 'var(--danger)' }}>*</span></label>
                            <select name="movieRequiredAgeId" value={formData.movieRequiredAgeId} onChange={handleInputChange as any} className="input select">
                                <option value="00000000-0000-0000-0000-000000000000" disabled>Select required age rating</option>
                                {requiredAges.map((age: MovieRequiredAge) => (
                                    <option key={age.movieRequiredAgeSymbolId} value={age.movieRequiredAgeSymbolId} title={age.movieRequiredAgeDescription}>
                                        {age.movieRequiredAgeSymbol} - {age.movieRequiredAgeDescription}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="input-label">Visual Formats <span style={{ color: 'var(--danger)' }}>*</span></label>
                            <div className="flex flex-wrap gap-2">
                                {formats.map((f: MovieFormat) => (
                                    <button
                                        key={f.formatId} type="button"
                                        onClick={() => handleFormatToggle(f.formatId)}
                                        className={`chip ${formData.movieFormatIds.includes(f.formatId) ? 'chip-active' : ''}`}
                                    >
                                        {f.formatName}
                                    </button>
                                ))}
                                {formats.length === 0 && <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>No formats available.</p>}
                            </div>
                        </div>

                        <div>
                            <label className="input-label">Genres</label>
                            <div className="flex flex-wrap gap-2">
                                {genres.map((g: MovieGenre) => (
                                    <button
                                        key={g.movieGenreId} type="button"
                                        onClick={() => handleGenreToggle(g.movieGenreId)}
                                        className={`chip ${formData.movieGenreIds.includes(g.movieGenreId) ? 'chip-active' : ''}`}
                                    >
                                        {g.movieGenreName}
                                    </button>
                                ))}
                                {genres.length === 0 && <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>No genres available.</p>}
                            </div>
                        </div>

                        <div>
                            <label className="input-label">Authorized Cinemas <span style={{ color: 'var(--danger)' }}>*</span></label>
                            <div className="flex flex-wrap gap-2">
                                {cinemas.map((c: Cinema) => (
                                    <button
                                        key={c.cinemaId} type="button"
                                        onClick={() => handleCinemaToggle(c.cinemaId)}
                                        className={`chip ${formData.cinemaIds.includes(c.cinemaId) ? 'chip-active' : ''}`}
                                    >
                                        {c.cinemaName}
                                    </button>
                                ))}
                                {cinemas.length === 0 && <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>No cinemas available.</p>}
                            </div>
                        </div>

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
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);

    const formatDateForInput = toVietnamDateTimeLocalValue;
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(movie.movieImageUrl);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({
        movieName: movie.movieName,
        movieDescription: movie.movieDescriptions,
        movieImage: null as File | null,
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
        setLoading(true);
        try {
            if (!formData.movieName.trim()) { setError('Please enter movie name'); setLoading(false); return; }
            if (!formData.startedDate) { setError('Please select start date'); setLoading(false); return; }
            if (!formData.endedDate) { setError('Please select end date'); setLoading(false); return; }
            if (!formData.duration || parseInt(formData.duration) <= 0) { setError('Please enter valid duration'); setLoading(false); return; }
            if (formData.movieFormatIds.length === 0) { setError('Please select at least one format'); setLoading(false); return; }

            const submissionData = {
                movieId: movie.movieId,
                movieRequiredAgeId: formData.movieRequiredAgeId,
                movieName: formData.movieName.trim(),
                movieDescription: formData.movieDescription.trim(),
                movieImage: formData.movieImage || undefined,
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

            await movieApi.updateMovie(submissionData);
            setSuccess(true);
            onSuccess();
            setTimeout(() => onClose(), 1200);
        } catch (err) {
            if (axios.isAxiosError(err) && err.response) {
                const data = err.response.data as ApiErrorResponse;
                setError(data.errors?.join(', ') || data.message || 'Failed to update movie');
            } else { setError('Unable to connect to server'); }
        } finally { setLoading(false); }
    };

    return (
        <div className="modal-overlay" style={{ zIndex: 70 }}>
            <div className="modal-content" style={{ maxWidth: 672 }} onClick={e => e.stopPropagation()}>
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
                            <label className="input-label">Movie Name <span style={{ color: 'var(--danger)' }}>*</span></label>
                            <input type="text" name="movieName" value={formData.movieName} onChange={handleInputChange} className="input" placeholder="Enter movie name" maxLength={50} />
                        </div>

                        <div>
                            <label className="input-label">Poster Image</label>
                            <div onClick={() => fileInputRef.current?.click()} className="upload-zone">
                                {imagePreview ? (
                                    <img src={imagePreview} alt="Preview" className="w-[80%] max-w-[200px] h-48 object-contain object-center rounded-lg mx-auto" />
                                ) : (
                                    <>
                                        <Image size={40} style={{ color: 'var(--text-muted)', marginBottom: 8 }} />
                                        <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Click to change poster image</p>
                                    </>
                                )}
                            </div>
                            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <div>
                                <label className="input-label">Start Date <span style={{ color: 'var(--danger)' }}>*</span></label>
                                <input type="datetime-local" name="startedDate" value={formData.startedDate} onChange={handleInputChange} className="input" />
                            </div>
                            <div>
                                <label className="input-label">End Date <span style={{ color: 'var(--danger)' }}>*</span></label>
                                <input type="datetime-local" name="endedDate" value={formData.endedDate} onChange={handleInputChange} className="input" />
                            </div>
                        </div>

                        <div>
                            <label className="input-label">Duration (minutes) <span style={{ color: 'var(--danger)' }}>*</span></label>
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
                            <label className="input-label">Required Age <span style={{ color: 'var(--danger)' }}>*</span></label>
                            <select name="movieRequiredAgeId" value={formData.movieRequiredAgeId} onChange={handleInputChange as any} className="input select">
                                <option value="00000000-0000-0000-0000-000000000000" disabled>Select required age rating</option>
                                {requiredAges.map((age: MovieRequiredAge) => (
                                    <option key={age.movieRequiredAgeSymbolId} value={age.movieRequiredAgeSymbolId} title={age.movieRequiredAgeDescription}>
                                        {age.movieRequiredAgeSymbol} - {age.movieRequiredAgeDescription}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="input-label">Visual Formats <span style={{ color: 'var(--danger)' }}>*</span></label>
                            <div className="flex flex-wrap gap-2">
                                {formats.map((f: MovieFormat) => (
                                    <button key={f.formatId} type="button" onClick={() => handleFormatToggle(f.formatId)}
                                        className={`chip ${formData.movieFormatIds.includes(f.formatId) ? 'chip-active' : ''}`}>
                                        {f.formatName}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="input-label">Genres</label>
                            <div className="flex flex-wrap gap-2">
                                {genres.map((g: MovieGenre) => (
                                    <button key={g.movieGenreId} type="button" onClick={() => handleGenreToggle(g.movieGenreId)}
                                        className={`chip ${formData.movieGenreIds.includes(g.movieGenreId) ? 'chip-active' : ''}`}>
                                        {g.movieGenreName}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="input-label">Authorized Cinemas <span style={{ color: 'var(--danger)' }}>*</span></label>
                            <div className="flex flex-wrap gap-2">
                                {cinemas.map((c: Cinema) => (
                                    <button key={c.cinemaId} type="button" onClick={() => handleCinemaToggle(c.cinemaId)}
                                        className={`chip ${formData.cinemaIds.includes(c.cinemaId) ? 'chip-active' : ''}`}>
                                        {c.cinemaName}
                                    </button>
                                ))}
                            </div>
                        </div>

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
                                    {formatDate(movie.startedDate)} — {formatDate(movie.endedDate)}
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
    const [error, setError] = useState<string | null>(null);
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
    const isAdmin = user?.roles?.includes('Admin');

    const handleDeleteMovie = async (movie: Movie) => {
        if (!window.confirm(`Are you sure you want to delete movie "${movie.movieName}"?`)) return;
        try {
            await movieApi.deleteMovie(movie.movieId!);
            showSuccess(t('toast.deleteMovieSuccess'));
            fetchMovies();
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Không thể xóa phim này';
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
            fetchMovies();
            fetchFormats();
            fetchRequiredAges();
            fetchGenres();
            fetchCinemas();
        } catch { navigate('/login'); }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [navigate]);

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
                onToggle={() => setSidebarOpen(!sidebarOpen)}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                sections={sidebarSections}
                role="Movie Manager"
            />

            <Header
                title={t('Movie Manager')}
                role="Movie Manager"
                showSidebarToggle
                onMenuToggle={() => setSidebarOpen(true)}
            />

            <main className="main-content">
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
