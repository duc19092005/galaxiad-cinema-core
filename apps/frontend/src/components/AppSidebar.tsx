import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  UserCircle,
  ChevronRight,
  ChevronDown,
  Settings,
  ArrowLeftRight,
  LogOut,
  Menu,
  PanelLeftClose,
  Folder,
} from 'lucide-react';
import { authApi } from '../api/authApi';
import Cookies from 'js-cookie';

export interface SidebarSection {
  /** Stable key for expand state; falls back to label or index. */
  id?: string;
  label?: string;
  /** Short helper under the group header when expanded. */
  description?: string;
  icon?: React.ReactNode;
  /** Start open (also opens when its child becomes activeTab). */
  defaultOpen?: boolean;
  /**
   * When true (default if label is set), group is one clickable row that expands items.
   * When false, items always show (flat).
   */
  collapsible?: boolean;
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

const sectionKey = (section: SidebarSection, index: number) =>
  section.id || section.label || `section-${index}`;

const collectOpenKeys = (sections: SidebarSection[], activeTab: string, preferDefault: boolean) => {
  const keys = new Set<string>();
  sections.forEach((section, index) => {
    const key = sectionKey(section, index);
    const isCollapsible = section.collapsible ?? Boolean(section.label);
    if (!isCollapsible) {
      keys.add(key);
      return;
    }
    if (preferDefault && section.defaultOpen) keys.add(key);
    if (section.items.some((item) => item.id === activeTab)) keys.add(key);
  });
  return keys;
};

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
  const sectionsRef = useRef(sections);
  sectionsRef.current = sections;

  const storedUserStr = localStorage.getItem('user_info');
  const user = storedUserStr ? JSON.parse(storedUserStr) : null;

  const [expanded, setExpanded] = useState<Set<string>>(() =>
    collectOpenKeys(sections, activeTab, true),
  );

  // Only react to activeTab changes — never re-open groups just because parent re-created sections[].
  const prevActiveTab = useRef(activeTab);
  useEffect(() => {
    if (prevActiveTab.current === activeTab) return;
    prevActiveTab.current = activeTab;
    setExpanded((prev) => {
      const next = new Set(prev);
      sectionsRef.current.forEach((section, index) => {
        if (section.items.some((item) => item.id === activeTab)) {
          next.add(sectionKey(section, index));
        }
      });
      return next;
    });
  }, [activeTab]);

