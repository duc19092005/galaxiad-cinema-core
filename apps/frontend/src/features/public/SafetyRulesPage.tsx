import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, Shield, Flame, Heart, Lock } from 'lucide-react';
import Header from '../../components/Header';

const icons = [<Shield size={20} />, <Flame size={20} />, <Heart size={20} />, <Lock size={20} />, <Lock size={20} />];

const SafetyRulesPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const sections = [
    { key: 'general' }, { key: 'fire' }, { key: 'health' }, { key: 'security' }, { key: 'children' },
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)' }}>
      <Header />
      <main className="page-enter" style={{ maxWidth: 900, margin: '0 auto', padding: 'clamp(88px, 12vw, 112px) clamp(16px, 4vw, 24px) clamp(48px, 6vw, 64px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
          <button onClick={() => navigate('/')}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 44, height: 44, borderRadius: 'var(--radius-md)', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', cursor: 'pointer' }}
            className="interactive"><ChevronLeft size={22} /></button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="amber-line" />
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>{t('safetyRules.title')}</h1>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: '4px 0 0' }}>{t('safetyRules.subtitle')}</p>
            </div>
          </div>
        </div>
        <div className="page-enter-d1" style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-color)', padding: 'clamp(24px, 4vw, 40px)' }}>
          <p style={{ fontSize: 15, lineHeight: 1.8, color: 'var(--text-secondary)', marginBottom: 32 }}>{t('safetyRules.intro')}</p>
          {sections.map((s, i) => (
            <div key={s.key} style={{ display: 'flex', gap: 14, marginBottom: 24, padding: 16, borderRadius: 'var(--radius-md)', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)' }}>
              <div style={{ color: 'var(--accent)', marginTop: 2, flexShrink: 0 }}>{icons[i]}</div>
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 4px' }}>{t(`safetyRules.${s.key}`)}</h3>
                <p style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--text-secondary)', margin: 0 }}>{t(`safetyRules.${s.key}Body`)}</p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default SafetyRulesPage;
