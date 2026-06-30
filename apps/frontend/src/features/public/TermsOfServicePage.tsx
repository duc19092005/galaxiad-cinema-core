import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronLeft } from 'lucide-react';
import Header from '../../components/Header';

const sectionStyle = { marginBottom: 28 };
const headingStyle = { fontSize: 16, fontWeight: 700, marginBottom: 8, color: 'var(--accent)' as string };
const bodyStyle = { fontSize: 14, lineHeight: 1.8, color: 'var(--text-secondary)' as string, margin: 0 };

const Section: React.FC<{ title: string; body: string }> = ({ title, body }) => (
  <div style={sectionStyle}>
    <h2 style={headingStyle}>{title}</h2>
    <p style={bodyStyle}>{body}</p>
  </div>
);

const TermsOfServicePage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const currentDate = new Date().toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric' });

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
            <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>{t('termsOfService.title')}</h1>
          </div>
        </div>
        <div className="page-enter-d1" style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-color)', padding: 'clamp(24px, 4vw, 40px)' }}>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 24, fontStyle: 'italic' }}>
            {t('termsOfService.lastUpdated')} {currentDate}
          </p>
          <p style={{ fontSize: 15, lineHeight: 1.8, color: 'var(--text-secondary)', marginBottom: 32 }}>{t('termsOfService.intro')}</p>
          <Section title={t('termsOfService.eligibility')} body={t('termsOfService.eligibilityBody')} />
          <Section title={t('termsOfService.accounts')} body={t('termsOfService.accountsBody')} />
          <Section title={t('termsOfService.tickets')} body={t('termsOfService.ticketsBody')} />
          <Section title={t('termsOfService.conduct')} body={t('termsOfService.conductBody')} />
          <Section title={t('termsOfService.intellectual')} body={t('termsOfService.intellectualBody')} />
          <Section title={t('termsOfService.termination')} body={t('termsOfService.terminationBody')} />
          <Section title={t('termsOfService.limitation')} body={t('termsOfService.limitationBody')} />
          <Section title={t('termsOfService.governing')} body={t('termsOfService.governingBody')} />
          <Section title={t('termsOfService.contact')} body={t('termsOfService.contactBody')} />
        </div>
      </main>
    </div>
  );
};

export default TermsOfServicePage;
