import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, Check, KeyRound, Loader2, RefreshCw, RotateCcw, Save, Search, ShieldCheck } from 'lucide-react';
import { adminApi } from '../../../api/adminApi';
import type { PermissionDto, RolePermissionsDto } from '../../../types/admin.types';
import { showError, showSuccess } from '../../../utils/ToastUtils';

const sameSet = (a: string[], b: string[]) => {
  if (a.length !== b.length) return false;
  const next = new Set(a);
  return b.every((item) => next.has(item));
};

const getApiMessage = (error: unknown, fallback: string) => {
  if (typeof error !== 'object' || error === null) return fallback;
  const response = (error as { response?: { data?: { message?: string; Message?: string } } }).response;
  return response?.data?.message ?? response?.data?.Message ?? fallback;
};

const RolePermissionsSection: React.FC = () => {
  const [roles, setRoles] = useState<RolePermissionsDto[]>([]);
  const [permissions, setPermissions] = useState<PermissionDto[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedRole = useMemo(
    () => roles.find((role) => role.roleId === selectedRoleId) || null,
    [roles, selectedRoleId],
  );

  const savedPermissionIds = useMemo(
    () => selectedRole?.permissions.map((permission) => permission.permissionId) || [],
    [selectedRole],
  );

  const selectedPermissionSet = useMemo(() => new Set(selectedPermissionIds), [selectedPermissionIds]);
  const hasUnsavedChanges = !sameSet(selectedPermissionIds, savedPermissionIds);

  const filteredPermissions = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return permissions;
    return permissions.filter((permission) => permission.permissionInfo.toLowerCase().includes(keyword));
  }, [permissions, searchTerm]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [permissionsRes, rolesRes] = await Promise.all([
        adminApi.getPermissions(),
        adminApi.getRolesPermissions(),
      ]);
      const nextPermissions = permissionsRes.data || [];
      const nextRoles = rolesRes.data || [];
      setPermissions(nextPermissions);
      setRoles(nextRoles);
      setSelectedRoleId((current) => current || nextRoles[0]?.roleId || '');
    } catch (err) {
      const message = getApiMessage(err, 'Unable to load role permissions.');
      setError(message);
      showError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    setSelectedPermissionIds(savedPermissionIds);
  }, [savedPermissionIds]);

  const handleSelectRole = (roleId: string) => {
    if (roleId === selectedRoleId) return;
    if (hasUnsavedChanges && !window.confirm('Discard unsaved permission changes for this role?')) return;
    setSelectedRoleId(roleId);
  };

  const togglePermission = (permissionId: string) => {
    setSelectedPermissionIds((current) => (
      current.includes(permissionId)
        ? current.filter((item) => item !== permissionId)
        : [...current, permissionId]
    ));
  };

  const updateVisiblePermissions = (checked: boolean) => {
    const visibleIds = filteredPermissions.map((permission) => permission.permissionId);
    setSelectedPermissionIds((current) => {
      const next = new Set(current);
      visibleIds.forEach((id) => {
        if (checked) next.add(id);
        else next.delete(id);
      });
      return Array.from(next);
    });
  };

  const handleReset = () => {
    setSelectedPermissionIds(savedPermissionIds);
  };

  const handleSave = async () => {
    if (!selectedRole) return;
    const confirmed = window.confirm(
      `Update permissions for ${selectedRole.roleName}? Users with this role need to log in again to receive new JWT permission claims.`,
    );
    if (!confirmed) return;

    setSaving(true);
    try {
      const response = await adminApi.updateRolePermissions(selectedRole.roleId, selectedPermissionIds);
      const nextPermissionSet = new Set(selectedPermissionIds);
      setRoles((current) => current.map((role) => (
        role.roleId === selectedRole.roleId
          ? { ...role, permissions: permissions.filter((permission) => nextPermissionSet.has(permission.permissionId)) }
          : role
      )));
      showSuccess(response.message || `Permissions updated for ${selectedRole.roleName}.`);
    } catch (err) {
      showError(getApiMessage(err, 'Unable to update role permissions.'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="state-center" style={{ minHeight: '55vh' }}>
        <Loader2 size={28} style={{ color: 'var(--accent)', animation: 'spin 1s linear infinite' }} />
        <p style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>
          Loading permissions...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card state-center" style={{ minHeight: 260, padding: 24 }}>
        <AlertCircle size={28} style={{ color: 'var(--danger)' }} />
        <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{error}</p>
        <button className="btn btn-secondary" onClick={loadData}>
          <RefreshCw size={16} />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="animate-in" style={{ display: 'grid', gap: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>Role permissions</h2>
          <p style={{ margin: '6px 0 0', color: 'var(--text-secondary)', fontSize: 13 }}>
            Configure permission claims for each role. Active users receive changes after their next login.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={loadData} disabled={saving}>
            <RefreshCw size={16} />
            Refresh
          </button>
          <button className="btn btn-primary" onClick={handleSave} disabled={!selectedRole || !hasUnsavedChanges || saving}>
            {saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={16} />}
            Save changes
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 0.36fr) minmax(0, 1fr)', gap: 16 }} className="admin-permissions-grid">
        <aside className="glass-card" style={{ padding: 16, display: 'grid', gap: 12, alignSelf: 'start' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck size={17} style={{ color: 'var(--accent)' }} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 13, fontWeight: 800 }}>Roles</h3>
              <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)' }}>{roles.length} configured</p>
            </div>
          </div>

          <div style={{ display: 'grid', gap: 8 }}>
            {roles.map((role) => {
              const isActive = role.roleId === selectedRoleId;
              return (
                <button
                  key={role.roleId}
                  type="button"
                  onClick={() => handleSelectRole(role.roleId)}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 10,
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: `1px solid ${isActive ? 'rgba(255, 138, 0, 0.45)' : 'var(--border-color)'}`,
                    background: isActive ? 'var(--accent-soft)' : 'rgba(255,255,255,0.02)',
                    color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 700 }}>{role.roleName}</span>
                  <span className="badge badge-default">{role.permissions.length}</span>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="glass-card" style={{ padding: 18, display: 'grid', gap: 16, minWidth: 0 }}>
          {selectedRole ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>{selectedRole.roleName}</h3>
                    {hasUnsavedChanges && <span className="badge badge-warning">Unsaved changes</span>}
                  </div>
                  <p style={{ margin: '5px 0 0', color: 'var(--text-secondary)', fontSize: 12 }}>
                    {selectedPermissionIds.length} of {permissions.length} permissions selected.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button className="btn btn-secondary" onClick={() => updateVisiblePermissions(true)} disabled={filteredPermissions.length === 0}>
                    <Check size={15} />
                    Select visible
                  </button>
                  <button className="btn btn-secondary" onClick={() => updateVisiblePermissions(false)} disabled={filteredPermissions.length === 0}>
                    Clear visible
                  </button>
                  <button className="btn btn-ghost" onClick={handleReset} disabled={!hasUnsavedChanges}>
                    <RotateCcw size={15} />
                    Reset
                  </button>
                </div>
              </div>

              <label style={{ display: 'grid', gap: 6 }}>
                <span className="input-label" style={{ margin: 0 }}>Search permissions</span>
                <div style={{ position: 'relative' }}>
                  <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    className="input"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Search permission name..."
                    style={{ paddingLeft: 38 }}
                  />
                </div>
              </label>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
                gap: 10,
                maxHeight: 500,
                overflowY: 'auto',
                paddingRight: 4,
              }}>
                {filteredPermissions.map((permission) => {
                  const checked = selectedPermissionSet.has(permission.permissionId);
                  return (
                    <label
                      key={permission.permissionId}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 10,
                        padding: 12,
                        borderRadius: 'var(--radius-md)',
                        border: `1px solid ${checked ? 'rgba(255, 138, 0, 0.35)' : 'var(--border-color)'}`,
                        background: checked ? 'rgba(255, 138, 0, 0.08)' : 'rgba(255,255,255,0.02)',
                        cursor: 'pointer',
                        minWidth: 0,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => togglePermission(permission.permissionId)}
                        style={{ marginTop: 2, accentColor: '#ff8a00' }}
                      />
                      <span style={{ display: 'grid', gap: 4, minWidth: 0 }}>
                        <span style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 700, overflowWrap: 'anywhere' }}>
                          {permission.permissionInfo}
                        </span>
                        <span style={{ color: 'var(--text-muted)', fontSize: 10, fontFamily: "'JetBrains Mono', monospace", overflowWrap: 'anywhere' }}>
                          {permission.permissionId}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>

              {filteredPermissions.length === 0 && (
                <div className="state-center" style={{ minHeight: 180, border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                  <KeyRound size={24} style={{ color: 'var(--text-muted)' }} />
                  <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 13 }}>No permissions match your search.</p>
                </div>
              )}
            </>
          ) : (
            <div className="state-center" style={{ minHeight: 260 }}>
              <KeyRound size={28} style={{ color: 'var(--text-muted)' }} />
              <p style={{ margin: 0, color: 'var(--text-muted)' }}>No roles found.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default RolePermissionsSection;
