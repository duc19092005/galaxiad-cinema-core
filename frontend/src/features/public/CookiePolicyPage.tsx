import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronDown, Cookie, Info, Database, Settings, Mail } from 'lucide-react';
import Header from '../../components/Header';

// ===================== SECTION HELPERS =====================

interface AccordionProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const AccordionSection: React.FC<AccordionProps> = ({ icon, title, children, defaultOpen }) => {
  const [open, setOpen] = useState(defaultOpen || false);
  return (
    <div
      className={`page-enter-d1${open ? ' faq-item-active' : ''}`}
      style={{
        borderRadius: 'var(--radius-lg)',
        backgroundColor: 'var(--bg-elevated)',
        border: open ? '1px solid rgba(255,138,0,0.2)' : '1px solid var(--border-color)',
        overflow: 'hidden',
        transition: 'border-color 0.2s ease',
      }}
    >
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', padding: '16px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 12, cursor: 'pointer',
          background: 'none', border: 'none',
          color: 'var(--text-primary)', fontSize: 15, fontWeight: 700,
          textAlign: 'left',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ color: 'var(--accent)', display: 'flex', flexShrink: 0 }}>{icon}</span>
          <span>{title}</span>
        </span>
        <ChevronDown
          size={18}
          style={{
            color: 'var(--text-secondary)', flexShrink: 0,
            transition: 'transform 0.3s ease',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
      </button>
      <div
        style={{
          maxHeight: open ? 9999 : 0,
          overflow: 'hidden',
          transition: 'max-height 0.35s cubic-bezier(0.16,1,0.3,1)',
          opacity: open ? 1 : 0,
          transitionProperty: 'max-height, opacity',
        }}
      >
        <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {children}
        </div>
      </div>
    </div>
  );
};

const Para: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p style={{
    fontSize: 14, lineHeight: 1.8, color: 'var(--text-secondary)', margin: 0,
  }}>{children}</p>
);

const FramedList: React.FC<{ items: string[] }> = ({ items }) => (
  <div style={{
    display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8,
  }}>
    {items.map((item, i) => (
      <div
        key={i}
        style={{
          padding: '12px 16px',
          borderRadius: 'var(--radius-md)',
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid var(--border-color)',
          fontSize: 14, lineHeight: 1.7, color: 'var(--text-secondary)',
          transition: 'border-color 0.2s ease, background 0.2s ease',
          display: 'flex', alignItems: 'flex-start', gap: 12,
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = 'rgba(255,138,0,0.3)';
          e.currentTarget.style.background = 'rgba(255,138,0,0.03)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = 'var(--border-color)';
          e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
        }}
      >
        <span style={{
          width: 24, height: 24, borderRadius: '50%',
          background: 'rgba(255,138,0,0.15)',
          color: 'var(--accent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, fontSize: 12, fontWeight: 800,
        }}>
          {i + 1}
        </span>
        <span style={{ flex: 1 }}>{item}</span>
      </div>
    ))}
  </div>
);

// ===================== MAIN PAGE =====================

const CookiePolicyPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const currentDate = '16/3/2023';

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)' }}>
      <Header />
      <main className="page-enter" style={{
        maxWidth: 960,
        margin: '0 auto',
        padding: 'clamp(88px, 12vw, 112px) clamp(16px, 4vw, 24px) clamp(48px, 6vw, 64px)',
      }}>
        {/* Back + Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
          <button onClick={() => navigate('/')}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 44, height: 44, borderRadius: 'var(--radius-md)',
              background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)',
              color: 'var(--text-primary)', cursor: 'pointer',
            }}
            className="interactive">
            <ChevronLeft size={22} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="amber-line" />
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
                {t('cookiePolicy.title')}
              </h1>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                {t('cookiePolicy.lastUpdated')} {currentDate}
              </p>
            </div>
          </div>
        </div>

        {/* Intro Banner */}
        <div className="page-enter-d1" style={{
          padding: 20, borderRadius: 'var(--radius-lg)', marginBottom: 16,
          background: 'rgba(255,138,0,0.04)',
          border: '1px solid rgba(255,138,0,0.12)',
        }}>
          <Para>{t('cookiePolicy.intro')}</Para>
        </div>

        {/* Accordion Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* 1. Cookie là gì? */}
          <AccordionSection icon={<Info size={20} />} title={`1. ${t('cookiePolicy.whatAre')}`} defaultOpen={true}>
            <Para>{t('cookiePolicy.whatAreBody')}</Para>
          </AccordionSection>

          {/* 2. Chúng tôi sử dụng Cookies để làm gì? */}
          <AccordionSection icon={<Settings size={20} />} title={`2. ${t('cookiePolicy.howUse')}`}>
            <Para>{t('cookiePolicy.howUseBody')}</Para>
            <FramedList items={[
              t('cookiePolicy.useItem1'),
              t('cookiePolicy.useItem2'),
              t('cookiePolicy.useItem3'),
              t('cookiePolicy.useItem4'),
              t('cookiePolicy.useItem5'),
            ]} />
          </AccordionSection>

          {/* 3. Thông tin thu thập */}
          <AccordionSection icon={<Database size={20} />} title={`3. ${t('cookiePolicy.types')}`}>
            <Para>{t('cookiePolicy.typesBody')}</Para>
            <FramedList items={[
              t('cookiePolicy.collectItem1'),
              t('cookiePolicy.collectItem2'),
              t('cookiePolicy.collectItem3'),
              t('cookiePolicy.collectItem4'),
              t('cookiePolicy.collectItem5'),
            ]} />
          </AccordionSection>

          {/* 4. Quản lý Cookie */}
          <AccordionSection icon={<Cookie size={20} />} title={`4. ${t('cookiePolicy.manage')}`}>
            <Para>{t('cookiePolicy.manageBody')}</Para>
          </AccordionSection>

          {/* 5. Liên hệ */}
          <AccordionSection icon={<Mail size={20} />} title={`5. ${t('cookiePolicy.contact')}`}>
            <Para>{t('cookiePolicy.contactBody')}</Para>
            <div style={{
              marginTop: 8, padding: '14px 18px', background: 'rgba(255,138,0,0.04)',
              borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,138,0,0.12)',
              fontSize: 14, lineHeight: 1.7, color: 'var(--text-secondary)',
            }}>
              <div><strong style={{ color: 'var(--accent)' }}>Email:</strong> {t('cookiePolicy.contactEmail')}</div>
              <div><strong style={{ color: 'var(--accent)' }}>Hotline:</strong> {t('cookiePolicy.contactPhone')}</div>
              <div><strong style={{ color: 'var(--accent)' }}>Địa chỉ:</strong> {t('cookiePolicy.contactAddress')}</div>
            </div>
          </AccordionSection>
        </div>
      </main>
    </div>
  );
};

export default CookiePolicyPage;
