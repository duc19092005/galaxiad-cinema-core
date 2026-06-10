// src/components/GlassCard.tsx
// Glassmorphism card component with cinema dark theme

import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
  glow?: boolean;
  style?: React.CSSProperties;
}

const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  onClick,
  hover = true,
  glow = false,
  style,
}) => {
  return (
    <div
      onClick={onClick}
      className={`glass-card ${hover ? 'transition-all duration-300' : ''} ${glow ? 'shadow-[0_0_30px_rgba(255,138,0,0.15)]' : ''} ${onClick ? 'cursor-pointer' : ''} ${className}`}
      style={style}
    >
      {children}
    </div>
  );
};

export default GlassCard;
