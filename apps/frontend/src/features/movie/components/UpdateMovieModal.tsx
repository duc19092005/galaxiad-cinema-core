import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertCircle, CheckCircle, Edit, Loader2, X } from 'lucide-react';
import { movieApi } from '../../../api/movieApi';
import { dismissToast, showError, showLoading, showSuccess } from '../../../utils/ToastUtils';
import { toVietnamDateTimeLocalValue, vietnamDateTimeLocalToOffsetString } from '../../../utils/dateTimeUtils';
import type { Cinema, MovieFormat } from '../../../types/facilities.types';
import type {
    Movie,
    MovieCoverImage,
    MovieGenre,
    MovieRequiredAge,
    UpdateMovieFormData,
} from '../../../types/movie.types';
import {
    ChoiceGroup,
    ExternalMoviePeoplePicker,
    PosterUploadBox,
    RequiredMark,
    SelectableOption,
    getMovieManagerError,
    notifyFormError,
    sameStringSet,
} from './MovieFormControls';

export interface UpdateMovieModalProps {
    movie: Movie;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    formats: MovieFormat[];
    requiredAges: MovieRequiredAge[];
    genres: MovieGenre[];
    cinemas: Cinema[];
}

export const UpdateMovieModal: React.FC<UpdateMovieModalProps> = ({
    movie,
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
        movieRequiredAgeId:
            movie.movieRequiredAgeId
            || requiredAges.find((a: MovieRequiredAge) => a.movieRequiredAgeSymbol === movie.movieRequiredAgeSymbol)?.movieRequiredAgeSymbolId
            || '00000000-0000-0000-0000-000000000000',
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
