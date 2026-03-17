import React, { useState, useRef, useEffect } from 'react';
import { Building2, ChevronDown, Check } from 'lucide-react';
import { useCinema } from '../contexts/CinemaContext';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';

const CinemaSelector: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { managedCinemas, activeCinemaId, setActiveCinemaId, activeCinemaName } = useCinema();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (managedCinemas.length <= 1) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all border ${
          theme === 'dark'
            ? 'bg-gray-900 border-gray-700 text-gray-300 hover:bg-gray-800 hover:border-red-600/50'
            : theme === 'modern'
              ? 'bg-[#0E0A20]/60 border-indigo-500/30 text-white hover:bg-indigo-500/20 hover:border-cyan-500/50 shadow-sm shadow-indigo-500/10 backdrop-blur-xl'
              : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-red-600/30'
        }`}
      >
        <div className={`p-1 rounded-md ${
          theme === 'modern' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-red-600/10 text-red-600'
        }`}>
          <Building2 className="w-4 h-4" />
        </div>
        <span className="hidden md:inline-block text-xs font-bold truncate max-w-[150px]">
          {activeCinemaName || t('Select Cinema')}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className={`absolute right-0 mt-2 w-64 rounded-xl shadow-2xl overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-200 ${
          theme === 'dark'
            ? 'bg-gray-900 border border-gray-700'
            : theme === 'modern'
              ? 'bg-[#0f172a]/95 border border-indigo-500/20 backdrop-blur-2xl'
              : 'bg-white border border-gray-200'
        }`}>
          <div className={`px-4 py-2 border-b ${
            theme === 'dark' ? 'border-gray-800' : theme === 'modern' ? 'border-indigo-500/20' : 'border-gray-100'
          }`}>
            <p className={`text-[10px] uppercase font-black tracking-widest ${
              theme === 'modern' ? 'text-cyan-400' : 'text-gray-400'
            }`}>
              {t('Switch Cinema')}
            </p>
          </div>
          <div className="py-1 max-h-64 overflow-y-auto custom-scrollbar">
            {managedCinemas.map((cinema) => (
              <button
                key={cinema.cinemaId}
                onClick={() => {
                  setActiveCinemaId(cinema.cinemaId);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-3 text-sm flex items-center justify-between transition-colors ${
                  activeCinemaId === cinema.cinemaId
                    ? theme === 'modern'
                      ? 'bg-cyan-500/10 text-cyan-400'
                      : 'bg-red-50 text-red-600'
                    : theme === 'dark'
                      ? 'text-gray-300 hover:bg-gray-800'
                      : theme === 'modern'
                        ? 'text-white hover:bg-indigo-500/10'
                        : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="font-bold truncate pr-2">{cinema.cinemaName}</span>
                {activeCinemaId === cinema.cinemaId && (
                  <Check className="w-4 h-4 shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CinemaSelector;
