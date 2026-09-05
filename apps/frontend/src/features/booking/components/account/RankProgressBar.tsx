import React from 'react';
import { useTranslation } from 'react-i18next';

export const RANK_THRESHOLDS = [
  { rank: 'Standard', minPoints: 0, maxPoints: 1000, color: '#6b7280' },
  { rank: 'VIP', minPoints: 1000, maxPoints: 5000, color: '#ff8a00' },
];

export const RankProgressBar: React.FC<{ currentPoints: number; currentRank: string }> = ({
  currentPoints,
  currentRank,
}) => {
  const { t } = useTranslation();

  const currentThreshold =
    RANK_THRESHOLDS.find((r) => r.rank === currentRank) || RANK_THRESHOLDS[0];
  const nextThreshold = RANK_THRESHOLDS.find((r) => r.minPoints > currentPoints);

  const progressStart = currentThreshold.minPoints;
  const progressEnd = nextThreshold ? nextThreshold.minPoints : currentThreshold.maxPoints;
  const progressRange = progressEnd - progressStart;
  const currentProgress = Math.min(currentPoints - progressStart, progressRange);
  const progressPercent = Math.min((currentProgress / progressRange) * 100, 100);
  const pointsNeeded = nextThreshold ? Math.max(nextThreshold.minPoints - currentPoints, 0) : 0;

  return (
    <div
      style={{
        marginTop: 12,
        padding: '16px',
        borderRadius: 12,
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid var(--border-color)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 10,
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: 'var(--text-secondary)',
          }}
        >
          {t('account.rankProgress', 'Tiến Trình Hạng')}
        </span>
        {nextThreshold && (
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)' }}>
            {t('account.pointsToNext', {
              points: pointsNeeded.toLocaleString('vi-VN'),
              nextRank: nextThreshold.rank,
            })}
          </span>
        )}
      </div>

      {/* Progress Bar */}
      <div
        style={{
          position: 'relative',
          height: 12,
          borderRadius: 6,
          background: 'rgba(255,255,255,0.08)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: `${progressPercent}%`,
            background: `linear-gradient(90deg, ${currentThreshold.color}, ${
              nextThreshold?.color || currentThreshold.color
            })`,
            borderRadius: 6,
            transition: 'width 0.8s ease',
          }}
        />
      </div>

      {/* Labels */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
        <span style={{ fontSize: 10, fontWeight: 600, color: currentThreshold.color }}>
          {currentThreshold.rank} ({currentThreshold.minPoints.toLocaleString('vi-VN')})
        </span>
        {nextThreshold && (
          <span style={{ fontSize: 10, fontWeight: 600, color: nextThreshold.color }}>
            {nextThreshold.rank} ({nextThreshold.minPoints.toLocaleString('vi-VN')})
          </span>
        )}
      </div>

      {/* Current Points Display */}
      <div style={{ textAlign: 'center', marginTop: 12 }}>
        <span style={{ fontSize: 24, fontWeight: 900, color: 'var(--accent)' }}>
          {currentPoints.toLocaleString('vi-VN')}
        </span>
        <span style={{ fontSize: 12, color: 'var(--text-secondary)', marginLeft: 4 }}>
          / {progressEnd.toLocaleString('vi-VN')} {t('account.points', 'điểm')}
        </span>
      </div>
    </div>
  );
};
