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
            style={{
                width: DROP_ZONE_SIZE,
                height: DROP_ZONE_SIZE,
                borderRadius: 20,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                cursor: 'default',
                transition: 'all 0.2s',
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                background: isOver
                    ? 'rgba(239, 68, 68, 0.9)'
                    : 'var(--bg-elevated)',
                border: isOver
                    ? '2px solid #ef4444'
                    : '2px dashed var(--border-color)',
                color: isOver ? '#fff' : 'var(--text-muted)',
                transform: isOver ? 'scale(1.1)' : 'scale(1)',
            }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            title="Drag schedule here to delete"
        >
            <Trash2 size={28} style={{ flexShrink: 0, transition: 'color 0.2s' }} />
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {isOver ? 'Release to delete' : 'Drop to delete'}
            </span>
        </div>
    );
};

export default TrashCan;
