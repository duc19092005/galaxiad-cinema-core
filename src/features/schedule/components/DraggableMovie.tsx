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
                className="p-3 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 cursor-grab active:cursor-grabbing hover:shadow-md transition-all duration-200 group"
                style={{ borderLeft: `4px solid ${movie.color || '#cbd5e1'}` }}
            >
                <div className="font-semibold text-slate-800 dark:text-slate-100 pr-6">{movie.title}</div>
                <div className="text-xs text-slate-500 dark:text-white/60 mt-1 flex justify-between">
                    <span>{movie.durationMinutes} min</span>
                    <div className="flex gap-1">
                        {movie.formats.map(f => (
                            <span key={f.id} className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-[10px] uppercase font-bold tracking-wider">
                                {f.name}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
            
            {/* Add Button for mobile/click-to-add */}
            {onManualAdd && (
                <button
                    onClick={() => onManualAdd(movie)}
                    className="absolute top-2 right-2 p-1.5 bg-slate-100 hover:bg-red-100 dark:bg-slate-700 dark:hover:bg-red-900/40 text-slate-400 hover:text-red-600 rounded-md transition-colors opacity-100 sm:opacity-0 sm:group-hover/movie:opacity-100 shadow-sm"
                    title="Nhập giờ chiếu bằng tay"
                >
                    <Plus className="w-4 h-4" />
                </button>
            )}
        </div>
    );
};

export default DraggableMovie;
