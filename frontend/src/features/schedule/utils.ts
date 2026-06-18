import type { ShowTimeSlot } from './types';

// Cinema operating day: 7:00 AM → 2:00 AM next day (19 hours continuous)
export const START_HOUR = 7;   // 7:00 AM
export const END_HOUR = 26;    // 2:00 AM next day (24 + 2 = 26)
export const TOTAL_HOURS = END_HOUR - START_HOUR; // 19 hours
export const PIXELS_PER_HOUR = 60;
export const PIXELS_PER_MIN = 2;

export const getPixelsFromTime = (dateStr: string): number => {
    const date = new Date(dateStr);
    let hours = date.getHours();
    const minutes = date.getMinutes();

    // Hours 0, 1, 2 (after midnight) are treated as 24, 25, 26 for continuity
    if (hours < START_HOUR) {
        hours += 24;
    }

    if (hours < START_HOUR) return 0;
    if (hours >= END_HOUR) return TOTAL_HOURS * 60 * PIXELS_PER_MIN;

    const totalMinutesFromStart = (hours - START_HOUR) * 60 + minutes;
    return totalMinutesFromStart * PIXELS_PER_MIN;
};

export const getTimeFromPixels = (pixels: number, baseDate: Date): Date => {
    const minutesFromStart = Math.round(pixels / PIXELS_PER_MIN);
    const totalMinutes = (START_HOUR * 60) + minutesFromStart;

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    const newDate = new Date(baseDate);
    // setHours handles values >= 24 by rolling to next day automatically
    newDate.setHours(hours, minutes, 0, 0);
    return newDate;
};

export const checkCollision = (
    newStart: Date,
    newEnd: Date,
    existingSlots: ShowTimeSlot[],
    excludeSlotId?: string
): boolean => {
    const newStartMs = newStart.getTime();
    const newEndMs = newEnd.getTime();

    return existingSlots.some(slot => {
        if (slot.id === excludeSlotId) return false;

        const slotStart = new Date(slot.start).getTime();
        const slotEnd = new Date(slot.end).getTime();

        return (newStartMs < slotEnd) && (newEndMs > slotStart);
    });
};

export const calculateEndTime = (startDate: Date, durationMinutes: number, cleaningTimeMinutes: number = 20): Date => {
    return new Date(startDate.getTime() + (durationMinutes + cleaningTimeMinutes) * 60000);
};

export const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
};
