import { create } from 'zustand';
import { Employee, Shift, Assignment, Station, OvertimeRequest, ShiftSwapRequest } from '@/lib/types';
import { fetchFullRosterDataset, syncAssignmentsToSupabase, seedSupabaseDatabase } from '@/lib/supabase/services';
import { isSupabaseConfigured } from '@/lib/supabase/client';

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
  
  // Supabase State & Actions
  isSupabaseConnected: boolean;
  isSyncing: boolean;
  loadFromSupabase: () => Promise<void>;
  saveAssignmentsToSupabase: (newAssignments?: Assignment[]) => Promise<void>;
  seedSupabase: () => Promise<void>;

  // Toast notifications
  toast: { message: string; type?: 'info' | 'success' | 'alert' } | null;
  showToast: (message: string, type?: 'info' | 'success' | 'alert') => void;
  clearToast: () => void;

  // App state
  weekStart: Date;
  setWeekStart: (date: Date) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
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
  
  isSupabaseConnected: isSupabaseConfigured(),
  isSyncing: false,

  loadFromSupabase: async () => {
    set({ isSyncing: true });
    const result = await fetchFullRosterDataset();
    set({
      employees: result.data.employees,
      shifts: result.data.shifts,
      assignments: result.data.assignments,
      stations: result.data.stations,
      overtimeRequests: result.data.overtimeRequests,
      shiftSwapRequests: result.data.shiftSwapRequests,
      isSupabaseConnected: result.isFromSupabase,
      isSyncing: false,
    });
    if (result.isFromSupabase) {
      get().showToast('Connected to Supabase DB (pwkqzzcecjxzmamzkdei)', 'success');
    }
  },

  saveAssignmentsToSupabase: async (newAssignments) => {
    const listToSave = newAssignments || get().assignments;
    set({ assignments: listToSave });
    if (get().isSupabaseConnected) {
      set({ isSyncing: true });
      const ok = await syncAssignmentsToSupabase(listToSave);
      set({ isSyncing: false });
      if (ok) {
        get().showToast('Roster assignments synced with Supabase!', 'success');
      }
    }
  },

  seedSupabase: async () => {
    if (!isSupabaseConfigured()) {
      get().showToast('Supabase key missing in .env.local', 'alert');
      return;
    }
    set({ isSyncing: true });
    const success = await seedSupabaseDatabase();
    set({ isSyncing: false });
    if (success) {
      get().showToast('Database seeded successfully in Supabase!', 'success');
      await get().loadFromSupabase();
    } else {
      get().showToast('Failed to seed Supabase database.', 'alert');
    }
  },

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
