// src/components/LanguageSwitcher.tsx

import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Languages, Check } from 'lucide-react';

interface LanguageOption {
  code: string;
  label: string;
  flag: string;
  name: string;
}

const LANGUAGES: LanguageOption[] = [
  { code: 'vi', label: 'VI', flag: '🇻🇳', name: 'Tiếng Việt' },
  { code: 'en', label: 'EN', flag: '🇬🇧', name: 'English' },
  { code: 'ru', label: 'RU', flag: '🇷🇺', name: 'Русский' },
];

const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentLang = LANGUAGES.find(l => l.code === i18n.language) || LANGUAGES[0];

  const handleSelect = (code: string) => {
    if (code !== i18n.language) {
      i18n.changeLanguage(code);
    }
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="btn-icon group relative flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-white/5 transition-all duration-200 border border-transparent hover:border-white/10"
        title={currentLang.name}
      >
        <Languages className="w-4 h-4" />
        <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-accent">
          {currentLang.label}
        </span>
        <svg
          className={`w-3 h-3 text-zinc-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-2 py-1 rounded-xl z-[1100] min-w-[160px]"
          style={{
            background: 'var(--bg-elevated, #18181b)',
            border: '1px solid var(--border-color, #27272a)',
            boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
          }}
        >
          {LANGUAGES.map((lang) => {
            const isActive = lang.code === i18n.language;
            return (
              <button
                key={lang.code}
                onClick={() => handleSelect(lang.code)}
                className={`w-full text-left px-3 py-2.5 flex items-center gap-3 text-sm border-none bg-transparent cursor-pointer transition-colors ${
                  isActive
                    ? 'text-[#ffb77f] bg-[#ff8a00]/10'
                    : 'text-zinc-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span className="text-base leading-none">{lang.flag}</span>
                <span className="flex-1 font-medium">{lang.name}</span>
                {isActive && (
                  <Check size={14} className="text-[#ffb77f] flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;
