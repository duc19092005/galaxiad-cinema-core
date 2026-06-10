// src/features/public/HomePage.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, ChevronDown, LogOut, AlertCircle, ArrowLeftRight, Loader2,
  Sun, Moon, Sparkles, LayoutDashboard, UserCircle, Menu, X, Play, Ticket,
} from 'lucide-react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { authApi } from '../../api/authApi';
import { publicApi } from '../../api/publicApi';
import type { ApiErrorResponse } from '../../types/auth.types';
import type { PublicMovieListItem } from '../../types/public.types';
import LogoutModal from '../../components/LogoutModal';
import { useTheme } from '../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import AdvancedSearch from './components/AdvancedSearch';
import PublicCitySelector from './components/PublicCitySelector';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();

  const [user, setUser] = useState<{ username: string; roles?: string[]; selectedRole?: string } | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isThemeDropdownOpen, setIsThemeDropdownOpen] = useState(false);
  const themeDropdownRef = useRef<HTMLDivElement>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [logoutError, setLogoutError] = useState<string | null>(null);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const [nowShowing, setNowShowing] = useState<PublicMovieListItem[]>([]);
  const [comingSoon, setComingSoon] = useState<PublicMovieListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string>('');

  const [isScrolled, setIsScrolled] = useState(false);
  const sectionsRef = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('animate-reveal');
      });
    }, { threshold: 0.1 });
    sectionsRef.current.forEach(s => { if (s) observer.observe(s); });
    const storedUser = localStorage.getItem('user_info');
    if (storedUser) setUser(JSON.parse(storedUser));
    fetchMovies();
    return () => { window.removeEventListener('scroll', handleScroll); observer.disconnect(); };
  }, [navigate, selectedCity]);

  const fetchMovies = async () => {
    setLoading(true); setError(null);
    try {
      const response = await publicApi.getAllMovies({ city: selectedCity || undefined, pageSize: 20 });
      const items = response.data || [];
      setNowShowing(items.filter(m => !m.isCommingSoon));
      setComingSoon(items.filter(m => m.isCommingSoon));
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
      } else { setError('Cannot connect to server.'); }
    } finally { setLoading(false); }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsDropdownOpen(false);
      if (themeDropdownRef.current && !themeDropdownRef.current.contains(event.target as Node)) setIsThemeDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogoutClick = () => { setIsLogoutModalOpen(true); setLogoutError(null); };
  const handleLogoutConfirm = async () => {
    setLogoutError(null); setLogoutLoading(true);
    try {
      await authApi.logout();
      localStorage.removeItem('user_info');
      Cookies.remove('X-Access-Token');
      setIsLogoutModalOpen(false);
      navigate('/login');
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response) {
        setLogoutError((error.response.data as ApiErrorResponse).message || 'Logout failed.');
      } else { setLogoutError('Unable to connect to server.'); }
    } finally { setLogoutLoading(false); }
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)' }}>
      {/* HEADER / NAVBAR */}
      <header
        className="navbar"
        style={{
          position: 'fixed',
          transition: 'background-color var(--duration) var(--ease), box-shadow var(--duration) var(--ease), border-color var(--duration) var(--ease)',
          backgroundColor: isScrolled ? 'var(--bg-surface)' : 'transparent',
          borderBottom: isScrolled ? '1px solid var(--border)' : '1px solid transparent',
          backdropFilter: isScrolled ? 'blur(12px)' : 'none',
          paddingLeft: 'var(--space-4)',
          paddingRight: 'var(--space-4)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="btn-icon"
            style={{ display: 'inline-flex' }}
          >
            <Menu size={18} />
          </button>

          <div
            className="navbar-brand"
            onClick={() => navigate('/home')}
            style={{ cursor: 'pointer' }}
          >
            <span style={{ fontWeight: 500 }}>Cinema</span>
            <span style={{ fontWeight: 400, color: 'var(--text-secondary)' }}>Pro</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', height: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <PublicCitySelector selectedCity={selectedCity} onCityChange={setSelectedCity} />
            <LanguageSwitcher />

            {/* Theme toggle dropdown */}
            <div className="relative" ref={themeDropdownRef}>
              <button
                onClick={() => setIsThemeDropdownOpen(!isThemeDropdownOpen)}
                className="btn-icon"
              >
                {theme === 'dark' ? <Moon size={14} /> : theme === 'modern' ? <Sparkles size={14} /> : <Sun size={14} />}
              </button>
              {isThemeDropdownOpen && (
                <div className="card surface-elevated"
                  style={{
                    position: 'absolute', right: 0, marginTop: 'var(--space-2)',
                    width: 180, padding: 'var(--space-1)',
                    boxShadow: 'var(--shadow-lg)', zIndex: 100,
                  }}
                >
                  {(['light', 'dark', 'modern'] as const).map(t => (
                    <button
                      key={t}
                      onClick={() => { setTheme(t); setIsThemeDropdownOpen(false); }}
                      className="btn-ghost"
                      style={{
                        width: '100%', justifyContent: 'flex-start',
                        fontSize: 'var(--text-sm)',
                        backgroundColor: theme === t ? 'var(--accent-soft)' : 'transparent',
                        color: theme === t ? 'var(--accent)' : 'var(--text-secondary)',
                      }}
                    >
                      {t === 'light' ? <Sun size={14} /> : t === 'dark' ? <Moon size={14} /> : <Sparkles size={14} />}
                      <span>{t === 'light' ? 'Light' : t === 'dark' ? 'Dark' : 'Modern'}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* User section */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            {!user ? (
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <button className="btn btn-secondary" onClick={() => navigate('/login')}>
                  {t('header.login')}
                </button>
                <button className="btn btn-primary" onClick={() => navigate('/register')}>
                  {t('header.register')}
                </button>
              </div>
            ) : (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="btn btn-secondary"
                  style={{
                    gap: 'var(--space-2)', padding: '4px 12px 4px 4px', height: 'auto',
                    borderRadius: 'var(--radius-full)',
                    borderColor: 'var(--border)',
                  }}
                >
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backgroundColor: 'var(--accent-soft)',
                  }}>
                    <User size={14} style={{ color: 'var(--accent)' }} />
                  </div>
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>{user.username}</span>
                  <ChevronDown size={12} style={{
                    transition: 'transform 300ms var(--ease)',
                    transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0)',
                    color: 'var(--text-muted)',
                  }} />
                </button>

                {isDropdownOpen && (
                  <div className="card surface-elevated"
                    style={{
                      position: 'absolute', right: 0, marginTop: 'var(--space-2)',
                      width: 220, padding: 'var(--space-1)',
                      boxShadow: 'var(--shadow-lg)', zIndex: 100,
                    }}
                  >
                    <div style={{ padding: 'var(--space-3) var(--space-4)', borderBottom: '1px solid var(--border)' }}>
                      <p className="text-muted" style={{ fontSize: 'var(--text-xs)', margin: 0 }}>
                        {t('header.signedInAs')}
                      </p>
                      <p style={{ fontSize: 'var(--text-sm)', fontWeight: 500, margin: 0, color: 'var(--text-primary)' }}>
                        {user.username}
                      </p>
                    </div>
                    {user.roles && user.roles.some((r: string) => r !== 'User' && r !== 'Cashier') && (
                      <button
                        onClick={() => navigate('/role-selection')}
                        className="btn-ghost"
                        style={{ width: '100%', justifyContent: 'flex-start', fontSize: 'var(--text-sm)' }}
                      >
                        <LayoutDashboard size={14} />
                        Management hub
                      </button>
                    )}
                    <button
                      onClick={() => { navigate('/account'); setIsDropdownOpen(false); }}
                      className="btn-ghost"
                      style={{ width: '100%', justifyContent: 'flex-start', fontSize: 'var(--text-sm)' }}
                    >
                      <UserCircle size={14} />
                      {t('header.accountInfo')}
                    </button>
                    {user.roles && user.roles.length > 1 && (
                      <button
                        onClick={() => navigate('/role-selection')}
                        className="btn-ghost"
                        style={{ width: '100%', justifyContent: 'flex-start', fontSize: 'var(--text-sm)' }}
                      >
                        <ArrowLeftRight size={14} />
                        {t('header.switchRole')}
                      </button>
                    )}
                    <div style={{ height: 1, backgroundColor: 'var(--border)', margin: 'var(--space-1) 0' }} />
                    <button
                      onClick={handleLogoutClick}
                      className="btn-ghost"
                      style={{
                        width: '100%', justifyContent: 'flex-start', fontSize: 'var(--text-sm)',
                        color: 'var(--danger)',
                      }}
                    >
                      <LogOut size={14} />
                      {t('header.logout')}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile sidebar */}
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 100,
          transition: 'opacity 400ms var(--ease), visibility 400ms var(--ease)',
          opacity: isMobileMenuOpen ? 1 : 0,
          visibility: isMobileMenuOpen ? 'visible' : 'hidden',
          pointerEvents: isMobileMenuOpen ? 'auto' : 'none',
        }}
      >
        <div
          style={{
            position: 'absolute', inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
          }}
          onClick={() => setIsMobileMenuOpen(false)}
        />
        <div
          style={{
            position: 'absolute', top: 0, left: 0, bottom: 0, width: 280,
            backgroundColor: 'var(--bg-surface)',
            borderRight: '1px solid var(--border)',
            transform: isMobileMenuOpen ? 'translateX(0)' : 'translateX(-100%)',
            transition: 'transform 400ms var(--ease)',
            display: 'flex', flexDirection: 'column',
          }}
        >
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: 'var(--space-6)',
            borderBottom: '1px solid var(--border)',
          }}>
            <span className="navbar-brand">Cinema Pro</span>
            <button className="btn-icon" onClick={() => setIsMobileMenuOpen(false)}>
              <X size={18} />
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            {!user ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <button className="btn btn-primary" onClick={() => { navigate('/login'); setIsMobileMenuOpen(false); }}>
                  {t('header.login')}
                </button>
                <button className="btn btn-secondary" onClick={() => { navigate('/register'); setIsMobileMenuOpen(false); }}>
                  {t('header.register')}
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backgroundColor: 'var(--accent-soft)',
                  }}>
                    <User size={20} style={{ color: 'var(--accent)' }} />
                  </div>
                  <div>
                    <p className="text-muted" style={{ fontSize: 'var(--text-xs)', margin: 0 }}>
                      {t('header.signedInAs')}
                    </p>
                    <p style={{ fontWeight: 500, margin: 0 }}>{user?.username}</p>
                  </div>
                </div>
                <button className="btn-ghost" style={{ justifyContent: 'flex-start' }}
                  onClick={() => { navigate('/account'); setIsMobileMenuOpen(false); }}>
                  <UserCircle size={16} /> {t('header.accountInfo')}
                </button>
                {user?.roles && user.roles.some(r => r !== 'User' && r !== 'Cashier') && (
                  <button className="btn-ghost" style={{ justifyContent: 'flex-start' }}
                    onClick={() => { navigate('/role-selection'); setIsMobileMenuOpen(false); }}>
                    <LayoutDashboard size={16} /> Management hub
                  </button>
                )}
                <button className="btn-ghost" style={{ justifyContent: 'flex-start', color: 'var(--danger)' }}
                  onClick={() => { handleLogoutClick(); setIsMobileMenuOpen(false); }}>
                  <LogOut size={16} /> {t('header.logout')}
                </button>
              </div>
            )}

            <div>
              <p className="text-muted" style={{ fontSize: 'var(--text-xs)', marginBottom: 'var(--space-3)', letterSpacing: '0.3px' }}>
                {t('City')}
              </p>
              <PublicCitySelector selectedCity={selectedCity} onCityChange={setSelectedCity} />
            </div>

            <div>
              <p className="text-muted" style={{ fontSize: 'var(--text-xs)', marginBottom: 'var(--space-3)', letterSpacing: '0.3px' }}>
                Theme
              </p>
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                {(['light', 'dark', 'modern'] as const).map(t => (
                  <button key={t} onClick={() => setTheme(t)}
                    className="btn-icon"
                    style={{
                      backgroundColor: theme === t ? 'var(--accent-soft)' : 'transparent',
                      color: theme === t ? 'var(--accent)' : 'var(--text-muted)',
                    }}
                  >
                    {t === 'light' ? <Sun size={14} /> : t === 'dark' ? <Moon size={14} /> : <Sparkles size={14} />}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-muted" style={{ fontSize: 'var(--text-xs)', marginBottom: 'var(--space-3)', letterSpacing: '0.3px' }}>
                Language
              </p>
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      </div>

      {logoutError && (
        <div style={{ paddingTop: 80, paddingLeft: 'var(--space-6)', paddingRight: 'var(--space-6)', maxWidth: 1200, margin: '0 auto' }}>
          <div className="card" style={{ padding: 'var(--space-3) var(--space-4)', borderColor: 'var(--danger)', backgroundColor: 'var(--danger-soft)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <AlertCircle size={16} style={{ color: 'var(--danger)', flexShrink: 0 }} />
            <span style={{ fontSize: 'var(--text-sm)' }}>{logoutError}</span>
          </div>
        </div>
      )}

      {/* HERO */}
      <section style={{ position: 'relative', height: '80vh', width: '100%', overflow: 'hidden', marginTop: 0 }}>
        <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
          <img
            src="https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1920"
            className="w-full h-full object-cover"
            style={{ filter: 'brightness(0.45)', objectFit: 'cover', width: '100%', height: '100%' }}
            alt="Cinema hero"
          />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, var(--bg-base) 0%, transparent 60%)' }} />
        </div>

        <div style={{ position: 'relative', zIndex: 1, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '0 var(--space-6)' }}>
          <div className="badge badge-accent" style={{ marginBottom: 'var(--space-6)', backdropFilter: 'blur(8px)', backgroundColor: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.15)' }}>
            <Sparkles size={12} style={{ marginRight: 'var(--space-1)' }} />
            {t('Experience Local Cinema Better')}
          </div>

          <h1 style={{
            fontSize: 'clamp(2.5rem, 8vw, 5rem)',
            fontWeight: 500,
            letterSpacing: '-1.5px',
            lineHeight: 1,
            marginBottom: 'var(--space-6)',
            color: 'white',
          }}>
            Cinematic<br />
            <span style={{ color: 'var(--accent)' }}>Adventure</span>
          </h1>

          <p style={{
            fontSize: 'var(--text-lg)', color: 'rgba(255,255,255,0.65)',
            maxWidth: 500, marginBottom: 'var(--space-8)',
          }}>
            {t('Discover the latest blockbusters and timeless classics at your favorite local theaters. Premium comfort, state-of-the-art sound, and endless magic.')}
          </p>

          <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button className="btn btn-primary" style={{
              padding: '12px 32px',
              fontSize: 'var(--text-base)',
              backgroundColor: 'white',
              color: '#18181b',
              borderRadius: 'var(--radius-full)',
            }}>
              {t('Explore Now')}
            </button>
            <button className="btn btn-secondary" style={{
              padding: '12px 32px',
              fontSize: 'var(--text-base)',
              borderColor: 'rgba(255,255,255,0.2)',
              color: 'white',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'rgba(255,255,255,0.08)',
            }}>
              <Play size={16} fill="white" />
              {t('Watch Trailer')}
            </button>
          </div>
        </div>
      </section>

      {/* Search bar under hero */}
      <section style={{ marginTop: '-48px', position: 'relative', zIndex: 20 }}>
        <AdvancedSearch />
      </section>

      {/* Movie listings */}
      <main style={{
        paddingLeft: 'var(--space-6)', paddingRight: 'var(--space-6)',
        maxWidth: 1280, margin: '0 auto',
        paddingBottom: 'var(--space-16)',
        position: 'relative', zIndex: 10,
      }}>
        {/* Now Showing */}
        <h2 className="section-header" style={{ marginBottom: 'var(--space-6)' }}>
          {t('Now Showing')}
        </h2>

        {error && (
          <div className="card" style={{
            padding: 'var(--space-3) var(--space-4)',
            marginBottom: 'var(--space-6)',
            display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
            borderColor: 'var(--danger)', backgroundColor: 'var(--danger-soft)',
          }}>
            <AlertCircle size={16} style={{ color: 'var(--danger)', flexShrink: 0 }} />
            <span style={{ flex: 1, fontSize: 'var(--text-sm)' }}>{error}</span>
            <button className="btn btn-primary" onClick={fetchMovies} style={{ flexShrink: 0 }}>
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <div className="state-center" style={{ minHeight: 200 }}>
            <Loader2 size={28} style={{ color: 'var(--accent)', animation: 'spin 1s linear infinite' }} />
            <span>Loading movies...</span>
          </div>
        ) : nowShowing.length === 0 ? (
          <div className="state-center" style={{ minHeight: 160 }}>
            <p>No movies currently showing.</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: 'var(--space-5)',
            marginBottom: 'var(--space-12)',
          }}>
            {nowShowing.map(movie => (
              <MovieCard key={movie.movieId} movie={movie} formatDate={formatDate} onClick={() => navigate(`/movie/${movie.movieId}`)} />
            ))}
          </div>
        )}

        {/* Coming Soon */}
        <h2 className="section-header" style={{ marginBottom: 'var(--space-6)' }}>
          {t('Coming Soon')}
        </h2>

        {!loading && comingSoon.length === 0 ? (
          <div className="state-center" style={{ minHeight: 120 }}>
            <p>No movies coming soon.</p>
          </div>
        ) : !loading ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: 'var(--space-5)',
          }}>
            {comingSoon.map(movie => (
              <MovieCard key={movie.movieId} movie={movie} formatDate={formatDate} isComingSoon onClick={() => navigate(`/movie/${movie.movieId}`)} />
            ))}
          </div>
        ) : null}
      </main>

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

