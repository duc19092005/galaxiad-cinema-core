// src/features/movie/MovieManagerPage.tsx
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    User,
    ChevronDown,
    LogOut,
    Settings,
    UserCircle,
    AlertCircle,
    Sun,
    Moon,
    Sparkles,
    ArrowLeftRight,
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
    Clapperboard,
    Trash2,
} from 'lucide-react';
import { movieApi } from '../../api/movieApi';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { authApi } from '../../api/authApi';
import type { ApiErrorResponse } from '../../types/auth.types';
import type { Movie, MovieRequiredAge, MovieGenre } from '../../types/movie.types';
import type { MovieFormat } from '../../types/facilities.types';
import { useTheme } from '../../contexts/ThemeContext';
import LogoutModal from '../../components/LogoutModal';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../../components/LanguageSwitcher';

// =============================================
// SIDEBAR COMPONENT
// =============================================

interface SidebarProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
    isOpen: boolean;
    onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange, isOpen, onToggle }) => {
    const { theme } = useTheme();
    const navigate = useNavigate();

    const menuItems = [
        { id: 'movies', label: 'Movies', icon: Film },
    ];

    return (
        <>
            {/* Mobile hamburger */}
            <button
                onClick={onToggle}
                className={`lg:hidden fixed top-4 left-4 z-[60] p-2 rounded-lg ${theme === 'dark' ? 'bg-gray-800 text-white' : theme === 'modern' ? 'bg-[#0E0A20] text-white' : 'bg-white text-gray-900 shadow'
                    }`}
            >
                <div className="w-5 h-5 flex flex-col justify-center gap-1">
                    <span className={`block h-0.5 w-full ${theme === 'dark' || theme === 'modern' ? 'bg-white' : 'bg-gray-900'} transition-transform ${isOpen ? 'rotate-45 translate-y-1.5' : ''}`} />
                    <span className={`block h-0.5 w-full ${theme === 'dark' || theme === 'modern' ? 'bg-white' : 'bg-gray-900'} transition-opacity ${isOpen ? 'opacity-0' : ''}`} />
                    <span className={`block h-0.5 w-full ${theme === 'dark' || theme === 'modern' ? 'bg-white' : 'bg-gray-900'} transition-transform ${isOpen ? '-rotate-45 -translate-y-1.5' : ''}`} />
                </div>
            </button>

            {/* Overlay */}
            {isOpen && (
                <div className="lg:hidden fixed inset-0 bg-black/60 z-40" onClick={onToggle} />
            )}

            {/* Sidebar */}
            <aside className={`fixed top-0 left-0 h-full w-64 z-50 border-r transition-transform duration-300 lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'
                } ${theme === 'dark'
                    ? 'bg-gray-950 border-gray-800'
                    : theme === 'modern'
                        ? 'bg-[#0E0A20] border-indigo-500/30 shadow-sm shadow-indigo-500/10'
                        : 'bg-white border-gray-200'
                }`}>
                {/* Logo */}
                <div className={`h-16 flex items-center px-6 border-b ${theme === 'dark' ? 'border-gray-800' : theme === 'modern' ? 'border-indigo-500/30 shadow-sm shadow-indigo-500/10' : 'border-gray-200'
                    }`}>
                    <div
                        className="flex items-center gap-2 cursor-pointer"
                        onClick={() => navigate('/home')}
                    >
                        <Clapperboard className={`w-7 h-7 ${theme === 'modern' ? 'text-cyan-400' : 'text-red-600'}`} />
                        <span className={`text-xl font-black tracking-wider ${theme === 'modern'
                            ? 'text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-pink-300 to-rose-300 drop-shadow-sm'
                            : 'text-red-600'
                            }`}>
                            CINEMA<span className={theme === 'dark' || theme === 'modern' ? 'text-white' : 'text-gray-900'}>PRO</span>
                        </span>
                    </div>
                </div>

                {/* Role badge */}
                <div className={`px-6 py-4 border-b ${theme === 'dark' ? 'border-gray-800' : theme === 'modern' ? 'border-indigo-500/30 shadow-sm shadow-indigo-500/10' : 'border-gray-200'
                    }`}>
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider ${theme === 'modern'
                        ? 'bg-gradient-to-r from-[#1E293B] to-[#0F172A] text-cyan-400 border border-slate-700'
                        : 'bg-red-600/10 text-red-500'
                        }`}>
                        <Film className="w-4 h-4" />
                        Movie Manager
                    </div>
                </div>

                {/* Menu */}
                <nav className="p-4 space-y-1">
                    {menuItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => { onTabChange(item.id); onToggle(); }}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all ${activeTab === item.id
                                ? theme === 'modern'
                                    ? 'bg-cyan-900/20 text-cyan-400 border border-cyan-500/50 shadow-[inset_0_0_20px_rgba(6,182,212,0.1),0_0_15px_rgba(6,182,212,0.2)]'
                                    : 'bg-red-600 text-white shadow-lg shadow-red-600/20'
                                : theme === 'dark'
                                    ? 'text-gray-400 hover:bg-gray-800 hover:text-white'
                                    : theme === 'modern'
                                        ? 'text-white font-medium hover:bg-[#15102B]/60 hover:text-white'
                                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                }`}
                        >
                            <item.icon className="w-5 h-5" />
                            {item.label}
                        </button>
                    ))}
                </nav>
            </aside>
        </>
    );
};

// =============================================
// MOVIE DETAIL MODAL
// =============================================

interface MovieDetailModalProps {
    movie: Movie;
    isOpen: boolean;
    onClose: () => void;
}

