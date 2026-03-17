import React, { useState, useRef } from 'react';
import { Trash2 } from 'lucide-react';

interface TrashCanProps {
    onDeleteSlot: (auditoriumId: string, slotId: string) => void;
}

// Kích thước vùng drop lớn để tránh dragLeave/dragOver liên tục khi kéo tới
const DROP_ZONE_SIZE = 120;

const TrashCan: React.FC<TrashCanProps> = ({ onDeleteSlot }) => {
    const [isOver, setIsOver] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        // Chỉ set isOver = false khi thực sự rời khỏi vùng drop (tránh nhảy do vào con)
        const related = e.relatedTarget as Node | null;
        if (containerRef.current && related && !containerRef.current.contains(related)) {
            setIsOver(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsOver(false);

        const data = e.dataTransfer.getData('application/json');
        if (data) {
            try {
                const parsed = JSON.parse(data);
                if (parsed.type === 'SLOT' && parsed.auditoriumId && parsed.slotId) {
                    setTimeout(() => {
                        onDeleteSlot(parsed.auditoriumId, parsed.slotId);
                    }, 0);
                }
            } catch (err) {
                console.error('Failed to parse drag data', err);
            }
        }
    };

    return (
        <div
            ref={containerRef}
            style={{ minWidth: DROP_ZONE_SIZE, minHeight: DROP_ZONE_SIZE }}
            className={`fixed bottom-8 right-8 rounded-2xl shadow-2xl transition-all z-50 flex items-center justify-center gap-2
                ${isOver
                    ? 'bg-red-600 text-white scale-110 shadow-red-500/50'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-2 border-slate-200 dark:border-slate-700 hover:text-red-600 hover:border-red-400 hover:bg-white'
                }
            `}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            title="Drag schedule here to delete"
        >
            <Trash2 className="w-8 h-8 flex-shrink-0" />
            {isOver && <span className="font-bold px-2">Xóa</span>}
        </div>
    );
};

export default TrashCan;