/* Movie card sub-component */
interface MovieCardProps {
  movie: PublicMovieListItem;
  formatDate: (d: string) => string;
  isComingSoon?: boolean;
  onClick: () => void;
}

function MovieCard({ movie, formatDate, isComingSoon, onClick }: MovieCardProps) {
  return (
    <div
      className="card card-hover"
      onClick={onClick}
      style={{
        overflow: 'hidden', cursor: 'pointer',
        display: 'flex', flexDirection: 'column',
      }}
    >
      <div style={{ aspectRatio: '2/3', position: 'relative', overflow: 'hidden' }}>
        <img
          src={movie.moviePosterURL || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=500'}
          onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=500'; }}
          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 500ms var(--ease)' }}
          alt={movie.movieName}
          className="group-hover:scale-105"
        />
        {isComingSoon && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
            paddingBottom: 'var(--space-4)',
            background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)',
          }}>
            <span className="badge badge-neutral" style={{ backgroundColor: 'rgba(0,0,0,0.6)', color: 'white' }}>
              Coming soon
            </span>
          </div>
        )}
        {!isComingSoon && (
          <div
            style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'flex-end',
              padding: 'var(--space-4)',
              opacity: 0,
              background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)',
              transition: 'opacity 400ms var(--ease)',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '0'; }}
          >
            <button className="btn btn-primary" onClick={e => { e.stopPropagation(); onClick(); }}
              style={{ width: '100%', padding: '8px', fontSize: 'var(--text-xs)' }}>
              <Ticket size={12} /> Book ticket
            </button>
          </div>
        )}
      </div>
      <div style={{ padding: 'var(--space-3)' }}>
        <p style={{
          fontSize: 'var(--text-sm)', fontWeight: 500,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          marginBottom: 'var(--space-1)',
        }}>
          {movie.movieName}
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-1)', marginBottom: 'var(--space-2)' }}>
          {movie.movieCategoryInfos?.split(',').slice(0, 2).map((genre: string, i: number) => (
            <span key={i} className="badge badge-neutral">{genre.trim()}</span>
          ))}
        </div>
        <p className="text-muted" style={{ fontSize: 'var(--text-xs)' }}>
          {movie.movieDuration} min
          {(movie.releaseDate || movie.expectedReleaseDate) ? ` • ${formatDate((movie.releaseDate || movie.expectedReleaseDate) as string)}` : ''}
        </p>
      </div>
    </div>
  );
}

export default HomePage;