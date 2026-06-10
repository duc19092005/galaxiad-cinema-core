// src/features/public/HomePage.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, ChevronDown, LogOut, AlertCircle, ArrowLeftRight, Loader2,
  Sun, Moon, Sparkles, LayoutDashboard, UserCircle, Menu, X, Play, Ticket,
  Search,
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

const IMG_BASE = 'https://lh3.googleusercontent.com/aida-public/';

const HERO_IMG = IMG_BASE + 'AB6AXuBb-6tDUgXoRgmgTRBXwngoVTj0smOmB_NZPmcLz1kiOTfMsZE0q1zTRpwjaDJODAErtBJ69LZgGfxSCF235D75zmh3x90AFKmA4E50fgujmCJDv_krUSKoqOXBtr_0Z6tQHY2yYzlnyzvt3W84u1BzPRod5sWHQqooJXYQDH3li2GMZsqPNhuYHBa0rR_CYURrjmM2OHScCUYex2_0lm6k-PzDwfgVk2s3Wd8hToSbNZvc0g_kD8RZzigLOWt0bPO0hif73yxHvNs';

const TRENDING_IMGS = [
  IMG_BASE + 'AB6AXuBsKQqKZqwwk8ExH3xxxIZVnMwZboVJ3uYny_qRLjMKINARFOmHWOXN0Th5Odn5uBeMX5z2kczB6DNJokbGlkQD7jmwrw5Urtj1iiaVa0l2qCB60o4wdqVo5I8b5Pw7qn-sU8WjuniuA1joA23jUKCX-zS4VDQprajtfxqVo6DnN_DdCUHtRG7vDcYp2U7aJKtHVg9Y8jof0PoJDBp0Ecq0eq9gGGdc0eQgMLWuYQSditLzPaagM1UtH5qAwvriO2EM0hWM-hmV3WY',
  IMG_BASE + 'AB6AXuDAqs9Gw6k0ILUJlRA0qtwYbOLLQIp55LncUHiNZpPvIOPQv4roM3E9g8w_wfZHLoSzEdXbADEnmlmeSOdSPH7F5KLeh9cLlA23F6_mpcqjokMV1ddbzCZe_7x_ejTabsoAlFFz4b_QYjxUidsVKafLW5NsmV5-1KYb6P9LzuAALYbT-Z2KMv2UVKUiRIZv7qLWRxou8svln_vJOg_hc14zBmcUCQZPnYOSKYeeAAmi1sGFZcx3sr0XJWl2E0iTgYwYkhy6XHRg5Oc',
  IMG_BASE + 'AB6AXuByZJ095eJoAbV3swmdF9iL9A0JHsJ5cSgcUbOeDqhHKpHR_YciZ0Ym-8F70L8bK82K8Yl5Wr2a4LehNOLuU0KmnFwTOtG6xHNBjnDTcO9Gp0c5MrPAIsUDs-T0loTDc2vBX4AKnrsslq9HOb_l_waWOdhkVHrBCv8TivxdP9HI8aTB5cxrljw6Pt0lQv6slreXWh29ABpi1I2W7JzUQ-Ki-EPeLh1lHrsLjuxVGDl7blnb584Eoh5KfqrtU-PmV6w8hxCjysAW3Ko',
];

const TRENDING_DATA = [
  { title: 'Techno World', desc: 'In a future where reality is digital, one glitch could redefine humanity forever.' },
  { title: 'Void Seekers', desc: 'The edge of the universe is just the beginning of the journey home.' },
  { title: 'Dawn of Embers', desc: 'A historical epic of survival and legacy in a world on the brink of change.' },
];

