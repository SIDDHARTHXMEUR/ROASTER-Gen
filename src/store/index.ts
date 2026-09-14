import { create } from 'zustand';
import { Employee, Shift, Assignment, Station, OvertimeRequest, ShiftSwapRequest } from '@/lib/types';

export type Role = 'Manager' | 'Employee' | 'Owner' | 'Evaluator' | 'Recruiter';

interface AppState {
  role: Role;
  setRole: (role: Role) => void;
  isEvaluatorDrawerOpen: boolean;
  setEvaluatorDrawerOpen: (open: boolean) => void;
  
  // Data state
  employees: Employee[];
  shifts: Shift[];
  assignments: Assignment[];
  stations: Station[];
  overtimeRequests: OvertimeRequest[];
  shiftSwapRequests: ShiftSwapRequest[];
  
  setEmployees: (employees: Employee[]) => void;
  setShifts: (shifts: Shift[]) => void;
  setAssignments: (assignments: Assignment[]) => void;
  setStations: (stations: Station[]) => void;
  setOvertimeRequests: (reqs: OvertimeRequest[]) => void;
  setShiftSwapRequests: (reqs: ShiftSwapRequest[]) => void;
  
  // Toast notifications
  toast: { message: string; type?: 'info' | 'success' | 'alert' } | null;
  showToast: (message: string, type?: 'info' | 'success' | 'alert') => void;
  clearToast: () => void;

  // App state
  weekStart: Date;
  setWeekStart: (date: Date) => void;
}

export const useAppStore = create<AppState>((set) => ({
  role: 'Manager',
  setRole: (role) => set({ role }),
  isEvaluatorDrawerOpen: false,
  setEvaluatorDrawerOpen: (isEvaluatorDrawerOpen) => set({ isEvaluatorDrawerOpen }),
  
  employees: [],
  shifts: [],
  assignments: [],
  stations: [],
  overtimeRequests: [],
  shiftSwapRequests: [],
  
  setEmployees: (employees) => set({ employees }),
  setShifts: (shifts) => set({ shifts }),
  setAssignments: (assignments) => set({ assignments }),
  setStations: (stations) => set({ stations }),
  setOvertimeRequests: (overtimeRequests) => set({ overtimeRequests }),
  setShiftSwapRequests: (shiftSwapRequests) => set({ shiftSwapRequests }),
  
  toast: null,
  showToast: (message, type = 'info') => {
    set({ toast: { message, type } });
    setTimeout(() => {
      set((s) => (s.toast?.message === message ? { toast: null } : s));
    }, 3800);
  },
  clearToast: () => set({ toast: null }),

  weekStart: new Date(),
  setWeekStart: (weekStart) => set({ weekStart }),
}));
