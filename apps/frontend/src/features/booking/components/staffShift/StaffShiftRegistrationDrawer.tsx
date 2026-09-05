import React from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, Save, X } from 'lucide-react';
import type { SelectedShiftKey } from './staffShiftHelpers';

export const StaffShiftRegistrationDrawer: React.FC<{
  selectedShifts: SelectedShiftKey[];
  saving: boolean;
  onClear: () => void;
  onSave: () => void;
}> = ({ selectedShifts, saving, onClear, onSave }) => {
  const { t } = useTranslation();

  if (selectedShifts.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '14px 22px',
        background: 'var(--bg-elevated)',
        border: '1px solid var(--accent)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: '0 8px 32px rgba(255,138,0,0.22), 0 2px 8px rgba(0,0,0,0.5)',
        backdropFilter: 'blur(12px)',
        minWidth: 320,
        animation: 'slideUp 0.25s cubic-bezier(0.34,1.56,0.64,1)',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: 'var(--text-primary)' }}>
          {t('staffShiftSelf.selectedShifts', { count: selectedShifts.length })}
        </p>
        <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--text-secondary)' }}>
          {selectedShifts.map(({ shift, dateValue }) => `${shift.shiftName} (${new Date(`${dateValue}T00:00:00`).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })})`).join(' · ')}
        </p>
      </div>
      <button
        type="button"
        className="btn btn-secondary"
        onClick={onClear}
        disabled={saving}
        style={{ padding: '8px 12px', fontSize: 12, flexShrink: 0 }}
      >
        <X size={14} /> {t('staffShiftSelf.deselect')}
      </button>
      <button
        type="button"
        className="btn btn-primary"
        onClick={onSave}
        disabled={saving}
        style={{ padding: '10px 20px', fontSize: 13, fontWeight: 800, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8 }}
      >
        {saving ? (
          <>
            <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
            {t('staffShiftSelf.saving')}
          </>
        ) : (
          <>
            <Save size={16} />
            {t('staffShiftSelf.saveSchedule', { count: selectedShifts.length })}
          </>
        )}
      </button>
    </div>
  );
};
