// src/features/public/HomePage.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, ChevronDown, LogOut, AlertCircle, ArrowLeftRight, Loader2,
  Sparkles, LayoutDashboard, UserCircle, Menu, X, Play, Ticket,
  Search,
} from 'lucide-react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { authApi } from '../../api/authApi';
import { publicApi } from '../../api/publicApi';
import type { ApiErrorResponse } from '../../types/auth.types';
import type { PublicMovieListItem } from '../../types/public.types';
import LogoutModal from '../../components/LogoutModal';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../../components/LanguageSwitcher';
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

  const [user, setUser] = useState<{ username: string; roles?: string[]; selectedRole?: string } | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
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

  return (
    <>
      <style>{`
        @media (min-width: 768px) {
          .trending-grid { grid-template-columns: repeat(3, 1fr) !important; }
          .booking-grid-items { grid-template-columns: repeat(3, 1fr) !important; }
          .booking-bar-row { flex-direction: row !important; }
          .footer-grid { grid-template-columns: repeat(3, 1fr) !important; }
          .hero-section { min-height: 921px; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)', overflowX: 'hidden' }}>
      {/* ===== NAVBAR ===== */}
      <nav
        style={{
          position: 'fixed', width: '100%', top: 0, zIndex: 50,
          backgroundColor: isScrolled ? 'var(--bg-surface)' : 'rgba(255,255,255,0.03)',
          backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
          borderBottom: isScrolled ? '1px solid var(--border-color)' : '1px solid rgba(255,255,255,0.06)',
          paddingLeft: 'var(--space-24)', paddingRight: 'var(--space-24)',
          transition: 'background-color 0.3s ease, border-color 0.3s ease',
          height: 72, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-16)' }}>
          <button onClick={() => setIsMobileMenuOpen(true)} className="btn-ghost" style={{ border: 'none' }}>
            <Menu size={18} />
          </button>
          <div
            onClick={() => navigate('/home')}
            style={{ cursor: 'pointer', fontFamily: "'Montserrat', sans-serif", fontSize: 24, fontWeight: 800, letterSpacing: '-0.3px', background: 'linear-gradient(135deg, var(--accent), var(--accent))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            CINEMA
          </div>
          <div style={{ display: 'none', alignItems: 'center', gap: 'var(--space-32)', marginLeft: 'var(--space-40)' }} className="md:flex">
            <a href="#" style={{ color: 'var(--accent)', fontWeight: 600, fontSize: 'var(--text-sm)', textDecoration: 'none', borderBottom: '2px solid var(--accent)', paddingBottom: 2 }}>{t('home.moviesNav')}</a>
            <a href="#" className="nav-link">{t('home.showtimesNav')}</a>
            <a href="#" className="nav-link">{t('home.theatersNav')}</a>
            <a href="#" className="nav-link">{t('home.offersNav')}</a>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-12)' }}>
          <div style={{ display: 'none' }} className="md:block">
            <PublicCitySelector selectedCity={selectedCity} onCityChange={setSelectedCity} />
          </div>
          <LanguageSwitcher />

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-8)' }}>
            {!user ? (
              <button className="btn-primary cta-glow" onClick={() => navigate('/login')} style={{ padding: '10px 24px', fontSize: 'var(--text-sm)', fontWeight: 600, borderRadius: 16 }}>
                {t('home.signIn')}
              </button>
            ) : (
              <div className="relative" ref={dropdownRef}>
                <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="btn-secondary" style={{ gap: 'var(--space-8)', padding: '4px 12px 4px 4px', height: 'auto', borderRadius: 'var(--radius-full)' }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-surface)' }}>
                    <User size={14} style={{ color: 'var(--accent)' }} />
                  </div>
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>{user.username}</span>
                  <ChevronDown size={12} style={{ transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 300ms ease', color: 'var(--text-secondary)' }} />
                </button>
                {isDropdownOpen && (
                  <div className="glass-card" style={{ position: 'absolute', right: 0, marginTop: 'var(--space-8)', width: 220, padding: 'var(--space-4)', zIndex: 100, borderRadius: 'var(--radius-md)' }}>
                    <div style={{ padding: 'var(--space-12) var(--space-16)', borderBottom: '1px solid var(--border-color)' }}>
                      <p style={{ fontSize: 'var(--text-xs)', margin: 0, color: 'var(--text-secondary)' }}>{t('header.signedInAs')}</p>
                      <p style={{ fontSize: 'var(--text-sm)', fontWeight: 500, margin: 0 }}>{user.username}</p>
                    </div>
                    {user.roles && user.roles.some((r: string) => r !== 'User' && r !== 'Cashier') && (
                      <button onClick={() => navigate('/role-selection')} className="btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', fontSize: 'var(--text-sm)' }}>
                        <LayoutDashboard size={14} /> Management hub
                      </button>
                    )}
                    <button onClick={() => { navigate('/account'); setIsDropdownOpen(false); }} className="btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', fontSize: 'var(--text-sm)' }}>
                      <UserCircle size={14} /> {t('header.accountInfo')}
                    </button>
                    {user.roles && user.roles.length > 1 && (
                      <button onClick={() => navigate('/role-selection')} className="btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', fontSize: 'var(--text-sm)' }}>
                        <ArrowLeftRight size={14} /> {t('header.switchRole')}
                      </button>
                    )}
                    <div style={{ height: 1, backgroundColor: 'var(--border-color)', margin: 'var(--space-4) 0' }} />
                    <button onClick={handleLogoutClick} className="btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', fontSize: 'var(--text-sm)', color: 'var(--danger)' }}>
                      <LogOut size={14} /> {t('header.logout')}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* ===== MOBILE SIDEBAR ===== */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 100,
        transition: 'opacity 400ms ease, visibility 400ms ease',
        opacity: isMobileMenuOpen ? 1 : 0,
        visibility: isMobileMenuOpen ? 'visible' : 'hidden',
        pointerEvents: isMobileMenuOpen ? 'auto' : 'none',
      }}>
        <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} onClick={() => setIsMobileMenuOpen(false)} />
        <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 280, backgroundColor: 'var(--bg-surface)', borderRight: '1px solid var(--border-color)', transform: isMobileMenuOpen ? 'translateX(0)' : 'translateX(-100%)', transition: 'transform 400ms ease', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-24)', borderBottom: '1px solid var(--border-color)' }}>
            <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 22, fontWeight: 800, background: 'linear-gradient(135deg, var(--accent), var(--accent))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>CINEMA</span>
            <button className="btn-icon" onClick={() => setIsMobileMenuOpen(false)}><X size={18} /></button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-24)', display: 'flex', flexDirection: 'column', gap: 'var(--space-24)' }}>
            {!user ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-12)' }}>
                <button className="btn-primary" onClick={() => { navigate('/login'); setIsMobileMenuOpen(false); }}>{t('header.login')}</button>
                <button className="btn-secondary" onClick={() => { navigate('/register'); setIsMobileMenuOpen(false); }}>{t('header.register')}</button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-12)', marginBottom: 'var(--space-16)' }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-surface)' }}>
                    <User size={20} style={{ color: 'var(--accent)' }} />
                  </div>
                  <div>
                    <p style={{ fontSize: 'var(--text-xs)', margin: 0, color: 'var(--text-secondary)' }}>{t('header.signedInAs')}</p>
                    <p style={{ fontWeight: 500, margin: 0 }}>{user?.username}</p>
                  </div>
                </div>
                <button className="btn-ghost" style={{ justifyContent: 'flex-start' }} onClick={() => { navigate('/account'); setIsMobileMenuOpen(false); }}>
                  <UserCircle size={16} /> {t('header.accountInfo')}
                </button>
                {user?.roles && user.roles.some(r => r !== 'User' && r !== 'Cashier') && (
                  <button className="btn-ghost" style={{ justifyContent: 'flex-start' }} onClick={() => { navigate('/role-selection'); setIsMobileMenuOpen(false); }}>
                    <LayoutDashboard size={16} /> Management hub
                  </button>
                )}
                <button className="btn-ghost" style={{ justifyContent: 'flex-start', color: 'var(--danger)' }} onClick={() => { handleLogoutClick(); setIsMobileMenuOpen(false); }}>
                  <LogOut size={16} /> {t('header.logout')}
                </button>
              </div>
            )}
            <div>
              <p style={{ fontSize: 'var(--text-xs)', marginBottom: 'var(--space-12)', letterSpacing: '0.3px', color: 'var(--text-secondary)' }}>Language</p>
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      </div>

      {/* ===== LOGOUT ERROR ===== */}
      {logoutError && (
        <div style={{ paddingTop: 80, paddingLeft: 'var(--space-24)', paddingRight: 'var(--space-24)', maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ padding: 'var(--space-12) var(--space-16)', border: '1px solid var(--danger)', backgroundColor: 'rgba(255,180,171,0.06)', display: 'flex', alignItems: 'center', gap: 'var(--space-12)', borderRadius: 'var(--radius-md)' }}>
            <AlertCircle size={16} style={{ color: 'var(--danger)', flexShrink: 0 }} />
            <span style={{ fontSize: 'var(--text-sm)' }}>{logoutError}</span>
          </div>
        </div>
      )}

      {/* ===== HERO SECTION ===== */}
      <section style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: 80, paddingLeft: 20, paddingRight: 20, minHeight: 600 }} className="hero-section">
        <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
          <img alt="Cinema theater" src={HERO_IMG} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.3)' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, var(--bg-base) 0%, rgba(5,20,36,0.4) 40%, rgba(5,20,36,0.8) 100%)' }} />
        </div>
        <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', maxWidth: 900, margin: '0 auto', paddingTop: 60 }}>
          <span style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--accent)', fontWeight: 700, display: 'block', marginBottom: 24 }}>
            {t('home.experienceBadge')}
          </span>
          <h1 style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 'clamp(2.5rem, 8vw, 4rem)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.02em', color: 'white' }}>
            {t('home.cinematic')}<br />
            <span style={{ color: 'var(--accent)' }}>{t('home.adventure')}</span>
          </h1>
          <p style={{ fontSize: 16, lineHeight: 1.7, color: 'rgba(255,255,255,0.65)', maxWidth: 600, margin: '24px auto' }}>
            {t('home.heroDesc')}
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
            <button className="btn-primary cta-glow" style={{ padding: '16px 40px', fontWeight: 700, fontSize: 14 }}>
              {t('home.exploreNow')}
            </button>
            <button className="glass-card" style={{ padding: '16px 40px', color: 'white', fontWeight: 700, fontSize: 14, border: 'none', borderRadius: 16, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, transition: 'all 0.3s ease', background: 'rgba(255,255,255,0.05)' }}>
              <Play size={16} fill="white" /> {t('home.watchTrailer')}
            </button>
          </div>
        </div>

        {/* Quick Booking Bar */}
        <div style={{ position: 'relative', zIndex: 20, width: '100%', maxWidth: 1000, marginTop: 64, paddingLeft: 20, paddingRight: 20 }}>
          <div className="glass-card" style={{ padding: 8, borderRadius: 16, display: 'flex', flexDirection: 'column' }}>
            <div className="booking-grid-items" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
              {[{ step: '1', label: 'home.date', value: 'home.today' }, { step: '2', label: 'home.movie', value: 'home.allMovies' }, { step: '3', label: 'home.cinema', value: 'home.allCinemas' }].map((item, idx) => (
                <div key={idx} style={{ padding: '16px 24px', cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'center', borderRadius: 8, borderTop: idx > 0 ? '1px solid rgba(255,255,255,0.1)' : 'none', transition: 'background 0.3s ease' }}>
                  <span style={{ fontSize: 10, color: 'var(--accent)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{item.step}. {t(item.label)}</span>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 500, color: 'white' }}>{t(item.value)}</span>
                    <ChevronDown size={16} style={{ color: 'rgba(255,255,255,0.4)' }} />
                  </div>
                </div>
              ))}
            </div>
            <button className="btn-primary cta-glow" style={{ width: '100%', padding: '16px 32px', fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
              <Search size={16} /> {t('home.searchNow')}
            </button>
          </div>
        </div>
      </section>

      {/* ===== TOP TRENDING SECTION ===== */}
      <section style={{ maxWidth: 1280, margin: '0 auto', padding: '80px 20px', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 48 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <Sparkles size={16} style={{ color: 'var(--accent)' }} />
              <span style={{ fontSize: 11, color: 'var(--accent)', letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 600 }}>{t('home.weeklyLeaders')}</span>
            </div>
            <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 700, margin: 0 }}>
              {t('home.topTrending')}
            </h2>
          </div>
        </div>

        <div className="trending-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 40 }}>
          {TRENDING_DATA.map((item, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ position: 'relative', aspectRatio: '4/5', borderRadius: 16, overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
                <img src={TRENDING_IMGS[i]} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.7s ease' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, black 0%, rgba(0,0,0,0.2) 50%, transparent 100%)' }} />
                <div style={{ position: 'absolute', bottom: 24, left: 24, right: 24 }}>
                  <h3 style={{ fontSize: 20, fontWeight: 700, color: 'white', marginBottom: 8 }}>{item.title}</h3>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.6 }}>{item.desc}</p>
                  <button className="btn-primary cta-glow" style={{ marginTop: 16, padding: '10px 24px', fontSize: 13, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <Ticket size={14} /> Book Now
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== NOW SHOWING SECTION ===== */}
      <section style={{ maxWidth: 1280, margin: '0 auto', padding: '60px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 48 }}>
          <div>
            <span style={{ fontSize: 11, color: 'var(--accent)', letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: 12 }}>
              {t('home.nowShowingBadge')}
            </span>
            <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 700, margin: 0 }}>
              {t('home.nowShowing')}
            </h2>
          </div>
        </div>

        {loading ? (
          <div className="state-center" style={{ minHeight: 300 }}>
            <Loader2 size={32} style={{ color: 'var(--accent)', animation: 'spin 1s linear infinite' }} />
            <p style={{ color: 'var(--text-secondary)', marginTop: 'var(--space-16)' }}>Loading movies...</p>
          </div>
        ) : error ? (
          <div className="state-center" style={{ minHeight: 300 }}>
            <AlertCircle size={40} style={{ color: 'var(--danger)' }} />
            <p style={{ color: 'var(--danger)', marginTop: 'var(--space-16)' }}>{error}</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
            {nowShowing.map(movie => (
              <div key={movie.movieId} className="glass-card interactive" style={{ borderRadius: 16, overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.3s ease, box-shadow 0.3s ease' }}
                onClick={() => navigate(`/movie/${movie.movieId}`)}>
                <img src={movie.moviePosterURL || PLACEHOLDER_POSTER} alt={movie.movieName} style={{ width: '100%', height: 400, objectFit: 'cover' }} />
                <div style={{ padding: 'var(--space-16)' }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 'var(--space-8)' }}>{movie.movieName}</h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {movie.movieFormatInfos.split('/').filter(Boolean).map((f: string, i: number) => (
                      <span key={i} style={{ padding: '2px 10px', borderRadius: 'var(--radius-full)', fontSize: 11, fontWeight: 700, background: 'var(--bg-surface)', color: 'var(--accent)', border: '1px solid var(--border-color)' }}>
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ===== COMING SOON SECTION ===== */}
      {comingSoon.length > 0 && (
        <section style={{ maxWidth: 1280, margin: '0 auto', padding: '60px 20px 100px' }}>
          <div style={{ marginBottom: 48 }}>
            <span style={{ fontSize: 11, color: 'var(--accent)', letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: 12 }}>
              {t('home.comingSoonBadge')}
            </span>
            <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 700, margin: 0 }}>
              {t('home.comingSoon')}
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
            {comingSoon.map(movie => (
              <div key={movie.movieId} className="glass-card interactive" style={{ borderRadius: 16, overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.3s ease' }}
                onClick={() => navigate(`/movie/${movie.movieId}`)}>
                <img src={movie.moviePosterURL || PLACEHOLDER_POSTER} alt={movie.movieName} style={{ width: '100%', height: 400, objectFit: 'cover' }} />
                <div style={{ padding: 'var(--space-16)' }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 'var(--space-8)' }}>{movie.movieName}</h3>
                  <span style={{ padding: '2px 10px', borderRadius: 'var(--radius-full)', fontSize: 11, fontWeight: 700, background: 'var(--bg-surface)', color: 'var(--accent)' }}>
                    Coming Soon
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ===== FOOTER ===== */}
      <footer style={{ borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--bg-surface)', padding: '60px 20px 40px' }}>
        <div className="footer-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 40, maxWidth: 1280, margin: '0 auto' }}>
          <div>
            <h3 style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 20, fontWeight: 800, background: 'linear-gradient(135deg, var(--accent), var(--accent))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', marginBottom: 16 }}>
              CINEMA PRO
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              Bringing the magic of cinema to life. Premium experiences, unforgettable stories.
            </p>
          </div>
          <div>
            <h4 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 }}>Quick Links</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {['Movies', 'Showtimes', 'Theaters', 'Offers'].map(link => (
                <a key={link} href="#" style={{ fontSize: 13, color: 'var(--text-secondary)', textDecoration: 'none' }}>{link}</a>
              ))}
            </div>
          </div>
          <div>
            <h4 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 }}>Contact</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13, color: 'var(--text-secondary)' }}>
              <span>support@cinemapro.com</span>
              <span>1800-123-456</span>
              <span>123 Cinema Boulevard</span>
            </div>
          </div>
        </div>
        <div style={{ borderTop: '1px solid var(--border-color)', marginTop: 40, paddingTop: 24, textAlign: 'center', fontSize: 12, color: 'var(--text-secondary)' }}>
          © 2024 CinemaPro. All rights reserved.
        </div>
      </footer>

      <LogoutModal isOpen={isLogoutModalOpen} onClose={() => setIsLogoutModalOpen(false)} onConfirm={handleLogoutConfirm} loading={logoutLoading} error={logoutError} />
      </div>
    </>
  );
};

export default HomePage;