import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const FooterLink: React.FC<{ label: string; path: string }> = ({ label, path }) => {
  const nav = useNavigate();
  return (
    <button
      type="button"
      onClick={() => nav(path)}
      style={{
        fontSize: 13,
        color: 'var(--text-secondary)',
        textDecoration: 'none',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        textAlign: 'left',
        padding: 0,
        transition: 'color 0.2s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = 'var(--accent)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = 'var(--text-secondary)';
      }}
    >
      {label}
    </button>
  );
};

/**
 * Shared public-site footer (Home, Movie Detail, etc.).
 * Uses design-system CSS variables so light/dark/modern themes stay consistent.
 */
const PublicFooter: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <footer
      style={{
        borderTop: '1px solid var(--border-color)',
        backgroundColor: 'var(--bg-surface)',
        padding: 'clamp(32px, 6vw, 60px) clamp(16px, 4vw, 24px) clamp(24px, 4vw, 40px)',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 160px), 1fr))',
          gap: 'clamp(24px, 4vw, 40px)',
          maxWidth: 1280,
          marginLeft: 'auto',
          marginRight: 'auto',
        }}
      >
        <div>
          <h3
            style={{
              fontFamily: "'Montserrat', sans-serif",
              fontSize: 20,
              fontWeight: 800,
              background: 'linear-gradient(135deg, var(--accent), var(--accent))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              marginBottom: 16,
            }}
          >
            {t('publicFooter.brand', 'CINEMA PRO')}
          </h3>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            {t(
              'publicFooter.tagline',
              'Bringing the magic of cinema to life. Premium experiences, unforgettable stories.'
            )}
          </p>
        </div>
        <div>
          <h4
            style={{
              fontSize: 13,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: 16,
              color: 'var(--accent)',
            }}
          >
            {t('publicFooter.quickLinks', 'Quick Links')}
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <FooterLink label={t('publicFooter.privacyPolicy', 'Privacy Policy')} path="/privacy-policy" />
            <FooterLink label={t('publicFooter.termsOfService', 'Terms of Service')} path="/terms-of-service" />
            <FooterLink label={t('publicFooter.contactUs', 'Contact Us')} path="/contact-us" />
          </div>
        </div>
        <div>
          <h4
            style={{
              fontSize: 13,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: 16,
              color: 'var(--accent)',
            }}
          >
            {t('publicFooter.company', 'Company')}
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <FooterLink label={t('publicFooter.careers', 'Careers')} path="/careers" />
            <FooterLink label={t('publicFooter.feedback', 'Feedback')} path="/contact-us" />
            <FooterLink label={t('publicFooter.aboutUs', 'About Us')} path="/about-us" />
          </div>
        </div>
        <div>
          <h4
            style={{
              fontSize: 13,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: 16,
              color: 'var(--accent)',
            }}
          >
            {t('publicFooter.legal', 'Legal')}
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <FooterLink label={t('publicFooter.cookiePolicy', 'Cookie Policy')} path="/cookie-policy" />
            <FooterLink label={t('publicFooter.safetyRules', 'Safety Rules')} path="/safety-rules" />
          </div>
        </div>
        <div>
          <h4
            style={{
              fontSize: 13,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: 16,
              color: 'var(--accent)',
            }}
          >
            {t('publicFooter.contact', 'Contact')}
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13, color: 'var(--text-secondary)' }}>
            <span>support@cinemapro.com</span>
            <span>1800-123-456</span>
            <span>123 Cinema Boulevard</span>
          </div>
        </div>
      </div>

      {/* Help CTA Banner */}
      <div
        style={{
          marginTop: 'clamp(24px, 5vw, 40px)',
          padding: '20px 24px',
          maxWidth: 1280,
          marginLeft: 'auto',
          marginRight: 'auto',
          borderRadius: 'var(--radius-lg)',
          backgroundColor: 'rgba(255,138,0,0.06)',
          border: '1px solid rgba(255,138,0,0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(255,138,0,0.12)',
              color: 'var(--accent)',
              fontSize: 20,
              fontWeight: 800,
            }}
          >
            ?
          </div>
          <div>
            <p style={{ fontSize: 15, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              {t('help.stillNeedHelp', 'Still need help?')}
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '2px 0 0' }}>
              {t('help.stillNeedHelpDesc', 'Our support team is available 24/7 to assist you.')}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate('/help')}
          className="interactive"
          style={{
            padding: '10px 24px',
            fontSize: 13,
            fontWeight: 700,
            background: 'var(--accent)',
            color: 'black',
            border: 'none',
            borderRadius: 'var(--radius-full)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            transition: 'transform 0.2s ease',
          }}
        >
          <span>?</span>
          {t('help.contactSupport', 'Contact Support')}
        </button>
      </div>

      <div
        style={{
          borderTop: '1px solid var(--border-color)',
          marginTop: 'clamp(24px, 5vw, 40px)',
          paddingTop: 24,
          textAlign: 'center',
          fontSize: 12,
          color: 'var(--text-secondary)',
        }}
      >
        {t('publicFooter.copyright', '© 2024 CinemaPro. All rights reserved.')}
      </div>
    </footer>
  );
};

export default PublicFooter;
