import React from 'react';
import { Menu } from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher';

interface ManagementChromeProps {
  sidebarOpen: boolean;
  onSidebarToggle: () => void;
}

const ManagementChrome: React.FC<ManagementChromeProps> = ({ sidebarOpen, onSidebarToggle }) => (
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

    {/* Floating Controls on the top-right containing the language switcher */}
    <div className="management-floating-controls">
      <div className="management-language-control">
        <LanguageSwitcher />
      </div>
    </div>
  </>
);

export default ManagementChrome;
