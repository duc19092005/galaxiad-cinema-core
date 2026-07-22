import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface PublicBreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
  /** overlay: semi-transparent pill for hero / dark cinematic pages */
  variant?: 'default' | 'overlay';
  style?: React.CSSProperties;
}

/**
 * Public navigation trail: Home → Phim → …
 * Lucide Home + ChevronRight. Last item is current page (no link).
 */
const PublicBreadcrumb: React.FC<PublicBreadcrumbProps> = ({
  items,
  className,
  variant = 'default',
  style,
}) => {
  if (!items.length) return null;

  const isOverlay = variant === 'overlay';

  return (
    <nav
      aria-label="Breadcrumb"
      className={className}
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 6,
        fontSize: 13,
        fontWeight: 600,
        color: isOverlay ? 'rgba(255,255,255,0.75)' : 'var(--text-secondary)',
        marginBottom: isOverlay ? 0 : 20,
        ...(isOverlay
          ? {
              padding: '8px 14px',
              borderRadius: 999,
              background: 'rgba(0,0,0,0.35)',
              border: '1px solid rgba(255,255,255,0.12)',
              backdropFilter: 'blur(10px)',
              width: 'fit-content',
              maxWidth: '100%',
            }
          : {}),
        ...style,
      }}
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const isHome = index === 0;
        const muted = isOverlay ? 'rgba(255,255,255,0.72)' : 'var(--text-secondary)';
        const active = isOverlay ? '#fff' : 'var(--text-primary)';

        return (
          <React.Fragment key={`${item.label}-${index}`}>
            {index > 0 && (
              <ChevronRight size={14} style={{ opacity: 0.55, flexShrink: 0 }} aria-hidden />
            )}
            {isLast || !item.path ? (
              <span
                style={{
                  color: isLast ? active : muted,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  maxWidth: 280,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                aria-current={isLast ? 'page' : undefined}
              >
                {isHome && <Home size={14} style={{ color: 'var(--accent)', flexShrink: 0 }} />}
                {item.label}
              </span>
            ) : (
              <Link
                to={item.path}
                style={{
                  color: muted,
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'color 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--accent)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = muted;
                }}
              >
                {isHome && <Home size={14} style={{ color: 'var(--accent)', flexShrink: 0 }} />}
                {item.label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

export default PublicBreadcrumb;
