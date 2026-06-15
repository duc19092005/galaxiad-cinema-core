import { useState, useEffect, useCallback } from 'react';
import {
  Loader2, AlertCircle, Plus, Trash2,
  RefreshCw, Ticket, Coffee, UserCheck, Eye, EyeOff
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { facilitiesApi } from '../../api/facilitiesApi';
import type {
  Department,
  CreateDepartmentRequest,
  CashierDepartmentType,
  Cinema,
} from '../../types/facilities.types';

/* ───────── helper styles ───────── */
const btnPrimary: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  padding: '8px 20px', borderRadius: 8, border: 'none',
  background: 'linear-gradient(135deg, #6366f1, #a855f7)',
  color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer',
  transition: 'all .2s',
};
const btnOutline: React.CSSProperties = {
  ...btnPrimary,
  background: 'transparent', border: '1px solid rgba(255,255,255,.15)',
  color: 'var(--text-secondary)',
};
const badgeBase: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 4,
  padding: '4px 10px', borderRadius: 20,
  fontSize: 11, fontWeight: 600,
};
const cardStyle: React.CSSProperties = {
  background: 'var(--bg-card)',
  borderRadius: 12, border: '1px solid var(--border-color)',
  overflow: 'hidden',
};

/* ───────── types ───────── */
interface Props {
  cinemas: Cinema[];
  activeCinemaId: string | null;
}

