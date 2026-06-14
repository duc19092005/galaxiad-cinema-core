import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  UserCircle,
  ChevronRight,
  Settings,
  ArrowLeftRight,
  LogOut,
  Menu,
  PanelLeftClose,
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
  collapsibleDesktop?: boolean;
}

const AppSidebar: React.FC<AppSidebarProps> = ({
  isOpen,
  onToggle,
  activeTab,
  onTabChange,
  sections,
  role,
  collapsibleDesktop = false,
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
        className={`sidebar glass-card ${(isOpen || !collapsibleDesktop) ? 'sidebar-open' : 'sidebar-collapsed'}`}
      >
        {/* Header */}
        <div className="sidebar-header" style={{ padding: isOpen ? '20px 20px 16px' : '20px 0 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: isOpen ? 'space-between' : 'center', width: '100%', padding: isOpen ? '0' : '0 10px' }}>
            {isOpen && (
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
            )}
            <button onClick={onToggle} className="btn-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32 }}>
              {isOpen ? <PanelLeftClose size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* User Info */}
        {user && (
          <div style={{
            padding: isOpen ? '12px 20px' : '12px 0',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: isOpen ? 'flex-start' : 'center',
            gap: isOpen ? 10 : 0,
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'var(--accent-soft)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <UserCircle size={16} style={{ color: 'var(--accent)' }} />
            </div>
            {isOpen && (
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
            )}
          </div>
        )}

        {/* Navigation */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 0' }}>
          {sections.map((section, sIdx) => (
            <div key={sIdx}>
              {isOpen && section.label && (
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
                  style={{
                    justifyContent: isOpen ? 'flex-start' : 'center',
                    padding: isOpen ? '10px 16px' : '10px 0',
                    margin: isOpen ? '2px 8px' : '2px 4px',
                    width: isOpen ? 'calc(100% - 16px)' : 'calc(100% - 8px)',
                  }}
                  title={!isOpen ? item.label : undefined}
                >
                  {item.icon}
                  {isOpen && <span style={{ flex: 1 }}>{item.label}</span>}
                  {isOpen && activeTab === item.id && (
                    <ChevronRight size={14} style={{ color: 'var(--accent)' }} />
                  )}
                </button>
              ))}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{
          padding: isOpen ? '12px 20px' : '12px 0',
          borderTop: '1px solid var(--border-color)',
          display: 'flex', flexDirection: 'column', gap: 2,
          alignItems: isOpen ? 'stretch' : 'center',
        }}>
          <button
            onClick={() => navigate('/account')}
            className="sidebar-nav-item"
            style={{
              justifyContent: isOpen ? 'flex-start' : 'center',
              padding: isOpen ? '10px 16px' : '10px 0',
              margin: isOpen ? '2px 8px' : '2px 4px',
              width: isOpen ? 'calc(100% - 16px)' : 'calc(100% - 8px)',
            }}
            title={!isOpen ? t('Account Info') : undefined}
          >
            <Settings size={16} />
            {isOpen && t('Account Info')}
          </button>
          <button
            onClick={() => navigate('/role-selection')}
            className="sidebar-nav-item"
            style={{
              justifyContent: isOpen ? 'flex-start' : 'center',
              padding: isOpen ? '10px 16px' : '10px 0',
              margin: isOpen ? '2px 8px' : '2px 4px',
              width: isOpen ? 'calc(100% - 16px)' : 'calc(100% - 8px)',
            }}
            title={!isOpen ? t('Switch Role') : undefined}
          >
            <ArrowLeftRight size={16} />
            {isOpen && t('Switch Role')}
          </button>
          <button
            onClick={handleLogout}
            className="sidebar-nav-item"
            style={{
              justifyContent: isOpen ? 'flex-start' : 'center',
              padding: isOpen ? '10px 16px' : '10px 0',
              margin: isOpen ? '2px 8px' : '2px 4px',
              width: isOpen ? 'calc(100% - 16px)' : 'calc(100% - 8px)',
              color: 'var(--danger)',
            }}
            title={!isOpen ? t('Logout') : undefined}
          >
            <LogOut size={16} />
            {isOpen && t('Logout')}
          </button>
        </div>
      </aside>
    </>
  );
};

export default AppSidebar;
