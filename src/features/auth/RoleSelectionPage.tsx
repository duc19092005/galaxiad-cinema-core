// src/features/auth/RoleSelectionPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Shield, Ticket, Film, Building2, Wrench, Loader2, AlertCircle } from 'lucide-react';
import { authApi } from '../../api/authApi';
import axios from 'axios';
import type { ApiErrorResponse } from '../../types/auth.types';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import Cookies from 'js-cookie';

const roleConfig: Record<string, { icon: React.ElementType; label: string; route: string; accentVar: string }> = {
  Customer: { icon: Ticket, label: 'roles.customer', route: '/home', accentVar: '--accent' },
  Cashier: { icon: Ticket, label: 'roles.cashier', route: '/cashier', accentVar: '--success' },
  Admin: { icon: Shield, label: 'roles.admin', route: '/admin', accentVar: '--info' },
  MovieManager: { icon: Film, label: 'roles.movieManager', route: '/movie-manager', accentVar: '--accent' },
  TheaterManager: { icon: Building2, label: 'roles.theaterManager', route: '/theater-manager', accentVar: '--accent' },
  FacilitiesManager: { icon: Wrench, label: 'roles.facilitiesManager', route: '/facilities-manager', accentVar: '--accent' },
};

const RoleSelectionPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [user, setUser] = useState<{ username: string; roles: string[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user_info');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        if (userData.roles && userData.roles.length === 1) {
          const roleInfo = roleConfig[userData.roles[0]];
          if (roleInfo) { navigate(roleInfo.route); return; }
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
      navigate(roleInfo.route);
    }
  };

  if (loading) {
    return (
      <div className="state-center" style={{ minHeight: '100vh' }}>
        <Loader2 size={32} style={{ color: 'var(--accent)', animation: 'spin 1s linear infinite' }} />
        <p className="text-muted">Loading...</p>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="state-center" style={{ minHeight: '100vh', gap: 'var(--space-6)' }}>
        <AlertCircle size={40} style={{ color: 'var(--danger)' }} />
        <p style={{ color: 'var(--danger)' }}>{error}</p>
        <button className="btn btn-primary" onClick={() => navigate('/login')}>
          {t('roles.backToLogin')}
        </button>
      </div>
    );
  }

  const availableRoles = user?.roles || [];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-base)' }}>
      {/* Header */}
      <header className="navbar">
        <div className="navbar-brand">
          <span>Cinema</span>
          <span style={{ fontWeight: 400, color: 'var(--text-secondary)' }}>Pro</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
          <LanguageSwitcher />
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              backgroundColor: 'var(--accent-soft)',
            }}>
              <User size={16} style={{ color: 'var(--accent)' }} />
            </div>
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>
              {user?.username || t('roles.guest')}
            </span>
          </div>
        </div>
      </header>

      <main style={{ paddingTop: 'var(--space-12)', paddingLeft: 'var(--space-6)', paddingRight: 'var(--space-6)', maxWidth: 960, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-12)' }}>
          <h1 className="heading-xl section-header" style={{ justifyContent: 'center', marginBottom: 'var(--space-3)' }}>
            {t('roles.selectRole')}
          </h1>
          <p className="text-secondary" style={{ fontSize: 'var(--text-lg)' }}>
            {t('roles.chooseRole')}
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: 'var(--space-5)',
        }}>
          {availableRoles.map(role => {
            const roleInfo = roleConfig[role];
            if (!roleInfo) return null;
            const Icon = roleInfo.icon;
            const isSelected = selectedRole === role;

            return (
              <button
                key={role}
                onClick={() => handleRoleSelect(role)}
                disabled={isSelected}
                className="card card-hover"
                style={{
                  padding: 'var(--space-8)',
                  textAlign: 'center',
                  cursor: 'pointer',
                  position: 'relative',
                  borderColor: isSelected ? 'var(--accent)' : 'var(--border)',
                  opacity: isSelected ? 0.9 : 1,
                }}
              >
                <div style={{
                  width: 64, height: 64,
                  borderRadius: 'var(--radius-full)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  backgroundColor: 'var(--accent-soft)',
                  margin: '0 auto var(--space-5)',
                }}>
                  <Icon size={28} style={{ color: 'var(--accent)' }} />
                </div>

                <h3 style={{
                  fontSize: 'var(--text-lg)', fontWeight: 500,
                  marginBottom: 'var(--space-2)',
                }}>
                  {t(roleInfo.label)}
                </h3>

                <p className="text-muted" style={{ fontSize: 'var(--text-sm)' }}>
                  {t('roles.clickToContinue')}
                </p>

                {isSelected && (
                  <span className="badge badge-accent" style={{ marginTop: 'var(--space-4)' }}>
                    {t('roles.selected')}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {error && (
          <div className="card" style={{
            marginTop: 'var(--space-6)',
            padding: 'var(--space-3) var(--space-4)',
            display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
            borderColor: 'var(--danger)', backgroundColor: 'var(--danger-soft)',
          }}>
            <AlertCircle size={16} style={{ color: 'var(--danger)', flexShrink: 0 }} />
            <span style={{ fontSize: 'var(--text-sm)' }}>{error}</span>
          </div>
        )}
      </main>
    </div>
  );
};

export default RoleSelectionPage;
