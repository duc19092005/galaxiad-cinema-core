import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertCircle, CheckCircle, Loader2, Plus, X } from 'lucide-react';
import { movieApi } from '../../../api/movieApi';
import { dismissToast, showError, showLoading, showSuccess } from '../../../utils/ToastUtils';
import { vietnamDateTimeLocalToOffsetString } from '../../../utils/dateTimeUtils';
import type { Cinema, MovieFormat } from '../../../types/facilities.types';
import type { MovieGenre, MovieRequiredAge } from '../../../types/movie.types';
import {
    ChoiceGroup,
    ExternalMoviePeoplePicker,
    PosterUploadBox,
    RequiredMark,
    SelectableOption,
    getMovieManagerError,
    notifyFormError,
} from './MovieFormControls';

export interface CreateMovieModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    formats: MovieFormat[];
    requiredAges: MovieRequiredAge[];
    genres: MovieGenre[];
    cinemas: Cinema[];
}

export const CreateMovieModal: React.FC<CreateMovieModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    formats,
    requiredAges,
    genres,
    cinemas,
}) => {
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
