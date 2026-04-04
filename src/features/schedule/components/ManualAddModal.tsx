import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { Movie, ShowTimeSlot, Auditorium } from '../types';
import { toast } from 'react-hot-toast';
import { checkCollision } from '../utils';

interface ManualAddModalProps {
    movie: Movie;
    auditorium: Auditorium;
    scheduleSlots: ShowTimeSlot[];
    selectedDate: Date; // base date from page
    onClose: () => void;
    onAdd: (slot: ShowTimeSlot) => void;
}

const toLocalISOString = (date: Date): string => {
    const tzoffset = date.getTimezoneOffset() * 60000;
    return (new Date(date.getTime() - tzoffset)).toISOString().slice(0, -1);
};

// Helper to check if time is past
const getNowVietnam = (): Date => {
    return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
};

const ManualAddModal: React.FC<ManualAddModalProps> = ({ movie, auditorium, scheduleSlots, selectedDate, onClose, onAdd }) => {
    // Ensure we start with formats that overlap with the auditorium's supported formats
    const roomFormatIds = auditorium.supportedFormats.map(f => f.id.toLowerCase());
    const validFormats = movie.formats.filter(f => roomFormatIds.includes(f.id.toLowerCase()));

    const [selectedFormat, setSelectedFormat] = useState(validFormats.length > 0 ? validFormats[0].id : '');
    const [dateVal, setDateVal] = useState('');
    const [timeVal, setTimeVal] = useState('12:00');

    useEffect(() => {
        // Initialize date to selected base date
        const y = selectedDate.getFullYear();
        const m = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const d = String(selectedDate.getDate()).padStart(2, '0');
        setDateVal(`${y}-${m}-${d}`);
    }, [selectedDate]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (validFormats.length === 0) {
            toast.error("Phim này không có định dạng phù hợp với phòng chiếu hiện tại (ví dụ phim 3D nhưng phòng chỉ hỗ trợ 2D).");
            return;
        }

        if (!selectedFormat || !dateVal || !timeVal) {
            toast.error("Vui lòng điền đủ thông tin.");
            return;
        }

        const [hours, minutes] = timeVal.split(':').map(Number);
        
        // Construct the exact local start Date
        const startRaw = new Date(`${dateVal}T00:00:00`);
        startRaw.setHours(hours, minutes, 0, 0);

        // Calculate end Date (duration + cleaning time of 20 mins assumed)
        const duration = movie.durationMinutes;
        const endTimeRaw = new Date(startRaw.getTime() + duration * 60000);

        // Collision check
        const isColliding = checkCollision(startRaw, endTimeRaw, scheduleSlots);

        // Past time check
        const nowVN = getNowVietnam();
        if (startRaw < nowVN) {
            toast.error("Không thể xếp lịch chiếu trong quá khứ.");
            return;
        }

        if (isColliding) {
            toast.error("Thời gian này trùng với một suất chiếu khác (hoặc chưa đủ 20 phút dọn rạp). Vui lòng chọn giờ khác.");
            return;
        }

        const matchedFormat = movie.formats.find(f => f.id === selectedFormat);
        if (!matchedFormat) return;

        const newSlot: ShowTimeSlot = {
            id: `new-${crypto.randomUUID()}`,
            movieId: movie.id,
            formatId: matchedFormat.id,
            formatName: matchedFormat.name,
            start: toLocalISOString(startRaw),
            end: toLocalISOString(endTimeRaw),
            price: 100 // default or fetch config
        };

        onAdd(newSlot);
        toast.success("Thêm suất chiếu thành công.");
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                    <h3 className="font-bold text-lg text-slate-800 dark:text-white">Nhập giờ chiếu bằng tay</h3>
                    <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-500 dark:text-white/60">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">Phim</label>
                        <div className="px-3 py-2 bg-slate-100 dark:bg-slate-900 rounded-lg text-slate-900 dark:text-white font-medium border border-transparent cursor-not-allowed opacity-80">
                            {movie.title} ({movie.durationMinutes} phút)
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">Phòng chiếu</label>
                        <div className="px-3 py-2 bg-slate-100 dark:bg-slate-900 rounded-lg text-slate-900 dark:text-white font-medium border border-transparent cursor-not-allowed opacity-80">
                            {auditorium.name}
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">Định dạng</label>
                        {validFormats.length === 0 ? (
                            <div className="text-sm border border-red-200 bg-red-50 text-red-600 p-2 rounded-lg">Không có định dạng phù hợp hỗ trợ rạp này.</div>
                        ) : (
                            <select 
                                value={selectedFormat}
                                onChange={(e) => setSelectedFormat(e.target.value)}
                                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500"
                            >
                                {validFormats.map(f => (
                                    <option key={f.id} value={f.id}>{f.name}</option>
                                ))}
                            </select>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">Ngày chiếu</label>
                            <input 
                                type="date" 
                                value={dateVal}
                                onChange={(e) => setDateVal(e.target.value)}
                                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">Giờ chiếu</label>
                            <input 
                                type="time" 
                                value={timeVal}
                                onChange={(e) => setTimeVal(e.target.value)}
                                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500"
                            />
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 font-bold text-slate-600 dark:text-white/80 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                            Hủy
                        </button>
                        <button 
                            type="submit" 
                            disabled={validFormats.length === 0}
                            className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow-lg shadow-red-500/30 transition-all disabled:opacity-50"
                        >
                            Thêm suất chiếu
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ManualAddModal;
