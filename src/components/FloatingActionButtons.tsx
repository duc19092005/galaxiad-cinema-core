// src/components/FloatingActionButtons.tsx

import React from 'react';

interface FloatingActionButtonsProps {
  buttons: {
    icon: React.ReactNode;
    onClick?: () => void;
    label?: string;
    color?: 'accent' | 'danger' | 'success';
  }[];
}

const FloatingActionButtons: React.FC<FloatingActionButtonsProps> = ({ buttons }) => {
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24,
      display: 'flex', flexDirection: 'column', gap: 8,
      zIndex: 40,
    }}>
      {buttons.map((btn, i) => (
        <button
          key={i}
          onClick={btn.onClick}
          title={btn.label}
          className="flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
          style={{
            width: 48, height: 48, borderRadius: '50%',
            border: '1px solid var(--border-color)',
            background: btn.color === 'danger'
              ? 'rgba(239, 68, 68, 0.15)'
              : btn.color === 'success'
                ? 'rgba(34, 197, 94, 0.15)'
                : 'rgba(255, 138, 0, 0.15)',
            color: btn.color === 'danger'
              ? 'var(--danger)'
              : btn.color === 'success'
                ? 'var(--success)'
                : 'var(--accent)',
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
            backdropFilter: 'blur(12px)',
          }}
        >
          {btn.icon}
        </button>
      ))}
    </div>
  );
};

export default FloatingActionButtons;
