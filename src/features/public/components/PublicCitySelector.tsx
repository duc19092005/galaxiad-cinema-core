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
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="btn btn-secondary"
        style={{ padding: '6px 12px', gap: 'var(--space-2)', fontSize: 'var(--text-sm)', height: 'auto' }}
      >
        <MapPin size={14} />
        <span style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selectedCity || t('All Cities')}
        </span>
        <ChevronDown size={12} style={{
          transition: 'transform 300ms var(--ease)',
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
        }} />
      </button>

      {isOpen && (
        <div className="card surface-elevated" style={{
          position: 'absolute', right: 0, marginTop: 'var(--space-2)',
          width: 240, padding: 'var(--space-1)', boxShadow: 'var(--shadow-lg)', zIndex: 100,
        }}>
          <button
            onClick={() => { onCityChange(''); setIsOpen(false); }}
            className="btn-ghost"
            style={{
              width: '100%', justifyContent: 'space-between', textAlign: 'left',
              fontSize: 'var(--text-sm)',
              backgroundColor: selectedCity === '' ? 'var(--accent-soft)' : 'transparent',
              color: selectedCity === '' ? 'var(--accent)' : 'var(--text-secondary)',
            }}
          >
            <span style={{ fontWeight: selectedCity === '' ? 500 : 400 }}>{t('All Cities')}</span>
            {selectedCity === '' && <Check size={14} />}
          </button>
          {CITIES.map(city => (
            <button
              key={city}
              onClick={() => { onCityChange(city); setIsOpen(false); }}
              className="btn-ghost"
              style={{
                width: '100%', justifyContent: 'space-between', textAlign: 'left',
                fontSize: 'var(--text-sm)',
                backgroundColor: selectedCity === city ? 'var(--accent-soft)' : 'transparent',
                color: selectedCity === city ? 'var(--accent)' : 'var(--text-secondary)',
              }}
            >
              <span style={{ fontWeight: selectedCity === city ? 500 : 400 }}>{city}</span>
              {selectedCity === city && <Check size={14} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default PublicCitySelector;
