import React from 'react';
import { Link } from 'react-router-dom';
import { Play } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/**
 * HeroBanner – full‑bleed hero section for the Home page.
 * Shows a background image (or blank dark base) with a glass overlay
 * containing the featured movie title, tagline and a glowing CTA.
 */
const HeroBanner: React.FC<{ posterUrl?: string; title: string; tagline?: string }> = ({ posterUrl, title, tagline }) => {
  const { t } = useTranslation();
  const background = posterUrl ? `url(${posterUrl}) center/cover no-repeat` : 'none';
  return (
    <section
      className="relative flex items-center justify-center min-h-[480px] bg-bg-base"
      style={{ backgroundImage: background, backgroundColor: 'var(--color-bg-base)' }}
    >
      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative z-10 text-center max-w-2xl mx-auto">
        {tagline && (
          <p className="text-secondary text-label-sm uppercase mb-2" style={{ letterSpacing: '0.1em' }}>
            {tagline}
          </p>
        )}
        <h1 className="font-display-lg text-primary mb-4" style={{ fontSize: '64px', lineHeight: '1.1', fontWeight: 800 }}>
          {title}
        </h1>
        <Link
          to="/booking/placeholder"
          className="btn-primary cta-glow inline-flex items-center gap-2"
        >
          <Play size={20} />
          {t('hero.bookNow', 'Book Now')}
        </Link>
      </div>
    </section>
  );
};

export default HeroBanner;
