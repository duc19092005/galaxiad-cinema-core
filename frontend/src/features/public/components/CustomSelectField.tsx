// src/features/public/components/CustomSelectField.tsx
import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

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
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Use click event for outside detection (reliable with React click)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent document click listener from closing immediately
    const nextOpen = !isOpen;
    setIsOpen(nextOpen);
    if (nextOpen && onOpen) {
      onOpen();
    }
  };

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
            maxHeight: 250,
            overflowY: 'auto',
          }}
          className="scrollbar-thin"
        >
          {options.map((opt) => (
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
              }}
              className="hover:bg-white/5 hover:text-white"
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomSelectField;
