// src/features/movie/MovieManagerPage.tsx
// Complete redesign with dark cinema theme - keeps all business logic

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Film, LayoutDashboard } from 'lucide-react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { useTranslation } from 'react-i18next';
import { movieApi } from '../../api/movieApi';
import { authApi } from '../../api/authApi';
import { publicApi } from '../../api/publicApi';
import { facilitiesApi } from '../../api/facilitiesApi';
import { showError, showSuccess } from '../../utils/ToastUtils';
import { formatVietnamDate } from '../../utils/dateTimeUtils';
import type { ApiErrorResponse } from '../../types/auth.types';
import type {
    Movie,
    MovieGenre,
    MovieRequiredAge,
} from '../../types/movie.types';
import type { Cinema, MovieFormat } from '../../types/facilities.types';

import LogoutModal from '../../components/LogoutModal';
import AssignRightsModal from '../admin/components/AssignRightsModal';
import ManagementDashboard from '../../components/ManagementDashboard';
import AppSidebar from '../../components/AppSidebar';
import type { SidebarSection } from '../../components/AppSidebar';
import ManagementChrome from '../../components/ManagementChrome';

import { MovieDetailModal } from './components/MovieDetailModal';
import { CreateMovieModal } from './components/CreateMovieModal';
import { UpdateMovieModal } from './components/UpdateMovieModal';
import { MoviesListTab } from './components/MoviesListTab';

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
