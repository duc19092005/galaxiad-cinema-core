import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../../../components/LanguageSwitcher';
import { authApi } from '../../../api/authApi';
import Cookies from 'js-cookie';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const MENU_ITEMS = [
  { id: 'dashboard', labelKey: 'Dashboard', icon: 'dashboard' },
  { id: 'employees', labelKey: 'Employee Management', icon: 'group' },
  { id: 'schedule', labelKey: 'Schedule', icon: 'calendar_month' },
];

const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange, isOpen, onToggle }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const stored = localStorage.getItem('user_info');
    setUser(stored ? JSON.parse(stored) : null);
  }, []);

  const handleLogout = async () => {
    try { await authApi.logout(); } catch (e) {}
    localStorage.removeItem('user_info');
    Cookies.remove('X-Access-Token');
    navigate('/login');
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 transition-opacity duration-500"
        style={{
          opacity: isOpen ? 1 : 0,
          visibility: isOpen ? 'visible' : 'hidden',
          pointerEvents: isOpen ? 'auto' : 'none',
        }}
        onClick={onToggle}
      />

      {/* Sidebar */}
      <aside
        className="sidebar fixed top-0 left-0 h-full z-50 flex flex-col"
        style={{
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-base">
          <div className="flex flex-col">
            <div
              className="font-display-lg text-primary cursor-pointer"
              onClick={() => { navigate('/home'); onToggle(); }}
            >
              CINEMA<span className="font-normal text-secondary">PRO</span>
            </div>
            <p className="text-secondary text-xs uppercase">{t('Theater Manager')}</p>
          </div>
          <button className="btn-ghost" onClick={onToggle}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>close</span>
          </button>
        </div>

        {/* Mobile User Info */}
        {user && (
          <div className="lg:hidden flex flex-col gap-2 p-6 border-b border-base">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#000' }}>
                  person
                </span>
              </div>
              <div className="flex flex-col">
                <p className="text-secondary text-xs">{t('Logged in as')}</p>
                <p className="font-medium text-primary">{user.username}</p>
              </div>
            </div>
            <button className="btn-ghost flex items-center" onClick={() => { navigate('/account'); onToggle(); }}>
              <span className="material-symbols-outlined" style={{ marginRight: '12px' }}>account_circle</span>
              {t('Account Info')}
            </button>
            <button className="btn-ghost flex items-center" onClick={handleLogout}>
              <span className="material-symbols-outlined" style={{ marginRight: '12px' }}>logout</span>
              {t('Logout')}
            </button>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-6">
          <p className="text-secondary text-xs uppercase mb-4">{t('Navigation')}</p>
          {MENU_ITEMS.map(item => (
            <button
              key={item.id}
              className={`sidebar-item ${activeTab === item.id ? 'active' : ''} flex items-center`}
              onClick={() => {
                onTabChange(item.id);
                if (window.innerWidth < 1024) onToggle();
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px', marginRight: '12px' }}>{item.icon}</span>
              {t(item.labelKey)}
            </button>
          ))}
        </nav>

        {/* Preferences – Mobile */}
        <div className="lg:hidden p-6 border-t border-base">
          <p className="text-secondary text-xs uppercase mb-2">{t('Preferences')}</p>
          <div className="flex items-center justify-between">
            <span className="font-medium text-primary">{t('Language')}</span>
            <LanguageSwitcher />
          </div>
        </div>

        {/* Footer – Desktop */}
        <div className="hidden lg:block p-6 border-t border-base mt-auto">
          <button className="btn-ghost flex items-center w-full" onClick={handleLogout}>
            <span className="material-symbols-outlined" style={{ marginRight: '12px' }}>logout</span>
            {t('Logout')}
          </button>
          <p className="text-secondary text-xs text-center mt-4">© 2024 CINEMA PRO</p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
