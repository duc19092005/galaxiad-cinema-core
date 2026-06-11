// src/components/LanguageSwitcher.tsx

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';

const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const next = i18n.language === 'vi' ? 'en' : 'vi';
    i18n.changeLanguage(next);
  };

  return (
    <button
      onClick={toggleLanguage}
      className="btn-icon group relative"
      title={i18n.language === 'vi' ? 'Switch to English' : 'Chuyển sang tiếng Việt'}
    >
      <Languages className="w-4 h-4" />
      <span className="absolute -bottom-1 right-0 text-[9px] font-bold font-mono uppercase tracking-wider text-accent">
        {i18n.language === 'vi' ? 'VI' : 'EN'}
      </span>
    </button>
  );
};

export default LanguageSwitcher;
