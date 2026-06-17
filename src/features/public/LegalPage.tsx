// src/features/public/LegalPage.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, Shield, FileText, Cookie, AlertTriangle } from 'lucide-react';
import Header from '../../components/Header';

const LegalPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const links = [
    { key: 'privacy', icon: <Shield size={20} />, path: '/privacy-policy' },
    { key: 'terms', icon: <FileText size={20} />, path: '/terms-of-service' },
    { key: 'cookies', icon: <Cookie size={20} />, path: '/cookie-policy' },
    { key: 'safety', icon: <AlertTriangle size={20} />, path: '/safety-rules' },
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)' }}>
      <Header />
      <main className="page-enter" style={{ maxWidth: 900, margin: '0 auto', padding: 'clamp(88px, 12vw, 112px) clamp(16px, 4vw, 24px) clamp(48px, 6vw, 64px)' }}>
        {/* Back + Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
          <button onClick={() => navigate('/')}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 44, height: 44, borderRadius: 'var(--radius-md)', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', cursor: 'pointer' }}
            className="interactive">
            <ChevronLeft size={22} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="amber-line" />
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>{t('legal.title')}</h1>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: '4px 0 0' }}>{t('legal.subtitle')}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="page-enter-d1" style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-color)', padding: 'clamp(24px, 4vw, 40px)' }}>
          <p style={{ fontSize: 15, lineHeight: 1.8, color: 'var(--text-secondary)', marginBottom: 32 }}>
            {t('legal.desc')}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {links.map((link) => (
              <button key={link.key} onClick={() => navigate(link.path)}
                style={{ display: 'flex', alignItems: 'center', gap: 14, width: '100%', padding: '16px 20px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', cursor: 'pointer', fontSize: 14, fontWeight: 600, textAlign: 'left', transition: 'all 0.2s' }}
                onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255,138,0,0.06)'; e.currentTarget.style.borderColor = 'rgba(255,138,0,0.15)'; }}
                onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.borderColor = 'var(--border-color)'; }}>
                <span style={{ color: 'var(--accent)', display: 'flex' }}>{link.icon}</span>
                <div>
                  <span>{t(`legal.${link.key}`)}</span>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 400, margin: '2px 0 0' }}>{t(`legal.${link.key}Body`)}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default LegalPage;
