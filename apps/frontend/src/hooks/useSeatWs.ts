import { useState, useEffect, useRef, useCallback } from 'react';
import { bookingApi } from '../api/bookingApi';
import { signalrClient, stopConnection } from '../api/signalrClient';
import type { HubConnection } from '@microsoft/signalr';

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
    const connectionRef = useRef<HubConnection | null>(null);
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

        let cancelled = false;
        const connection = signalrClient.createSeatConnection(scheduleId, clientIdRef.current);
        connectionRef.current = connection;

        const normalizeKeys = (obj: Record<string, string>) => {
            const normalized: Record<string, string> = {};
            for (const key of Object.keys(obj || {})) {
                normalized[key.toLowerCase()] = obj[key];
            }
            return normalized;
        };

        const handleSeatLocked = (payload: any) => {
            const data = payload?.data ?? payload;
            if (
                data?.source === 'group-booking' &&
                ignoreGroupSessionId &&
                String(data.groupSessionId || '').toLowerCase() === ignoreGroupSessionId
            ) {
                return;
            }
            if (data?.seatId) {
                setLockedSeats(prev => ({
                    ...prev,
                    [data.seatId.toLowerCase()]: data.userName || 'Guest'
                }));
            }
        };

        const handleSeatUnlocked = (payload: any) => {
            const data = payload?.data ?? payload;
            if (
                data?.source === 'group-booking' &&
                ignoreGroupSessionId &&
                String(data.groupSessionId || '').toLowerCase() === ignoreGroupSessionId
            ) {
                return;
            }
            if (data?.seatId) {
                setLockedSeats(prev => {
                    const next = { ...prev };
                    delete next[data.seatId.toLowerCase()];
                    return next;
                });
            }
        };

        connection.on('initial-state', (payload: { lockedSeats?: Record<string, string> }) => {
            setLockedSeats(normalizeKeys(payload?.lockedSeats || {}));
        });
        connection.on('seat-locked', handleSeatLocked);
        connection.on('seat-unlocked', handleSeatUnlocked);
        connection.on('seat-released', handleSeatUnlocked);

        connection.onreconnecting(() => setIsConnected(false));
        connection.onreconnected(() => setIsConnected(true));
        connection.onclose(() => setIsConnected(false));

        connection.start()
            .then(() => {
                if (!cancelled) setIsConnected(true);
            })
            .catch((err) => {
                if (!cancelled) {
                    console.warn('[Seats SignalR] Connection error', err);
                    setIsConnected(false);
                }
            });

        return () => {
            cancelled = true;
            connection.off('initial-state');
            connection.off('seat-locked', handleSeatLocked);
            connection.off('seat-unlocked', handleSeatUnlocked);
            connection.off('seat-released', handleSeatUnlocked);
            stopConnection(connection).catch(() => {});
            if (connectionRef.current === connection) {
                connectionRef.current = null;
            }

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
