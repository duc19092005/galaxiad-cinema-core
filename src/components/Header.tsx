// src/components/Header.tsx
// Fixed top navbar with cinema dark theme

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCinema } from '../contexts/CinemaContext';
import {
  UserCircle,
  LogOut,
  ArrowLeftRight,
  LayoutDashboard,
  ChevronDown,
  Menu,
  Bell,
} from 'lucide-react';
import { authApi } from '../api/authApi';
import Cookies from 'js-cookie';
import LanguageSwitcher from './LanguageSwitcher';
import CinemaSelector from './CinemaSelector';
import LogoutModal from './LogoutModal';

interface HeaderProps {
  title?: string;
  role?: string;
  onMenuToggle?: () => void;
  showSidebarToggle?: boolean;
  rightContent?: React.ReactNode;
}

const Header: React.FC<HeaderProps> = ({
  title,
  role,
  onMenuToggle,
  showSidebarToggle = false,
  rightContent,
}) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const storedUserStr = localStorage.getItem('user_info');
  const user = storedUserStr ? JSON.parse(storedUserStr) : null;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setLogoutError(null);
    setLogoutLoading(true);
    try {
      await authApi.logout();
      localStorage.removeItem('user_info');
      Cookies.remove('X-Access-Token');
      setIsLogoutModalOpen(false);
      navigate('/login');
    } catch {
      setLogoutError('Logout failed. Please try again.');
    } finally {
      setLogoutLoading(false);
    }
  };

  return (
    <>
      <header className="navbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1 }}>
          {showSidebarToggle && (
            <button onClick={onMenuToggle} className="btn-icon lg:hidden">
              <Menu size={20} />
            </button>
          )}
          {title && (
            <div>
              <h1 style={{
                fontSize: 16, fontWeight: 700, color: 'var(--text-primary)',
                fontFamily: "'Inter', sans-serif", margin: 0, letterSpacing: '-0.01em',
              }}>
                {title}
              </h1>
              {role && (
                <p style={{
                  fontSize: 10, color: 'var(--accent)', margin: 0,
                  fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.05em',
                  textTransform: 'uppercase', fontWeight: 600,
                }}>
                  {role}
                </p>
              )}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Notification Bell */}
          <button className="btn-icon relative">
            <Bell size={18} />
            <span style={{
              position: 'absolute', top: 6, right: 6,
              width: 6, height: 6, borderRadius: '50%',
              background: 'var(--accent)',
              animation: 'pulse-dot 2s ease-in-out infinite',
            }} />
          </button>

          {/* Cinema Selector */}
          <CinemaSelector />

          {/* Language Switcher */}
          <LanguageSwitcher />

          {/* Divider */}
          <div style={{ width: 1, height: 24, background: 'var(--border-color)' }} />

          {/* User Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all duration-200"
              style={{
                background: isDropdownOpen ? 'rgba(255,255,255,0.04)' : 'transparent',
                border: '1px solid transparent',
                borderColor: isDropdownOpen ? 'var(--border-color)' : 'transparent',
              }}
            >
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: 'var(--accent-soft)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <UserCircle size={16} style={{ color: 'var(--accent)' }} />
              </div>
              <div style={{ display: 'none', flexDirection: 'column', alignItems: 'flex-start' }}
                   className="hidden md:flex">
                <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                  {user?.username || 'Guest'}
                </span>
                <span style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace", lineHeight: 1.2 }}>
                  {role || 'User'}
                </span>
              </div>
              <ChevronDown
                size={12}
                style={{
                  color: 'var(--text-muted)',
                  transition: 'transform 0.2s ease',
                  transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                }}
              />
            </button>

            {isDropdownOpen && (
              <div
                className="absolute right-0 mt-2 py-1 rounded-xl z-50"
                style={{
                  minWidth: 220,
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-color)',
                  boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
                }}
              >
                {user && (
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)' }}>
                    <p style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace", margin: '0 0 2px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                      {t('SIGNED IN AS')}
                    </p>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                      {user.username}
                    </p>
                  </div>
                )}

                <button
                  onClick={() => { navigate('/account'); setIsDropdownOpen(false); }}
                  className="sidebar-nav-item"
                >
                  <UserCircle size={16} />
                  {t('Account Info')}
                </button>

                <button
                  onClick={() => { navigate('/role-selection'); setIsDropdownOpen(false); }}
                  className="sidebar-nav-item"
                >
                  <ArrowLeftRight size={16} />
                  {t('Switch Role')}
                </button>

                <div style={{ height: 1, background: 'var(--border-color)', margin: '4px 8px' }} />

                <button
                  onClick={() => { setIsDropdownOpen(false); setIsLogoutModalOpen(true); }}
                  className="sidebar-nav-item"
                  style={{ color: 'var(--danger)' }}
                >
                  <LogOut size={16} />
                  {t('Logout')}
                </button>
              </div>
            )}
          </div>

          {rightContent}
        </div>
      </header>

      <LogoutModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleLogout}
        loading={logoutLoading}
        error={logoutError}
      />
    </>
  );
};

export default Header;
