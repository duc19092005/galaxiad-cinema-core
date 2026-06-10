// src/components/CinemaSelector.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Building2, ChevronDown, Check } from 'lucide-react';
import { useCinema } from '../contexts/CinemaContext';
import { useTranslation } from 'react-i18next';

const CinemaSelector: React.FC = () => {
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
        className="btn btn-secondary"
        style={{
          padding: '6px 12px',
          gap: 'var(--space-2)',
          fontSize: 'var(--text-sm)',
          height: 'auto',
        }}
      >
        <Building2 size={14} />
        <span style={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {activeCinemaName || t('Select Cinema')}
        </span>
        <ChevronDown size={14} style={{ transition: 'transform 300ms var(--ease)', transform: isOpen ? 'rotate(180deg)' : 'rotate(0)' }} />
      </button>

      {isOpen && (
        <div
          className="card surface-elevated"
          style={{
            position: 'absolute', right: 0, marginTop: 'var(--space-2)',
            width: 256, padding: 0, overflow: 'hidden',
            boxShadow: 'var(--shadow-lg)', zIndex: 100,
          }}
        >
          <div style={{ padding: 'var(--space-2) var(--space-3)', borderBottom: '1px solid var(--border)' }}>
            <p className="text-muted" style={{ fontSize: 'var(--text-xs)', letterSpacing: '0.3px', margin: 0 }}>
              {t('Switch Cinema')}
            </p>
          </div>
          <div style={{ maxHeight: 256, overflowY: 'auto' }}>
            {managedCinemas.map(cinema => (
              <button
                key={cinema.cinemaId}
                onClick={() => { setActiveCinemaId(cinema.cinemaId); setIsOpen(false); }}
                className="btn-ghost"
                style={{
                  width: '100%', justifyContent: 'space-between', textAlign: 'left',
                  padding: 'var(--space-3) var(--space-4)',
                  fontSize: 'var(--text-sm)',
                  borderBottom: '1px solid var(--border)',
                  backgroundColor: activeCinemaId === cinema.cinemaId ? 'var(--accent-soft)' : 'transparent',
                  color: activeCinemaId === cinema.cinemaId ? 'var(--accent)' : 'var(--text-secondary)',
                  borderRadius: 0,
                }}
              >
                <span style={{ fontWeight: 500 }}>{cinema.cinemaName}</span>
                {activeCinemaId === cinema.cinemaId && <Check size={14} />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CinemaSelector;