const MovieDetailModal: React.FC<MovieDetailModalProps> = ({ movie, isOpen, onClose }) => {
    const { theme } = useTheme();

    if (!isOpen) return null;

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('vi-VN', {
            day: '2-digit', month: '2-digit', year: 'numeric'
        });
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
            <div className={`relative w-full max-w-3xl max-h-[90vh] rounded-2xl border shadow-2xl overflow-hidden flex flex-col ${theme === 'dark'
                ? 'bg-gray-900 border-gray-800'
                : theme === 'modern'
                    ? 'bg-[#15102B]/95 border-indigo-500/30 shadow-sm shadow-indigo-500/10 backdrop-blur-2xl'
                    : 'bg-white border-gray-200'
                }`} onClick={(e) => e.stopPropagation()}>
                {/* Movie Image Banner */}
                <div className="relative h-48 sm:h-64 overflow-hidden bg-black/40">
                    <img
                        src={movie.movieImageUrl || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800'}
                        alt={movie.movieName}
                        className="w-full h-full object-contain object-center"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 rounded-full bg-black/50 hover:bg-black/80 text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    <div className="absolute bottom-4 left-6 right-6">
                        <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">{movie.movieName}</h2>
                        <div className="flex flex-wrap gap-2">
                            {movie.movieGenresInfos.map((genre, i) => (
                                <span key={i} className="px-2 py-1 rounded-full text-xs font-semibold bg-red-600/80 text-white">
                                    {genre}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Info Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-gray-800/50 border-gray-700' : theme === 'modern' ? 'bg-[#15102B]/60 border-indigo-500/20' : 'bg-gray-50 border-gray-200'
                            }`}>
                            <div className={`flex items-center gap-2 text-xs font-semibold mb-1 ${theme === 'dark' ? 'text-gray-400' : theme === 'modern' ? 'text-white font-medium' : 'text-gray-500'}`}>
                                <Clock className="w-3.5 h-3.5" /> Duration
                            </div>
                            <p className={`text-lg font-bold ${theme === 'dark' || theme === 'modern' ? 'text-white' : 'text-gray-900'}`}>
                                {movie.duration} min
                            </p>
                        </div>
                        <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-gray-800/50 border-gray-700' : theme === 'modern' ? 'bg-[#15102B]/60 border-indigo-500/20' : 'bg-gray-50 border-gray-200'
                            }`}>
                            <div className={`flex items-center gap-2 text-xs font-semibold mb-1 ${theme === 'dark' ? 'text-gray-400' : theme === 'modern' ? 'text-white font-medium' : 'text-gray-500'}`}>
                                <Calendar className="w-3.5 h-3.5" /> Start Date
                            </div>
                            <p className={`text-lg font-bold ${theme === 'dark' || theme === 'modern' ? 'text-white' : 'text-gray-900'}`}>
                                {formatDate(movie.startedDate)}
                            </p>
                        </div>
                        <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-gray-800/50 border-gray-700' : theme === 'modern' ? 'bg-[#15102B]/60 border-indigo-500/20' : 'bg-gray-50 border-gray-200'
                            }`}>
                            <div className={`flex items-center gap-2 text-xs font-semibold mb-1 ${theme === 'dark' ? 'text-gray-400' : theme === 'modern' ? 'text-white font-medium' : 'text-gray-500'}`}>
                                <Calendar className="w-3.5 h-3.5" /> End Date
                            </div>
                            <p className={`text-lg font-bold ${theme === 'dark' || theme === 'modern' ? 'text-white' : 'text-gray-900'}`}>
                                {formatDate(movie.endedDate)}
                            </p>
                        </div>
                        <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-gray-800/50 border-gray-700' : theme === 'modern' ? 'bg-[#15102B]/60 border-indigo-500/20' : 'bg-gray-50 border-gray-200'
                            }`}>
                            <div className={`flex items-center gap-2 text-xs font-semibold mb-1 ${theme === 'dark' ? 'text-gray-400' : theme === 'modern' ? 'text-white font-medium' : 'text-gray-500'}`}>
                                <Tag className="w-3.5 h-3.5" /> Formats
                            </div>
                            <div className="flex flex-wrap gap-1">
                                {movie.movieVisualFormatInfos.map((f, i) => (
                                    <span key={i} className={`px-2 py-0.5 rounded text-xs font-semibold ${theme === 'modern' ? 'bg-cyan-600/30 text-cyan-400 drop-shadow-md' : 'bg-red-600/20 text-red-400'
                                        }`}>{f}</span>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {/* Description */}
                        <div>
                            <h3 className={`text-sm font-bold uppercase tracking-wider mb-2 ${theme === 'dark' ? 'text-gray-400' : theme === 'modern' ? 'text-white font-medium' : 'text-gray-500'
                                }`}>Description</h3>
                            <p className={`text-sm leading-relaxed ${theme === 'dark' ? 'text-gray-300' : theme === 'modern' ? 'text-indigo-100 ' : 'text-gray-700'
                                }`}>
                                {movie.movieDescriptions || 'No description available.'}
                            </p>
                        </div>

                        {(movie.director || movie.actors) && (
                            <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-gray-800/50 border-gray-700' : theme === 'modern' ? 'bg-[#15102B]/60 border-indigo-500/20' : 'bg-gray-50 border-gray-200'
                                }`}>
                                {movie.director && (
                                    <div className="mb-2">
                                        <h3 className={`text-xs font-bold uppercase tracking-wider mb-1 ${theme === 'dark' ? 'text-gray-400' : theme === 'modern' ? 'text-white font-medium' : 'text-gray-500'
                                            }`}>Director</h3>
                                        <p className={`text-sm ${theme === 'dark' || theme === 'modern' ? 'text-white' : 'text-gray-900'}`}>{movie.director}</p>
                                    </div>
                                )}
                                {movie.actors && (
                                    <div>
                                        <h3 className={`text-xs font-bold uppercase tracking-wider mb-1 ${theme === 'dark' ? 'text-gray-400' : theme === 'modern' ? 'text-white font-medium' : 'text-gray-500'
                                            }`}>Actors</h3>
                                        <p className={`text-sm ${theme === 'dark' || theme === 'modern' ? 'text-white' : 'text-gray-900'}`}>{movie.actors}</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {movie.trailerUrl && (
                            <div>
                                <h3 className={`text-sm font-bold uppercase tracking-wider mb-2 ${theme === 'dark' ? 'text-gray-400' : theme === 'modern' ? 'text-white font-medium' : 'text-gray-500'
                                    }`}>Trailer</h3>
                                <a href={movie.trailerUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-blue-500 hover:underline">
                                    Watch Trailer on YouTube
                                </a>
                            </div>
                        )}
                    </div>

                    {/* Metadata */}
                    <div className={`text-xs space-y-1 pt-4 border-t ${theme === 'dark' ? 'border-gray-800 text-gray-500' : theme === 'modern' ? 'border-indigo-500/30 shadow-sm shadow-indigo-500/10 text-cyan-400' : 'border-gray-200 text-gray-400'
                        }`}>
                        <p>Created by: {movie.createdBy} • {formatDate(movie.createdAt)}</p>
                        <p>Updated by: {movie.updatedBy} • {formatDate(movie.updatedAt)}</p>
                    </div>
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
}

const CreateMovieModal: React.FC<CreateMovieModalProps> = ({ isOpen, onClose, onSuccess, formats, requiredAges, genres }) => {
    const { theme } = useTheme();
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
        movieRequiredAgeId: '00000000-0000-0000-0000-000000000000', // Default placeholder
        trailerUrl: '',
        director: '',
        actors: '',
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
                ? prev.movieFormatIds.filter((id: string) => id !== formatId)
                : [...prev.movieFormatIds, formatId],
        }));
    };

    const handleGenreToggle = (genreId: string) => {
        setFormData(prev => ({
            ...prev,
            movieGenreIds: prev.movieGenreIds.includes(genreId)
                ? prev.movieGenreIds.filter((id: string) => id !== genreId)
                : [...prev.movieGenreIds, genreId],
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

            const submissionData = {
                movieRequiredAgeId: formData.movieRequiredAgeId,
                movieName: formData.movieName.trim(),
                movieDescription: formData.movieDescription.trim(),
                movieImage: formData.movieImage,
                startedDate: formData.startedDate, // Send local string as-is
                endedDate: formData.endedDate,     // Send local string as-is
                duration: parseInt(formData.duration),
                movieFormatIds: formData.movieFormatIds,
                movieGenreIds: formData.movieGenreIds,
                trailerUrl: formData.trailerUrl.trim() || undefined,
                director: formData.director.trim() || undefined,
                actors: formData.actors.trim() || undefined,
            };

            console.log("DEBUG: Creating Movie -> Sending Local Time:", {
                UI_Started: formData.startedDate,
                UI_Ended: formData.endedDate
            });

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
        } finally {
            setLoading(false);
        }
    };

    const inputClass = `w-full px-4 py-3 border rounded-lg focus:outline-none transition-colors ${theme === 'modern' ? 'focus:border-cyan-300 shadow-md shadow-cyan-500/20' : 'focus:border-red-600'
        } ${theme === 'dark'
            ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
            : theme === 'modern'
                ? 'bg-[#15102B]/60 border-indigo-500/30 shadow-sm shadow-indigo-500/10 text-white placeholder-slate-500'
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
        }`;

    const labelClass = `block text-sm font-semibold mb-2 ${theme === 'dark' || theme === 'modern' ? 'text-white' : 'text-gray-900'
        }`;

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className={`relative w-full max-w-2xl max-h-[90vh] rounded-xl border shadow-2xl flex flex-col ${theme === 'dark'
                ? 'bg-gray-900 border-gray-800'
                : theme === 'modern'
                    ? 'bg-[#15102B]/95 border-indigo-500/30 shadow-sm shadow-indigo-500/10 backdrop-blur-2xl'
                    : 'bg-white border-gray-200'
                }`} onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className={`flex items-center justify-between p-6 border-b ${theme === 'dark' ? 'border-gray-800' : theme === 'modern' ? 'border-indigo-500/30 shadow-sm shadow-indigo-500/10' : 'border-gray-200'
                    }`}>
                    <h2 className={`text-2xl font-black ${theme === 'dark' || theme === 'modern' ? 'text-white' : 'text-gray-900'}`}>
                        Add New Movie
                    </h2>
                    <button onClick={onClose} className={`p-2 rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-gray-800 text-gray-400' : theme === 'modern' ? 'hover:bg-[#15102B]/60 text-white font-medium' : 'hover:bg-gray-100 text-gray-600'
                        }`}>
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {success && (
                        <div className={`mb-4 p-4 rounded-lg border flex items-center ${theme === 'dark' || theme === 'modern' ? 'bg-green-900/40 border-green-500/50 text-green-100' : 'bg-green-50 border-green-200 text-green-800'
                            }`}>
                            <CheckCircle className="w-5 h-5 mr-3 text-green-500" />
                            <span className="text-sm font-medium">Movie added successfully!</span>
                        </div>
                    )}
                    {error && (
                        <div className={`mb-4 p-4 rounded-lg border flex items-center ${theme === 'dark' || theme === 'modern' ? 'bg-red-900/40 border-red-500/50 text-red-100' : 'bg-red-50 border-red-200 text-red-800'
                            }`}>
                            <AlertCircle className="w-5 h-5 mr-3 text-red-500" />
                            <span className="text-sm font-medium">{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Movie Name */}
                        <div>
                            <label className={labelClass}>Movie Name <span className="text-red-500">*</span></label>
                            <input type="text" name="movieName" value={formData.movieName} onChange={handleInputChange} className={inputClass} placeholder="Enter movie name" maxLength={50} />
                        </div>

                        {/* Image Upload */}
                        <div>
                            <label className={labelClass}>Poster Image <span className="text-red-500">*</span></label>
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${theme === 'dark'
                                    ? 'border-gray-700 hover:border-red-600 bg-gray-800/50'
                                    : theme === 'modern'
                                        ? 'border-indigo-500/30 shadow-sm shadow-indigo-500/10 hover:border-cyan-300 shadow-md shadow-cyan-500/20 bg-[#15102B]/40'
                                        : 'border-gray-300 hover:border-red-500 bg-gray-50'
                                    }`}
                            >
                                {imagePreview ? (
                                    <img src={imagePreview} alt="Preview" className="w-[80%] max-w-[200px] h-48 object-contain object-center rounded-lg mx-auto bg-black/20" />
                                ) : (
                                    <>
                                        <Image className={`w-12 h-12 mx-auto mb-3 ${theme === 'dark' ? 'text-gray-600' : theme === 'modern' ? 'text-cyan-400' : 'text-gray-400'}`} />
                                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : theme === 'modern' ? 'text-white font-medium' : 'text-gray-500'}`}>
                                            Click to upload poster image
                                        </p>
                                    </>
                                )}
                            </div>
                            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                        </div>

                        {/* Dates */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>Start Date <span className="text-red-500">*</span></label>
                                <input type="datetime-local" name="startedDate" value={formData.startedDate} onChange={handleInputChange} className={inputClass} />
                            </div>
                            <div>
                                <label className={labelClass}>End Date <span className="text-red-500">*</span></label>
                                <input type="datetime-local" name="endedDate" value={formData.endedDate} onChange={handleInputChange} className={inputClass} />
                            </div>
                        </div>

                        {/* Duration */}
                        <div>
                            <label className={labelClass}>Duration (minutes) <span className="text-red-500">*</span></label>
                            <input type="number" name="duration" value={formData.duration} onChange={handleInputChange} className={inputClass} placeholder="e.g. 120" min={1} />
                        </div>

                        {/* Description */}
                        <div>
                            <label className={labelClass}>Description</label>
                            <textarea name="movieDescription" value={formData.movieDescription} onChange={handleInputChange} rows={3} className={`${inputClass} resize-none`} placeholder="Enter movie description" maxLength={200} />
                        </div>

                        {/* Additional Info */}
                        <div>
                            <label className={labelClass}>Trailer URL</label>
                            <input type="url" name="trailerUrl" value={formData.trailerUrl} onChange={handleInputChange} className={inputClass} placeholder="Enter YouTube trailer URL" />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>Director</label>
                                <input type="text" name="director" value={formData.director} onChange={handleInputChange} className={inputClass} placeholder="Enter director name" />
                            </div>
                            <div>
                                <label className={labelClass}>Actors</label>
                                <input type="text" name="actors" value={formData.actors} onChange={handleInputChange} className={inputClass} placeholder="Enter actors (comma separated)" />
                            </div>
                        </div>

                        {/* Required Age */}
                        <div>
                            <label className={labelClass}>Required Age <span className="text-red-500">*</span></label>
                            <select name="movieRequiredAgeId" value={formData.movieRequiredAgeId} onChange={handleInputChange as any} className={inputClass}>
                                <option value="00000000-0000-0000-0000-000000000000" disabled>Select required age rating</option>
                                {requiredAges.map((age: MovieRequiredAge) => (
                                    <option key={age.movieRequiredAgeSymbolId} value={age.movieRequiredAgeSymbolId} title={age.movieRequiredAgeDescription}>
                                        {age.movieRequiredAgeSymbol} - {age.movieRequiredAgeDescription}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Movie Formats */}
                        <div>
                            <label className={labelClass}>Visual Formats <span className="text-red-500">*</span></label>
                            <div className="flex flex-wrap gap-2">
                                {formats.map((f: MovieFormat) => (
                                    <button
                                        key={f.formatId}
                                        type="button"
                                        onClick={() => handleFormatToggle(f.formatId)}
                                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all border ${formData.movieFormatIds.includes(f.formatId)
                                            ? theme === 'modern'
                                                ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-white border-cyan-300 shadow-md shadow-cyan-500/20'
                                                : 'bg-red-600 text-white border-red-600'
                                            : theme === 'dark'
                                                ? 'bg-gray-800 text-gray-300 border-gray-700 hover:border-red-600'
                                                : theme === 'modern'
                                                    ? 'bg-[#15102B]/60 text-white font-medium border-indigo-500/30 shadow-sm shadow-indigo-500/10 hover:border-cyan-300 shadow-md shadow-cyan-500/20'
                                                    : 'bg-gray-100 text-gray-700 border-gray-300 hover:border-red-500'
                                            }`}
                                    >
                                        {f.formatName}
                                    </button>
                                ))}
                                {formats.length === 0 && (
                                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-500' : theme === 'modern' ? 'text-cyan-400' : 'text-gray-400'}`}>
                                        No formats available. Please configure formats in Facilities Manager.
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Movie Genres */}
                        <div>
                            <label className={labelClass}>Genres</label>
                            <div className="flex flex-wrap gap-2">
                                {genres.map((g: MovieGenre) => (
                                    <button
                                        key={g.movieGenreId}
                                        type="button"
                                        onClick={() => handleGenreToggle(g.movieGenreId)}
                                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all border ${formData.movieGenreIds.includes(g.movieGenreId)
                                            ? theme === 'modern'
                                                ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white border-pink-300 shadow-md shadow-pink-500/20'
                                                : 'bg-red-600 text-white border-red-600'
                                            : theme === 'dark'
                                                ? 'bg-gray-800 text-gray-300 border-gray-700 hover:border-red-600'
                                                : theme === 'modern'
                                                    ? 'bg-[#15102B]/60 text-white font-medium border-indigo-500/30 shadow-sm shadow-indigo-500/10 hover:border-cyan-300 shadow-md shadow-cyan-500/20'
                                                    : 'bg-gray-100 text-gray-700 border-gray-300 hover:border-red-500'
                                            }`}
                                    >
                                        {g.movieGenreName}
                                    </button>
                                ))}
                                {genres.length === 0 && (
                                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-500' : theme === 'modern' ? 'text-cyan-400' : 'text-gray-400'}`}>
                                        No genres available.
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Submit */}
                        <div className="flex justify-end gap-3 pt-4">
                            <button type="button" onClick={onClose} disabled={loading} className={`px-4 py-2 rounded-lg font-semibold transition-colors ${theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : theme === 'modern' ? 'bg-[#1F173D]/60 hover:bg-[#1F173D]/50 text-white font-medium' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}>Cancel</button>
                            <button type="submit" disabled={loading} className={`px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 ${loading ? 'opacity-50 cursor-not-allowed' : ''
                                } ${theme === 'modern' ? 'bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-400 hover:to-rose-400 shadow-lg shadow-pink-500/20 text-white border border-pink-400/50' : 'bg-red-600 hover:bg-red-700 text-white'
                                }`}>
                                {loading ? (<><Loader2 className="w-4 h-4 animate-spin" /> Creating...</>) : (<><Plus className="w-4 h-4" /> Create Movie</>)}
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
}

const UpdateMovieModal: React.FC<UpdateMovieModalProps> = ({ movie, isOpen, onClose, onSuccess, formats, requiredAges, genres }) => {
    const { theme } = useTheme();
    const [loading, setLoading] = useState(false);

    // Helper to format ISO date to local YYYY-MM-DDTHH:mm ignoring Z (treating as Wall Time)
    const formatDateForInput = (dateStr: string | null | undefined) => {
        if (!dateStr) return '';
        // Strip 'Z' to prevent browser from adding timezone offset
        const wallTimeStr = dateStr.endsWith('Z') ? dateStr.slice(0, -1) : dateStr;
        const d = new Date(wallTimeStr);
        if (isNaN(d.getTime())) return '';
        
        // Use local time methods to fill the <input type="datetime-local">
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    };
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
            .filter((f: MovieFormat) => movie.movieVisualFormatInfos.includes(f.formatName))
            .map((f: MovieFormat) => f.formatId),
        movieGenreIds: genres
            .filter((g: MovieGenre) => movie.movieGenresInfos.includes(g.movieGenreName))
            .map((g: MovieGenre) => g.movieGenreId),
        movieRequiredAgeId: requiredAges.find((a: MovieRequiredAge) => movie.movieVisualFormatInfos.some((info: string) => info.includes(a.movieRequiredAgeSymbol)))?.movieRequiredAgeSymbolId || '00000000-0000-0000-0000-000000000000',
        trailerUrl: movie.trailerUrl || '',
        director: movie.director || '',
        actors: movie.actors || '',
    });

    // Re-sync if movie changes or modal opens
    useEffect(() => {
        if (!isOpen) return;
        
        console.log("DEBUG: Official Opening Modal with Movie:", movie);
        
        setFormData({
            movieName: movie.movieName,
            movieDescription: movie.movieDescriptions,
            movieImage: null as File | null,
            startedDate: formatDateForInput(movie.startedDate),
            endedDate: formatDateForInput(movie.endedDate),
            duration: movie.duration.toString(),
            movieFormatIds: formats
                .filter((f: MovieFormat) => movie.movieVisualFormatInfos.includes(f.formatName))
                .map((f: MovieFormat) => f.formatId),
            movieGenreIds: genres
                .filter((g: MovieGenre) => movie.movieGenresInfos.includes(g.movieGenreName))
                .map((g: MovieGenre) => g.movieGenreId),
            movieRequiredAgeId: requiredAges.find((a: MovieRequiredAge) => movie.movieVisualFormatInfos.some((info: string) => info.includes(a.movieRequiredAgeSymbol)))?.movieRequiredAgeSymbolId || '00000000-0000-0000-0000-000000000000',
            trailerUrl: movie.trailerUrl || '',
            director: movie.director || '',
            actors: movie.actors || '',
        });
        setImagePreview(movie.movieImageUrl);
    }, [movie, formats, requiredAges, genres, isOpen]);

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
                ? prev.movieFormatIds.filter((id: string) => id !== formatId)
                : [...prev.movieFormatIds, formatId],
        }));
    };

    const handleGenreToggle = (genreId: string) => {
        setFormData(prev => ({
            ...prev,
            movieGenreIds: prev.movieGenreIds.includes(genreId)
                ? prev.movieGenreIds.filter((id: string) => id !== genreId)
                : [...prev.movieGenreIds, genreId],
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(false);
        setLoading(true);

        try {
            if (!formData.movieName.trim()) { setError('Please enter movie name'); setLoading(false); return; }
            if (formData.duration && parseInt(formData.duration) <= 0) { setError('Please enter valid duration'); setLoading(false); return; }
            if (formData.movieFormatIds.length === 0) { setError('Please select at least one format'); setLoading(false); return; }

            const submissionData = {
                movieRequiredAgeId: formData.movieRequiredAgeId !== '00000000-0000-0000-0000-000000000000' ? formData.movieRequiredAgeId : undefined,
                movieName: formData.movieName.trim(),
                movieDescription: formData.movieDescription.trim(),
                movieImage: formData.movieImage || undefined,
                startedDate: formData.startedDate || null, // No conversion, send what user sees
                endedDate: formData.endedDate || null,
                duration: formData.duration ? parseInt(formData.duration) : undefined,
                movieFormatIds: formData.movieFormatIds,
                movieGenreIds: formData.movieGenreIds,
                trailerUrl: formData.trailerUrl.trim() || undefined,
                director: formData.director.trim() || undefined,
                actors: formData.actors.trim() || undefined,
            };

            console.log("DEBUG: Update Movie Submission Date Check:", {
                UI_Raw_Input: formData.startedDate,
                Server_Raw_Started: movie.startedDate,
                Final_Submission: submissionData.startedDate
            });

            await movieApi.updateMovie(movie.movieId!, submissionData);

            setSuccess(true);
            onSuccess();
            setTimeout(() => onClose(), 1200);
        } catch (err) {
            if (axios.isAxiosError(err) && err.response) {
                const data = err.response.data as ApiErrorResponse;
                setError(data.errors?.join(', ') || data.message || 'Failed to update movie');
            } else {
                setError('Unable to connect to server');
            }
        } finally {
            setLoading(false);
        }
    };

    const inputClass = `w-full px-4 py-3 border rounded-lg focus:outline-none transition-colors ${theme === 'modern' ? 'focus:border-cyan-300 shadow-md shadow-cyan-500/20' : 'focus:border-red-600'
        } ${theme === 'dark'
            ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
            : theme === 'modern'
                ? 'bg-[#15102B]/60 border-indigo-500/30 shadow-sm shadow-indigo-500/10 text-white placeholder-slate-500'
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
        }`;

    const labelClass = `block text-sm font-semibold mb-2 ${theme === 'dark' || theme === 'modern' ? 'text-white' : 'text-gray-900'
        }`;

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className={`relative w-full max-w-2xl max-h-[90vh] rounded-xl border shadow-2xl flex flex-col ${theme === 'dark'
                ? 'bg-gray-900 border-gray-800'
                : theme === 'modern'
                    ? 'bg-[#15102B]/95 border-indigo-500/30 shadow-sm shadow-indigo-500/10 backdrop-blur-2xl'
                    : 'bg-white border-gray-200'
                }`} onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className={`flex items-center justify-between p-6 border-b ${theme === 'dark' ? 'border-gray-800' : theme === 'modern' ? 'border-indigo-500/30 shadow-sm shadow-indigo-500/10' : 'border-gray-200'
                    }`}>
                    <h2 className={`text-2xl font-black ${theme === 'dark' || theme === 'modern' ? 'text-white' : 'text-gray-900'}`}>
                        Update Movie
                    </h2>
                    <button onClick={onClose} className={`p-2 rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-gray-800 text-gray-400' : theme === 'modern' ? 'hover:bg-[#15102B]/60 text-white font-medium' : 'hover:bg-gray-100 text-gray-600'
                        }`}>
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {success && (
                        <div className={`mb-4 p-4 rounded-lg border flex items-center ${theme === 'dark' || theme === 'modern' ? 'bg-green-900/40 border-green-500/50 text-green-100' : 'bg-green-50 border-green-200 text-green-800'
                            }`}>
                            <CheckCircle className="w-5 h-5 mr-3 text-green-500" />
                            <span className="text-sm font-medium">Movie updated successfully!</span>
                        </div>
                    )}
                    {error && (
                        <div className={`mb-4 p-4 rounded-lg border flex items-center ${theme === 'dark' || theme === 'modern' ? 'bg-red-900/40 border-red-500/50 text-red-100' : 'bg-red-50 border-red-200 text-red-800'
                            }`}>
                            <AlertCircle className="w-5 h-5 mr-3 text-red-500" />
                            <span className="text-sm font-medium">{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Movie Name */}
                        <div>
                            <label className={labelClass}>Movie Name <span className="text-red-500">*</span></label>
                            <input type="text" name="movieName" value={formData.movieName} onChange={handleInputChange} className={inputClass} placeholder="Enter movie name" maxLength={50} />
                        </div>

                        {/* Image Upload */}
                        <div>
                            <label className={labelClass}>Poster Image (Leave empty to keep current)</label>
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${theme === 'dark'
                                    ? 'border-gray-700 hover:border-red-600 bg-gray-800/50'
                                    : theme === 'modern'
                                        ? 'border-indigo-500/30 shadow-sm shadow-indigo-500/10 hover:border-cyan-300 shadow-md shadow-cyan-500/20 bg-[#15102B]/40'
                                        : 'border-gray-300 hover:border-red-500 bg-gray-50'
                                    }`}
                            >
                                {imagePreview ? (
                                    <img src={imagePreview} alt="Preview" className="w-[80%] max-w-[200px] h-48 object-contain object-center rounded-lg mx-auto bg-black/20" />
                                ) : (
                                    <>
                                        <Image className={`w-12 h-12 mx-auto mb-3 ${theme === 'dark' ? 'text-gray-600' : theme === 'modern' ? 'text-cyan-400' : 'text-gray-400'}`} />
                                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : theme === 'modern' ? 'text-white font-medium' : 'text-gray-500'}`}>
                                            Click to update poster image
                                        </p>
                                    </>
                                )}
                            </div>
                            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                        </div>

                        {/* Dates */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>Start Date</label>
                                <input type="datetime-local" name="startedDate" value={formData.startedDate} onChange={handleInputChange} className={inputClass} />
                            </div>
                            <div>
                                <label className={labelClass}>End Date</label>
                                <input type="datetime-local" name="endedDate" value={formData.endedDate} onChange={handleInputChange} className={inputClass} />
                            </div>
                        </div>

                        {/* Duration */}
                        <div>
                            <label className={labelClass}>Duration (minutes) <span className="text-red-500">*</span></label>
                            <input type="number" name="duration" value={formData.duration} onChange={handleInputChange} className={inputClass} placeholder="e.g. 120" min={1} />
                        </div>

                        {/* Description */}
                        <div>
                            <label className={labelClass}>Description</label>
                            <textarea name="movieDescription" value={formData.movieDescription} onChange={handleInputChange} rows={3} className={`${inputClass} resize-none`} placeholder="Enter movie description" maxLength={200} />
                        </div>

                        {/* Additional Info */}
                        <div>
                            <label className={labelClass}>Trailer URL</label>
                            <input type="url" name="trailerUrl" value={formData.trailerUrl} onChange={handleInputChange} className={inputClass} placeholder="Enter YouTube trailer URL" />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>Director</label>
                                <input type="text" name="director" value={formData.director} onChange={handleInputChange} className={inputClass} placeholder="Enter director name" />
                            </div>
                            <div>
                                <label className={labelClass}>Actors</label>
                                <input type="text" name="actors" value={formData.actors} onChange={handleInputChange} className={inputClass} placeholder="Enter actors (comma separated)" />
                            </div>
                        </div>

                        {/* Required Age */}
                        <div>
                            <label className={labelClass}>Required Age</label>
                            <select name="movieRequiredAgeId" value={formData.movieRequiredAgeId} onChange={handleInputChange as any} className={inputClass}>
                                <option value="00000000-0000-0000-0000-000000000000">Current Rating</option>
                                {requiredAges.map((age: MovieRequiredAge) => (
                                    <option key={age.movieRequiredAgeSymbolId} value={age.movieRequiredAgeSymbolId} title={age.movieRequiredAgeDescription}>
                                        {age.movieRequiredAgeSymbol} - {age.movieRequiredAgeDescription}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Movie Formats */}
                        <div>
                            <label className={labelClass}>Visual Formats <span className="text-red-500">*</span></label>
                            <div className="flex flex-wrap gap-2">
                                {formats.map((f: MovieFormat) => (
                                    <button
                                        key={f.formatId}
                                        type="button"
                                        onClick={() => handleFormatToggle(f.formatId)}
                                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all border ${formData.movieFormatIds.includes(f.formatId)
                                            ? theme === 'modern'
                                                ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-white border-cyan-300 shadow-md shadow-cyan-500/20'
                                                : 'bg-red-600 text-white border-red-600'
                                            : theme === 'dark'
                                                ? 'bg-gray-800 text-gray-300 border-gray-700 hover:border-red-600'
                                                : theme === 'modern'
                                                    ? 'bg-[#15102B]/60 text-white font-medium border-indigo-500/30 shadow-sm shadow-indigo-500/10 hover:border-cyan-300 shadow-md shadow-cyan-500/20'
                                                    : 'bg-gray-100 text-gray-700 border-gray-300 hover:border-red-500'
                                            }`}
                                    >
                                        {f.formatName}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Movie Genres */}
                        <div>
                            <label className={labelClass}>Genres</label>
                            <div className="flex flex-wrap gap-2">
                                {genres.map((g: MovieGenre) => (
                                    <button
                                        key={g.movieGenreId}
                                        type="button"
                                        onClick={() => handleGenreToggle(g.movieGenreId)}
                                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all border ${formData.movieGenreIds.includes(g.movieGenreId)
                                            ? theme === 'modern'
                                                ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white border-pink-300 shadow-md shadow-pink-500/20'
                                                : 'bg-red-600 text-white border-red-600'
                                            : theme === 'dark'
                                                ? 'bg-gray-800 text-gray-300 border-gray-700 hover:border-red-600'
                                                : theme === 'modern'
                                                    ? 'bg-[#15102B]/60 text-white font-medium border-indigo-500/30 shadow-sm shadow-indigo-500/10 hover:border-cyan-300 shadow-md shadow-cyan-500/20'
                                                    : 'bg-gray-100 text-gray-700 border-gray-300 hover:border-red-500'
                                            }`}
                                    >
                                        {g.movieGenreName}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Submit */}
                        <div className="flex justify-end gap-3 pt-4">
                            <button type="button" onClick={onClose} disabled={loading} className={`px-4 py-2 rounded-lg font-semibold transition-colors ${theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : theme === 'modern' ? 'bg-[#1F173D]/60 hover:bg-[#1F173D]/50 text-white font-medium' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}>Cancel</button>
                            <button type="submit" disabled={loading} className={`px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 ${loading ? 'opacity-50 cursor-not-allowed' : ''
                                } ${theme === 'modern' ? 'bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-400 hover:to-rose-400 shadow-lg shadow-pink-500/20 text-white border border-pink-400/50' : 'bg-red-600 hover:bg-red-700 text-white'
                                }`}>
                                {loading ? (<><Loader2 className="w-4 h-4 animate-spin" /> Updating...</>) : (<><Edit className="w-4 h-4" /> Save Changes</>)}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

// =============================================
// MAIN MOVIE MANAGER PAGE
// =============================================

const MovieManagerPage: React.FC = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { theme, setTheme } = useTheme();
    const [isThemeDropdownOpen, setIsThemeDropdownOpen] = useState(false);
    const themeDropdownRef = useRef<HTMLDivElement>(null);
    const [user, setUser] = useState<{ username: string; roles?: string[]; selectedRole?: string } | null>(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const [movies, setMovies] = useState<Movie[]>([]);
    const [formats, setFormats] = useState<MovieFormat[]>([]);
    const [requiredAges, setRequiredAges] = useState<MovieRequiredAge[]>([]);
    const [genres, setGenres] = useState<MovieGenre[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [logoutError, setLogoutError] = useState<string | null>(null);
    const [logoutLoading, setLogoutLoading] = useState(false);
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

    // Sidebar
    const [activeTab, setActiveTab] = useState('movies');
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Modals
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
    const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
    const [movieToUpdate, setMovieToUpdate] = useState<Movie | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

    const handleDeleteMovie = async (movie: Movie) => {
        if (!window.confirm(`Are you sure you want to delete movie "${movie.movieName}"?`)) return;
        try {
            await movieApi.deleteMovie(movie.movieId!);
            toast.success('Xóa phim thành công');
            fetchMovies();
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Không thể xóa phim này';
            toast.error(msg);
        }
    };

    useEffect(() => {
        const storedUser = localStorage.getItem('user_info');
        if (!storedUser) { navigate('/login'); return; }
        try {
            const parsed = JSON.parse(storedUser);
            const roles = parsed.roles || [];
            if (!roles.includes('MovieManager')) { navigate('/role-selection'); return; }
            setUser(parsed);
            fetchMovies();
            fetchFormats();
            fetchRequiredAges();
            fetchGenres();
        } catch { navigate('/login'); }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [navigate]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsDropdownOpen(false);
            if (themeDropdownRef.current && !themeDropdownRef.current.contains(event.target as Node)) setIsThemeDropdownOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchMovies = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await movieApi.getMovieList();
            console.log("DEBUG: API getMovieList Response ->", res.data);
            setMovies(res.data || []);
        } catch (err) {
            if (axios.isAxiosError(err) && err.response) {
                const data = err.response.data as ApiErrorResponse;
                if (data.statusCode === 401) { localStorage.removeItem('user_info'); navigate('/login'); return; }
                setError(data.message || 'Cannot load movies list.');
            } else if (axios.isAxiosError(err) && err.request) {
                setError('Cannot connect to server. Please check your network connection.');
            } else {
                setError('An unknown error occurred.');
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchFormats = async () => {
        try {
            const res = await movieApi.getMovieFormats();
            setFormats(res.data || []);
        } catch {
            /* formats are non-critical, silently ignore */
        }
    };

    const fetchRequiredAges = async () => {
        try {
            const res = await movieApi.getMovieRequiredAges();
            setRequiredAges(res.data || []);
        } catch {
            /* silently ignore */
        }
    };

    const fetchGenres = async () => {
        try {
            const res = await movieApi.getMovieGenres();
            setGenres(res.data || []);
        } catch {
            /* silently ignore */
        }
    };

    const handleLogoutClick = () => { setIsLogoutModalOpen(true); setLogoutError(null); };

    const handleLogoutConfirm = async () => {
        setLogoutError(null);
        setLogoutLoading(true);
        try {
            await authApi.logout();
            localStorage.removeItem('user_info');
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
        m.movieDescriptions.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatDate = (dateStr: string) => {
        // Strip 'Z' to display as Wall Time
        const wallTimeStr = dateStr.endsWith('Z') ? dateStr.slice(0, -1) : dateStr;
        return new Date(wallTimeStr).toLocaleDateString('vi-VN', { 
            day: '2-digit', month: '2-digit', year: 'numeric' 
        });
    };

    return (
        <div className={`min-h-screen font-sans transition-colors duration-300 ${theme === 'dark' ? 'bg-black text-white' : theme === 'modern' ? 'bg-gradient-to-br from-[#0D081D] via-[#050A14] to-[#12081C] text-white' : 'bg-gray-50 text-gray-900'
            }`}>
            <Sidebar activeTab={activeTab} onTabChange={setActiveTab} isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

            {/* HEADER */}
            <header className={`fixed top-0 left-0 right-0 lg:left-64 z-50 backdrop-blur-md border-b h-16 flex items-center justify-between px-6 shadow-lg transition-colors duration-300 ${theme === 'dark' ? 'bg-black/80 border-gray-800' : theme === 'modern' ? 'bg-[#0E0A20]/90 shadow-2xl border-indigo-500/30 shadow-sm shadow-indigo-500/10' : 'bg-white/80 border-gray-200'
                }`}>
                <div className="hidden lg:flex items-center gap-3 cursor-pointer" onClick={() => navigate('/home')}>
                    <div className={`text-2xl font-black tracking-widest uppercase ${theme === 'modern' ? 'text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-pink-300 to-rose-300 drop-shadow-sm' : 'text-red-600'
                        }`}>
                        CINEMA<span className={theme === 'dark' || theme === 'modern' ? 'text-white' : 'text-gray-900'}>PRO</span>
                    </div>
                    <span className={`text-xs border-l pl-3 ${theme === 'dark' ? 'text-gray-400 border-gray-700' : theme === 'modern' ? 'text-white font-medium border-indigo-500/30 shadow-sm shadow-indigo-500/10' : 'text-gray-600 border-gray-300'
                        }`}>Movie Manager Dashboard</span>
                </div>
                <div className="lg:hidden flex-1" />

                <div className="flex items-center gap-3">
                    <LanguageSwitcher />
                    {/* Theme Dropdown */}
                    <div className="relative" ref={themeDropdownRef}>
                        <button onClick={() => setIsThemeDropdownOpen(!isThemeDropdownOpen)} className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-gray-800 text-gray-300' : theme === 'modern' ? 'hover:bg-[#0E0A20]/30 text-white font-medium' : 'hover:bg-gray-100 text-gray-700'
                            }`}>
                            {theme === 'dark' ? <Moon className="w-5 h-5" /> : theme === 'modern' ? <Sparkles className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                            <span className="hidden sm:inline-block text-sm font-medium">{theme === 'dark' ? 'Dark' : theme === 'modern' ? 'Modern' : 'Light'}</span>
                            <ChevronDown className={`w-4 h-4 transition-transform ${isThemeDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {isThemeDropdownOpen && (
                            <div className={`absolute right-0 mt-2 w-48 rounded-xl shadow-xl overflow-hidden ${theme === 'dark' ? 'bg-gray-900 border border-gray-700' : theme === 'modern' ? 'bg-[#0E0A20]/95 border border-indigo-500/30 shadow-sm shadow-indigo-500/10 backdrop-blur-2xl' : 'bg-white border border-gray-200'} ${theme === 'modern' ? 'bg-[#0f172a]/40 backdrop-blur-2xl border-indigo-500/20' : ''}'
                                }`}>
                                {(['light', 'dark', 'modern'] as const).map((t) => (
                                    <button key={t} onClick={() => { setTheme(t); setIsThemeDropdownOpen(false); }} className={`w-full text-left px-4 py-3 text-sm flex items-center gap-3 transition-colors ${theme === t ? (theme === 'dark' ? 'bg-gray-800 text-white' : theme === 'modern' ? 'bg-[#1F173D]/60 text-white' : 'bg-gray-100 text-gray-900')
                                        : theme === 'dark' ? 'text-gray-300 hover:bg-gray-800' : theme === 'modern' ? 'text-white font-medium hover:bg-[#15102B]/60' : 'text-gray-700 hover:bg-gray-100'
                                        }`}>
                                        {t === 'light' ? <Sun className="w-4 h-4" /> : t === 'dark' ? <Moon className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                                        {t === 'light' ? 'Light Mode' : t === 'dark' ? 'Dark Mode' : 'Modern View'}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* User Menu */}
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className={`flex items-center gap-3 p-2 rounded-lg transition-colors outline-none focus:ring-2 ${theme === 'dark' ? 'hover:bg-gray-800 focus:ring-red-600/50' : theme === 'modern' ? 'hover:bg-indigo-500/10 hover:shadow-[0_0_8px_rgba(99,102,241,0.15)] focus:ring-indigo-500/50' : 'hover:bg-gray-100 focus:ring-red-600/50'
                                }`}
                        >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg ${theme === 'modern' ? 'bg-gradient-to-br from-indigo-600 to-purple-700 opacity-90 shadow-indigo-500/20' : 'bg-gradient-to-br from-red-600 to-red-800'}`}>
                                <User className="w-5 h-5 text-white" />
                            </div>
                            <span className={`hidden sm:block font-bold text-sm ${theme === 'dark' ? 'text-gray-200' : theme === 'modern' ? 'text-white' : 'text-gray-700'}`}>
                                {user?.username || 'Guest'}
                            </span>
                            <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''} ${theme === 'dark' ? 'text-gray-400' : theme === 'modern' ? 'text-white/60' : 'text-gray-600'}`} />
                        </button>

                        {isDropdownOpen && (
                            <div className={`absolute right-0 mt-2 w-56 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 ${theme === 'dark' ? 'bg-gray-900 border border-gray-700' : theme === 'modern' ? 'bg-[#0f172a]/40 backdrop-blur-2xl border border-indigo-500/20' : 'bg-white border border-gray-200'
                                }`}>
                                <div className="py-2">
                                    <div className={`px-4 py-3 border-b ${theme === 'dark' ? 'border-gray-800' : theme === 'modern' ? 'border-indigo-500/20' : 'border-gray-200'}`}>
                                        <p className={`text-xs uppercase font-bold ${theme === 'dark' ? 'text-gray-500' : theme === 'modern' ? 'text-indigo-400' : 'text-gray-400'}`}>SIGNED IN AS</p>
                                        <p className={`text-sm font-bold truncate ${theme === 'dark' || theme === 'modern' ? 'text-white' : 'text-gray-900'}`}>{user?.username}</p>
                                    </div>
                                    <button className={`w-full text-left px-4 py-3 text-sm flex items-center gap-3 transition-colors ${theme === 'dark' ? 'text-gray-300 hover:bg-gray-800 hover:text-indigo-400' : theme === 'modern' ? 'text-white hover:bg-indigo-500/20 hover:text-indigo-300 hover:drop-shadow-[0_0_3px_rgba(129,140,248,0.4)]' : 'text-gray-700 hover:bg-gray-100 hover:text-indigo-400'}`}>
                                        <UserCircle className="w-4 h-4" />{t('header.accountInfo')}
                                    </button>

                                    <button className={`w-full text-left px-4 py-3 text-sm flex items-center gap-3 transition-colors ${theme === 'dark' ? 'text-gray-300 hover:bg-gray-800 hover:text-indigo-400' : theme === 'modern' ? 'text-white hover:bg-indigo-500/20 hover:text-indigo-300 hover:drop-shadow-[0_0_3px_rgba(129,140,248,0.4)]' : 'text-gray-700 hover:bg-gray-100 hover:text-indigo-400'}`}>
                                        <Settings className="w-4 h-4" />{t('header.changePassword')}
                                    </button>

                                    {user?.roles && user.roles.length > 1 && (
                                        <button
                                            onClick={() => navigate('/role-selection')}
                                            className={`w-full text-left px-4 py-3 text-sm flex items-center gap-3 transition-colors ${theme === 'dark' ? 'text-gray-300 hover:bg-gray-800 hover:text-blue-500' : theme === 'modern' ? 'text-white hover:bg-indigo-500/20 hover:text-indigo-300 hover:drop-shadow-[0_0_3px_rgba(129,140,248,0.4)]' : 'text-gray-700 hover:bg-gray-100 hover:text-blue-600'
                                                }`}
                                        >
                                            <ArrowLeftRight className="w-4 h-4" />
                                            Switch Role
                                        </button>
                                    )}

                                    <div className={`border-t mt-1 ${theme === 'dark' ? 'border-gray-800' : theme === 'modern' ? 'border-indigo-500/20' : 'border-gray-200'}`}></div>

                                    <button
                                        onClick={handleLogoutClick}
                                        className={`w-full text-left px-4 py-3 text-sm flex items-center gap-3 transition-colors font-bold ${theme === 'dark' ? 'text-red-500 hover:bg-red-900/20 hover:drop-shadow-[0_0_4px_rgba(239,68,68,0.4)]' : theme === 'modern' ? 'text-red-400 hover:bg-red-500/20 hover:text-red-300 hover:drop-shadow-[0_0_4px_rgba(248,113,113,0.4)]' : 'text-red-600 hover:bg-red-50'
                                            }`}
                                    >
                                        <LogOut className="w-4 h-4" />
                                        Logout
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* MAIN CONTENT */}
            <main className="pt-16 lg:pl-64 min-h-screen">
                <div className="p-4 lg:p-6 container mx-auto max-w-7xl">
                    {logoutError && (
                        <div className={`mb-4 p-4 rounded-lg border flex items-center ${theme === 'dark' ? 'bg-red-900/40 border-red-500/50 text-red-100' : 'bg-red-50 border-red-200 text-red-800'
                            }`}>
                            <AlertCircle className="w-5 h-5 mr-3 text-red-500" />
                            <span className="text-sm font-medium">{logoutError}</span>
                        </div>
                    )}

                    {/* Page Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                        <div className="flex-1 min-w-0">
                            <h1 className={`text-2xl sm:text-3xl font-black mb-2 border-l-4 pl-4 ${theme === 'modern' ? 'border-cyan-300 shadow-md shadow-cyan-500/20' : 'border-red-600'
                                } ${theme === 'dark' || theme === 'modern' ? 'text-white' : 'text-gray-900'}`}>
                                Movie Management
                            </h1>
                            <p className={`text-sm sm:text-base ${theme === 'dark' ? 'text-gray-400' : theme === 'modern' ? 'text-white font-medium' : 'text-gray-600'}`}>
                                Manage all movies in the system — add, edit and track movie schedules
                            </p>
                        </div>
                        <button onClick={() => setIsCreateModalOpen(true)} className={`inline-flex items-center justify-center gap-2 px-4 py-2 text-white font-semibold rounded-lg transition-colors whitespace-nowrap ${theme === 'modern' ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-[0_0_15px_rgba(6,182,212,0.3)]' : 'bg-red-600 hover:bg-red-700'
                            }`}>
                            <Plus className="w-5 h-5" />
                            <span className="hidden sm:inline">Add New Movie</span>
                            <span className="sm:hidden">Add</span>
                        </button>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className={`mb-6 p-4 rounded-lg border flex items-center ${theme === 'dark' || theme === 'modern' ? 'bg-red-900/40 border-red-500/50 text-red-100' : 'bg-red-50 border-red-200 text-red-800'
                            }`}>
                            <AlertCircle className="w-5 h-5 mr-3 text-red-500" />
                            <span className="text-sm font-medium flex-1">{error}</span>
                            <button onClick={fetchMovies} className="ml-3 px-3 py-1 rounded text-sm font-semibold bg-red-600 hover:bg-red-700 text-white">Retry</button>
                        </div>
                    )}

                    {/* Search */}
                    <div className="relative mb-6">
                        <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${theme === 'dark' ? 'text-gray-400' : theme === 'modern' ? 'text-white font-medium' : 'text-gray-500'
                            }`} />
                        <input
                            type="text" placeholder="Search movies..." value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={`w-full pl-12 pr-4 py-3 border rounded-lg focus:outline-none transition-colors ${theme === 'modern' ? 'focus:border-cyan-300 shadow-md shadow-cyan-500/20' : 'focus:border-red-600'
                                } ${theme === 'dark' ? 'bg-gray-900 border-gray-800 text-white placeholder-gray-500'
                                    : theme === 'modern' ? 'bg-[#0E0A20]/60 border-indigo-500/30 shadow-sm shadow-indigo-500/10 text-white placeholder-slate-500 backdrop-blur-2xl'
                                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                                }`}
                        />
                    </div>

                    {/* Loading */}
                    {loading && (
                        <div className={`text-center py-12 rounded-xl border ${theme === 'dark' ? 'bg-gray-900 border-gray-800' : theme === 'modern' ? 'bg-[#15102B]/80 border border-indigo-500/40 shadow-sm shadow-indigo-500/10 border-indigo-500/30 shadow-sm shadow-indigo-500/10' : 'bg-white border-gray-200'
                            }`}>
                            <Loader2 className={`w-12 h-12 animate-spin mx-auto mb-4 ${theme === 'modern' ? 'text-cyan-400' : 'text-red-600'}`} />
                            <p className={theme === 'dark' ? 'text-gray-400' : theme === 'modern' ? 'text-white font-medium' : 'text-gray-600'}>Loading movies...</p>
                        </div>
                    )}

                    {/* Movie Cards Grid */}
                    {!loading && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-6">
                            {filteredMovies.map((movie) => (
                                <div
                                    key={movie.movieId}
                                    className={`group rounded-xl overflow-hidden border transition-all hover:-translate-y-1 cursor-pointer ${theme === 'dark'
                                        ? 'bg-gray-900 border-gray-800 hover:border-red-600'
                                        : theme === 'modern'
                                            ? 'bg-[#15102B]/80 border border-indigo-500/40 shadow-sm shadow-indigo-500/10 border-indigo-500/30 shadow-sm shadow-indigo-500/10 hover:border-cyan-300 shadow-md shadow-cyan-500/20 backdrop-blur-2xl'
                                            : 'bg-white border-gray-200 hover:border-red-600 shadow-sm'
                                        }`}
                                    onClick={() => { setSelectedMovie(movie); setIsDetailModalOpen(true); }}
                                >
                                    {/* Poster */}
                                    <div className="aspect-[2/3] relative overflow-hidden bg-black/20">
                                        <img
                                            src={movie.movieImageUrl || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=400'}
                                            alt={movie.movieName}
                                            className="w-full h-full object-contain object-center group-hover:scale-105 transition-transform duration-500"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                                        {/* Hover Actions */}
                                        <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                                            <div className="flex gap-2">
                                                <button onClick={(e) => { e.stopPropagation(); setSelectedMovie(movie); setIsDetailModalOpen(true); }} className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-white/20 backdrop-blur-md rounded-lg text-white text-[10px] font-semibold hover:bg-white/30 transition-colors">
                                                    <Eye className="w-3.5 h-3.5" /> View
                                                </button>
                                                <button onClick={(e) => { e.stopPropagation(); setMovieToUpdate(movie); setIsUpdateModalOpen(true); }} className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-600/80 backdrop-blur-md rounded-lg text-white text-[10px] font-semibold hover:bg-blue-700 transition-colors">
                                                    <Edit className="w-3.5 h-3.5" /> Edit
                                                </button>
                                                <button onClick={(e) => { e.stopPropagation(); handleDeleteMovie(movie); }} className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-600/80 backdrop-blur-md rounded-lg text-white text-[10px] font-semibold hover:bg-red-700 transition-colors">
                                                    <Trash2 className="w-3.5 h-3.5" /> Delete
                                                </button>
                                            </div>
                                        </div>

                                        {/* Duration Badge */}
                                        <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 backdrop-blur-sm rounded text-xs font-semibold text-white flex items-center gap-1">
                                            <Clock className="w-3 h-3" /> {movie.duration}m
                                        </div>

                                        {/* Format Tags */}
                                        <div className="absolute top-2 left-2 flex flex-col gap-1">
                                            {movie.movieVisualFormatInfos.slice(0, 2).map((format, i) => (
                                                <span key={i} className={`px-2 py-0.5 rounded text-[10px] font-bold ${theme === 'modern' ? 'bg-blue-600/80 text-white' : 'bg-red-600/80 text-white'
                                                    }`}>{format}</span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Info */}
                                    <div className="p-3 sm:p-4">
                                        <h3 className={`font-bold text-sm sm:text-base truncate mb-1 ${theme === 'dark' || theme === 'modern' ? 'text-white' : 'text-gray-900'
                                            }`}>{movie.movieName}</h3>
                                        <div className="flex flex-wrap gap-1 mb-2">
                                            {movie.movieGenresInfos.slice(0, 2).map((genre, i) => (
                                                <span key={i} className={`text-[10px] px-1.5 py-0.5 rounded ${theme === 'dark' ? 'bg-gray-800 text-gray-400' : theme === 'modern' ? 'bg-[#15102B]/80 text-white font-medium' : 'bg-gray-100 text-gray-600'
                                                    }`}>{genre}</span>
                                            ))}
                                        </div>
                                        <p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : theme === 'modern' ? 'text-cyan-400' : 'text-gray-500'}`}>
                                            {formatDate(movie.startedDate)} — {formatDate(movie.endedDate)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Empty State */}
                    {!loading && filteredMovies.length === 0 && (
                        <div className={`text-center py-16 rounded-xl border ${theme === 'dark' ? 'bg-gray-900 border-gray-800' : theme === 'modern' ? 'bg-[#15102B]/80 border border-indigo-500/40 shadow-sm shadow-indigo-500/10 border-indigo-500/30 shadow-sm shadow-indigo-500/10' : 'bg-white border-gray-200'
                            }`}>
                            <Film className={`w-16 h-16 mx-auto mb-4 ${theme === 'dark' ? 'text-gray-600' : theme === 'modern' ? 'text-cyan-500' : 'text-gray-400'}`} />
                            <p className={`text-lg font-semibold mb-1 ${theme === 'dark' || theme === 'modern' ? 'text-white' : 'text-gray-900'}`}>
                                {searchTerm ? 'No movies found' : 'No movies yet'}
                            </p>
                            <p className={`text-sm ${theme === 'dark' ? 'text-gray-500' : theme === 'modern' ? 'text-cyan-400' : 'text-gray-400'}`}>
                                {searchTerm ? 'Try adjusting your search' : 'Click "Add New Movie" to get started'}
                            </p>
                        </div>
                    )}
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
            />
            {movieToUpdate && (
                <UpdateMovieModal
                    movie={movieToUpdate as Movie}
                    isOpen={isUpdateModalOpen}
                    onClose={() => { setIsUpdateModalOpen(false); setMovieToUpdate(null); }}
                    onSuccess={fetchMovies}
                    formats={formats}
                    requiredAges={requiredAges}
                    genres={genres}
                />
            )}
            {selectedMovie && (
                <MovieDetailModal
                    movie={selectedMovie as Movie}
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
        </div>
    );
};

export default MovieManagerPage;
