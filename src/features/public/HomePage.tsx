// src/features/public/HomePage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, ChevronDown, LogOut, AlertCircle, ArrowLeftRight, Loader2,
  Sparkles, LayoutDashboard, UserCircle, X, Play, Ticket,
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
import Header from '../../components/Header';


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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [logoutError, setLogoutError] = useState<string | null>(null);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const [nowShowing, setNowShowing] = useState<PublicMovieListItem[]>([]);
  const [comingSoon, setComingSoon] = useState<PublicMovieListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string>('');

  useEffect(() => {
    const storedUser = localStorage.getItem('user_info');
    if (storedUser) setUser(JSON.parse(storedUser));
    fetchMovies();
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
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)', overflowX: 'hidden' }}>

      {/* Redesigned Unified Header */}
      <Header
        showSidebarToggle={true}
        onMenuToggle={() => setIsMobileMenuOpen(true)}
        rightContent={
          <div className="hidden md:block">
            <PublicCitySelector selectedCity={selectedCity} onCityChange={setSelectedCity} />
          </div>
        }
      />

      {/* ============================================
          MOBILE SIDEBAR (Drawer)
          ============================================ */}
      {/* Overlay backdrop */}
      <div
        onClick={() => setIsMobileMenuOpen(false)}
        style={{
          position: 'fixed', inset: 0, zIndex: 99,
          backgroundColor: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          transition: 'opacity 350ms ease, visibility 350ms ease',
          opacity: isMobileMenuOpen ? 1 : 0,
          visibility: isMobileMenuOpen ? 'visible' : 'hidden',
          pointerEvents: isMobileMenuOpen ? 'auto' : 'none',
        }}
      />

      {/* Panel */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: 'min(82vw, 320px)',
        maxWidth: 320,
        height: '100vh',
        zIndex: 100,
        backgroundColor: '#111114',
        borderRight: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '4px 0 40px rgba(0,0,0,0.5)',
        display: 'flex',
        flexDirection: 'column',
        transform: isMobileMenuOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 350ms cubic-bezier(0.4, 0, 0.2, 1)',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 16px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}>
          <span style={{
            fontFamily: "'Montserrat', sans-serif",
            fontSize: 22,
            fontWeight: 800,
            background: 'linear-gradient(135deg, #ffb77f, #ff8a00)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            lineHeight: 1,
            userSelect: 'none',
          }}>
            CINEMA
          </span>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 36,
              height: 36,
              borderRadius: 10,
              border: 'none',
              background: 'rgba(255,255,255,0.05)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              flexShrink: 0,
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}>
          {!user ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 8 }}>
              <button onClick={() => { navigate('/login'); setIsMobileMenuOpen(false); }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  minHeight: 48, borderRadius: 12, fontWeight: 600, fontSize: 15,
                  gap: 8, border: 'none', cursor: 'pointer', padding: '12px 24px',
                  background: 'linear-gradient(135deg, #ff8a00, #ea580c)',
                  color: '#fff',
                }}>
                {t('header.login')}
              </button>
              <button onClick={() => { navigate('/register'); setIsMobileMenuOpen(false); }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  minHeight: 48, borderRadius: 12, fontWeight: 600, fontSize: 15,
                  gap: 8, border: '1px solid var(--border-color)',
                  cursor: 'pointer', padding: '12px 24px',
                  background: 'transparent', color: 'var(--text-primary)',
                }}>
                {t('header.register')}
              </button>
            </div>
          ) : (
            <>
              {/* User card */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '12px 12px',
                borderRadius: 12,
                backgroundColor: 'rgba(255,255,255,0.03)',
                marginBottom: 8,
              }}>
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(255,138,0,0.12)',
                  flexShrink: 0,
                }}>
                  <User size={20} style={{ color: 'var(--accent)' }} />
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <p style={{
                    fontSize: 11, margin: 0,
                    color: 'var(--text-muted)',
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    fontWeight: 600,
                    lineHeight: 1.3,
                  }}>{t('header.signedInAs')}</p>
                  <p style={{
                    fontSize: 15, fontWeight: 600, margin: 0,
                    color: 'var(--text-primary)',
                    lineHeight: 1.4,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: '100%',
                  }}>{user.username}</p>
                </div>
              </div>

              {/* Divider */}
              <div style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.06)', margin: '4px 0 8px' }} />

              {/* Account Info */}
              <SidebarItem
                icon={<UserCircle size={20} style={{ flexShrink: 0, color: 'var(--accent)' }} />}
                label={t('header.accountInfo')}
                onClick={() => { navigate('/account'); setIsMobileMenuOpen(false); }}
              />

              {/* Management hub */}
              {user?.roles && user.roles.some(r => r !== 'User' && r !== 'Cashier') && (
                <SidebarItem
                  icon={<LayoutDashboard size={20} style={{ flexShrink: 0, color: 'var(--accent)' }} />}
                  label="Management hub"
                  onClick={() => { navigate('/role-selection'); setIsMobileMenuOpen(false); }}
                />
              )}

              {/* Switch Role */}
              {user?.roles && user.roles.length > 1 && (
                <SidebarItem
                  icon={<ArrowLeftRight size={20} style={{ flexShrink: 0 }} />}
                  label={t('header.switchRole')}
                  onClick={() => { navigate('/role-selection'); setIsMobileMenuOpen(false); }}
                />
              )}
            </>
          )}

          {/* Spacer */}
          <div style={{ flex: 1, minHeight: 16 }} />

          {/* Language Section */}
          <div style={{
            borderTop: '1px solid rgba(255,255,255,0.06)',
            paddingTop: 12,
            marginTop: 4,
          }}>
            <p style={{
              fontSize: 11, margin: '0 0 8px 14px',
              color: 'var(--text-muted)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              fontWeight: 600,
              lineHeight: 1.3,
            }}>Language</p>
            <div style={{ paddingLeft: 2 }}>
              <LanguageSwitcher />
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.06)', margin: '8px 0' }} />

          {/* Logout */}
          <button
            onClick={() => { handleLogoutClick(); setIsMobileMenuOpen(false); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 14,
              width: '100%', minHeight: 48, padding: '12px 14px',
              borderRadius: 10, background: 'transparent', border: 'none',
              color: '#f87171', fontSize: 14, fontWeight: 500,
              cursor: 'pointer', textAlign: 'left', lineHeight: 1.4,
              transition: 'all 0.15s ease',
            }}
            className="hover:bg-red-500/10 hover:text-red-300"
          >
            <LogOut size={20} style={{ flexShrink: 0 }} />
            <span>{t('header.logout')}</span>
          </button>
        </div>
      </div>

      {/* ===== LOGOUT ERROR ===== */}
      {logoutError && (
        <div style={{ paddingTop: 80, paddingLeft: 'clamp(12px, 3vw, 24px)', paddingRight: 'clamp(12px, 3vw, 24px)', maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ padding: 'var(--space-12) var(--space-16)', border: '1px solid var(--danger)', backgroundColor: 'rgba(255,180,171,0.06)', display: 'flex', alignItems: 'center', gap: 'var(--space-12)', borderRadius: 'var(--radius-md)' }}>
            <AlertCircle size={16} style={{ color: 'var(--danger)', flexShrink: 0 }} />
            <span style={{ fontSize: 'var(--text-sm)' }}>{logoutError}</span>
          </div>
        </div>
      )}

      {/* ===== HERO SECTION ===== */}
      <section style={{
        position: 'relative', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        paddingTop: 80, paddingLeft: 'clamp(12px, 4vw, 24px)',
        paddingRight: 'clamp(12px, 4vw, 24px)',
        minHeight: 'min(600px, 90vh)',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
          <img alt="Cinema theater" src={HERO_IMG} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.3)' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, var(--bg-base) 0%, rgba(5,20,36,0.4) 40%, rgba(5,20,36,0.8) 100%)' }} />
        </div>
        <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', width: '100%', maxWidth: 900, margin: '0 auto', paddingTop: 'clamp(24px, 6vw, 60px)' }}>
          <span style={{ fontSize: 'clamp(10px, 2vw, 11px)', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--accent)', fontWeight: 700, display: 'block', marginBottom: 'clamp(12px, 3vw, 24px)' }}>
            {t('home.experienceBadge')}
          </span>
          <h1 style={{
            fontFamily: "'Montserrat', sans-serif",
            fontSize: 'clamp(1.75rem, 8vw, 4rem)',
            fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.02em',
            color: 'white', maxWidth: '100%', overflowWrap: 'break-word',
            margin: '0 auto',
          }}>
            {t('home.cinematic')}<br />
            <span style={{ color: 'var(--accent)' }}>{t('home.adventure')}</span>
          </h1>
          <p style={{
            fontSize: 'clamp(14px, 2.5vw, 16px)',
            lineHeight: 1.7, color: 'rgba(255,255,255,0.65)',
            maxWidth: 600, margin: 'clamp(12px, 3vw, 24px) auto',
            padding: '0 8px', overflowWrap: 'break-word',
          }}>
            {t('home.heroDesc')}
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 'clamp(8px, 2vw, 16px)', flexWrap: 'wrap', flexDirection: 'row' }}>
            <button className="btn-primary cta-glow" style={{
              padding: 'clamp(12px, 2vw, 16px) clamp(24px, 4vw, 40px)',
              fontWeight: 700, fontSize: 'clamp(13px, 2vw, 14px)',
              whiteSpace: 'nowrap', minHeight: 48,
            }}>
              {t('home.exploreNow')}
            </button>
            <button className="glass-card" style={{
              padding: 'clamp(12px, 2vw, 16px) clamp(24px, 4vw, 40px)',
              color: 'white', fontWeight: 700, fontSize: 'clamp(13px, 2vw, 14px)',
              border: 'none', borderRadius: 16, cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 8,
              transition: 'all 0.3s ease', background: 'rgba(255,255,255,0.05)',
              whiteSpace: 'nowrap', minHeight: 48,
            }}>
              <Play size={16} fill="white" /> {t('home.watchTrailer')}
            </button>
          </div>
        </div>

        {/* Quick Booking Bar */}
        <div style={{
          position: 'relative', zIndex: 20, width: '100%',
          maxWidth: 1000, marginTop: 'clamp(32px, 6vw, 64px)',
          paddingLeft: 'clamp(8px, 2vw, 20px)',
          paddingRight: 'clamp(8px, 2vw, 20px)',
        }}>
          <div className="glass-card" style={{ padding: 8, borderRadius: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}
              className="booking-grid-items md:grid-cols-3">
              {[{ step: '1', label: 'home.date', value: 'home.today' }, { step: '2', label: 'home.movie', value: 'home.allMovies' }, { step: '3', label: 'home.cinema', value: 'home.allCinemas' }].map((item, idx) => (
                <div key={idx} style={{
                  padding: 'clamp(12px, 2vw, 16px) clamp(16px, 3vw, 24px)',
                  cursor: 'pointer', display: 'flex', flexDirection: 'column',
                  justifyContent: 'center', borderRadius: 8,
                  borderTop: idx > 0 ? '1px solid rgba(255,255,255,0.1)' : 'none',
                  transition: 'background 0.3s ease',
                }}>
                  <span style={{ fontSize: 10, color: 'var(--accent)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{item.step}. {t(item.label)}</span>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 500, color: 'white', fontSize: 'clamp(13px, 2vw, 14px)' }}>{t(item.value)}</span>
                    <ChevronDown size={16} style={{ color: 'rgba(255,255,255,0.4)', flexShrink: 0 }} />
                  </div>
                </div>
              ))}
            </div>
            <button className="btn-primary cta-glow" style={{
              width: '100%', padding: 'clamp(12px, 2vw, 16px) clamp(24px, 4vw, 32px)',
              fontWeight: 700, fontSize: 'clamp(13px, 2vw, 14px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
              minHeight: 48,
            }}>
              <Search size={16} /> {t('home.searchNow')}
            </button>
          </div>
        </div>
      </section>

      {/* ===== TOP TRENDING SECTION ===== */}
      <section style={{ width: '100%', maxWidth: 1280, margin: '0 auto', padding: 'clamp(40px, 8vw, 80px) clamp(16px, 4vw, 24px)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 'clamp(24px, 5vw, 48px)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <Sparkles size={16} style={{ color: 'var(--accent)' }} />
              <span style={{ fontSize: 'clamp(10px, 1.5vw, 11px)', color: 'var(--accent)', letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 600 }}>{t('home.weeklyLeaders')}</span>
            </div>
            <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 'clamp(1.25rem, 4vw, 2rem)', fontWeight: 700, margin: 0 }}>
              {t('home.topTrending')}
            </h2>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))',
          gap: 'clamp(16px, 4vw, 40px)',
        }}>
          {TRENDING_DATA.map((item, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ position: 'relative', aspectRatio: '4/5', borderRadius: 16, overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
                <img src={TRENDING_IMGS[i]} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.7s ease' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, black 0%, rgba(0,0,0,0.2) 50%, transparent 100%)' }} />
                <div style={{ position: 'absolute', bottom: 'clamp(12px, 3vw, 24px)', left: 'clamp(12px, 3vw, 24px)', right: 'clamp(12px, 3vw, 24px)' }}>
                  <h3 style={{ fontSize: 'clamp(16px, 3vw, 20px)', fontWeight: 700, color: 'white', marginBottom: 8 }}>{item.title}</h3>
                  <p style={{ fontSize: 'clamp(12px, 2vw, 13px)', color: 'rgba(255,255,255,0.65)', lineHeight: 1.6 }}>{item.desc}</p>
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
      <section style={{ width: '100%', maxWidth: 1280, margin: '0 auto', padding: 'clamp(32px, 6vw, 60px) clamp(16px, 4vw, 24px)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 'clamp(24px, 5vw, 48px)' }}>
          <div>
            <span style={{ fontSize: 'clamp(10px, 1.5vw, 11px)', color: 'var(--accent)', letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: 12 }}>
              {t('home.nowShowingBadge')}
            </span>
            <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 'clamp(1.25rem, 4vw, 2rem)', fontWeight: 700, margin: 0 }}>
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
          <div className="movie-grid">
            {nowShowing.map(movie => (
              <div key={movie.movieId} className="glass-card interactive" style={{ borderRadius: 16, overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.3s ease, box-shadow 0.3s ease' }}
                onClick={() => navigate(`/movie/${movie.movieId}`)}>
                <div style={{ position: 'relative', width: '100%', paddingTop: '150%' }}>
                  <img
                    src={movie.moviePosterURL || PLACEHOLDER_POSTER}
                    alt={movie.movieName}
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                    loading="lazy"
                  />
                </div>
                <div style={{ padding: 'clamp(12px, 2vw, 16px)' }}>
                  <h3 style={{ fontSize: 'clamp(14px, 2vw, 16px)', fontWeight: 700, marginBottom: 'var(--space-8)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{movie.movieName}</h3>
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
        <section style={{ width: '100%', maxWidth: 1280, margin: '0 auto', padding: 'clamp(32px, 6vw, 60px) clamp(16px, 4vw, 24px) 100px' }}>
          <div style={{ marginBottom: 'clamp(24px, 5vw, 48px)' }}>
            <span style={{ fontSize: 'clamp(10px, 1.5vw, 11px)', color: 'var(--accent)', letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: 12 }}>
              {t('home.comingSoonBadge')}
            </span>
            <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 'clamp(1.25rem, 4vw, 2rem)', fontWeight: 700, margin: 0 }}>
              {t('home.comingSoon')}
            </h2>
          </div>
          <div className="movie-grid">
            {comingSoon.map(movie => (
              <div key={movie.movieId} className="glass-card interactive" style={{ borderRadius: 16, overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.3s ease' }}
                onClick={() => navigate(`/movie/${movie.movieId}`)}>
                <div style={{ position: 'relative', width: '100%', paddingTop: '150%' }}>
                  <img
                    src={movie.moviePosterURL || PLACEHOLDER_POSTER}
                    alt={movie.movieName}
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                    loading="lazy"
                  />
                </div>
                <div style={{ padding: 'clamp(12px, 2vw, 16px)' }}>
                  <h3 style={{ fontSize: 'clamp(14px, 2vw, 16px)', fontWeight: 700, marginBottom: 'var(--space-8)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{movie.movieName}</h3>
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
      <footer style={{ borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--bg-surface)', padding: 'clamp(32px, 6vw, 60px) clamp(16px, 4vw, 24px) clamp(24px, 4vw, 40px)' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
          gap: 'clamp(24px, 5vw, 40px)',
          maxWidth: 1280, margin: '0 auto'
        }}>
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
        <div style={{ borderTop: '1px solid var(--border-color)', marginTop: 'clamp(24px, 5vw, 40px)', paddingTop: 24, textAlign: 'center', fontSize: 12, color: 'var(--text-secondary)' }}>
          © 2024 CinemaPro. All rights reserved.
        </div>
      </footer>

      <LogoutModal isOpen={isLogoutModalOpen} onClose={() => setIsLogoutModalOpen(false)} onConfirm={handleLogoutConfirm} loading={logoutLoading} error={logoutError} />
      </div>
    </>
  );
};

/* ------------------------------------------------------------------ */
/*  Sidebar item helper                                                */
/* ------------------------------------------------------------------ */
const SidebarItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}> = ({ icon, label, onClick }) => (
  <button
    onClick={onClick}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      width: '100%',
      minHeight: 48,
      padding: '12px 14px',
      borderRadius: 10,
      background: 'transparent',
      border: 'none',
      color: 'var(--text-secondary)',
      fontSize: 14,
      fontWeight: 500,
      cursor: 'pointer',
      transition: 'all 0.15s ease',
      textAlign: 'left',
      lineHeight: 1.4,
    }}
    className="hover:bg-white/5 hover:text-white"
  >
    {icon}
    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
  </button>
);

export default HomePage;