const PLACEHOLDER_POSTER = 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=500';

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

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    const storedUser = localStorage.getItem('user_info');
    if (storedUser) setUser(JSON.parse(storedUser));
    fetchMovies();
    return () => { window.removeEventListener('scroll', handleScroll); };
  }, [navigate]);

  // Re-fetch when city changes
  useEffect(() => {
    fetchMovies();
  }, [selectedCity]);

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

  const getThemeIcon = () => {
    if (theme === 'dark') return <Moon size={14} />;
    if (theme === 'modern') return <Sparkles size={14} />;
    return <Sun size={14} />;
  };

  return (
    <>
      {/* Responsive grid CSS */}
      <style>{`
        @media (min-width: 768px) {
          .trending-grid { grid-template-columns: repeat(3, 1fr) !important; }
          .booking-grid-items { grid-template-columns: repeat(3, 1fr) !important; }
          .booking-bar-row { flex-direction: row !important; }
          .footer-grid { grid-template-columns: repeat(3, 1fr) !important; }
          .hero-section { min-height: 921px; }
        }
        .trending-card-img { transition: transform 0.7s ease; }
        .trending-card-img:hover { transform: scale(1.05); }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)', overflowX: 'hidden' }}>
      {/* ===== NAVBAR ===== */}
      <nav
        className="navbar"
        style={{
          position: 'fixed', width: '100%', top: 0, zIndex: 50,
          backgroundColor: isScrolled
            ? 'var(--bg-surface)'
            : 'rgba(255,255,255,0.03)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderBottom: isScrolled
            ? '1px solid var(--border)'
            : '1px solid rgba(255,255,255,0.06)',
          paddingLeft: 'var(--space-6)', paddingRight: 'var(--space-6)',
          transition: 'background-color 0.3s ease, border-color 0.3s ease',
          height: 72,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="btn-icon"
            style={{ display: 'inline-flex', border: 'none' }}
          >
            <Menu size={18} />
          </button>

          {/* Brand CINEMA */}
          <div
            onClick={() => navigate('/home')}
            style={{
              cursor: 'pointer',
              fontFamily: "'Montserrat', sans-serif",
              fontSize: '24px', fontWeight: 800,
              letterSpacing: '-0.3px',
              background: 'linear-gradient(135deg, #ffb77f, #ff8a00)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            CINEMA
          </div>

          {/* Desktop nav links */}
          <div style={{ display: 'none', alignItems: 'center', gap: 'var(--space-8)', marginLeft: 'var(--space-10)' }}
            className="md:flex"
          >
            <a href="#" style={{ color: 'var(--accent)', fontWeight: 600, fontSize: 'var(--text-sm)', textDecoration: 'none', borderBottom: '2px solid var(--accent)', paddingBottom: 2 }}>
              {t('home.moviesNav')}
            </a>
            <a href="#" style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', textDecoration: 'none', transition: 'color 0.3s ease' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
            >
              {t('home.showtimesNav')}
            </a>
            <a href="#" style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', textDecoration: 'none', transition: 'color 0.3s ease' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
            >
              {t('home.theatersNav')}
            </a>
            <a href="#" style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', textDecoration: 'none', transition: 'color 0.3s ease' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
            >
              {t('home.offersNav')}
            </a>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          {/* City selector */}
          <div style={{ display: 'none' }} className="md:block">
            <PublicCitySelector selectedCity={selectedCity} onCityChange={setSelectedCity} />
          </div>

          {/* Language */}
          <LanguageSwitcher />

          {/* Theme toggle dropdown */}
          <div className="relative" ref={themeDropdownRef}>
            <button
              onClick={() => setIsThemeDropdownOpen(!isThemeDropdownOpen)}
              className="btn-icon"
              style={{ border: 'none' }}
            >
              {getThemeIcon()}
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

          {/* User section */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            {!user ? (
              <button
                className="btn"
                onClick={() => navigate('/login')}
                style={{
                  padding: '10px 24px',
                  backgroundColor: 'var(--accent)',
                  color: 'white',
                  fontWeight: 600,
                  fontSize: 'var(--text-sm)',
                  borderRadius: 16,
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                {t('home.signIn')}
              </button>
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
      </nav>

      {/* ===== MOBILE SIDEBAR ===== */}
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
            <span style={{
              fontFamily: "'Montserrat', sans-serif",
              fontSize: '22px', fontWeight: 800,
              background: 'linear-gradient(135deg, #ffb77f, #ff8a00)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>CINEMA</span>
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

      {/* ===== LOGOUT ERROR ===== */}
      {logoutError && (
        <div style={{ paddingTop: 80, paddingLeft: 'var(--space-6)', paddingRight: 'var(--space-6)', maxWidth: 1200, margin: '0 auto' }}>
          <div className="card" style={{ padding: 'var(--space-3) var(--space-4)', borderColor: 'var(--danger)', backgroundColor: 'var(--danger-soft)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <AlertCircle size={16} style={{ color: 'var(--danger)', flexShrink: 0 }} />
            <span style={{ fontSize: 'var(--text-sm)' }}>{logoutError}</span>
          </div>
        </div>
      )}

      {/* ===== HERO SECTION ===== */}
      <section className="hero-section" style={{
        position: 'relative', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        paddingTop: 80, paddingLeft: 20, paddingRight: 20,
      }}>
        {/* Background image */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
          <img
            className="w-full h-full object-cover"
            alt="Cinema theater"
            src={HERO_IMG}
            style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.3)' }}
          />
          <div className="hero-gradient" style={{ position: 'absolute', inset: 0 }} />
        </div>

        {/* Hero content */}
        <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', maxWidth: 900, margin: '0 auto', paddingTop: 60 }}>
          <span style={{
            fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase',
            color: 'var(--accent)', fontWeight: 700, display: 'block', marginBottom: 24,
          }}>
            {t('home.experienceBadge')}
          </span>

          <h1 style={{
            fontFamily: "'Montserrat', sans-serif",
            fontSize: 'clamp(2.5rem, 8vw, 4rem)',
            fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.02em',
            color: 'white',
          }}>
            {t('home.cinematic')}<br />
            <span style={{ color: '#ff8a00' }}>{t('home.adventure')}</span>
          </h1>

          <p style={{
            fontSize: 16, lineHeight: 1.7, color: 'rgba(255,255,255,0.65)',
            maxWidth: 600, margin: '24px auto',
          }}>
            {t('home.heroDesc')}
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
            <button
              className="orange-glow"
              style={{
                padding: '16px 40px', backgroundColor: '#ff8a00', color: 'black',
                fontWeight: 700, fontSize: 14, border: 'none', borderRadius: 16,
                cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                transform: 'scale(1)',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              {t('home.exploreNow')}
            </button>
            <button
              style={{
                padding: '16px 40px', background: 'rgba(255,255,255,0.05)',
                backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)',
                borderTop: '1px solid rgba(255,255,255,0.1)',
                borderLeft: '1px solid rgba(255,255,255,0.1)',
                color: 'white', fontWeight: 700, fontSize: 14,
                border: 'none', borderRadius: 16, cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', gap: 8,
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
            >
              <Play size={16} fill="white" />
              {t('home.watchTrailer')}
            </button>
          </div>
        </div>

        {/* ===== QUICK BOOKING BAR ===== */}
        <div style={{
          position: 'relative', zIndex: 20,
          width: '100%', maxWidth: 1000, marginTop: 64,
          paddingLeft: 20, paddingRight: 20,
        }}>
          <div className="glass-card" style={{
            padding: 8, borderRadius: 16,
            display: 'flex', flexDirection: 'column',
          }}>
            <div className="booking-grid-items" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
              {/* Date */}
              <div style={{ padding: '16px 24px', cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'center', borderRadius: 8, transition: 'background 0.3s ease' }}
                className="md:border-r border-white/10"
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
              >
                <span style={{ fontSize: 10, color: 'var(--accent)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                  1. {t('home.date')}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 500, color: 'white' }}>{t('home.today')}</span>
                  <ChevronDown size={16} style={{ color: 'rgba(255,255,255,0.4)' }} />
                </div>
              </div>
              {/* Movie */}
              <div style={{ padding: '16px 24px', cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'center', borderRadius: 8, borderTop: '1px solid rgba(255,255,255,0.1)', transition: 'background 0.3s ease' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
              >
                <span style={{ fontSize: 10, color: 'var(--accent)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                  2. {t('home.movie')}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 500, color: 'white' }}>{t('home.allMovies')}</span>
                  <ChevronDown size={16} style={{ color: 'rgba(255,255,255,0.4)' }} />
                </div>
              </div>
              {/* Cinema */}
              <div style={{ padding: '16px 24px', cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'center', borderRadius: 8, borderTop: '1px solid rgba(255,255,255,0.1)', transition: 'background 0.3s ease' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
              >
                <span style={{ fontSize: 10, color: 'var(--accent)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                  3. {t('home.cinema')}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 500, color: 'white' }}>{t('home.allCinemas')}</span>
                  <ChevronDown size={16} style={{ color: 'rgba(255,255,255,0.4)' }} />
                </div>
              </div>
            </div>
            <button
              className="orange-glow"
              style={{
                width: '100%', padding: '16px 32px',
                backgroundColor: '#ff8a00', color: 'black',
                fontWeight: 700, fontSize: 14,
                border: 'none', borderRadius: 16,
                cursor: 'pointer', display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: 12,
                transition: 'all 0.3s ease',
              }}
            >
              <Search size={16} />
              {t('home.searchNow')}
            </button>
          </div>
        </div>
      </section>

      {/* ===== TOP TRENDING SECTION ===== */}
      <section style={{
        maxWidth: 1280, margin: '0 auto',
        padding: '80px 20px',
        overflow: 'hidden',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 48 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <Sparkles size={16} style={{ color: 'var(--accent)' }} />
              <span style={{ fontSize: 11, color: 'var(--accent)', letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 600 }}>
                {t('home.weeklyLeaders')}
              </span>
            </div>
            <h2 style={{
              fontFamily: "'Montserrat', sans-serif",
              fontSize: 'clamp(1.5rem, 4vw, 2rem)',
              fontWeight: 700, color: 'var(--text-primary)',
              margin: 0,
            }}>
              {t('home.topTrending')}
            </h2>
          </div>
        </div>

        <div className="trending-grid trending-grid-responsive" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 40 }}>
          {TRENDING_DATA.map((item, i) => (
            <div key={i} className="movie-card relative" style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{
                position: 'relative', aspectRatio: '4/5', borderRadius: 16, overflow: 'hidden',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
              }}>
                <img
                  src={TRENDING_IMGS[i]}
                  alt={item.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.7s ease' }}
                  className="group-hover:scale-105"
                />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, black 0%, rgba(0,0,0,0.2) 50%, transparent 100%)' }} />

                {/* Trending badge */}
                <div style={{ position: 'absolute', top: 24, left: 24 }}>
                  <span style={{
                    backgroundColor: '#ff8a00', color: 'black',
                    fontSize: 10, fontWeight: 700, padding: '4px 12px',
                    borderRadius: 9999, textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                  }}>
                    {t('home.trendingNow')}
                  </span>
                </div>

                {/* Text overlay */}
                <div style={{ position: 'absolute', bottom: 24, left: 24, right: 24 }}>
                  <h3 style={{
                    fontFamily: "'Montserrat', sans-serif",
                    fontSize: 24, fontWeight: 700, color: 'white',
                    margin: 0, marginBottom: 8, lineHeight: 1.2,
                  }}>
                    {item.title}
                  </h3>
                  <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, lineHeight: 1.5, margin: 0 }}>
                    {item.desc}
                  </p>
                </div>

                {/* Large number */}
                <div style={{
                  position: 'absolute', bottom: -16, right: -16,
                  fontFamily: "'Montserrat', sans-serif",
                  fontSize: 120, lineHeight: 1, color: 'white', opacity: 0.2,
                  WebkitTextStroke: '2px rgba(255,183,127,0.3)',
                  paintOrder: 'stroke fill',
                  pointerEvents: 'none', fontStyle: 'italic', fontWeight: 900,
                }}>
                  {i + 1}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== ADVANCED SEARCH ===== */}
      <AdvancedSearch />

      {/* ===== NOW SHOWING & COMING SOON ===== */}
      <main style={{
        paddingLeft: 'var(--space-6)', paddingRight: 'var(--space-6)',
        maxWidth: 1280, margin: '0 auto',
        paddingBottom: 'var(--space-16)',
        position: 'relative', zIndex: 10,
      }}>
        {/* Error banner */}
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

        {/* Now Showing */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <div style={{ width: 12, height: 4, backgroundColor: 'var(--accent)', borderRadius: 2 }} />
          <h2 style={{
            fontFamily: "'Montserrat', sans-serif",
            fontSize: 'clamp(1.3rem, 3vw, 1.75rem)',
            fontWeight: 700, color: 'var(--text-primary)',
            margin: 0,
          }}>
            {t('home.nowShowing')}
          </h2>
          <div style={{ flex: 1 }} />
          <a href="#" style={{ color: 'var(--accent)', fontSize: 11, letterSpacing: '0.1em', fontWeight: 600, textTransform: 'uppercase', textDecoration: 'none' }}>
            {t('home.viewAll')}
          </a>
        </div>

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
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, marginTop: 48 }}>
          <div style={{ width: 12, height: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2 }} />
          <h2 style={{
            fontFamily: "'Montserrat', sans-serif",
            fontSize: 'clamp(1.3rem, 3vw, 1.75rem)',
            fontWeight: 700, color: 'var(--text-primary)',
            margin: 0,
          }}>
            {t('home.comingSoon')}
          </h2>
        </div>

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

      {/* ===== FOOTER ===== */}
      <footer style={{
        width: '100%', paddingTop: 80, paddingBottom: 40,
        backgroundColor: 'var(--bg-elevated)',
        borderTop: '1px solid var(--border)',
      }}>
        <div style={{
          display: 'flex', flexDirection: 'column',
          justifyContent: 'space-between', alignItems: 'flex-start',
          paddingLeft: 'var(--space-6)', paddingRight: 'var(--space-6)',
          maxWidth: 1280, margin: '0 auto',
          gap: 48,
        }}>
          <div style={{ maxWidth: 320 }}>
            <div style={{
              fontFamily: "'Montserrat', sans-serif",
              fontSize: 20, fontWeight: 700,
              background: 'linear-gradient(135deg, #ffb77f, #ff8a00)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              marginBottom: 16,
            }}>
              CINEMA
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', lineHeight: 1.6 }}>
              {t('home.footerDesc')}
            </p>
          </div>

          <div className="footer-grid" style={{
            display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 48, width: '100%',
          }}>
            <div>
              <h4 style={{ color: 'var(--text-primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: 11, marginBottom: 16, marginTop: 0 }}>
                {t('home.explore')}
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <a href="#" className="footer-link">{t('home.moviesNav')}</a>
                <a href="#" className="footer-link">{t('home.showtimesNav')}</a>
                <a href="#" className="footer-link">{t('home.theatersNav')}</a>
              </div>
            </div>
            <div>
              <h4 style={{ color: 'var(--text-primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: 11, marginBottom: 16, marginTop: 0 }}>
                {t('home.support')}
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <a href="#" className="footer-link">{t('home.contactUs')}</a>
                <a href="#" className="footer-link">{t('home.careers')}</a>
                <a href="#" className="footer-link">{t('home.feedback')}</a>
              </div>
            </div>
            <div>
              <h4 style={{ color: 'var(--text-primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: 11, marginBottom: 16, marginTop: 0 }}>
                {t('home.legal')}
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <a href="#" className="footer-link">{t('home.privacyPolicy')}</a>
                <a href="#" className="footer-link">{t('home.termsOfService')}</a>
              </div>
            </div>
          </div>
        </div>

        <div style={{
          maxWidth: 1280, margin: '0 auto',
          paddingLeft: 'var(--space-6)', paddingRight: 'var(--space-6)',
          marginTop: 80, paddingTop: 40,
          borderTop: '1px solid rgba(255,255,255,0.05)',
          display: 'flex', flexDirection: 'column',
          justifyContent: 'space-between', alignItems: 'center',
          gap: 16, textAlign: 'center',
        }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', opacity: 0.8 }}>
            {t('home.copyright')}
          </p>
          <div style={{ display: 'flex', gap: 24 }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--text-muted)', cursor: 'pointer', fontSize: 20 }}>face</span>
            <span className="material-symbols-outlined" style={{ color: 'var(--text-muted)', cursor: 'pointer', fontSize: 20 }}>public</span>
            <span className="material-symbols-outlined" style={{ color: 'var(--text-muted)', cursor: 'pointer', fontSize: 20 }}>play_circle</span>
          </div>
        </div>
      </footer>

      {/* ===== LOGOUT MODAL ===== */}
      <LogoutModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleLogoutConfirm}
        loading={logoutLoading}
        error={logoutError}
      />
    </div>
    </>
  );
};

/* ===== MOVIE CARD SUB-COMPONENT ===== */
interface MovieCardProps {
  movie: PublicMovieListItem;
  formatDate: (d: string) => string;
  isComingSoon?: boolean;
  onClick: () => void;
}

function MovieCard({ movie, formatDate, isComingSoon, onClick }: MovieCardProps) {
  const { t } = useTranslation();
  return (
    <div
      className="movie-card card card-hover"
      onClick={onClick}
      style={{
        overflow: 'hidden', cursor: 'pointer',
        display: 'flex', flexDirection: 'column',
      }}
    >
      <div style={{ aspectRatio: '2/3', position: 'relative', overflow: 'hidden' }}>
        <img
          src={movie.moviePosterURL || PLACEHOLDER_POSTER}
          onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = PLACEHOLDER_POSTER; }}
          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 500ms var(--ease)' }}
          alt={movie.movieName}
        />
        {isComingSoon && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
            paddingBottom: 'var(--space-4)',
            background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)',
          }}>
            <span className="badge badge-neutral" style={{ backgroundColor: 'rgba(0,0,0,0.6)', color: 'white' }}>
              {t('Coming soon')}
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
            <button className="btn btn-primary quick-book" onClick={e => { e.stopPropagation(); onClick(); }}
              style={{ width: '100%', padding: '8px', fontSize: 'var(--text-xs)' }}>
              <Ticket size={12} /> {t('home.bookNow')}
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
          {movie.movieDuration} {t('home.minutes')}
          {(movie.releaseDate || movie.expectedReleaseDate) ? ` • ${formatDate((movie.releaseDate || movie.expectedReleaseDate) as string)}` : ''}
        </p>
      </div>
    </div>
  );
}

export default HomePage;