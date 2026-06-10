import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Moon, Sun, Sparkles, Bell, Menu } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

/**
 * Header component (Top Navigation Bar) – shared across all authenticated pages.
 * Implements the design spec:
 *   • Dark background (var(--color-bg-base) / admin surface)
 *   • Search input with icon
 *   • Notifications icon with red dot
 *   • Theme toggle (light / dark / modern)
 *   • Account settings dropdown (avatar placeholder, language switcher, logout)
 *   • Uses design‑system utility classes for spacing, colors, typography.
 */
const Header: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [isThemeOpen, setIsThemeOpen] = React.useState(false);
  const [isAccountOpen, setIsAccountOpen] = React.useState(false);

  const themeIcon = () => {
    switch (theme) {
      case 'dark': return <Moon size={20} className="text-secondary"/>;
      case 'modern': return <Sparkles size={20} className="text-secondary"/>;
      default: return <Sun size={20} className="text-secondary"/>;
    }
  };

  const handleLogout = () => {
    // simple logout – actual logic handled elsewhere (context / auth api)
    navigate('/logout');
  };

  return (
    <header className="flex items-center justify-between h-16 bg-bg-base border-b border-base px-8 sticky top-0 z-40">
      {/* Left side – optional menu button for mobile */}
      <button className="lg:hidden btn-ghost" onClick={() => {/* trigger sidebar via global state */}}>
        <Menu size={20} className="text-secondary" />
      </button>

      {/* Search bar */}
      <div className="relative flex-1 max-w-2xl mx-4">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary" style={{fontSize:'20px'}}>search</span>
        <input
          type="text"
          placeholder={t('Search movies, schedules, or users...')}
          className="w-full pl-10 pr-4 py-2 bg-surface rounded-full text-body-md text-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Right side – icons */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button className="relative btn-ghost">
          <Bell size={20} className="text-secondary" />
          <span className="absolute top-0 right-0 block w-2 h-2 bg-primary rounded-full" />
        </button>
        {/* Theme toggle */}
        <button className="btn-ghost" onClick={() => setIsThemeOpen(!isThemeOpen)}>
          {themeIcon()}
        </button>
        {isThemeOpen && (
          <div className="absolute right-0 mt-2 w-32 bg-surface-high border border-base rounded-lg shadow-lg z-10">
            {(['light','dark','modern'] as const).map(m => (
              <button key={m} className="flex items-center w-full px-3 py-2 hover:bg-surface-high"
                onClick={() => { setTheme(m); setIsThemeOpen(false); }}>
                {m === 'light' && <Sun size={16} className="mr-2"/>}
                {m === 'dark' && <Moon size={16} className="mr-2"/>}
                {m === 'modern' && <Sparkles size={16} className="mr-2"/>}
                <span className="text-body-sm capitalize">{m}</span>
              </button>
            ))}
          </div>
        )}
        {/* Account dropdown */}
        <div className="relative">
          <button className="flex items-center gap-2 btn-ghost" onClick={() => setIsAccountOpen(!isAccountOpen)}>
            <span className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary">
              {/* placeholder avatar */}<span className="material-symbols-outlined" style={{fontSize:'20px'}}>person</span>
            </span>
            <span className="text-body-sm text-secondary">{t('Account Settings')}</span>
            <svg className="w-4 h-4 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>
          </button>
          {isAccountOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-surface-high border border-base rounded-lg shadow-lg z-10">
              <button className="flex items-center w-full px-3 py-2 hover:bg-surface-high" onClick={() => navigate('/account')}>
                <span className="material-symbols-outlined mr-2" style={{fontSize:'18px'}}>account_circle</span>
                {t('Account Info')}
              </button>
              <button className="flex items-center w-full px-3 py-2 hover:bg-surface-high" onClick={() => navigate('/role-selection')}>
                <span className="material-symbols-outlined mr-2" style={{fontSize:'18px'}}>swap_horiz</span>
                {t('Switch Role')}
              </button>
              <div className="border-t border-base my-1" />
              <button className="flex items-center w-full px-3 py-2 text-primary hover:bg-surface-high" onClick={handleLogout}>
                <span className="material-symbols-outlined mr-2" style={{fontSize:'18px'}}>logout</span>
                {t('Logout')}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
