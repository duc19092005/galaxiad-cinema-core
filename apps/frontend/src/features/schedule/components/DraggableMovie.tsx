import React from 'react';
import type { Movie } from '../types';
import { Plus } from 'lucide-react';

interface DraggableMovieProps {
    movie: Movie;
    onDragStart: (movie: Movie) => void;
    onDragEnd?: () => void;
    onManualAdd?: (movie: Movie) => void;
}

const DraggableMovie: React.FC<DraggableMovieProps> = ({ movie, onDragStart, onDragEnd, onManualAdd }) => {
    return (
        <div className="relative group/movie mb-2">
            <div
                draggable
                onDragStart={(e) => {
                    // We set dataTransfer for compatibility, but mainly use internal state if possible or rely on the logic
                    e.dataTransfer.setData('application/json', JSON.stringify({ type: 'movie_source', movieId: movie.id }));
                    e.dataTransfer.effectAllowed = 'copy';
                    onDragStart(movie);
                }}
                onDragEnd={() => {
                    if (onDragEnd) onDragEnd();
                }}
                className="p-3 bg-cinema-elevated rounded-lg shadow-sm border border-cinema-border cursor-grab active:cursor-grabbing hover:shadow-md transition-all duration-200 group"
                style={{ borderLeft: `4px solid ${movie.color || '#cbd5e1'}` }}
            >
                <div className="font-semibold text-cinema-text pr-6 truncate">{movie.title}</div>
                <div className="text-xs text-cinema-text-muted mt-1 flex justify-between items-start gap-1">
                    <span className="shrink-0">{movie.durationMinutes} min</span>
                    <div className="flex flex-wrap gap-1 justify-end">
                        {(movie.formats || []).slice(0, 3).map(f => (
                            <span key={f.id} className="px-1.5 py-0.5 bg-cinema-bg border border-cinema-border rounded text-[10px] uppercase font-bold tracking-wider whitespace-nowrap text-cinema-text">
                                {f.name}
                            </span>
                        ))}
                        {(movie.formats || []).length > 3 && (
                            <span className="px-1.5 py-0.5 bg-cinema-bg border border-cinema-border rounded text-[10px] uppercase font-bold tracking-wider whitespace-nowrap text-cinema-text">
                                +{movie.formats.length - 3}
                            </span>
                        )}
                    </div>
                </div>
            </div>
            
            {/* Add Button for mobile/click-to-add */}
            {onManualAdd && (
                <button
                    onClick={() => onManualAdd(movie)}
                    className="absolute top-2 right-2 p-1.5 bg-cinema-surface hover:bg-cinema-accent-hover text-cinema-text-muted hover:text-white rounded-md transition-colors opacity-100 sm:opacity-0 sm:group-hover/movie:opacity-100 shadow-sm border border-cinema-border"
                    title="Nhập giờ chiếu bằng tay"
                >
                    <Plus className="w-4 h-4" />
                </button>
            )}
        </div>
    );
};

export default DraggableMovie;
