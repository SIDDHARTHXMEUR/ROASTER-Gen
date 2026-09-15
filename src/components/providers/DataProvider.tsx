'use client';

import { useEffect, useRef } from 'react';
import { useAppStore } from '@/store';
import { generateDataset } from '@/lib/seed';
import { assignShiftsBacktracking } from '@/lib/algorithms/backtracking';

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { setEmployees, setShifts, setAssignments, setStations, setOvertimeRequests, setShiftSwapRequests } = useAppStore();
  const hasSeeded = useRef(false);

  useEffect(() => {
    if (!hasSeeded.current) {
      const data = generateDataset(42); // fixed seed for reproducibility
      setEmployees(data.employees);
      setShifts(data.shifts);
      setStations(data.stations);
      setOvertimeRequests(data.overtimeRequests);
      setShiftSwapRequests(data.shiftSwapRequests);
      
      // Generate baseline backtracking roster immediately so initial hydration has data
      const initialSolution = assignShiftsBacktracking(data.employees, data.shifts);
      let initialAssignments = initialSolution.result;
      const friEveningShift = data.shifts.find(s => s.day === 'Friday' && s.tier === 'Evening');
      if (friEveningShift) {
        const idx = initialAssignments.findIndex(a => a.shiftId === friEveningShift.id);
        if (idx !== -1) {
          initialAssignments = initialAssignments.filter((_, i) => i !== idx);
        }
      }
      setAssignments(initialAssignments);
      hasSeeded.current = true;
    }
  }, [setEmployees, setShifts, setAssignments, setStations, setOvertimeRequests, setShiftSwapRequests]);

  return <>{children}</>;
}
