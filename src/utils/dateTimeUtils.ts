const VIETNAM_TIME_ZONE = 'Asia/Ho_Chi_Minh';
const UTC_OFFSET_PATTERN = /(?:Z|[+-]\d{2}:?\d{2})$/i;

const normalizeUtcInput = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed || trimmed.startsWith('0001-01-01')) return null;
  return UTC_OFFSET_PATTERN.test(trimmed) ? trimmed : `${trimmed}Z`;
};

export const parseUtcDate = (value?: string | null) => {
  if (!value) return null;

  const normalized = normalizeUtcInput(value);
  if (!normalized) return null;

  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const formatVietnamDateTime = (value?: string | null) => {
  const date = parseUtcDate(value);
  if (!date) return 'N/A';

  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: VIETNAM_TIME_ZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date);
};

export const formatVietnamDate = (value?: string | null) => {
  const date = parseUtcDate(value);
  if (!date) return 'N/A';

  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: VIETNAM_TIME_ZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
};

export const formatVietnamTime = (value?: string | null) => {
  const date = parseUtcDate(value);
  if (!date) return 'N/A';

  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: VIETNAM_TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export const toVietnamDateTimeLocalValue = (value?: string | null) => {
  const date = parseUtcDate(value);
  if (!date) return '';

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: VIETNAM_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);

  const pick = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? '00';

  return `${pick('year')}-${pick('month')}-${pick('day')}T${pick('hour')}:${pick('minute')}`;
};

export const vietnamDateTimeLocalToOffsetString = (value?: string | null) => {
  if (!value) return value ?? null;

  const [datePart, timePart = '00:00'] = value.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hour, minute] = timePart.split(':').map(Number);

  if ([year, month, day, hour, minute].some((part) => Number.isNaN(part))) {
    return value;
  }

  const pad = (part: number) => part.toString().padStart(2, '0');
  return `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}:00+07:00`;
};
