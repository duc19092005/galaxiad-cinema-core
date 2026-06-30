import { useState, useEffect, useRef, useCallback } from 'react';
import { bookingApi } from '../api/bookingApi';

interface UseSeatSseReturn {
    lockedSeats: Record<string, string>;
    lockSeat: (seatId: string, userName: string) => Promise<boolean>;
    unlockSeat: (seatId: string) => Promise<boolean>;
    isConnected: boolean;
}

export function useSeatSse(scheduleId: string | null): UseSeatSseReturn {
    const [lockedSeats, setLockedSeats] = useState<Record<string, string>>({});
    const [isConnected, setIsConnected] = useState(false);
    const myLockedSeatsRef = useRef<Set<string>>(new Set());
    const eventSourceRef = useRef<EventSource | null>(null);

    useEffect(() => {
        if (!scheduleId) {
            setLockedSeats({});
            setIsConnected(false);
            return;
        }

        const url = bookingApi.getSeatEventsUrl(scheduleId);
        const eventSource = new EventSource(url, { withCredentials: true });
        eventSourceRef.current = eventSource;

        const handleInitialState = (event: MessageEvent) => {
            try {
                const data = JSON.parse(event.data);
                setLockedSeats(data.lockedSeats || {});
            } catch { /* ignore parse error */ }
        };

        const handleSeatLocked = (event: MessageEvent) => {
            try {
                const data = JSON.parse(event.data);
                setLockedSeats(data.lockedSeats || {});
            } catch { /* ignore parse error */ }
        };

        const handleSeatUnlocked = (event: MessageEvent) => {
            try {
                const data = JSON.parse(event.data);
                setLockedSeats(data.lockedSeats || {});
            } catch { /* ignore parse error */ }
        };

        eventSource.addEventListener('initial-state', handleInitialState);
        eventSource.addEventListener('seat-locked', handleSeatLocked);
        eventSource.addEventListener('seat-unlocked', handleSeatUnlocked);

        eventSource.onopen = () => setIsConnected(true);
        eventSource.onerror = () => setIsConnected(false);

        return () => {
            eventSource.removeEventListener('initial-state', handleInitialState);
            eventSource.removeEventListener('seat-locked', handleSeatLocked);
            eventSource.removeEventListener('seat-unlocked', handleSeatUnlocked);
            eventSource.close();
            eventSourceRef.current = null;

            // Unlock all seats locked by this client on unmount
            if (scheduleId && myLockedSeatsRef.current.size > 0) {
                const seatIds = Array.from(myLockedSeatsRef.current);
                myLockedSeatsRef.current.clear();
                for (const seatId of seatIds) {
                    bookingApi.unlockSeat(scheduleId, seatId).catch(() => {});
                }
            }
        };
    }, [scheduleId]);

    const lockSeat = useCallback(async (seatId: string, userName: string): Promise<boolean> => {
        if (!scheduleId) return false;
        const success = await bookingApi.lockSeat(scheduleId, seatId, userName);
        if (success) {
            myLockedSeatsRef.current.add(seatId);
        }
        return success;
    }, [scheduleId]);

    const unlockSeat = useCallback(async (seatId: string): Promise<boolean> => {
        if (!scheduleId) return false;
        const success = await bookingApi.unlockSeat(scheduleId, seatId);
        if (success) {
            myLockedSeatsRef.current.delete(seatId);
        }
        return success;
    }, [scheduleId]);

    return { lockedSeats, lockSeat, unlockSeat, isConnected };
}
