// src/features/facilities/components/Sidebar.tsx
import React from 'react';
import { LayoutDashboard, Building2, BarChart3, XCircle, UserCircle, ArrowLeftRight, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { authApi } from '../../../api/authApi';
import Cookies from 'js-cookie';
import LanguageSwitcher from '../../../components/LanguageSwitcher';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange, isOpen, onToggle }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const menuItems = [
    { id: 'dashboard', label: t('sidebar.dashboard'), icon: LayoutDashboard },
    { id: 'cinemas', label: t('sidebar.cinemas'), icon: Building2 },
    { id: 'seat-reports', label: t('sidebar.rooms', 'Seat Reports'), icon: BarChart3 },
  ];

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
      {/* Overlay */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 100,
        transition: 'opacity 500ms var(--ease), visibility 500ms var(--ease)',
        opacity: isOpen ? 1 : 0, visibility: isOpen ? 'visible' : 'hidden',
        pointerEvents: isOpen ? 'auto' : 'none',
      }}>
        <div className="overlay" onClick={onToggle} />
      </div>

      <aside className="surface-elevated" style={{
        position: 'fixed', top: 0, left: 0, height: '100%', width: 288, zIndex: 110,
        borderRight: '1px solid var(--border)',
        transition: 'transform var(--duration) var(--ease)',
        transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{ padding: 'var(--space-6)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)' }}>
          <div>
            <div className="navbar-brand" onClick={() => navigate('/home')} style={{ cursor: 'pointer' }}>
              Cinema<span style={{ fontWeight: 400, color: 'var(--text-secondary)' }}>Pro</span>
            </div>
            <p className="text-muted" style={{ fontSize: '10px', letterSpacing: '0.3em', margin: 0 }}>{t('Facilities Manager')}</p>
          </div>
          <button onClick={onToggle} className="btn-icon">
            <XCircle size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {/* Mobile user */}
          {user && (
            <div className="lg:hidden" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', borderBottom: '1px solid var(--border)', paddingBottom: 'var(--space-4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--accent-soft)' }}>
                  <UserCircle size={20} style={{ color: 'var(--accent)' }} />
                </div>
                <div>
                  <p className="text-muted" style={{ fontSize: 'var(--text-xs)', margin: 0 }}>{t('ĐĂNG NHẬP BỞI')}</p>
                  <p style={{ fontWeight: 500, margin: 0 }}>{user.username}</p>
                </div>
              </div>
              <button onClick={() => { navigate('/account'); onToggle(); }} className="btn-ghost" style={{ justifyContent: 'flex-start' }}>
                <UserCircle size={16} />{t('Thông Tin Tài Khoản')}
              </button>
              {user.roles && user.roles.some((r: string) => r !== 'User' && r !== 'Cashier') && (
                <button onClick={() => { navigate('/role-selection'); onToggle(); }} className="btn-ghost" style={{ justifyContent: 'flex-start', color: 'var(--success)' }}>
                  <LayoutDashboard size={16} />Management Hub
                </button>
              )}
              <button onClick={() => { navigate('/role-selection'); onToggle(); }} className="btn-ghost" style={{ justifyContent: 'flex-start', color: 'var(--info)' }}>
                <ArrowLeftRight size={16} />{t('Đổi Vai Trò')}
              </button>
              <button onClick={() => { handleLogout(); onToggle(); }} className="btn-ghost" style={{ justifyContent: 'flex-start', color: 'var(--danger)' }}>
                <LogOut size={16} />{t('Đăng Xuất')}
              </button>
              {/* Preferences */}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 'var(--space-3)', marginTop: 'var(--space-1)' }}>
                <p className="text-muted" style={{ fontSize: 'var(--text-xs)', letterSpacing: '0.3px', marginBottom: 'var(--space-3)' }}>{t('Preferences')}</p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>{t('Language')}</span>
                  <LanguageSwitcher />
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div>
            <p className="text-muted" style={{ fontSize: 'var(--text-xs)', letterSpacing: '0.3px', marginBottom: 'var(--space-3)' }}>
              {t('Navigation')}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
              <button onClick={() => navigate('/home')} className="btn-ghost" style={{ justifyContent: 'flex-start' }}>
                <LayoutDashboard size={16} />{t('Back To Home')}
              </button>
              <div style={{ height: 1, backgroundColor: 'var(--border)', margin: 'var(--space-2) 0' }} />
              {menuItems.map(item => (
                <button key={item.id}
                  onClick={() => { onTabChange(item.id); if (window.innerWidth < 1024) onToggle(); }}
                  className="btn-ghost"
                  style={{
                    justifyContent: 'flex-start',
                    backgroundColor: activeTab === item.id ? 'var(--accent-soft)' : 'transparent',
                    color: activeTab === item.id ? 'var(--accent)' : 'var(--text-secondary)',
                  }}>
                  <item.icon size={16} />{item.label}
                </button>
              ))}
            </div>
          </div>

          {/* System (desktop) */}
          <div className="hidden lg:block" style={{ marginTop: 'auto' }}>
            <p className="text-muted" style={{ fontSize: 'var(--text-xs)', letterSpacing: '0.3px', marginBottom: 'var(--space-3)' }}>
              {t('System')}
            </p>
            <button onClick={() => navigate('/account')} className="btn-ghost" style={{ justifyContent: 'flex-start' }}>
              <UserCircle size={16} />{t('Account Info')}
            </button>
          </div>
        </div>

        {/* Footer (desktop) */}
        <div className="hidden lg:block" style={{ padding: 'var(--space-6)', borderTop: '1px solid var(--border)' }}>
          <button onClick={() => navigate('/role-selection')} className="btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', color: 'var(--info)' }}>
            <ArrowLeftRight size={16} />{t('Switch Role')}
          </button>
          <p className="text-muted" style={{ fontSize: '10px', textAlign: 'center', marginTop: 'var(--space-4)' }}>© 2024 CinemaPro</p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
