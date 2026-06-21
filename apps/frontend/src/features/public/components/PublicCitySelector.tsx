// src/features/public/components/PublicCitySelector.tsx
import React, { useState, useRef, useEffect } from 'react';
import { MapPin, ChevronDown, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface PublicCitySelectorProps {
  selectedCity: string;
  onCityChange: (city: string) => void;
}

const CITIES = ['Hồ Chí Minh', 'Hà Nội'];

const PublicCitySelector: React.FC<PublicCitySelectorProps> = ({ selectedCity, onCityChange }) => {
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
        className="group relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-all duration-200 border border-transparent hover:border-white/10 text-white bg-transparent cursor-pointer"
        style={{ fontSize: 13, fontWeight: 500 }}
      >
        <MapPin size={15} style={{ color: selectedCity ? 'var(--accent, #ff8a00)' : 'rgba(255,255,255,0.7)' }} />
        <span style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selectedCity || t('All Cities', 'All Cities')}
        </span>
        <ChevronDown 
          size={12} 
          style={{
            transition: 'transform 200ms',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            color: 'rgba(255,255,255,0.4)'
          }} 
        />
      </button>

      {isOpen && (
        <div 
          className="absolute right-0 mt-2 py-1 rounded-xl z-[1100] min-w-[180px]"
          style={{
            background: 'var(--bg-elevated, #18181b)',
            border: '1px solid var(--border-color, #27272a)',
            boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
          }}
        >
          {/* Option: All Cities */}
          <button
            onClick={() => { onCityChange(''); setIsOpen(false); }}
            className={`w-full text-left px-4 py-2.5 flex items-center justify-between text-sm border-none bg-transparent cursor-pointer transition-colors ${
              selectedCity === ''
                ? 'text-[#ffb77f] bg-[#ff8a00]/10 font-bold'
                : 'text-zinc-300 hover:bg-white/5 hover:text-white'
            }`}
          >
            <span>{t('All Cities', 'All Cities')}</span>
            {selectedCity === '' && <Check size={14} className="text-[#ffb77f] flex-shrink-0" />}
          </button>

          {/* Option: Specific Cities */}
          {CITIES.map(city => {
            const isActive = selectedCity === city;
            return (
              <button
                key={city}
                onClick={() => { onCityChange(city); setIsOpen(false); }}
                className={`w-full text-left px-4 py-2.5 flex items-center justify-between text-sm border-none bg-transparent cursor-pointer transition-colors ${
                  isActive
                    ? 'text-[#ffb77f] bg-[#ff8a00]/10 font-bold'
                    : 'text-zinc-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span>{city}</span>
                {isActive && <Check size={14} className="text-[#ffb77f] flex-shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PublicCitySelector;
