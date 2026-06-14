// src/components/LanguageSwitcher.tsx

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';

const LANGUAGES = ['vi', 'en', 'ru'] as const;
const LABELS: Record<string, string> = {
  vi: 'VI',
  en: 'EN',
  ru: 'RU',
};

const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const currentIndex = LANGUAGES.indexOf(i18n.language as typeof LANGUAGES[number]);
    const nextIndex = (currentIndex + 1) % LANGUAGES.length;
    i18n.changeLanguage(LANGUAGES[nextIndex]);
  };

  const currentLabel = LABELS[i18n.language] || 'VI';

  return (
    <button
      onClick={toggleLanguage}
      className="btn-icon group relative"
      title={
        i18n.language === 'vi' ? 'Switch to English' :
        i18n.language === 'en' ? 'Switch to Russian' :
        'Chuyển sang tiếng Việt'
      }
    >
      <Languages className="w-4 h-4" />
      <span className="absolute -bottom-1 right-0 text-[9px] font-bold font-mono uppercase tracking-wider text-accent">
        {currentLabel}
      </span>
    </button>
  );
};

export default LanguageSwitcher;
