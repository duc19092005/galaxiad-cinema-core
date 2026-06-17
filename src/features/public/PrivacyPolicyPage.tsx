import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronDown, Shield, FileText, Building } from 'lucide-react';
import Header from '../../components/Header';

// ===================== SECTION HELPERS =====================

interface FaqSectionProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const AccordionSection: React.FC<FaqSectionProps> = ({ icon, title, children, defaultOpen }) => {
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

const HtmlPara: React.FC<{ html: string }> = ({ html }) => (
  <p style={{
    fontSize: 14, lineHeight: 1.8, color: 'var(--text-secondary)', margin: 0,
  }} dangerouslySetInnerHTML={{ __html: html }} />
);

const SubTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h4 style={{
    fontSize: 14, fontWeight: 700, color: 'var(--accent)', margin: 0,
  }}>{children}</h4>
);

const BulletList: React.FC<{ items: string[] }> = ({ items }) => (
  <ul style={{
    paddingLeft: 20, margin: 0,
    display: 'flex', flexDirection: 'column', gap: 6,
    fontSize: 14, lineHeight: 1.6, color: 'var(--text-secondary)',
  }}>
    {items.map((item, i) => <li key={i}>{item}</li>)}
  </ul>
);

// ===================== MAIN PAGE =====================

const PrivacyPolicyPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const p = (key: string) => t(`privacyPolicy.${key}`);

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
                {p('title')}
              </h1>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                {p('subtitle')}
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* ===== 1. QUY ĐỊNH CHUNG ===== */}
          <AccordionSection icon={<FileText size={20} />} title={p('s1Title')} defaultOpen={true}>
            <HtmlPara html={p('s1p1')} />
            <Para>{p('s1p2')}</Para>
            <Para>{p('s1p3')}</Para>

            <SubTitle>{p('s1s1Title')}</SubTitle>
            <Para>{p('s1s1Body')}</Para>

            <SubTitle>{p('s1s2Title')}</SubTitle>
            <Para>{p('s1s2Body')}</Para>

            <SubTitle>{p('s1s3Title')}</SubTitle>
            <Para>{p('s1s3Body')}</Para>

            <SubTitle>{p('s1s4Title')}</SubTitle>
            <Para>{p('s1s4Body')}</Para>

            <SubTitle>{p('s1s5Title')}</SubTitle>
            <Para>{p('s1s5Body')}</Para>

            <SubTitle>{p('s1s6Title')}</SubTitle>
            <ContactBoxT t={t} />
          </AccordionSection>

          {/* ===== 2. ĐIỀU KHOẢN GIAO DỊCH ===== */}
          <AccordionSection icon={<FileText size={20} />} title={p('s2Title')}>
            <SubTitle>{p('s2s1Title')}</SubTitle>
            <Para>{p('s2s1Body')}</Para>

            <SubTitle>{p('s2s2Title')}</SubTitle>
            <Para>{p('s2s2Body')}</Para>

            <SubTitle>{p('s2s3Title')}</SubTitle>
            <HtmlPara html={p('s2s3Body')} />

            <SubTitle>{p('s2s4Title')}</SubTitle>
            <Para>{p('s2s4Body')}</Para>

            <SubTitle>{p('s2s5Title')}</SubTitle>
            <Para>{p('s2s5Body')}</Para>

            <SubTitle>{p('s2s6Title')}</SubTitle>
            <Para>{p('s2s6Body')}</Para>

            <SubTitle>{p('s2s7Title')}</SubTitle>
            <Para>{p('s2s7Body')}</Para>
            <ContactBoxT t={t} />
          </AccordionSection>

          {/* ===== 3. QUY ĐỊNH TẠI RẠP ===== */}
          <AccordionSection icon={<Building size={20} />} title={p('s3Title')}>
            <SubTitle>{p('s3s1Title')}</SubTitle>
            <Para>{p('s3s1Lead')}</Para>
            <BulletList items={[
              p('s3s1Bullet1'), p('s3s1Bullet2'), p('s3s1Bullet3'),
              p('s3s1Bullet4'), p('s3s1Bullet5'), p('s3s1Bullet6'),
              p('s3s1Bullet7'),
            ]} />

            <SubTitle>{p('s3s2Title')}</SubTitle>
            <div style={{
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)', overflow: 'hidden',
            }}>
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 2fr',
                background: 'rgba(255,138,0,0.08)',
                borderBottom: '1px solid var(--border-color)',
                fontWeight: 700, fontSize: 13, padding: '10px 14px',
              }}>
                <span>{p('s3s2Col1')}</span><span>{p('s3s2Col2')}</span>
              </div>
              {[p('s3s2Row1'), p('s3s2Row2'), p('s3s2Row3'), p('s3s2Row4'), p('s3s2Row5'), p('s3s2Row6')].map((row, i) => {
                const [cls, desc] = row.split(' - ', 2);
                return (
                  <div key={i} style={{
                    display: 'grid', gridTemplateColumns: '1fr 2fr',
                    borderBottom: i < 5 ? '1px solid var(--border-color)' : 'none',
                    background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent',
                    fontSize: 13, padding: '10px 14px', color: 'var(--text-secondary)',
                  }}>
                    <span style={{ fontWeight: 600, color: 'var(--accent)' }}>{cls}</span>
                    <span>{desc}</span>
                  </div>
                );
              })}
            </div>

            <SubTitle>{p('s3s3Title')}</SubTitle>
            <BulletList items={[p('s3s3Bullet1'), p('s3s3Bullet2'), p('s3s3Bullet3')]} />

            <SubTitle>{p('s3s4Title')}</SubTitle>
            <BulletList items={[p('s3s4Bullet1'), p('s3s4Bullet2'), p('s3s4Bullet3'), p('s3s4Bullet4')]} />
          </AccordionSection>

          {/* ===== 4. CHÍNH SÁCH BẢO MẬT ===== */}
          <AccordionSection icon={<Shield size={20} />} title={p('s4Title')}>
            <Para>{p('s4Intro')}</Para>

            <SubTitle>{p('s4s1Title')}</SubTitle>
            <Para>{p('s4s1Lead')}</Para>
            <BulletList items={[p('s4s1Bullet1'), p('s4s1Bullet2'), p('s4s1Bullet3'), p('s4s1Bullet4'), p('s4s1Bullet5')]} />

            <SubTitle>{p('s4s2Title')}</SubTitle>
            <BulletList items={[p('s4s2Bullet1'), p('s4s2Bullet2'), p('s4s2Bullet3'), p('s4s2Bullet4'), p('s4s2Bullet5')]} />

            <SubTitle>{p('s4s3Title')}</SubTitle>
            <Para>{p('s4s3Body')}</Para>

            <SubTitle>{p('s4s4Title')}</SubTitle>
            <BulletList items={[p('s4s4Bullet1'), p('s4s4Bullet2'), p('s4s4Bullet3'), p('s4s4Bullet4'), p('s4s4Bullet5'), p('s4s4Bullet6')]} />

            <SubTitle>{p('s4s5Title')}</SubTitle>
            <Para>{p('s4s5Body')}</Para>

            <SubTitle>{p('s4s6Title')}</SubTitle>
            <Para>{p('s4s6Body')}</Para>
            <ContactBoxT t={t} />
          </AccordionSection>
        </div>
      </main>
    </div>
  );
};

// ===================== CONTACT BOX WITH i18n =====================
const ContactBoxT: React.FC<{ t: (key: string) => string }> = ({ t }) => {
  const p = (key: string) => t(`privacyPolicy.${key}`);
  return (
    <div style={{
      background: 'rgba(255,138,0,0.04)',
      border: '1px solid rgba(255,138,0,0.15)',
      borderRadius: 'var(--radius-md)',
      padding: '16px 20px',
      display: 'flex', flexDirection: 'column', gap: 6,
      fontSize: 14, lineHeight: 1.7, color: 'var(--text-secondary)',
    }}>
      <div style={{ fontWeight: 700, color: 'var(--accent)', fontSize: 15 }}>
        {p('contactName')}
      </div>
      <div>{p('contactAddress')}</div>
      <div>{p('contactPhone')}</div>
      <div>{p('contactEmail')}</div>
      <div>{p('contactWebsite')}</div>
    </div>
  );
};

export default PrivacyPolicyPage;
