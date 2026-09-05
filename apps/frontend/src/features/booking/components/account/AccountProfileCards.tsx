import React from 'react';
import { Edit2, Loader2, Check, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const TabButton: React.FC<{
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}> = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    style={{
      flex: 1,
      padding: '16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      borderRadius: 'var(--radius-lg)',
      cursor: 'pointer',
      border: '1px solid var(--border-color)',
      fontWeight: 700,
      fontSize: 15,
      transition: 'all 0.3s ease',
      backgroundColor: active ? 'var(--accent)' : 'var(--bg-elevated)',
      color: active ? 'black' : 'var(--text-secondary)',
      boxShadow: active ? '0 4px 16px rgba(255,138,0,0.3)' : 'none',
      overflowWrap: 'break-word',
      wordBreak: 'break-word',
      whiteSpace: 'normal',
    }}
  >
    {icon}
    {label}
  </button>
);

export const ProfileCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value?: string;
}> = ({ icon, label, value }) => (
  <div
    style={{
      padding: '24px',
      borderRadius: 'var(--radius-lg)',
      backgroundColor: 'var(--bg-elevated)',
      border: '1px solid var(--border-color)',
      boxShadow: 'var(--shadow-md)',
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(255,138,0,0.1)',
          color: 'var(--accent)',
        }}
      >
        {icon}
      </div>
      <span
        style={{
          fontSize: 11,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: 'var(--text-secondary)',
          wordBreak: 'break-word',
        }}
      >
        {label}
      </span>
    </div>
    <p style={{ fontSize: 18, fontWeight: 700 }}>{value || 'N/A'}</p>
  </div>
);

export const EditableProfileCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  field: string;
  type?: string;
  isEditing: boolean;
  tempValue: string;
  onChange: (v: string) => void;
  onSave: () => void;
  onCancel: () => void;
  onStart: () => void;
  updating: boolean;
}> = ({
  icon,
  label,
  value,
  field,
  type = 'text',
  isEditing,
  tempValue,
  onChange,
  onSave,
  onCancel,
  onStart,
  updating,
}) => {
  const { t } = useTranslation();
  return (
    <div
      style={{
        padding: '24px',
        borderRadius: 'var(--radius-lg)',
        backgroundColor: 'var(--bg-elevated)',
        border: isEditing ? '1px solid var(--accent)' : '1px solid var(--border-color)',
        boxShadow: isEditing ? '0 0 16px rgba(255,183,127,0.2)' : 'var(--shadow-md)',
        transition: 'all 0.3s ease',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(255,138,0,0.1)',
              color: 'var(--accent)',
            }}
          >
            {icon}
          </div>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--text-secondary)',
              wordBreak: 'break-word',
            }}
          >
            {label}
          </span>
        </div>
        {!isEditing && (
          <button
            onClick={onStart}
            className="glass-card interactive"
            style={{
              padding: '6px 12px',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              border: '1px solid var(--border-color)',
              background: 'rgba(255,255,255,0.03)',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            <Edit2 size={14} /> {t('common.edit')}
          </button>
        )}
      </div>

      {isEditing ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type={field === 'dateOfBirth' ? 'text' : type}
              autoFocus
              placeholder={field === 'dateOfBirth' ? 'DD/MM/YYYY' : ''}
              style={{
                flex: 1,
                backgroundColor: 'transparent',
                border: 'none',
                borderBottom: '2px solid var(--accent)',
                fontSize: 16,
                fontWeight: 600,
                outline: 'none',
                paddingBottom: 'var(--space-4)',
                color: 'var(--text-primary)',
                opacity: updating ? 0.5 : 1,
              }}
              value={tempValue}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onSave();
                if (e.key === 'Escape') onCancel();
              }}
              disabled={updating}
            />
            <button
              onClick={onSave}
              style={{
                padding: 8,
                backgroundColor: 'var(--success)',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                cursor: 'pointer',
                opacity: updating ? 0.5 : 1,
              }}
              disabled={updating}
            >
              {updating ? (
                <Loader2 size={16} style={{ color: 'white', animation: 'spin 1s linear infinite' }} />
              ) : (
                <Check size={16} style={{ color: 'white' }} />
              )}
            </button>
            <button
              onClick={onCancel}
              style={{
                padding: 8,
                backgroundColor: 'var(--bg-surface)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                cursor: 'pointer',
              }}
              disabled={updating}
            >
              <X size={16} style={{ color: 'var(--text-secondary)' }} />
            </button>
          </div>
          {field === 'dateOfBirth' && (
            <p
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.05em',
                color: 'var(--accent)',
              }}
            >
              Format: DD/MM/YYYY
            </p>
          )}
        </div>
      ) : (
        <div>
          <p style={{ fontSize: 18, fontWeight: 700 }}>{value || 'N/A'}</p>
        </div>
      )}
    </div>
  );
};
