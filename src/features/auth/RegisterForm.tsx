// src/features/auth/RegisterForm.tsx
// Cinema dark theme registration page

import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Clapperboard, User, Mail, CreditCard, Phone, Calendar, Lock, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { showSuccess } from '../../utils/ToastUtils';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../../api/authApi';
import { identityAxios } from '../../api/axiosClient';
import type { RegisterRequest, ApiErrorResponse } from '../../types/auth.types';

interface FormData {
  fullName: string;
  email: string;
  identityCard: string;
  phoneNumber: string;
  birthDate: string;
  password: string;
  confirmPassword: string;
}

const RegisterForm: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [formData, setFormData] = useState<FormData>({
    fullName: '', email: '', identityCard: '', phoneNumber: '', birthDate: '', password: '', confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setErrorMsg(null);
    if (formData.password !== formData.confirmPassword) { setErrorMsg('Passwords do not match!'); return; }
    try {
      setLoading(true);
      const payload: RegisterRequest = {
        userName: formData.fullName, userEmail: formData.email,
        identityCode: formData.identityCard, phoneNumber: formData.phoneNumber,
        userPassword: formData.password, userRepassword: formData.confirmPassword,
        dateOfBirth: formData.birthDate ? new Date(formData.birthDate).toISOString() : new Date().toISOString(),
      };
      const res = await authApi.regularRegister(payload);
      if (res.isSuccess) { showSuccess(res.message || t('toast.registrationSuccess')); navigate('/login'); }
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response) {
        setErrorMsg((error.response.data as ApiErrorResponse).message || 'Authentication error.');
      } else { setErrorMsg('Unable to connect to the server.'); }
    } finally { setLoading(false); }
  };

  const handleGoogleLogin = async () => {
    try { setLoading(true);
      const response = await identityAxios.get('/IdentityAccess/google-login?platform=web');
      const data = response.data;
      if (data.isSuccess) window.location.href = data.data.redirectUrl;
      else { setErrorMsg('Failed to initialize Google Registration.'); setLoading(false); }
    } catch { setErrorMsg('Failed to connect to Google service.'); setLoading(false); }
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
        padding: 16, overflowY: 'auto',
      }}>
        <div
          className="glass-card"
          style={{
            width: '100%', maxWidth: 560,
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
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 28 }}>
            <div style={{
              width: 56, height: 56, borderRadius: 16,
              background: 'linear-gradient(135deg, #ff8a00, #ea580c)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 16,
              boxShadow: '0 8px 32px rgba(255,138,0,0.3)',
            }}>
              <Clapperboard size={24} style={{ color: '#fff' }} />
            </div>
            <h1 style={{
              fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em',
              color: 'var(--text-primary)', margin: 0,
            }}>
              Member registration
            </h1>
            <p style={{
              fontSize: 11, color: 'var(--text-muted)', marginTop: 4,
              fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.03em',
            }}>
              Join us now to receive exclusive ticket and snack offers
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

          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, letterSpacing: '0.03em' }}>Full name</label>
              <div className="relative">
                <User size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} placeholder="Your full name" className="input" style={{ paddingLeft: 38 }} required />
              </div>
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, letterSpacing: '0.03em' }}>Email address</label>
              <div className="relative">
                <Mail size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="name@cinema.com" className="input" style={{ paddingLeft: 38 }} required />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, letterSpacing: '0.03em' }}>Identity card</label>
              <div className="relative">
                <CreditCard size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                <input type="text" name="identityCard" value={formData.identityCard} onChange={handleChange} placeholder="123456789" className="input" style={{ paddingLeft: 38 }} />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, letterSpacing: '0.03em' }}>Phone number</label>
              <div className="relative">
                <Phone size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                <input type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} placeholder="0912345678" className="input" style={{ paddingLeft: 38 }} />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, letterSpacing: '0.03em' }}>Date of birth</label>
              <div className="relative">
                <Calendar size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                <input type="date" name="birthDate" value={formData.birthDate} onChange={handleChange} className="input" style={{ paddingLeft: 38 }} />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, letterSpacing: '0.03em' }}>Password</label>
              <div className="relative">
                <Lock size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                <input type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange} placeholder="Min. 6 characters" className="input" style={{ paddingLeft: 38, paddingRight: 38 }} required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="btn-icon" style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)' }}>
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, letterSpacing: '0.03em' }}>Confirm password</label>
              <div className="relative">
                <Lock size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="Repeat password" className="input" style={{ paddingLeft: 38 }} required />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary" style={{ gridColumn: '1 / -1', width: '100%', padding: '12px 20px', justifyContent: 'center', marginTop: 4 }}>
              {loading ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Registering...</> : 'Create account'}
            </button>
          </form>

          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '20px 0',
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
              OR CONTINUE WITH
            </span>
          </div>

          <button type="button" disabled={loading} onClick={handleGoogleLogin} className="btn btn-secondary" style={{ width: '100%', padding: '12px 20px', justifyContent: 'center', gap: 10, fontSize: 13 }}>
            <svg style={{ width: 18, height: 18 }} viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
              <path fill="none" d="M0 0h48v48H0z" />
            </svg>
            Google account
          </button>

          <div style={{ marginTop: 16, textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 600 }}>Login</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;