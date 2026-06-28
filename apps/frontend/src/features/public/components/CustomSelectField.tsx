// src/features/public/components/CustomSelectField.tsx
import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface CustomSelectFieldProps {
  step: string;
  label: string;
  value: string;
  displayValue: string;
  options: { value: string; label: string }[];
  onChange: (val: string) => void;
  borderLeft?: boolean;
  onOpen?: () => void;
}

const CustomSelectField: React.FC<CustomSelectFieldProps> = ({
  step,
  label,
  value,
  displayValue,
  options,
  onChange,
  borderLeft,
  onOpen,
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Debounce search term update by 300ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  // Focus input and reset search when dropdown opens/closes
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      setSearchTerm('');
      setDebouncedSearchTerm('');
    }
  }, [isOpen]);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextOpen = !isOpen;
    setIsOpen(nextOpen);
    if (nextOpen && onOpen) {
      onOpen();
    }
  };

  // Filter options based on debounced search term
  const filteredOptions = options.filter((opt) => {
    const term = debouncedSearchTerm.toLowerCase().trim();
    if (!term) return true;
    return opt.label.toLowerCase().includes(term);
  });

  return (
    <div
      ref={dropdownRef}
      style={{
        position: 'relative',
        padding: '12px 16px',
        borderRadius: 12,
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        transition: 'background-color 0.2s ease',
      }}
      className={`hover:bg-white/5 ${borderLeft ? 'md:border-l md:border-white/10' : ''}`}
      onClick={handleToggle}
    >
      <span style={{ fontSize: 10, color: 'var(--accent, #ff8a00)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
        {step}. {label}
      </span>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
        <span style={{ fontWeight: 500, color: 'white', fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '90%' }}>
          {displayValue}
        </span>
        <ChevronDown size={16} style={{ color: 'rgba(255,255,255,0.4)', transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
      </div>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: 8,
            backgroundColor: '#18181b',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 12,
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)',
            zIndex: 50,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
          onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the container
        >
          {/* Search Box */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 12px',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              backgroundColor: 'rgba(0,0,0,0.2)',
            }}
          >
            <Search size={14} className="text-zinc-500" />
            <input
              ref={inputRef}
              type="text"
              placeholder={t('home.searchPlaceholder', 'Search...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                flex: 1,
                background: 'none',
                border: 'none',
                color: 'white',
                fontSize: 13,
                outline: 'none',
                padding: 0,
              }}
            />
          </div>

          {/* Options List */}
          <div
            style={{
              maxHeight: 200,
              overflowY: 'auto',
            }}
            className="scrollbar-thin"
          >
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <div
                  key={opt.value}
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  style={{
                    padding: '10px 16px',
                    fontSize: 13,
                    color: opt.value === value ? 'var(--accent, #ff8a00)' : 'rgba(255,255,255,0.8)',
                    backgroundColor: opt.value === value ? 'rgba(255,138,0,0.1)' : 'transparent',
                    fontWeight: opt.value === value ? 600 : 400,
                    transition: 'background-color 0.15s, color 0.15s',
                    cursor: 'pointer',
                  }}
                  className="hover:bg-white/5 hover:text-white"
                >
                  {opt.label}
                </div>
              ))
            ) : (
              <div
                style={{
                  padding: '12px 16px',
                  fontSize: 13,
                  color: 'rgba(255,255,255,0.4)',
                  textAlign: 'center',
                  fontStyle: 'italic',
                }}
              >
                {t('home.noResults', 'No results found')}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomSelectField;
