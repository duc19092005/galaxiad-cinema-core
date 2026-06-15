import React, { useState, useEffect, useRef } from 'react';
import { Menu, Building2, ChevronDown } from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher';


interface CinemaSelectorOption {
  cinemas: { cinemaId: string; cinemaName: string }[];
  activeCinemaId: string | null;
  activeCinemaName: string | null;
  onChange: (id: string | null) => void;
}

interface ManagementChromeProps {
  sidebarOpen: boolean;
  onSidebarToggle: () => void;
  cinemaSelector?: CinemaSelectorOption;
}

const ManagementChrome: React.FC<ManagementChromeProps> = ({ sidebarOpen, onSidebarToggle, cinemaSelector }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const selectedCinema = cinemaSelector?.cinemas.find(c => c.cinemaId === cinemaSelector.activeCinemaId);
  const currentLabel = selectedCinema ? selectedCinema.cinemaName : 'Chọn Rạp';

  return (
    <>
      {/* Mobile-only toggle button at the top-left when the sidebar is closed */}
      {!sidebarOpen && (
        <div 
          className="lg:hidden" 
          style={{
            position: 'fixed',
            top: 18,
            left: 18,
            zIndex: 80,
          }}
        >
          <button
            type="button"
            className="management-icon-button"
            onClick={onSidebarToggle}
            aria-label="Open sidebar"
            title="Open sidebar"
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              border: '1px solid rgba(255, 255, 255, 0.1)',
              background: 'rgba(10, 14, 24, 0.78)',
              backdropFilter: 'blur(18px)',
              WebkitBackdropFilter: 'blur(18px)',
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
              cursor: 'pointer',
            }}
          >
            <Menu size={18} />
          </button>
        </div>
      )}

      {/* Floating Controls on the top-right */}
      <div className="management-floating-controls">
        <div className="management-language-control">
          <LanguageSwitcher />
        </div>
        {/* Custom Cinema Selector for Admin */}
        {cinemaSelector && (
          <div 
            ref={dropdownRef}
            className="management-cinema-selector-container"
            style={{ position: 'relative' }}
          >
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: 'linear-gradient(135deg, rgba(255, 138, 0, 0.08) 0%, rgba(10, 14, 24, 0.8) 100%)',
                border: '1px solid rgba(255, 138, 0, 0.35)',
                borderRadius: '12px',
                padding: '6px 14px',
                cursor: 'pointer',
                color: 'var(--text-primary)',
                fontSize: '11px',
                fontWeight: 700,
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                outline: 'none',
                height: '36px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent)';
                e.currentTarget.style.boxShadow = '0 6px 24px rgba(255, 138, 0, 0.2)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 138, 0, 0.35)';
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.25)';
                e.currentTarget.style.transform = 'none';
              }}
            >
              <Building2 size={13} style={{ color: 'var(--accent)', flexShrink: 0 }} />
              <span style={{ 
                whiteSpace: 'nowrap', 
                overflow: 'hidden', 
                textOverflow: 'ellipsis', 
                maxWidth: '120px' 
              }}>
                {currentLabel}
              </span>
              <ChevronDown 
                size={13} 
                style={{ 
                  color: 'var(--text-muted)', 
                  flexShrink: 0,
                  transform: isOpen ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.2s ease',
                }} 
              />
            </button>

            {isOpen && (
              <div
                className="management-cinema-menu"
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  zIndex: 150,
                  minWidth: '220px',
                  background: 'rgba(10, 14, 24, 0.94)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  border: '1px solid rgba(255, 138, 0, 0.25)',
                  borderRadius: '14px',
                  boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
                  padding: '6px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                  animation: 'slideDownFade 0.2s cubic-bezier(0.4, 0, 0.2, 1) forwards',
                  transformOrigin: 'top right',
                }}
              >
                {/* Reset option */}
                <button
                  type="button"
                  onClick={() => {
                    cinemaSelector.onChange(null);
                    setIsOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '8px 12px',
                    fontSize: '11px',
                    fontWeight: 600,
                    borderRadius: '8px',
                    border: 'none',
                    background: !cinemaSelector.activeCinemaId ? 'rgba(255, 138, 0, 0.12)' : 'transparent',
                    color: !cinemaSelector.activeCinemaId ? 'var(--accent)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                    width: '100%',
                  }}
                  onMouseEnter={(e) => {
                    if (cinemaSelector.activeCinemaId) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                      e.currentTarget.style.color = 'var(--text-primary)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (cinemaSelector.activeCinemaId) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = 'var(--text-secondary)';
                    }
                  }}
                >
                  -- Chọn Rạp --
                </button>

                {cinemaSelector.cinemas.map(c => {
                  const isActive = c.cinemaId === cinemaSelector.activeCinemaId;
                  return (
                    <button
                      key={c.cinemaId}
                      type="button"
                      onClick={() => {
                        cinemaSelector.onChange(c.cinemaId);
                        setIsOpen(false);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '8px 12px',
                        fontSize: '11px',
                        fontWeight: isActive ? 750 : 600,
                        borderRadius: '8px',
                        border: 'none',
                        background: isActive ? 'rgba(255, 138, 0, 0.12)' : 'transparent',
                        color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.15s ease',
                        width: '100%',
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.background = 'rgba(255, 138, 0, 0.06)';
                          e.currentTarget.style.color = 'var(--text-primary)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.color = 'var(--text-secondary)';
                        }
                      }}
                    >
                      {c.cinemaName}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default ManagementChrome;
