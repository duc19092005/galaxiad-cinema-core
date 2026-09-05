import type React from 'react';

/** Soft Liquid Glass — lower glare / less specular */
export const theme = {
  accent: '#e8890b',
  accentHover: '#f0a020',
  accentSoft: 'rgba(232,137,11,0.12)',
  surface: 'rgba(22,22,24,0.72)',
  surfaceLow: 'rgba(18,18,20,0.65)',
  surfaceHigh: 'rgba(255,255,255,0.06)',
  surfaceHighest: 'rgba(255,255,255,0.09)',
  glass: 'rgba(255,255,255,0.05)',
  glassStrong: 'rgba(255,255,255,0.08)',
  border: 'rgba(255,255,255,0.12)',
  borderSoft: 'rgba(255,255,255,0.08)',
  highlight: 'rgba(255,255,255,0.2)',
  text: '#ececef',
  muted: 'rgba(235,235,245,0.48)',
  success: '#30d158',
  danger: '#ff453a',
  blur: 'blur(28px) saturate(120%)',
  blurSoft: 'blur(16px) saturate(110%)',
};

export const glassPanel: React.CSSProperties = {
  background: 'linear-gradient(165deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 40%, rgba(16,16,18,0.78) 100%)',
  backdropFilter: theme.blur,
  WebkitBackdropFilter: theme.blur,
  border: `1px solid ${theme.border}`,
  boxShadow: `
    0 1px 0 0 rgba(255,255,255,0.1) inset,
    0 18px 48px rgba(0,0,0,0.4),
    0 6px 16px rgba(0,0,0,0.22)
  `,
};

export const glassChip: React.CSSProperties = {
  background: 'rgba(255,255,255,0.06)',
  backdropFilter: theme.blurSoft,
  WebkitBackdropFilter: theme.blurSoft,
  border: `1px solid ${theme.borderSoft}`,
  boxShadow: '0 1px 0 rgba(255,255,255,0.08) inset, 0 4px 12px rgba(0,0,0,0.14)',
};

export const baseButton: React.CSSProperties = {
  border: 'none',
  cursor: 'pointer',
  fontFamily: 'inherit',
  transition: 'transform 0.2s cubic-bezier(0.22,1,0.36,1), border-color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease',
};

export const primaryButton: React.CSSProperties = {
  ...baseButton,
  background: `linear-gradient(145deg, rgba(240,160,32,0.88) 0%, ${theme.accent} 55%, #c97408 100%)`,
  color: '#1c1c1e',
  borderRadius: 14,
  padding: '10px 12px',
  fontWeight: 800,
  border: '1px solid rgba(255,255,255,0.18)',
  boxShadow: '0 1px 0 rgba(255,255,255,0.15) inset, 0 6px 14px rgba(232,137,11,0.18)',
};

export const ghostButton: React.CSSProperties = {
  ...baseButton,
  ...glassChip,
  color: theme.text,
  borderRadius: 14,
  padding: '10px 12px',
  fontWeight: 700,
};

export const optionButtonStyle: React.CSSProperties = {
  ...baseButton,
  ...glassChip,
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 10,
  borderRadius: 14,
  padding: '10px 12px',
  color: theme.text,
  fontSize: 12,
  overflow: 'hidden',
  minWidth: 0,
};