/* ───────── component ───────── */
const DepartmentManager: React.FC<Props> = ({ cinemas, activeCinemaId }) => {
  const { t } = useTranslation();
  const [user, setUser] = useState<{ username: string; roles?: string[]; selectedRole?: string } | null>(null);
  const isAdmin = user?.roles?.includes('Admin') ?? false;
  const isFacilities = user?.roles?.includes('FacilitiesManager') ?? false;

  useEffect(() => {
    try {
      const stored = localStorage.getItem('user_info');
      if (stored) setUser(JSON.parse(stored));
    } catch { /* ignore */ }
  }, []);

  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create modal
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<CashierDepartmentType>('TicketPOS');
  const [createMsg, setCreateMsg] = useState<string | null>(null);

  // Show password info
  const [showPassInfo, setShowPassInfo] = useState<string | null>(null);

  const selectedCinemaId = activeCinemaId;

  const fetchDepartments = useCallback(async () => {
    if (!selectedCinemaId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await facilitiesApi.getDepartments(selectedCinemaId);
      if (res.isSuccess && Array.isArray(res.data)) {
        setDepartments(res.data);
      } else {
        setDepartments([]);
        if (res.message) setError(res.message);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || t('departmentManager.errorLoad'));
      setDepartments([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCinemaId]);

  useEffect(() => {
    if (selectedCinemaId) fetchDepartments();
  }, [selectedCinemaId, fetchDepartments]);

  /* ─── create ─── */
  const handleCreate = async () => {
    if (!newName.trim() || !selectedCinemaId) return;
    setCreating(true);
    setCreateMsg(null);
    setShowPassInfo(null);
    try {
      const payload: CreateDepartmentRequest = {
        cinemaId: selectedCinemaId,
        departmentName: newName.trim(),
        departmentType: newType,
      };
      const res = await facilitiesApi.createDepartment(payload);
      if (res.isSuccess) {
        if (res.message) setShowPassInfo(res.message);
        setNewName('');
        setNewType('TicketPOS');
        setShowCreate(false);
        fetchDepartments();
      } else {
        setCreateMsg(res.message || t('departmentManager.createFailed'));
      }
    } catch (err: any) {
      setCreateMsg(err?.response?.data?.message || err?.message || t('departmentManager.errorCreate'));
    } finally {
      setCreating(false);
    }
  };

  /* ─── toggle active ─── */
  const handleToggleActive = async (dept: Department) => {
    try {
      await facilitiesApi.updateDepartment(dept.departmentId, {
        isActive: !dept.isActive,
      });
      fetchDepartments();
    } catch { /* ignore */ }
  };

  /* ─── delete (deactivate) ─── */
  const handleDelete = async (dept: Department) => {
    try {
      await facilitiesApi.deleteDepartment(dept.departmentId);
      fetchDepartments();
    } catch { /* ignore */ }
  };

  /* ───────── render ───────── */
  if (!selectedCinemaId) {
    return (
      <div className="state-center" style={{ minHeight: 160 }}>
        <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>
          {t('departmentManager.selectCinemaPrompt')}
        </span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h3 style={{ margin: 0, fontWeight: 700, fontSize: 18, color: 'var(--text-primary)' }}>
            Phòng Ban Thu Ngân
          </h3>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
            {t('departmentManager.description')}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={btnOutline} onClick={fetchDepartments}>
            <RefreshCw size={14} /> {t('departmentManager.refresh')}
          </button>
          {(isAdmin || isFacilities) && (
            <button style={btnPrimary} onClick={() => setShowCreate(true)}>
              <Plus size={14} /> {t('departmentManager.addDepartment')}
            </button>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} onClick={() => { if (!creating) setShowCreate(false); }}>
          <div style={{
            background: 'var(--bg-card)', borderRadius: 16, border: '1px solid var(--border-color)',
            padding: 28, width: 400, maxWidth: '90vw',
          }} onClick={e => e.stopPropagation()}>
            <h4 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
            {t('departmentManager.createTitle')}
            </h4>

            {/* Cinema info */}
            <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 8, background: 'var(--bg-base)', fontSize: 12, color: 'var(--text-secondary)' }}>
              {t('departmentManager.cinemaLabel')} <strong style={{ color: 'var(--text-primary)' }}>{cinemas.find(c => c.cinemaId === selectedCinemaId)?.cinemaName || 'Đang tải...'}</strong>
            </div>

            {/* Name */}
            <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
              {t('departmentManager.departmentName')}
            </label>
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder={t('departmentManager.departmentNamePlaceholder')}
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-color)',
                background: 'var(--bg-base)', color: 'var(--text-primary)', fontSize: 13, outline: 'none',
                boxSizing: 'border-box', marginBottom: 16,
              }}
            />

            {/* Type */}
            <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
              {t('departmentManager.departmentType')}
            </label>
            <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
              <button
                onClick={() => setNewType('TicketPOS')}
                style={{
                  flex: 1, padding: '10px 0', borderRadius: 8, border: newType === 'TicketPOS' ? '2px solid #6366f1' : '1px solid var(--border-color)',
                  background: newType === 'TicketPOS' ? 'rgba(99,102,241,.1)' : 'var(--bg-base)',
                  color: 'var(--text-primary)', fontWeight: 600, fontSize: 12, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}
              >
                <Ticket size={16} /> {t('departmentManager.ticketPOS')}
              </button>
              <button
                onClick={() => setNewType('FoodPOS')}
                style={{
                  flex: 1, padding: '10px 0', borderRadius: 8, border: newType === 'FoodPOS' ? '2px solid #6366f1' : '1px solid var(--border-color)',
                  background: newType === 'FoodPOS' ? 'rgba(99,102,241,.1)' : 'var(--bg-base)',
                  color: 'var(--text-primary)', fontWeight: 600, fontSize: 12, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}
              >
                <Coffee size={16} /> {t('departmentManager.foodPOS')}
              </button>
            </div>

            {createMsg && (
              <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(239,68,68,.1)', color: '#ef4444', fontSize: 12, marginBottom: 12 }}>
                {createMsg}
              </div>
            )}

            {showPassInfo && (
              <div style={{
                padding: '10px 14px', borderRadius: 8,
                background: 'rgba(34,197,94,.1)', color: '#22c55e',
                fontSize: 12, marginBottom: 12, lineHeight: 1.6,
                wordBreak: 'break-all',
              }}>
                <UserCheck size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                {showPassInfo}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                onClick={() => { setShowCreate(false); setCreateMsg(null); setShowPassInfo(null); }}
                disabled={creating}
                style={{ ...btnOutline, opacity: creating ? .5 : 1 }}
              >
                {t('departmentManager.cancel')}
              </button>
              <button
                onClick={handleCreate}
                disabled={creating || !newName.trim()}
                style={{ ...btnPrimary, opacity: creating || !newName.trim() ? .5 : 1 }}
              >
                {creating ? <><Loader2 size={14} className="spin" /> {t('departmentManager.creating')}</> : t('departmentManager.create')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      {loading && (
        <div className="state-center" style={{ minHeight: 120 }}>
          <Loader2 size={20} className="spin" style={{ color: 'var(--accent)' }} />
        </div>
      )}

      {error && !loading && (
        <div className="alert alert-error">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {!loading && !error && departments.length === 0 && (
        <div className="state-center" style={{ minHeight: 120, flexDirection: 'column', gap: 8 }}>
          <AlertCircle size={32} style={{ color: 'var(--text-muted)' }} />
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            {t('departmentManager.noDepartments')}
          </span>
        </div>
      )}

      {!loading && departments.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {departments.map(dept => (
            <div key={dept.departmentId} style={{ ...cardStyle, opacity: dept.isActive ? 1 : .5 }}>
              {/* Header */}
              <div style={{
                padding: '14px 16px', borderBottom: '1px solid var(--border-color)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: dept.departmentType === 'TicketPOS'
                      ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                      : 'linear-gradient(135deg, #f59e0b, #ef4444)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {dept.departmentType === 'TicketPOS' ? <Ticket size={16} color="#fff" /> : <Coffee size={16} color="#fff" />}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>
                      {dept.departmentName}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {dept.departmentType === 'TicketPOS' ? t('departmentManager.ticketPOS') : t('departmentManager.foodPOS')}
                    </div>
                  </div>
                </div>
                <span style={{
                  ...badgeBase,
                  background: dept.isActive ? 'rgba(34,197,94,.15)' : 'rgba(239,68,68,.1)',
                  color: dept.isActive ? '#22c55e' : '#ef4444',
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: dept.isActive ? '#22c55e' : '#ef4444' }} />
                  {dept.isActive ? t('departmentManager.active') : t('departmentManager.inactive')}
                </span>
              </div>

              {/* Body */}
              <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ color: 'var(--text-muted)' }}>{t('departmentManager.accountEmail')}</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>
                    {dept.sharedUserEmail || '—'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ color: 'var(--text-muted)' }}>{t('departmentManager.defaultPassword')}</span>
                  <span style={{ color: 'var(--text-secondary)', fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>
                    <code>123456</code>
                  </span>
                </div>
              </div>

              {/* Actions */}
              {(isAdmin || isFacilities) && (
                <div style={{
                  padding: '10px 16px', borderTop: '1px solid var(--border-color)',
                  display: 'flex', gap: 6, justifyContent: 'flex-end',
                }}>
                  <button
                    onClick={() => handleToggleActive(dept)}
                    style={{
                      ...btnOutline, padding: '6px 12px', fontSize: 11,
                      background: dept.isActive ? 'rgba(239,68,68,.1)' : 'rgba(34,197,94,.1)',
                      borderColor: dept.isActive ? 'rgba(239,68,68,.3)' : 'rgba(34,197,94,.3)',
                    }}
                    title={dept.isActive ? t('departmentManager.deactivate') : t('departmentManager.activate')}
                  >
                    {dept.isActive ? <EyeOff size={12} /> : <Eye size={12} />}
                    {dept.isActive ? t('departmentManager.inactive') : t('departmentManager.active')}
                  </button>
                  <button
                    onClick={() => handleDelete(dept)}
                    style={{
                      ...btnOutline, padding: '6px 12px', fontSize: 11,
                      background: 'rgba(239,68,68,.1)', borderColor: 'rgba(239,68,68,.3)',
                    }}
                    title={t('departmentManager.delete')}
                  >
                    <Trash2 size={12} style={{ color: '#ef4444' }} /> {t('departmentManager.delete')}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DepartmentManager;
