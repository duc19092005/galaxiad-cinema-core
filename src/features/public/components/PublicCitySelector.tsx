import React, { useState, useRef, useEffect } from 'react';
import { MapPin, ChevronDown, Check } from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';

interface PublicCitySelectorProps {
  selectedCity: string;
  onCityChange: (city: string) => void;
}

const CITIES = ['Hồ Chí Minh', 'Hà Nội'];

const PublicCitySelector: React.FC<PublicCitySelectorProps> = ({ selectedCity, onCityChange }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  
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

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all border ${
          theme === 'dark'
            ? 'bg-gray-900 border-gray-700 text-gray-300 hover:bg-gray-800'
            : theme === 'modern'
              ? 'bg-[#0E0A20]/60 border-indigo-500/30 text-white hover:bg-indigo-500/20 backdrop-blur-xl'
              : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
        }`}
      >
        <MapPin className={`w-4 h-4 ${theme === 'modern' ? 'text-cyan-400' : 'text-red-500'}`} />
        <span className="hidden md:inline-block text-xs font-bold truncate max-w-[150px]">
          {selectedCity || t('All Cities')}
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
          <div className="py-1 max-h-64 overflow-y-auto custom-scrollbar">
            <button
               onClick={() => { onCityChange(''); setIsOpen(false); }}
               className={`w-full text-left px-4 py-3 text-sm flex items-center justify-between transition-colors ${
                selectedCity === ''
                  ? theme === 'modern' ? 'bg-cyan-500/10 text-cyan-400' : 'bg-red-50 text-red-600'
                  : theme === 'dark' ? 'text-gray-300 hover:bg-gray-800' : theme === 'modern' ? 'text-white hover:bg-indigo-500/10' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="font-bold">{t('All Cities')}</span>
              {selectedCity === '' && <Check className="w-4 h-4" />}
            </button>
            {CITIES.map((city) => (
              <button
                key={city}
                onClick={() => {
                  onCityChange(city);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-3 text-sm flex items-center justify-between transition-colors ${
                  selectedCity === city
                    ? theme === 'modern' ? 'bg-cyan-500/10 text-cyan-400' : 'bg-red-50 text-red-600'
                    : theme === 'dark' ? 'text-gray-300 hover:bg-gray-800' : theme === 'modern' ? 'text-white hover:bg-indigo-500/10' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="font-bold truncate pr-2">{city}</span>
                {selectedCity === city && (
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

export default PublicCitySelector;
