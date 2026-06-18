// src/features/auth/RoleSelectionPage.tsx
// Cinema dark theme role selection page

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Shield, Ticket, Film, Building2, Wrench, Loader2, AlertCircle, Clapperboard } from 'lucide-react';
import { authApi } from '../../api/authApi';
import axios from 'axios';
import type { ApiErrorResponse } from '../../types/auth.types';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import Cookies from 'js-cookie';

const roleConfig: Record<string, { icon: React.ElementType; label: string; route: string; description: string; gradient: string }> = {
  Customer: { icon: Ticket, label: 'roles.customer', route: '/home', description: 'Browse movies and book tickets', gradient: 'linear-gradient(135deg, #ff8a00, #ea580c)' },
  Cashier: { icon: Ticket, label: 'roles.cashier', route: '/staff', description: 'Manage personal shifts and attendance', gradient: 'linear-gradient(135deg, #059669, #10b981)' },
  Admin: { icon: Shield, label: 'roles.admin', route: '/admin', description: 'Full system administration', gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)' },
  MovieManager: { icon: Film, label: 'roles.movieManager', route: '/movie-manager', description: 'Manage movie listings', gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)' },
  TheaterManager: { icon: Building2, label: 'roles.theaterManager', route: '/theater-manager', description: 'Manage theater schedules', gradient: 'linear-gradient(135deg, #ec4899, #db2777)' },
  FacilitiesManager: { icon: Wrench, label: 'roles.facilitiesManager', route: '/facilities-manager', description: 'Manage cinemas and facilities', gradient: 'linear-gradient(135deg, #f59e0b, #d97706)' },
};

const RoleSelectionPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [user, setUser] = useState<{ username: string; roles: string[]; isSharedPosAccount?: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [hoveredRole, setHoveredRole] = useState<string | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user_info');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        if (userData.roles && userData.roles.length === 1) {
          const roleInfo = roleConfig[userData.roles[0]];
          if (roleInfo) { navigate(userData.roles[0] === 'Cashier' && userData.isSharedPosAccount ? '/cashier' : roleInfo.route); return; }
        }
        testAuthentication();
      } catch { setError('Invalid user data'); setLoading(false); }
    } else { navigate('/login'); }
  }, [navigate]);

  const testAuthentication = async () => {
    try {
      const res = await authApi.getProfile();
      if (res.isSuccess) {
        const currentStored = localStorage.getItem('user_info');
        if (currentStored) {
          const current = JSON.parse(currentStored);
          const updated = { ...current, ...res.data };
          localStorage.setItem('user_info', JSON.stringify(updated));
          window.dispatchEvent(new Event('user_info_updated'));
          setUser(updated);
        }
      }
      setLoading(false);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        const data = err.response.data as ApiErrorResponse;
        if (data.statusCode === 401) {
          localStorage.removeItem('user_info'); Cookies.remove('X-Access-Token');
          navigate('/login'); return;
        }
        setError(data.message || 'Authentication failed');
      } else { setError('Unable to connect to server'); }
      setLoading(false);
    }
  };

  const handleRoleSelect = (role: string) => {
    setSelectedRole(role);
    const roleInfo = roleConfig[role];
    if (roleInfo) {
      const userData = { ...user, selectedRole: role };
      localStorage.setItem('user_info', JSON.stringify(userData));
      window.dispatchEvent(new Event('user_info_updated'));
      navigate(role === 'Cashier' && user?.isSharedPosAccount ? '/cashier' : roleInfo.route);
    }
  };

  if (loading) {
    return (
      <div className="state-center" style={{ minHeight: '100vh' }}>
        <Loader2 size={32} style={{ color: 'var(--accent)', animation: 'spin 1s linear infinite' }} />
        <p style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace", marginTop: 8 }}>Loading...</p>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="state-center" style={{ minHeight: '100vh', gap: 16 }}>
        <AlertCircle size={40} style={{ color: 'var(--danger)' }} />
        <p style={{ color: 'var(--danger)', fontSize: 13 }}>{error}</p>
        <button className="btn btn-primary" onClick={() => navigate('/login')}>
          {t('roles.backToLogin')}
        </button>
      </div>
    );
  }

  const availableRoles = user?.roles || [];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-base)',
      position: 'relative',
    }}>
      {/* Background effects */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0,
        background: `
          radial-gradient(ellipse at 20% 30%, rgba(255,138,0,0.06) 0%, transparent 50%),
          radial-gradient(ellipse at 80% 70%, rgba(255,138,0,0.04) 0%, transparent 50%),
          #0a0a0a
        `,
      }} />
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0,
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)
        `,
        backgroundSize: '60px 60px',
        maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 70%)',
        WebkitMaskImage: 'radial-gradient(ellipse at center, black 40%, transparent 70%)',
      }} />

      {/* Header */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: 64, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px',
        background: 'rgba(10,10,10,0.8)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border-color)',
      }}>
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
            fontFamily: "'Montserrat', sans-serif", fontSize: 20, fontWeight: 800,
            color: 'var(--text-primary)', letterSpacing: '0.08em',
          }}
          onClick={() => navigate('/home')}
        >
          <Clapperboard size={20} style={{ color: 'var(--accent)' }} />
          <span>CINEMA</span>
          <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: 14 }}>Pro</span>
        </div>
        <LanguageSwitcher />
      </header>

      <main style={{
        position: 'relative', zIndex: 10,
        paddingTop: 96,
        maxWidth: 960, margin: '0 auto',
        paddingLeft: 24, paddingRight: 24,
      }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
            marginBottom: 8,
          }}>
            <h1 style={{
              fontSize: 28, fontWeight: 800,
              letterSpacing: '-0.02em',
              color: 'var(--text-primary)', margin: 0,
            }}>
              {t('roles.selectRole')}
            </h1>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', maxWidth: 400, margin: '0 auto' }}>
            {t('roles.chooseRole')}
          </p>
          <div style={{
            marginTop: 12,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={14} style={{ color: 'var(--accent)' }} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
              {user?.username || t('roles.guest')}
            </span>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))',
          gap: 20,
        }}>
          {availableRoles.map(role => {
            const roleInfo = roleConfig[role];
            if (!roleInfo) return null;
            const Icon = roleInfo.icon;
            const isSelected = selectedRole === role;
            const isHovered = hoveredRole === role;

            return (
              <button
                key={role}
                onClick={() => handleRoleSelect(role)}
                disabled={isSelected}
                onMouseEnter={() => setHoveredRole(role)}
                onMouseLeave={() => setHoveredRole(null)}
                className="glass-card"
                style={{
                  padding: 32,
                  textAlign: 'center',
                  cursor: 'pointer',
                  position: 'relative',
                  border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--border-color)'}`,
                  opacity: isSelected ? 0.9 : 1,
                  transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
                  transition: 'all 0.2s ease',
                }}
              >
                {/* Icon */}
                <div style={{
                  width: 64, height: 64,
                  borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: isSelected ? roleInfo.gradient : 'var(--accent-soft)',
                  margin: '0 auto 20px',
                  boxShadow: isSelected ? '0 8px 24px rgba(255,138,0,0.3)' : 'none',
                  transition: 'all 0.2s ease',
                }}>
                  <Icon size={28} style={{ color: isSelected ? '#fff' : 'var(--accent)' }} />
                </div>

                {/* Name */}
                <h3 style={{
                  fontSize: 16, fontWeight: 700,
                  marginBottom: 8,
                  color: 'var(--text-primary)',
                }}>
                  {t(roleInfo.label)}
                </h3>

                {/* Description */}
                <p style={{
                  fontSize: 11, color: 'var(--text-muted)',
                  margin: 0, lineHeight: 1.5,
                }}>
                  {roleInfo.description}
                </p>

                {/* Selected badge */}
                {isSelected && (
                  <div style={{
                    marginTop: 16,
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '4px 14px',
                    borderRadius: 20,
                    background: 'var(--accent)',
                    color: '#fff',
                    fontSize: 11, fontWeight: 700,
                  }}>
                    <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
                    {t('roles.selected')}
                  </div>
                )}

                {/* Hover indicator */}
                {isHovered && !isSelected && (
                  <div style={{
                    position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
                    fontSize: 10, color: 'var(--accent)',
                    fontWeight: 600,
                  }}>
                    Click to enter →
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {error && (
          <div style={{
            marginTop: 24,
            padding: '10px 14px', borderRadius: 10,
            display: 'flex', alignItems: 'center', gap: 10,
            border: '1px solid rgba(239, 68, 68, 0.2)',
            background: 'rgba(239, 68, 68, 0.08)',
            fontSize: 12, color: 'var(--danger)',
          }}>
            <AlertCircle size={14} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}
      </main>
    </div>
  );
};

export default RoleSelectionPage;
