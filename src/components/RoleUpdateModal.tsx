// src/components/RoleUpdateModal.tsx
import React, { useEffect, useState } from 'react';
import { X, Shield, Loader2, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { adminApi } from '../api/adminApi';
import type { RoleDto } from '../types/admin.types';
import { showSuccess, showError } from '../utils/ToastUtils';

interface RoleUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  currentUserEmail: string;
  currentUserRoles: string;
  onSuccess: (userId: string) => void;
}

const RoleUpdateModal: React.FC<RoleUpdateModalProps> = ({
  isOpen, onClose, userId, currentUserEmail, currentUserRoles, onSuccess,
}) => {
  const { t } = useTranslation();
  const [roles, setRoles] = useState<RoleDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [initialRoleIds, setInitialRoleIds] = useState<string[]>([]);

  useEffect(() => { if (isOpen) fetchRoles(); }, [isOpen]);

  const getRoleError = (err: unknown, fallback: string) => {
    if (typeof err !== 'object' || err === null) return fallback;
    const response = (err as { response?: { data?: { message?: string; Message?: string; errors?: string[] } } }).response;
    return response?.data?.message ?? response?.data?.Message ?? response?.data?.errors?.[0] ?? fallback;
  };

  const sameRoleSet = (a: string[], b: string[]) => (
    a.length === b.length && a.every((id) => b.includes(id))
  );

  const fetchRoles = async () => {
    setLoading(true); setError(null);
    try {
      const allRolesRes = await adminApi.getRoles();
      const allRoles = Array.isArray(allRolesRes.data) ? allRolesRes.data : (allRolesRes as any).data || [];
      setRoles(allRoles);
      try {
        const userRolesRes = await adminApi.getUserRoles(userId);
        const userCurrentRoles = userRolesRes.data || [];
        if (userCurrentRoles.length > 0) {
          const selectedIds = userCurrentRoles
            .map((role: any) => {
              if (typeof role === 'string') {
                return allRoles.find((r: RoleDto) => r.roleName === role)?.roleId;
              }
              return role.roleId;
            })
            .filter(Boolean) as string[];
          setSelectedRoleIds(selectedIds);
          setInitialRoleIds(selectedIds);
        } else { syncFromProps(allRoles); }
      } catch { syncFromProps(allRoles); }
    } catch (err: any) {
      setError(getRoleError(err, 'Failed to load roles'));
    } finally { setLoading(false); }
  };

  const syncFromProps = (allRoles: RoleDto[]) => {
    const currentRoleNames = currentUserRoles.split(',').map(r => r.trim());
    const selectedIds = allRoles.filter(r => currentRoleNames.includes(r.roleName)).map(r => r.roleId);
    setSelectedRoleIds(selectedIds);
    setInitialRoleIds(selectedIds);
  };

  const toggleRole = (role: RoleDto) => {
    const storedUser = JSON.parse(localStorage.getItem('user_info') || '{}');
    const isSelf = storedUser.userId === userId;
    const isAdminRole = role.roleName === 'Admin';

    if (isSelf && isAdminRole && selectedRoleIds.includes(role.roleId)) {
      showError(t('toast.removeOwnAdmin')); return;
    }

    setSelectedRoleIds(prev =>
      prev.includes(role.roleId) ? prev.filter(id => id !== role.roleId) : [...prev, role.roleId]
    );
  };

  const handleUpdate = async () => {
    if (sameRoleSet(selectedRoleIds, initialRoleIds)) return;
    setUpdating(true);
    try {
      await adminApi.updateUserRole(userId, selectedRoleIds);
      const storedUser = JSON.parse(localStorage.getItem('user_info') || '{}');
      if (storedUser.userId === userId) {
        showSuccess(t('toast.permissionsChanged'), { duration: 3000 });
        setTimeout(() => {
          localStorage.removeItem('user_info');
          document.cookie = 'X-Access-Token=; Max-Age=0; path=/;';
          window.location.href = '/login';
        }, 1500);
        return;
      }
      showSuccess(t('toast.rolesUpdated'));
      setInitialRoleIds(selectedRoleIds);
      onSuccess(userId);
      onClose();
    } catch (err: any) {
      showError(getRoleError(err, t('toast.rolesUpdateFailed')));
    } finally { setUpdating(false); }
  };

  if (!isOpen) return null;

  const currentRoleList = roles.filter(r => selectedRoleIds.includes(r.roleId));
  const availableRoleList = roles.filter(r => !selectedRoleIds.includes(r.roleId));
  const hasChanges = !sameRoleSet(selectedRoleIds, initialRoleIds);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 620 }}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <div style={{
              width: 40, height: 40,
              borderRadius: 'var(--radius-md)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              backgroundColor: 'var(--accent-soft)',
            }}>
              <Shield size={18} style={{ color: 'var(--accent)' }} />
            </div>
            <div>
              <h2 className="heading-md" style={{ margin: 0, fontSize: 22 }}>Update staff roles</h2>
              <p className="text-muted" style={{ fontSize: 13, margin: '4px 0 0' }}>
                {currentUserEmail}
              </p>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose}><X size={16} /></button>
        </div>

        {/* Body */}
        <div className="modal-body" style={{ maxHeight: 420, overflowY: 'auto', padding: '24px 28px' }}>
          {loading ? (
            <div className="state-center" style={{ minHeight: '120px' }}>
              <Loader2 size={24} style={{ color: 'var(--accent)', animation: 'spin 1s linear infinite' }} />
              <span className="text-muted">Loading roles...</span>
            </div>
          ) : error ? (
            <div className="card" style={{ padding: '12px 16px', borderColor: 'var(--danger)', backgroundColor: 'var(--danger-soft)', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <AlertCircle size={16} style={{ color: 'var(--danger)', flexShrink: 0 }} />
              <span className="text-sm" style={{ color: 'var(--danger)' }}>{error}</span>
            </div>
          ) : (
            <>
              {/* Current roles */}
              <div style={{ marginBottom: '28px' }}>
                <p className="text-muted" style={{ fontSize: 13, marginBottom: '10px', letterSpacing: '0.3px' }}>
                  Current roles
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {currentRoleList.length === 0 ? (
                    <span className="text-muted" style={{ fontSize: 14, fontStyle: 'italic', opacity: 0.7 }}>
                      No roles assigned.
                    </span>
                  ) : (
                    currentRoleList.map(role => {
                      const storedUser = JSON.parse(localStorage.getItem('user_info') || '{}');
                      const isSelf = storedUser.userId === userId;
                      const isAdminRole = role.roleName === 'Admin';
                      const isProtected = isSelf && isAdminRole;
                      return (
                        <span key={role.roleId} className="badge badge-accent" style={{ gap: '6px', padding: '7px 10px 7px 14px', fontSize: 13, borderRadius: 'var(--radius-md)' }}>
                          <span>{role.roleName}</span>
                          {isProtected ? (
                            <Shield size={12} />
                          ) : (
                            <button
                              onClick={() => toggleRole(role)}
                              style={{
                                all: 'unset', cursor: 'pointer', display: 'flex',
                                borderRadius: '50%', padding: 2,
                                backgroundColor: 'rgba(0,0,0,0.15)',
                              }}
                            >
                              <X size={10} />
                            </button>
                          )}
                        </span>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Available roles */}
              <div>
                <p className="text-muted" style={{ fontSize: 13, marginBottom: '10px', letterSpacing: '0.3px' }}>
                  Add roles
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {availableRoleList.length === 0 ? (
                    <span className="text-muted" style={{ fontSize: 14, fontStyle: 'italic', opacity: 0.7 }}>
                      All available roles assigned.
                    </span>
                  ) : (
                    availableRoleList.map(role => {
                      return (
                        <button
                          key={role.roleId}
                          onClick={() => toggleRole(role)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '14px 18px',
                            width: '100%',
                            textAlign: 'left',
                            cursor: 'pointer',
                            borderRadius: 'var(--radius-md)',
                            backgroundColor: 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid var(--border-color)',
                            transition: 'all 0.2s ease',
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
                            e.currentTarget.style.borderColor = 'var(--border-color)';
                          }}
                        >
                          <span className="text-body" style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                            {role.roleName}
                          </span>
                          <div style={{
                            width: 18,
                            height: 18,
                            borderRadius: '50%',
                            border: '2px solid var(--border-color)',
                          }} />
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose} disabled={updating}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleUpdate} disabled={updating || loading || !hasChanges}>
            {updating ? (
              <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Updating...</>
            ) : (
              <><Shield size={14} /> {hasChanges ? 'Apply changes' : 'No changes'}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoleUpdateModal;
