// src/types/cleaning.types.ts
// Types for Janitor/Cleaning task board and lifecycle.

export type CleaningTaskStatus = 'Pending' | 'Assigned' | 'InProgress' | 'Completed' | 'Verified' | 'Skipped';
export type CleaningTaskType = 'PostShowtime' | 'Routine' | 'Deep' | 'Restroom' | 'Lobby';

export interface CleaningTaskDto {
  cleaningTaskId: string;
  cinemaId: string;
  auditoriumId: string;
  auditoriumNumber: string;
  movieScheduleId?: string | null;
  assignedStaffId?: string | null;
  assignedStaffName?: string | null;
  status: CleaningTaskStatus;
  taskType: CleaningTaskType;
  priority: number;
  scheduledAt: string;
  dueAt?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  verifiedAt?: string | null;
  note?: string | null;
  proofImageUrl?: string | null;
}

export interface CleaningBoardCellDto {
  auditoriumId: string;
  auditoriumNumber: string;
  tasks: CleaningTaskDto[];
}

export interface AssignCleaningTaskRequest {
  staffId: string;
}

export interface CompleteCleaningTaskRequest {
  note?: string;
  proofImageUrl?: string;
}

export interface VerifyCleaningTaskRequest {
  note?: string;
}
