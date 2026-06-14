// src/features/public/ServicesPage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, Wifi, Coffee, Gift, Accessibility, Car, Shirt, Star, Check, ChevronDown } from 'lucide-react';
import Header from '../../components/Header';

interface ServiceItem {
  icon: React.ReactNode;
  titleKey: string;
  descKey: string;
  features: string[];
  available: boolean;
}

const SERVICES: ServiceItem[] = [
  {
    icon: <Wifi size={28} />,
    titleKey: 'services.freeWifi',
    descKey: 'services.freeWifiDesc',
    features: [
      'services.freeWifiF1',
      'services.freeWifiF2',
      'services.freeWifiF3',
    ],
    available: true,
  },
  {
    icon: <Coffee size={28} />,
    titleKey: 'services.gourmetSnacks',
    descKey: 'services.gourmetSnacksDesc',
    features: [
      'services.gourmetSnacksF1',
      'services.gourmetSnacksF2',
      'services.gourmetSnacksF3',
    ],
    available: true,
  },
  {
    icon: <Gift size={28} />,
    titleKey: 'services.vipPackages',
    descKey: 'services.vipPackagesDesc',
    features: [
      'services.vipPackagesF1',
      'services.vipPackagesF2',
      'services.vipPackagesF3',
    ],
    available: true,
  },
  {
    icon: <Accessibility size={28} />,
    titleKey: 'services.accessibility',
    descKey: 'services.accessibilityDesc',
    features: [
      'services.accessibilityF1',
      'services.accessibilityF2',
      'services.accessibilityF3',
    ],
    available: true,
  },
  {
    icon: <Car size={28} />,
    titleKey: 'services.parking',
    descKey: 'services.parkingDesc',
    features: [
      'services.parkingF1',
      'services.parkingF2',
      'services.parkingF3',
    ],
    available: true,
  },
  {
    icon: <Shirt size={28} />,
    titleKey: 'services.lockerRoom',
    descKey: 'services.lockerRoomDesc',
    features: [
      'services.lockerRoomF1',
      'services.lockerRoomF2',
      'services.lockerRoomF3',
    ],
    available: false,
  },
];

const ServicesPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const toggleExpand = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)' }}>
      <Header />

      <main className="page-enter" style={{ maxWidth: 1000, margin: '0 auto', padding: 'clamp(88px, 12vw, 112px) clamp(16px, 4vw, 24px) clamp(48px, 6vw, 64px)' }}>
        {/* Back + Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 40 }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 44, height: 44, borderRadius: 'var(--radius-md)',
              background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)',
              color: 'var(--text-primary)', cursor: 'pointer',
            }}
            className="interactive"
          >
            <ChevronLeft size={22} />
          </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span className="amber-line" />
              <div>
                <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>{t('services.title', 'Our Services')}</h1>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                  {t('services.subtitle', 'Everything we offer to elevate your cinema experience')}
                </p>
              </div>
            </div>
        </div>

        {/* Services Grid */}
        <div className="page-enter-d2" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))',
          gap: 24,
        }}>
          {SERVICES.map((service, index) => (
            <div
              key={index}
              style={{
                borderRadius: 'var(--radius-xl)',
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border-color)',
                overflow: 'hidden',
                transition: 'all 0.3s ease',
              }}
              className={`${expandedIndex === index ? '' : 'interactive'} page-enter-d${(index % 5) + 1}`}
            >
              {/* Card Header */}
              <div
                onClick={() => toggleExpand(index)}
                style={{
                  padding: 24, cursor: 'pointer',
                  display: 'flex', alignItems: 'flex-start', gap: 16,
                }}
              >
                <div style={{
                  width: 56, height: 56, borderRadius: 'var(--radius-lg)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  backgroundColor: service.available
                    ? 'rgba(255,138,0,0.1)'
                    : 'rgba(255,255,255,0.03)',
                  color: service.available ? 'var(--accent)' : 'var(--text-secondary)',
                  flexShrink: 0,
                }}>
                  {service.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>
                      {t(service.titleKey)}
                    </h3>
                    {!service.available && (
                      <span style={{
                        fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                        padding: '2px 8px', borderRadius: 'var(--radius-full)',
                        backgroundColor: 'rgba(255,180,171,0.1)', color: 'var(--danger)',
                        letterSpacing: '0.05em',
                      }}>
                        {t('services.comingSoonBadge', 'Soon')}
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
                    {t(service.descKey)}
                  </p>
                </div>
                <ChevronDown
                  size={18}
                  style={{
                    color: 'var(--text-secondary)', flexShrink: 0,
                    transition: 'transform 0.3s ease',
                    transform: expandedIndex === index ? 'rotate(180deg)' : 'rotate(0deg)',
                  }}
                />
              </div>

              {/* Expanded Features */}
              <div
                style={{
                  maxHeight: expandedIndex === index ? 300 : 0,
                  overflow: 'hidden',
                  transition: 'max-height 0.35s ease, opacity 0.25s ease',
                  opacity: expandedIndex === index ? 1 : 0,
                }}
              >
                <div style={{
                  padding: '0 24px 20px',
                  borderTop: '1px solid var(--border-color)',
                  paddingTop: 16, marginTop: 0,
                }}>
                  <p style={{
                    fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                    letterSpacing: '0.05em', color: 'var(--text-secondary)',
                    marginBottom: 12,
                  }}>
                    {t('services.whatsIncluded', "What's included")}
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {service.features.map((featKey, fi) => (
                      <div key={fi} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--text-secondary)' }}>
                        <Check size={14} style={{ color: 'var(--success)', flexShrink: 0 }} />
                        <span>{t(featKey)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Banner */}
        <div className="page-enter-d3" style={{
          marginTop: 48, padding: '32px', borderRadius: 'var(--radius-xl)',
          background: 'linear-gradient(135deg, rgba(255,138,0,0.1), rgba(255,183,127,0.05))',
          border: '1px solid rgba(255,138,0,0.15)',
          textAlign: 'center',
        }}>
          <Star size={36} style={{ color: 'var(--accent)', marginBottom: 12 }} />
          <h2 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 8px' }}>
            {t('services.ctaTitle', 'Need Something Special?')}
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: '0 0 20px', maxWidth: 500, marginLeft: 'auto', marginRight: 'auto' }}>
            {t('services.ctaDesc', 'Contact our support team for custom event bookings, private screenings, and group packages.')}
          </p>
          <button
            onClick={() => navigate('/contact')}
            style={{
              padding: '12px 32px', fontSize: 14, fontWeight: 700,
              background: 'var(--accent)', color: 'black', border: 'none',
              borderRadius: 'var(--radius-full)', cursor: 'pointer',
              transition: 'transform 0.2s ease',
            }}
            className="interactive"
          >
            {t('services.contactUs', 'Contact Us')}
          </button>
        </div>
      </main>
    </div>
  );
};

export default ServicesPage;
