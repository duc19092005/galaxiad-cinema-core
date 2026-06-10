// src/components/CinemaSelector.tsx

import React, { useEffect, useState, useRef } from 'react';
import { useCinema } from '../contexts/CinemaContext';
import { useTranslation } from 'react-i18next';
import { Building2, ChevronDown, Loader2 } from 'lucide-react';

const CinemaSelector: React.FC = () => {
  const { managedCinemas, activeCinemaId, setActiveCinemaId, loading } = useCinema();
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

  const activeCinema = managedCinemas.find(c => c.cinemaId === activeCinemaId);

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-color)' }}>
        <Loader2 size={14} style={{ animation: 'spin 1s linear infinite', color: 'var(--accent)' }} />
        <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>Loading...</span>
      </div>
    );
  }

  if (managedCinemas.length === 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-color)' }}>
        <Building2 size={14} style={{ color: 'var(--text-muted)' }} />
        <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>No cinemas</span>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-200"
        style={{
          background: 'var(--bg-elevated)',
          border: `1px solid ${isOpen ? 'var(--accent)' : 'var(--border-color)'}`,
        }}
      >
        <Building2 size={14} style={{ color: 'var(--accent)' }} />
        <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)', fontFamily: "'Inter', sans-serif" }}>
          {activeCinema ? activeCinema.cinemaName : t('Select Cinema')}
        </span>
        <ChevronDown
          size={12}
          style={{
            color: 'var(--text-muted)',
            transition: 'transform 0.2s ease',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-2 py-1 rounded-xl z-50"
          style={{
            minWidth: 240,
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-color)',
            boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
          }}
        >
          <div style={{ padding: '8px 12px 4px', fontSize: 10, color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            {t('Select Cinema')}
          </div>
          <div style={{ maxHeight: 200, overflowY: 'auto' }}>
            {managedCinemas.map((cinema) => (
              <button
                key={cinema.cinemaId}
                onClick={() => {
                  setActiveCinemaId(cinema.cinemaId);
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 transition-all duration-150"
                style={{
                  background: cinema.cinemaId === activeCinemaId ? 'rgba(255, 138, 0, 0.08)' : 'transparent',
                  borderLeft: cinema.cinemaId === activeCinemaId ? '2px solid var(--accent)' : '2px solid transparent',
                }}
                onMouseEnter={e => { if (cinema.cinemaId !== activeCinemaId) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                onMouseLeave={e => { if (cinema.cinemaId !== activeCinemaId) e.currentTarget.style.background = 'transparent'; }}
              >
                <Building2 size={14} style={{ color: cinema.cinemaId === activeCinemaId ? 'var(--accent)' : 'var(--text-muted)' }} />
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{cinema.cinemaName}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>{cinema.cinemaId}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CinemaSelector;
