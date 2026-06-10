import React from 'react';

/**
 * GlassCard – generic container with the glass‑card effect.
 *   background: rgba(255,255,255,0.05) + backdrop‑blur-xl
 *   border‑top & left: 1px solid rgba(255,255,255,0.1)
 *   can be used for modals, summary panels, etc.
 */
const GlassCard: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => {
  return (
    <div className={`glass-card ${className}`} style={{ padding: 'var(--space-4)' }}>
      {children}
    </div>
  );
};

export default GlassCard;
