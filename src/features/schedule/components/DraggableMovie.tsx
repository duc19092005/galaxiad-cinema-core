import React from 'react';
import type { Movie } from '../types';

interface DraggableMovieProps {
    movie: Movie;
    onDragStart: (movie: Movie) => void;
    onDragEnd?: () => void;
}

const DraggableMovie: React.FC<DraggableMovieProps> = ({ movie, onDragStart, onDragEnd }) => {
    return (
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
            className="p-3 mb-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 cursor-grab active:cursor-grabbing hover:shadow-md transition-all duration-200 group"
            style={{ borderLeft: `4px solid ${movie.color || '#cbd5e1'}` }}
        >
            <div className="font-semibold text-slate-800 dark:text-slate-100">{movie.title}</div>
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
    );
};

export default DraggableMovie;
