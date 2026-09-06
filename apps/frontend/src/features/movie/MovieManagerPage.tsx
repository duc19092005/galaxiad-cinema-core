// src/features/movie/MovieManagerPage.tsx
// Complete redesign with dark cinema theme - keeps all business logic

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Film, LayoutDashboard } from 'lucide-react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { useTranslation } from 'react-i18next';
import { movieApi } from '../../api/movieApi';
import { authApi } from '../../api/authApi';
import { showError, showSuccess } from '../../utils/ToastUtils';
import { formatVietnamDate } from '../../utils/dateTimeUtils';
import type { ApiErrorResponse } from '../../types/auth.types';
import type { Movie } from '../../types/movie.types';
import { contractApi } from '../../api/contractApi';

import LogoutModal from '../../components/LogoutModal';
import ManagementDashboard from '../../components/ManagementDashboard';
import AppSidebar from '../../components/AppSidebar';
import type { SidebarSection } from '../../components/AppSidebar';
import ManagementChrome from '../../components/ManagementChrome';

import { MovieDetailModal } from './components/MovieDetailModal';
import { MoviesListTab } from './components/MoviesListTab';
import { ContractsWorkspace } from '../contracts/ContractsWorkspace';

const MovieManagerPage: React.FC = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [user, setUser] = useState<{ username: string; roles?: string[]; selectedRole?: string } | null>(null);

    const [movies, setMovies] = useState<Movie[]>([]);
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
    const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

    useEffect(() => {
        const storedUser = localStorage.getItem('user_info');
        if (!storedUser) { navigate('/login'); return; }
        try {
            const parsed = JSON.parse(storedUser);
            const roles = parsed.roles || [];
            if (!roles.includes('MovieManager') && !roles.includes('Admin')) { navigate('/role-selection'); return; }
            setUser(parsed);
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

    const handleChangeRequest = async (movie: Movie) => {
        const reason = window.prompt(`Lý do điều chỉnh metadata cho “${movie.movieName}”:`, 'Cập nhật nội dung hiển thị theo tài liệu đối tác');
        if (!reason) return;
        const proposedDescription = window.prompt('Mô tả mới (để trống nếu không đổi):', movie.movieDescriptions || '');
        if (proposedDescription === null) return;
        try {
            const created = await contractApi.proposeMovieChange(movie.movieId, reason, JSON.stringify({ movieDescription: proposedDescription }));
            await contractApi.submitMovieChange(created.data.movieChangeRequestId);
            showSuccess('Đã gửi yêu cầu điều chỉnh cho Admin. Phim hiện tại chưa bị thay đổi.');
        } catch (err: unknown) {
            const response = (err as { response?: { data?: { message?: string } } }).response;
            showError(response?.data?.message || 'Không thể tạo yêu cầu điều chỉnh.');
        }
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
                { id: 'contracts', label: 'Hợp đồng được giao', icon: <FileText size={16} /> },
                { id: 'movies', label: 'Danh mục phim — chỉ đọc', icon: <Film size={16} /> },
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
                        onMovieClick={(movie) => { setSelectedMovie(movie); setIsDetailModalOpen(true); }}
                        onChangeRequest={(movie) => void handleChangeRequest(movie)}
                        formatDate={formatDate}
                    />
                );
            case 'contracts':
                return <ContractsWorkspace mode="manager" />;
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

        </div>
    );
};

export default MovieManagerPage;