  const toggleSection = (key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      /* ignore */
    }
    localStorage.removeItem('user_info');
    Cookies.remove('X-Access-Token');
    navigate('/login');
  };

  const runItem = (item: SidebarItem) => {
    // Collapsed rail: open sidebar first so the user sees context; still navigate.
    if (!isOpen && collapsibleDesktop) {
      onToggle();
    }
    if (item.onClick) item.onClick();
    else onTabChange(item.id);
    if (window.innerWidth < 1024 && isOpen) onToggle();
  };

  const itemButtonStyle = (open: boolean): React.CSSProperties => ({
    justifyContent: open ? 'flex-start' : 'center',
    padding: open ? '10px 16px' : '10px 0',
    margin: open ? '2px 8px' : '2px 4px',
    width: open ? 'calc(100% - 16px)' : 'calc(100% - 8px)',
  });

  return (
    <>
      {isOpen && (
        <div
          onClick={onToggle}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 90,
            background: 'rgba(0, 0, 0, 0.5)',
          }}
          className="lg:hidden"
        />
      )}

      <aside
        className={`sidebar glass-card ${isOpen || !collapsibleDesktop ? 'sidebar-open' : 'sidebar-collapsed'}`}
      >
        <div className="sidebar-header" style={{ padding: isOpen ? '20px 20px 16px' : '20px 0 16px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: isOpen ? 'space-between' : 'center',
              width: '100%',
              padding: isOpen ? '0' : '0 10px',
            }}
          >
            {isOpen && (
              <div>
                <div
                  onClick={() => navigate('/home')}
                  style={{
                    cursor: 'pointer',
                    fontSize: 18,
                    fontWeight: 800,
                    color: 'var(--text-primary)',
                    letterSpacing: '-0.02em',
                  }}
                >
                  CINEMA
                  <span style={{ color: 'var(--accent)', fontWeight: 300 }}>Pro</span>
                </div>
                {role && (
                  <p
                    style={{
                      fontSize: 9,
                      color: 'var(--accent)',
                      margin: '2px 0 0',
                      fontFamily: "'JetBrains Mono', monospace",
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      fontWeight: 600,
                    }}
                  >
                    {role}
                  </p>
                )}
              </div>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggle();
              }}
              className="btn-icon"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 32,
                height: 32,
              }}
              aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            >
              {isOpen ? <PanelLeftClose size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {user && (
          <div
            style={{
              padding: isOpen ? '12px 20px' : '12px 0',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: isOpen ? 'flex-start' : 'center',
              gap: isOpen ? 10 : 0,
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'var(--accent-soft)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <UserCircle size={16} style={{ color: 'var(--accent)' }} />
            </div>
            {isOpen && (
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    margin: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {user.username}
                </p>
                <p
                  style={{
                    fontSize: 9,
                    color: 'var(--text-muted)',
                    margin: 0,
                    fontFamily: "'JetBrains Mono', monospace",
                    letterSpacing: '0.03em',
                  }}
                >
                  {t('Signed in')}
                </p>
              </div>
            )}
          </div>
        )}

        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 0' }}>
          {sections.map((section, sIdx) => {
            const key = sectionKey(section, sIdx);
            const isCollapsible = section.collapsible ?? Boolean(section.label);
            const isExpanded = !isCollapsible || expanded.has(key);
            const hasActiveChild = section.items.some((item) => item.id === activeTab);
            const groupIcon = section.icon ?? <Folder size={18} />;

            // Flat single control (e.g. "Về Admin")
            if (!section.label && section.items.length === 1 && !isCollapsible) {
              const item = section.items[0];
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => runItem(item)}
                  className={`sidebar-nav-item ${activeTab === item.id ? 'active' : ''}`}
                  style={itemButtonStyle(isOpen)}
                  title={!isOpen ? item.label : undefined}
                >
                  {item.icon}
                  {isOpen && <span style={{ flex: 1 }}>{item.label}</span>}
                </button>
              );
            }

            return (
              <div key={key} className="sidebar-accordion-group">
                {isCollapsible && section.label ? (
                  <button
                    type="button"
                    className={`sidebar-nav-item sidebar-group-toggle ${hasActiveChild ? 'has-active' : ''} ${isExpanded ? 'open' : ''}`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      // Collapsed rail: only open the sidebar + expand this group.
                      // Do NOT toggle close here (that caused "close then pop open" fights).
                      if (!isOpen && collapsibleDesktop) {
                        onToggle();
                        setExpanded((prev) => new Set(prev).add(key));
                        return;
                      }
                      toggleSection(key);
                    }}
                    style={itemButtonStyle(isOpen)}
                    title={!isOpen ? section.label : undefined}
                    aria-expanded={isExpanded}
                  >
                    {groupIcon}
                    {isOpen && (
                      <>
                        <span style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
                          <span style={{ display: 'block', fontWeight: 700 }}>{section.label}</span>
                          {section.description && (
                            <span className="sidebar-group-desc">{section.description}</span>
                          )}
                        </span>
                        {isExpanded ? (
                          <ChevronDown size={16} style={{ opacity: 0.8, flexShrink: 0 }} />
                        ) : (
                          <ChevronRight size={16} style={{ opacity: 0.8, flexShrink: 0 }} />
                        )}
                      </>
                    )}
                  </button>
                ) : (
                  isOpen &&
                  section.label && (
                    <div className="sidebar-section-header">
                      <div className="sidebar-section-label">{section.label}</div>
                      {section.description && (
                        <p className="sidebar-section-description">{section.description}</p>
                      )}
                    </div>
                  )
                )}

                {/* When rail is collapsed, still show child icons if group is expanded */}
                {isExpanded && (
                  <div className={`sidebar-accordion-body ${isOpen && isCollapsible ? 'indented' : ''}`}>
                    {section.items.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => runItem(item)}
                        className={`sidebar-nav-item ${activeTab === item.id ? 'active' : ''}`}
                        style={{
                          justifyContent: isOpen ? 'flex-start' : 'center',
                          padding: isOpen ? '9px 14px' : '10px 0',
                          margin: isOpen ? '1px 8px' : '2px 4px',
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
                )}
              </div>
            );
          })}
        </div>

        <div
          style={{
            padding: isOpen ? '12px 20px' : '12px 0',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            alignItems: isOpen ? 'stretch' : 'center',
          }}
        >
          <button
            type="button"
            onClick={() => navigate('/account')}
            className="sidebar-nav-item"
            style={itemButtonStyle(isOpen)}
            title={!isOpen ? t('Account Info') : undefined}
          >
            <Settings size={16} />
            {isOpen && t('Account Info')}
          </button>
          <button
            type="button"
            onClick={() => navigate('/role-selection')}
            className="sidebar-nav-item"
            style={itemButtonStyle(isOpen)}
            title={!isOpen ? t('Switch Role') : undefined}
          >
            <ArrowLeftRight size={16} />
            {isOpen && t('Switch Role')}
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="sidebar-nav-item"
            style={{ ...itemButtonStyle(isOpen), color: 'var(--danger)' }}
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
