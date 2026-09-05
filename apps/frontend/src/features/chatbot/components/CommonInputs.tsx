import React from 'react';
import { Search } from 'lucide-react';
import { theme } from '../theme/chatbotTheme';

export const SummaryRow: React.FC<{ label: string; value: string; strong?: boolean }> = ({ label, value, strong }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, padding: '6px 0', borderBottom: `1px solid ${theme.border}` }}>
    <span style={{ color: theme.muted }}>{label}</span>
    <span style={{ color: strong ? theme.accent : theme.text, fontWeight: strong ? 900 : 700, textAlign: 'right', overflowWrap: 'anywhere' }}>{value}</span>
  </div>
);

export const SearchInput: React.FC<{ value: string; onChange: (value: string) => void; placeholder: string }> = ({ value, onChange, placeholder }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 10, padding: '0 10px' }}>
    <Search size={14} color={theme.muted} />
    <input
      value={value}
      onChange={event => onChange(event.target.value)}
      placeholder={placeholder}
      style={{ flex: 1, minWidth: 0, background: 'transparent', border: 'none', color: theme.text, outline: 'none', padding: '10px 0', fontSize: 13 }}
    />
  </div>
);

export const TextInput: React.FC<{ value: string; onChange: (value: string) => void; placeholder: string }> = ({ value, onChange, placeholder }) => (
  <input
    value={value}
    onChange={event => onChange(event.target.value)}
    placeholder={placeholder}
    style={{
      width: '100%',
      background: theme.surface,
      color: theme.text,
      border: `1px solid ${theme.border}`,
      borderRadius: 10,
      padding: '10px 11px',
      outline: 'none',
      fontFamily: 'inherit',
      fontSize: 13,
    }}
  />
);
