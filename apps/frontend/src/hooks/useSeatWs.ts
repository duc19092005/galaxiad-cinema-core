import { useState, useEffect, useRef, useCallback } from 'react';
import { bookingApi } from '../api/bookingApi';

interface UseSeatWsReturn {
    lockedSeats: Record<string, string>;
    lockSeat: (seatId: string, userName: string) => Promise<boolean>;
    unlockSeat: (seatId: string) => Promise<boolean>;
    isConnected: boolean;
}

interface UseSeatWsOptions {
    ignoreGroupSessionId?: string;
}

export function useSeatWs(scheduleId: string | null, options: UseSeatWsOptions = {}): UseSeatWsReturn {
    const [lockedSeats, setLockedSeats] = useState<Record<string, string>>({});
    const [isConnected, setIsConnected] = useState(false);
    const myLockedSeatsRef = useRef<Set<string>>(new Set());
    const wsRef = useRef<WebSocket | null>(null);
    const ignoreGroupSessionId = options.ignoreGroupSessionId?.toLowerCase();
    const clientIdRef = useRef<string>(
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
            ? `seat-client-${crypto.randomUUID()}`
            : `seat-client-${Date.now()}-${Math.random().toString(36).slice(2)}`
    );

    useEffect(() => {
        if (!scheduleId) {
            setLockedSeats({});
            setIsConnected(false);
            return;
        }

        const url = bookingApi.getSeatWsUrl(scheduleId, clientIdRef.current);
        const ws = new WebSocket(url);
        wsRef.current = ws;

        const normalizeKeys = (obj: Record<string, string>) => {
            const normalized: Record<string, string> = {};
            for (const key of Object.keys(obj || {})) {
                normalized[key.toLowerCase()] = obj[key];
            }
            return normalized;
        };

        ws.onopen = () => {
            console.log('[Seats WS] Connected successfully to', url);
            setIsConnected(true);
        };
        ws.onerror = (err) => {
            console.warn('[Seats WS] Connection error on', url, err);
            setIsConnected(false);
        };
        ws.onclose = () => {
            console.log('[Seats WS] Connection closed for', url);
            setIsConnected(false);
        };

        ws.onmessage = (event) => {
            try {
                const payload = JSON.parse(event.data);
                if (payload.type === 'initial-state') {
                    setLockedSeats(normalizeKeys(payload.lockedSeats || {}));
                } else if (payload.type === 'seat-locked') {
                    const data = payload.data;
                    if (
                        data?.source === 'group-booking' &&
                        ignoreGroupSessionId &&
                        String(data.groupSessionId || '').toLowerCase() === ignoreGroupSessionId
                    ) {
                        return;
                    }
                    if (data && data.seatId) {
                        setLockedSeats(prev => ({
                            ...prev,
                            [data.seatId.toLowerCase()]: data.userName || 'Guest'
                        }));
                    }
                } else if (payload.type === 'seat-unlocked' || payload.type === 'seat-released') {
                    const data = payload.data;
                    if (
                        data?.source === 'group-booking' &&
                        ignoreGroupSessionId &&
                        String(data.groupSessionId || '').toLowerCase() === ignoreGroupSessionId
                    ) {
                        return;
                    }
                    if (data && data.seatId) {
                        setLockedSeats(prev => {
                            const next = { ...prev };
                            delete next[data.seatId.toLowerCase()];
                            return next;
                        });
                    }
                }
            } catch (err) {
                console.error('[WS] Failed to parse message', err);
            }
        };

        return () => {
            ws.close();
            wsRef.current = null;

            // Unlock all seats locked by this client on unmount
            if (scheduleId && myLockedSeatsRef.current.size > 0) {
                const seatIds = Array.from(myLockedSeatsRef.current);
                myLockedSeatsRef.current.clear();
                for (const seatId of seatIds) {
                    bookingApi.unlockSeat(scheduleId, seatId, clientIdRef.current).catch(() => {});
                }
            }
        };
    }, [scheduleId, ignoreGroupSessionId]);

    const lockSeat = useCallback(async (seatId: string, userName: string): Promise<boolean> => {
        if (!scheduleId) return false;
        const success = await bookingApi.lockSeat(scheduleId, seatId, userName, clientIdRef.current);
        if (success) {
            myLockedSeatsRef.current.add(seatId);
        }
        return success;
    }, [scheduleId]);

    const unlockSeat = useCallback(async (seatId: string): Promise<boolean> => {
        if (!scheduleId) return false;
        const success = await bookingApi.unlockSeat(scheduleId, seatId, clientIdRef.current);
        if (success) {
            myLockedSeatsRef.current.delete(seatId);
        }
        return success;
    }, [scheduleId]);

    return { lockedSeats, lockSeat, unlockSeat, isConnected };
}
