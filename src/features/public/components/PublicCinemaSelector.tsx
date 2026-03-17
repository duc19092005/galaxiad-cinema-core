import React, { useState, useRef, useEffect } from 'react';
import { MapPin, ChevronDown, Check } from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { publicApi } from '../../../api/publicApi';
import type { ActiveCinema } from '../../../types/public.types';

interface PublicCinemaSelectorProps {
  selectedCinemaId: string;
  onCinemaChange: (cinemaId: string) => void;
}

const PublicCinemaSelector: React.FC<PublicCinemaSelectorProps> = ({ selectedCinemaId, onCinemaChange }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  
  const [isOpen, setIsOpen] = useState(false);
  const [cinemas, setCinemas] = useState<ActiveCinema[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchCinemas = async () => {
      try {
        const res = await publicApi.getActiveCinemas();
        setCinemas(res.data || []);
      } catch (err) {
        console.error('Failed to fetch cinemas', err);
      }
    };
    fetchCinemas();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedCinema = cinemas.find(c => c.cinemaId === selectedCinemaId);

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
          {selectedCinema?.cinemaName || t('All Cinemas')}
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
               onClick={() => { onCinemaChange(''); setIsOpen(false); }}
               className={`w-full text-left px-4 py-3 text-sm flex items-center justify-between transition-colors ${
                selectedCinemaId === ''
                  ? theme === 'modern' ? 'bg-cyan-500/10 text-cyan-400' : 'bg-red-50 text-red-600'
                  : theme === 'dark' ? 'text-gray-300 hover:bg-gray-800' : theme === 'modern' ? 'text-white hover:bg-indigo-500/10' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="font-bold">{t('All Cinemas')}</span>
              {selectedCinemaId === '' && <Check className="w-4 h-4" />}
            </button>
            {cinemas.map((cinema) => (
              <button
                key={cinema.cinemaId}
                onClick={() => {
                  onCinemaChange(cinema.cinemaId);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-3 text-sm flex items-center justify-between transition-colors ${
                  selectedCinemaId === cinema.cinemaId
                    ? theme === 'modern' ? 'bg-cyan-500/10 text-cyan-400' : 'bg-red-50 text-red-600'
                    : theme === 'dark' ? 'text-gray-300 hover:bg-gray-800' : theme === 'modern' ? 'text-white hover:bg-indigo-500/10' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="font-bold truncate pr-2">{cinema.cinemaName}</span>
                {selectedCinemaId === cinema.cinemaId && (
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

export default PublicCinemaSelector;
