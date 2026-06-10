// src/features/auth/RegisterForm.tsx
import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Clapperboard, User, Mail, CreditCard, Phone, Calendar, Lock, Loader2, AlertCircle } from 'lucide-react';
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

interface FieldProps {
  label: string;
  name: keyof FormData;
  type?: string;
  icon: React.ElementType;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const InputField: React.FC<FieldProps> = ({ label, name, type = 'text', icon: Icon, placeholder, value, onChange }) => (
  <div className="flex flex-col">
    <label htmlFor={name} style={{ marginBottom: 'var(--space-2)', fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--text-secondary)' }}>
      {label}
    </label>
    <div className="relative group">
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, display: 'flex', alignItems: 'center', paddingLeft: 'var(--space-4)', pointerEvents: 'none' }}>
        <Icon size={16} style={{ color: 'var(--text-muted)' }} />
      </div>
      <input
        type={type} id={name} name={name} value={value} onChange={onChange}
        placeholder={placeholder}
        style={{
          width: '100%', padding: '10px 14px 10px 40px',
          backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)',
          border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
          outline: 'none', fontSize: 'var(--text-sm)',
        }}
        onFocus={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.boxShadow = '0 0 0 3px var(--accent-ring)'; }}
        onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
        required
      />
    </div>
  </div>
);

const RegisterForm: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [formData, setFormData] = useState<FormData>({
    fullName: '', email: '', identityCard: '', phoneNumber: '', birthDate: '', password: '', confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
    <div style={{ width: '100%', minHeight: '100vh', overflow: 'hidden', backgroundColor: 'var(--bg-base)' }}>
      <div style={{ position: 'absolute', inset: 0, zIndex: 0, backgroundImage: "url('https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=2070&auto=format&fit=crop')", backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.15 }} />
      <div style={{ position: 'absolute', inset: 0, zIndex: 0, background: 'linear-gradient(to top, var(--bg-base) 0%, transparent 100%)' }} />

      <div style={{ position: 'relative', zIndex: 10, display: 'flex', minHeight: '100vh', width: '100%', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-4)', overflowY: 'auto' }}>
        <div className="card" style={{ width: '100%', maxWidth: 560, padding: 'var(--space-8)', boxShadow: 'var(--shadow-xl)' }}>
          {/* Header */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
            <div style={{ width: 56, height: 56, borderRadius: 'var(--radius-xl)', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--accent-soft)', marginBottom: 'var(--space-4)' }}>
              <Clapperboard size={24} style={{ color: 'var(--accent)' }} />
            </div>
            <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 500, letterSpacing: '-0.3px', margin: 0 }}>
              Member registration
            </h1>
            <p className="text-secondary" style={{ fontSize: 'var(--text-sm)', marginTop: 'var(--space-2)' }}>
              Join us now to receive exclusive ticket and snack offers
            </p>
          </div>

          {errorMsg && (
            <div className="card" style={{ padding: 'var(--space-3) var(--space-4)', marginBottom: 'var(--space-6)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)', borderColor: 'var(--danger)', backgroundColor: 'var(--danger-soft)' }}>
              <AlertCircle size={16} style={{ color: 'var(--danger)', flexShrink: 0 }} />
              <span style={{ fontSize: 'var(--text-sm)' }}>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <InputField label="Full name" name="fullName" icon={User} placeholder="Your full name" value={formData.fullName} onChange={handleChange} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <InputField label="Email address" name="email" type="email" icon={Mail} placeholder="name@cinema.com" value={formData.email} onChange={handleChange} />
            </div>
            <InputField label="Identity card" name="identityCard" icon={CreditCard} placeholder="123456789" value={formData.identityCard} onChange={handleChange} />
            <InputField label="Phone number" name="phoneNumber" type="tel" icon={Phone} placeholder="0912345678" value={formData.phoneNumber} onChange={handleChange} />
            <InputField label="Date of birth" name="birthDate" type="date" icon={Calendar} value={formData.birthDate} onChange={handleChange} />
            <InputField label="Password" name="password" type="password" icon={Lock} placeholder="Min. 6 characters" value={formData.password} onChange={handleChange} />
            <InputField label="Confirm password" name="confirmPassword" type="password" icon={Lock} placeholder="Repeat password" value={formData.confirmPassword} onChange={handleChange} />

            <button type="submit" disabled={loading} className="btn btn-primary" style={{ gridColumn: '1 / -1', width: '100%', padding: '12px 20px', justifyContent: 'center', marginTop: 'var(--space-2)' }}>
              {loading ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Registering...</> : 'Create account'}
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', margin: 'var(--space-5) 0', position: 'relative' }}>
            <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: 1, backgroundColor: 'var(--border)' }} />
            <span style={{ position: 'relative', padding: '0 var(--space-4)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)', backgroundColor: 'var(--bg-surface)' }}>
              OR CONTINUE WITH
            </span>
          </div>

          <button type="button" disabled={loading} onClick={handleGoogleLogin} className="btn btn-secondary" style={{ width: '100%', padding: '12px 20px', justifyContent: 'center' }}>
            <svg className="w-5 h-5" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
              <path fill="none" d="M0 0h48v48H0z" />
            </svg>
            Google account
          </button>

          <div style={{ marginTop: 'var(--space-5)', textAlign: 'center', fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 500 }}>Login</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;