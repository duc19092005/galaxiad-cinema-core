import React from 'react';
import { Move } from 'lucide-react';

/**
 * DragMovieCard – represents a movie in the left drag list.
 * Props:
 *   posterUrl – URL of the movie poster (expected 40x56)
 *   title – movie title
 *   duration – e.g., "120 min"
 *   isDragging – boolean indicating drag state (adds opacity, scale, orange border)
 */
const DragMovieCard: React.FC<{
  posterUrl: string;
  title: string;
  duration: string;
  isDragging?: boolean;
}> = ({ posterUrl, title, duration, isDragging = false }) => {
  const baseClasses = 'drag-card';
  const dragStateClasses = isDragging ? 'opacity-50 scale-95 border-2 border-primary' : '';
  return (
    <div className={`${baseClasses} ${dragStateClasses}`} draggable>
      <img src={posterUrl} alt={title} className="w-10 h-14 object-cover rounded" />
      <div className="flex flex-col flex-1">
        <span className="font-label-md text-primary" style={{ fontWeight: 600 }}>{title}</span>
        <span className="text-secondary text-label-sm">{duration}</span>
      </div>
      <Move size={16} className="text-secondary" />
    </div>
  );
};

export default DragMovieCard;
