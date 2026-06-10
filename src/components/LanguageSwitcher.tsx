// src/components/LanguageSwitcher.tsx
import React from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();

  return (
    <div
      className="btn btn-secondary"
      style={{
        padding: '2px',
        gap: 0,
        height: 'auto',
        borderRadius: 'var(--radius-md)',
      }}
    >
      <button
        onClick={() => i18n.changeLanguage('vi')}
        className="badge"
        style={{
          backgroundColor: i18n.language === 'vi' ? 'var(--accent)' : 'transparent',
          color: i18n.language === 'vi' ? 'white' : 'var(--text-muted)',
          borderRadius: 'var(--radius-sm)',
          padding: '2px 8px',
          fontSize: 'var(--text-xs)',
          fontWeight: 500,
          border: 'none',
          cursor: 'pointer',
        }}
      >
        VI
      </button>
      <button
        onClick={() => i18n.changeLanguage('en')}
        className="badge"
        style={{
          backgroundColor: i18n.language === 'en' ? 'var(--accent)' : 'transparent',
          color: i18n.language === 'en' ? 'white' : 'var(--text-muted)',
          borderRadius: 'var(--radius-sm)',
          padding: '2px 8px',
          fontSize: 'var(--text-xs)',
          fontWeight: 500,
          border: 'none',
          cursor: 'pointer',
        }}
      >
        EN
      </button>
    </div>
  );
};

export default LanguageSwitcher;
