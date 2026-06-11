import React from 'react';

/**
 * CalendarCell – a single 80px‑high time slot in the weekly schedule.
 * Props:
 *   hasMovie – boolean (changes background to orange‑tinted)
 *   isCurrent – indicates the "current" time row (optional highlight)
 *   onDrop – drop handler for movie blocks
 */
const CalendarCell: React.FC<{ hasMovie?: boolean; isCurrent?: boolean; onDrop?: (e: React.DragEvent<HTMLDivElement>) => void }> = ({ hasMovie = false, isCurrent = false, onDrop }) => {
  const emptyBg = 'bg-card';
  const movieBg = 'bg-primary/10'; // orange tint 0.1
  const border = 'border-base';

  const classes = [
    'calendar-cell',
    isCurrent ? 'bg-primary/5' : hasMovie ? movieBg : emptyBg,
    border,
    'hover:bg-surface',
  ].join(' ');

  return (
    <div className={classes} style={{ height: 'var(--space-80)' }} onDrop={onDrop}>
      {/* content (optional movie block) would be rendered by parent */}
    </div>
  );
};

export default CalendarCell;
