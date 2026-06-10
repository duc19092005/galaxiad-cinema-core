// src/components/AppSidebar.tsx
// Reusable sidebar for all management pages

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  Film,
  Calendar,
  Building2,
  Activity,
  Users,
  Settings,
  X,
  LogOut,
  UserCircle,
  ArrowLeftRight,
  ChevronRight,
} from 'lucide-react';
import { authApi } from '../api/authApi';
import Cookies from 'js-cookie';

export interface SidebarSection {
  label?: string;
  items: SidebarItem[];
}

export interface SidebarItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path?: string;
  onClick?: () => void;
}

interface AppSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  sections: SidebarSection[];
  role?: string;
  onLogout?: () => void;
}

const AppSidebar: React.FC<AppSidebarProps> = ({
  isOpen,
  onToggle,
  activeTab,
  onTabChange,
  sections,
  role,
}) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const storedUserStr = localStorage.getItem('user_info');
  const user = storedUserStr ? JSON.parse(storedUserStr) : null;

  const handleLogout = async () => {
    try { await authApi.logout(); } catch {}
    localStorage.removeItem('user_info');
    Cookies.remove('X-Access-Token');
    navigate('/login');
  };

  return (
    <>
      {/* Overlay (mobile) */}
      {isOpen && (
        <div
          onClick={onToggle}
          style={{
            position: 'fixed', inset: 0, zIndex: 90,
            background: 'rgba(0,0,0,0.5)',
          }}
          className="lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`sidebar ${isOpen ? 'open' : ''}`}
        style={{
          transform: isOpen ? 'translateX(0)' : undefined,
        }}
      >
        {/* Header */}
        <div className="sidebar-header">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div
                onClick={() => navigate('/home')}
                style={{ cursor: 'pointer', fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
              >
                CINEMA
                <span style={{ color: 'var(--accent)', fontWeight: 300 }}>Pro</span>
              </div>
              {role && (
                <p style={{
                  fontSize: 9, color: 'var(--accent)', margin: '2px 0 0',
                  fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.08em',
                  textTransform: 'uppercase', fontWeight: 600,
                }}>
                  {role}
                </p>
              )}
            </div>
            <button onClick={onToggle} className="btn-icon lg:!hidden">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* User Info */}
        {user && (
          <div style={{
            padding: '12px 20px', borderBottom: '1px solid var(--border-color)',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'var(--accent-soft)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <UserCircle size={16} style={{ color: 'var(--accent)' }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.username}
              </p>
              <p style={{
                fontSize: 9, color: 'var(--text-muted)', margin: 0,
                fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.03em',
              }}>
                {t('Signed in')}
              </p>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 0' }}>
          {sections.map((section, sIdx) => (
            <div key={sIdx}>
              {section.label && (
                <div className="sidebar-section-label">{section.label}</div>
              )}
              {section.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.onClick) item.onClick();
                    else onTabChange(item.id);
                    if (window.innerWidth < 1024) onToggle();
                  }}
                  className={`sidebar-nav-item ${activeTab === item.id ? 'active' : ''}`}
                >
                  {item.icon}
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {activeTab === item.id && (
                    <ChevronRight size={14} style={{ color: 'var(--accent)' }} />
                  )}
                </button>
              ))}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid var(--border-color)',
          display: 'flex', flexDirection: 'column', gap: 2,
        }}>
          <button
            onClick={() => navigate('/account')}
            className="sidebar-nav-item"
            style={{ width: '100%' }}
          >
            <Settings size={16} />
            {t('Account Info')}
          </button>
          <button
            onClick={() => navigate('/role-selection')}
            className="sidebar-nav-item"
            style={{ width: '100%' }}
          >
            <ArrowLeftRight size={16} />
            {t('Switch Role')}
          </button>
          <button
            onClick={handleLogout}
            className="sidebar-nav-item"
            style={{ width: '100%', color: 'var(--danger)' }}
          >
            <LogOut size={16} />
            {t('Logout')}
          </button>
        </div>
      </aside>
    </>
  );
};

export default AppSidebar;
