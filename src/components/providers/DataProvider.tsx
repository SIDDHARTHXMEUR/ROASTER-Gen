'use client';

import { useEffect, useRef } from 'react';
import { useAppStore } from '@/store';
import { generateDataset } from '@/lib/seed';

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { setEmployees, setShifts, setStations, setOvertimeRequests, setShiftSwapRequests } = useAppStore();
  const hasSeeded = useRef(false);

  useEffect(() => {
    if (!hasSeeded.current) {
      const data = generateDataset(42); // fixed seed for reproducibility
      setEmployees(data.employees);
      setShifts(data.shifts);
      setStations(data.stations);
      setOvertimeRequests(data.overtimeRequests);
      setShiftSwapRequests(data.shiftSwapRequests);
      hasSeeded.current = true;
    }
  }, [setEmployees, setShifts, setStations, setOvertimeRequests, setShiftSwapRequests]);

  return <>{children}</>;
}
