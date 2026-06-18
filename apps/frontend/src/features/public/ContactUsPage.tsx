import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, Mail, Phone, MapPin, Clock } from 'lucide-react';
import Header from '../../components/Header';

const ContactUsPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const items = [
    { icon: <Mail size={20} />, title: t('contactUs.email'), body: t('contactUs.emailBody') },
    { icon: <Phone size={20} />, title: t('contactUs.phone'), body: t('contactUs.phoneBody') },
    { icon: <MapPin size={20} />, title: t('contactUs.address'), body: t('contactUs.addressBody') },
    { icon: <Clock size={20} />, title: t('contactUs.hours'), body: t('contactUs.hoursBody') },
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
              <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>{t('contactUs.title')}</h1>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: '4px 0 0' }}>{t('contactUs.subtitle')}</p>
            </div>
          </div>
        </div>
        <div className="page-enter-d1" style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-color)', padding: 'clamp(24px, 4vw, 40px)' }}>
          <p style={{ fontSize: 15, lineHeight: 1.8, color: 'var(--text-secondary)', marginBottom: 32 }}>{t('contactUs.desc')}</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: 16 }}>
            {items.map((v, i) => (
              <div key={i} style={{ padding: 20, borderRadius: 'var(--radius-md)', background: 'rgba(255,138,0,0.04)', border: '1px solid rgba(255,138,0,0.1)' }}>
                <div style={{ color: 'var(--accent)', marginBottom: 12 }}>{v.icon}</div>
                <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 6px' }}>{v.title}</h3>
                <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--text-secondary)', margin: 0 }}>{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ContactUsPage;
