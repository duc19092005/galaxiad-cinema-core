// src/features/auth/LoginForm.tsx
// Cinema dark theme login page

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { Clapperboard, Mail, Lock, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import Cookies from 'js-cookie';
import { authApi } from '../../api/authApi';
import { identityAxios } from '../../api/axiosClient';
import type { LoginRequest, ApiErrorResponse } from '../../types/auth.types';

const LoginForm: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const state = location.state as { googleError?: string } | null;
    if (state?.googleError) { setErrorMsg(state.googleError); window.history.replaceState({}, ''); }
  }, [location.state]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const redirectPath = params.get('redirect');

    const storedUser = localStorage.getItem('user_info');
    if (storedUser) {
      try {
        const userInfo = JSON.parse(storedUser);
        if (userInfo && userInfo.roles && userInfo.roles.length > 0) {
          if (redirectPath) {
            navigate(redirectPath, { replace: true });
          } else if (userInfo.roles.length === 1) {
            const roleConfig: Record<string, string> = {
              Customer: '/home', Cashier: userInfo.isSharedPosAccount ? '/cashier' : '/staff', Admin: '/admin',
              MovieManager: '/movie-manager', TheaterManager: '/theater-manager', FacilitiesManager: '/facilities-manager',
            };
            navigate(roleConfig[userInfo.roles[0]] || '/role-selection', { replace: true });
          } else { navigate('/role-selection', { replace: true }); }
        }
      } catch {}
    }
  }, [navigate, location.search]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setErrorMsg(null); setLoading(true);
    try {
      const payload: LoginRequest = { email: formData.email, password: formData.password };
      const res = await authApi.regularLogin(payload);
      if (res.isSuccess) {
        localStorage.setItem('user_info', JSON.stringify(res.data));
        window.dispatchEvent(new Event('user_info_updated'));
        if (res.data.accessToken) Cookies.set('X-Access-Token', res.data.accessToken, { expires: 7, sameSite: 'Lax' });

        const params = new URLSearchParams(location.search);
        const redirectPath = params.get('redirect');
        if (redirectPath) {
          navigate(redirectPath);
        } else if (res.data.roles?.length === 1) {
          const roleConfig: Record<string, string> = {
            Customer: '/home',
            Cashier: res.data.isSharedPosAccount ? '/cashier' : '/staff',
            Admin: '/admin',
            MovieManager: '/movie-manager',
            TheaterManager: '/theater-manager',
            FacilitiesManager: '/facilities-manager',
          };
          navigate(roleConfig[res.data.roles[0]] || '/role-selection');
        } else {
          navigate('/role-selection');
        }
      } else { setErrorMsg(t('auth.login_failed')); }
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        if (error.response) { setErrorMsg((error.response.data as ApiErrorResponse).message || 'Login failed.'); }
        else if (error.request) { setErrorMsg(t('auth.cannot_connect')); }
        else { setErrorMsg(t('auth.error_occurred')); }
      } else { setErrorMsg(t('auth.unexpected_error')); }
    } finally { setLoading(false); }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const response = await identityAxios.get('/IdentityAccess/google-login?platform=web');
      const data = response.data;
      if (data.isSuccess) { window.location.href = data.data.redirectUrl; }
      else { setErrorMsg(t('auth.google_login_failed')); setLoading(false); }
    } catch { setErrorMsg(t('auth.google_connect_failed')); setLoading(false); }
  };

  return (
    <div style={{
      width: '100%', minHeight: '100vh', overflow: 'hidden',
      background: 'var(--bg-base)',
      position: 'relative',
    }}>
      {/* Cinematic Background */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0,
        background: `
          radial-gradient(ellipse at 20% 50%, rgba(255,138,0,0.08) 0%, transparent 50%),
          radial-gradient(ellipse at 80% 20%, rgba(255,138,0,0.04) 0%, transparent 50%),
          radial-gradient(ellipse at 50% 80%, rgba(255,138,0,0.03) 0%, transparent 50%),
          #0a0a0a
        `,
      }} />

      {/* Decorative grid lines */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0,
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
        `,
        backgroundSize: '60px 60px',
        maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 70%)',
        WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 70%)',
      }} />

      <div style={{
        position: 'relative', zIndex: 10,
        display: 'flex', minHeight: '100vh', width: '100%',
        alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}>
        {/* Login Card */}
        <div
          className="glass-card"
          style={{
            width: '100%', maxWidth: 420,
            padding: '40px 36px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Subtle top gradient accent */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 3,
            background: 'linear-gradient(90deg, #ff8a00, #ea580c, #ff8a00)',
            backgroundSize: '200% 100%',
            animation: 'gradientShift 3s ease-in-out infinite',
          }} />

          {/* Logo & Title */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 36 }}>
            <div style={{
              width: 64, height: 64, borderRadius: 16,
              background: 'linear-gradient(135deg, #ff8a00, #ea580c)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 20,
              boxShadow: '0 8px 32px rgba(255,138,0,0.3)',
            }}>
              <Clapperboard size={28} style={{ color: '#fff' }} />
            </div>
            <h1 style={{
              fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em',
              color: 'var(--text-primary)', margin: 0,
            }}>
              CINEMA
            </h1>
            <p style={{
              fontSize: 12, color: 'var(--text-muted)', marginTop: 4,
              fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}>
              {t('auth.the_ultimate_cinematic_experience')}
            </p>
          </div>

          {errorMsg && (
            <div style={{
              padding: '10px 14px', marginBottom: 20, borderRadius: 10,
              display: 'flex', alignItems: 'center', gap: 10,
              border: '1px solid rgba(239, 68, 68, 0.2)',
              background: 'rgba(239, 68, 68, 0.08)',
              fontSize: 12, color: 'var(--danger)',
            }}>
              <AlertCircle size={14} style={{ flexShrink: 0 }} />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, letterSpacing: '0.03em' }}>
                {t('auth.email_address')}
              </label>
              <div className="relative">
                <Mail size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="name@cinema.com"
                  className="input"
                  style={{ paddingLeft: 40 }}
                  required
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, letterSpacing: '0.03em' }}>
                {t('auth.password')}
              </label>
              <div className="relative">
                <Lock size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="input"
                  style={{ paddingLeft: 40, paddingRight: 40 }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="btn-icon"
                  style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)' }}
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{
                width: '100%', padding: '12px 20px', fontSize: 14,
                justifyContent: 'center', marginTop: 4,
              }}
            >
                {loading ? (
                <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> {t('auth.signing_in')}</>
              ) : t('auth.login')}
            </button>
          </form>

          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '24px 0',
            position: 'relative',
          }}>
            <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: 1, background: 'var(--border-color)' }} />
            <span style={{
              position: 'relative', padding: '0 16px',
              fontSize: 10, color: 'var(--text-muted)',
              background: 'var(--bg-surface)',
              fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}>
              {t('auth.or_continue_with')}
            </span>
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={handleGoogleLogin}
            className="btn btn-secondary"
            style={{
              width: '100%', padding: '12px 20px', fontSize: 13,
              justifyContent: 'center', gap: 10,
            }}
          >
            <svg className="w-5 h-5" viewBox="0 0 48 48" style={{ width: 18, height: 18 }}>
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
              <path fill="none" d="M0 0h48v48H0z" />
            </svg>
            {t('auth.google_account')}
          </button>

          <div style={{
            marginTop: 24, textAlign: 'center',
            fontSize: 12, color: 'var(--text-muted)',
            display: 'flex', flexDirection: 'column', gap: 12,
          }}>
            <div>
              {t('auth.no_account')}{' '}
              <Link to="/register" style={{ color: 'var(--accent)', fontWeight: 600 }}>{t('auth.register_now')}</Link>
            </div>
            <div>
              <span style={{ opacity: 0.6 }}>{t('auth.no_login')} </span>
              <Link to="/home" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{t('auth.go_to_movies')}</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
