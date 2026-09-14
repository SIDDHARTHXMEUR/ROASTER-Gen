export interface Employee {
  id: string;
  name: string;
  role: string;
  department: string;
  hourlyWage: number;
  maxWeeklyHours: number;
  assignedHours: number;
  skills: string[];
  // Simplified availability matrix: true means available for that tier on that day
  availability: {
    [day: string]: {
      Morning: boolean;
      Day: boolean;
      Evening: boolean;
      Night: boolean;
    }
  };
}

export interface Shift {
  id: string;
  day: string; // e.g., 'Monday'
  tier: 'Morning' | 'Day' | 'Evening' | 'Night';
  department: string;
  requiredHeadcount: number;
  requiredSkills: string[];
}

export interface Assignment {
  shiftId: string;
  employeeId: string;
}

export interface Station {
  id: string;
  name: string;
  department: string;
  requiredSkill: string;
}

export interface OvertimeRequest {
  id: string;
  employeeId: string;
  shiftId: string;
  cost: number;
  priorityScore: number;
  approved: boolean;
}

export interface ShiftSwapRequest {
  id: string;
  requestingEmployeeId: string;
  targetShiftId: string;
  reason: string;
  status?: 'pending' | 'approved' | 'rejected';
}

export interface AlgorithmResult<T> {
  result: T;
  runtimeMs: number;
  comparisons?: number;
  metaInfo?: Record<string, number>;
}
