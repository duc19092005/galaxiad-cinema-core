import React from 'react';
import { Menu, Building2 } from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher';
import type { Cinema } from '../api/facilitiesApi';

interface CinemaSelectorOption {
  cinemas: Cinema[];
  activeCinemaId: string | null;
  activeCinemaName: string | null;
  onChange: (id: string | null) => void;
}

interface ManagementChromeProps {
  sidebarOpen: boolean;
  onSidebarToggle: () => void;
  cinemaSelector?: CinemaSelectorOption;
}

const ManagementChrome: React.FC<ManagementChromeProps> = ({ sidebarOpen, onSidebarToggle, cinemaSelector }) => (
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
      {/* Cinema Selector for Admin */}
      {cinemaSelector && (
        <div className="management-cinema-selector">
          <Building2 size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <select
            value={cinemaSelector.activeCinemaId || ''}
            onChange={e => cinemaSelector.onChange(e.target.value || null)}
            className="management-cinema-dropdown"
          >
            <option value="">-- Chọn Rạp --</option>
            {cinemaSelector.cinemas.map(c => (
              <option key={c.cinemaId} value={c.cinemaId}>{c.cinemaName}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  </>
);

export default ManagementChrome;
