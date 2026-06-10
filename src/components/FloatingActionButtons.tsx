import React from 'react';
import { Plus, ZoomIn, ZoomOut, Delete } from 'lucide-react';

/**
 * FloatingActionButtons – group of four circular FABs in the bottom‑right corner.
 *   • Add (primary #ff8a00)
 *   • Zoom In (secondary #2a2a2a with border)
 *   • Zoom Out (secondary #2a2a2a with border)
 *   • Delete (red #7f1d1d)
 *
 * Props receive callbacks for each action.
 */
const FloatingActionButtons: React.FC<{
  onAdd: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onDelete: () => void;
}> = ({ onAdd, onZoomIn, onZoomOut, onDelete }) => {
  return (
    <div className="fixed bottom-6 right-6 flex flex-col gap-2" style={{ transform: 'translate(0,0)' }}>
      <button className="fab fab-primary" onClick={onAdd}>
        <Plus size={20} className="text-white" />
      </button>
      <button className="fab fab-secondary" onClick={onZoomIn}>
        <ZoomIn size={20} className="text-secondary" />
      </button>
      <button className="fab fab-secondary" onClick={onZoomOut}>
        <ZoomOut size={20} className="text-secondary" />
      </button>
      <button className="fab fab-delete" onClick={onDelete}>
        <Delete size={20} className="text-white" />
      </button>
    </div>
  );
};

export default FloatingActionButtons;
