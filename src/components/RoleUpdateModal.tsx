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

  useEffect(() => { if (isOpen) fetchRoles(); }, [isOpen]);

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
          setSelectedRoleIds(userCurrentRoles.map(r => r.roleId));
        } else { syncFromProps(allRoles); }
      } catch { syncFromProps(allRoles); }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load roles');
    } finally { setLoading(false); }
  };

  const syncFromProps = (allRoles: RoleDto[]) => {
    const currentRoleNames = currentUserRoles.split(',').map(r => r.trim());
    setSelectedRoleIds(allRoles.filter(r => currentRoleNames.includes(r.roleName)).map(r => r.roleId));
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
      onSuccess(userId);
      onClose();
    } catch (err: any) {
      showError(err.response?.data?.message || t('toast.rolesUpdateFailed'));
    } finally { setUpdating(false); }
  };

  if (!isOpen) return null;

  const currentRoleList = roles.filter(r => selectedRoleIds.includes(r.roleId));
  const availableRoleList = roles.filter(r => !selectedRoleIds.includes(r.roleId));

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
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
              <h2 className="heading-md" style={{ margin: 0 }}>Update user role</h2>
              <p className="text-muted" style={{ fontSize: 'var(--text-xs)', margin: 0 }}>
                {currentUserEmail}
              </p>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose}><X size={16} /></button>
        </div>

        {/* Body */}
        <div className="modal-body" style={{ maxHeight: 420, overflowY: 'auto' }}>
          {loading ? (
            <div className="state-center">
              <Loader2 size={24} style={{ color: 'var(--accent)', animation: 'spin 1s linear infinite' }} />
              <span>Loading roles...</span>
            </div>
          ) : error ? (
            <div className="card" style={{ padding: 'var(--space-3) var(--space-4)', borderColor: 'var(--danger)', backgroundColor: 'var(--danger-soft)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <AlertCircle size={16} style={{ color: 'var(--danger)', flexShrink: 0 }} />
              <span className="text-sm">{error}</span>
            </div>
          ) : (
            <>
              {/* Current roles */}
              <div style={{ marginBottom: 'var(--space-6)' }}>
                <p className="text-muted" style={{ fontSize: 'var(--text-xs)', marginBottom: 'var(--space-2)', letterSpacing: '0.3px' }}>
                  Current roles
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                  {currentRoleList.length === 0 ? (
                    <span className="text-muted" style={{ fontSize: 'var(--text-sm)', fontStyle: 'italic', opacity: 0.5 }}>
                      No roles assigned.
                    </span>
                  ) : (
                    currentRoleList.map(role => {
                      const storedUser = JSON.parse(localStorage.getItem('user_info') || '{}');
                      const isSelf = storedUser.userId === userId;
                      const isAdminRole = role.roleName === 'Admin';
                      const isProtected = isSelf && isAdminRole;
                      return (
                        <span key={role.roleId} className="badge badge-accent" style={{ gap: 'var(--space-1)', paddingRight: isProtected ? '8px' : '4px' }}>
                          <span>{role.roleName}</span>
                          {isProtected ? (
                            <Shield size={10} />
                          ) : (
                            <button
                              onClick={() => toggleRole(role)}
                              style={{
                                all: 'unset', cursor: 'pointer', display: 'flex',
                                borderRadius: '50%', padding: 1,
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
                <p className="text-muted" style={{ fontSize: 'var(--text-xs)', marginBottom: 'var(--space-2)', letterSpacing: '0.3px' }}>
                  Add roles
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  {availableRoleList.length === 0 ? (
                    <span className="text-muted" style={{ fontSize: 'var(--text-sm)', fontStyle: 'italic', opacity: 0.5 }}>
                      All available roles assigned.
                    </span>
                  ) : (
                    availableRoleList.map(role => (
                      <button
                        key={role.roleId}
                        onClick={() => toggleRole(role)}
                        className="card card-hover"
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: 'var(--space-3) var(--space-4)', width: '100%', textAlign: 'left',
                          cursor: 'pointer',
                        }}
                      >
                        <span className="text-body" style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>
                          {role.roleName}
                        </span>
                        <div style={{
                          width: 16, height: 16,
                          borderRadius: '50%',
                          border: '1px solid var(--border)',
                        }} />
                      </button>
                    ))
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
          <button className="btn btn-primary" onClick={handleUpdate} disabled={updating || loading}>
            {updating ? (
              <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Updating...</>
            ) : (
              <><Shield size={14} /> Apply changes</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoleUpdateModal;
