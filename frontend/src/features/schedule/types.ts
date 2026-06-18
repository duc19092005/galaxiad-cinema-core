export interface FormatInfo {
  id: string;
  name: string;
}

export interface Movie {
  id: string;
  title: string;
  durationMinutes: number;
  formats: FormatInfo[];
  color?: string;
}

export interface Auditorium {
  id: string;
  name: string;
  supportedFormats: FormatInfo[]; // Format objects with id and name
}

export interface ShowTimeSlot {
  id: string; // unique instance id
  movieId: string;
  formatId: string;
  formatName?: string;
  start: string; // ISO8601
  end: string; // ISO8601
  price: number;
  isDirty?: boolean;
}

export interface AuditoriumSchedule {
  auditoriumId: string;
  slots: ShowTimeSlot[];
}

export interface ScheduleData {
  cinemaId: string;
  data: AuditoriumSchedule[];
}

// For Drag & Drop state
export interface DragItem {
  type: 'movie_source' | 'existing_slot';
  movieId?: string; // if from source
  slotId?: string; // if moving existing
  duration?: number;
  format?: string;
}
