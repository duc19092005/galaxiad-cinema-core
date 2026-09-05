import React from 'react';
import { theme } from '../theme/chatbotTheme';

export const ActionShell: React.FC<{
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}> = ({ title, icon, children }) => (
  <div className="liquid-glass-card" style={{
    marginTop: 10,
    padding: 12,
    borderRadius: 16,
    background: 'linear-gradient(160deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.05) 100%)',
    border: `1px solid ${theme.borderSoft}`,
    boxShadow: '0 1px 0 rgba(255,255,255,0.16) inset, 0 8px 22px rgba(0,0,0,0.16)',
    backdropFilter: theme.blurSoft,
    WebkitBackdropFilter: theme.blurSoft,
    overflow: 'hidden',
    minWidth: 0,
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8, color: theme.muted, fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }}>
      {icon}
      <span>{title}</span>
    </div>
    {children}
  </div>
);
