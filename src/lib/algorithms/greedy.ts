import { Employee, Shift, Assignment, AlgorithmResult, OvertimeRequest, Station } from '../types';

/**
 * Greedy algorithm for shift assignments.
 * Simple, fast: just takes the first available employee.
 */
export function assignShiftsGreedy(employees: Employee[], shifts: Shift[]): AlgorithmResult<Assignment[]> {
  const start = performance.now();
  const assignments: Assignment[] = [];
  const empState = employees.map(e => ({...e}));
  const meta = { unassignedSlots: 0 };
  
  for (const shift of shifts) {
    for (let i = 0; i < shift.requiredHeadcount; i++) {
      let assigned = false;
      for (const emp of empState) {
        const hasSkill = shift.requiredSkills.some(s => emp.skills.includes(s));
        const isAvailable = emp.availability[shift.day][shift.tier];
        const hasHours = emp.assignedHours + 8 <= emp.maxWeeklyHours;
        const notAlreadyOnShift = !assignments.some(a => a.shiftId === shift.id && a.employeeId === emp.id);
        
        if (hasSkill && isAvailable && hasHours && notAlreadyOnShift) {
          emp.assignedHours += 8;
          assignments.push({ shiftId: shift.id, employeeId: emp.id });
          assigned = true;
          break;
        }
      }
      if (!assigned) {
        meta.unassignedSlots++;
      }
    }
  }

  const runtimeMs = performance.now() - start;
  return {
    result: assignments,
    runtimeMs,
    metaInfo: meta
  };
}

/**
 * Greedy algorithm for budget planner (Overtime approval).
 * Sorts by priority/cost ratio and approves until budget is hit.
 */
export function approveOvertimeGreedy(requests: OvertimeRequest[], budgetCap: number): AlgorithmResult<OvertimeRequest[]> {
    const start = performance.now();
    
    // Sort by value/weight ratio descending
    const sorted = [...requests].sort((a, b) => (b.priorityScore / b.cost) - (a.priorityScore / a.cost));
    
    let currentCost = 0;
    const result = sorted.map(req => {
        if (currentCost + req.cost <= budgetCap) {
            currentCost += req.cost;
            return { ...req, approved: true };
        }
        return { ...req, approved: false };
    });
    
    return {
        result,
        runtimeMs: performance.now() - start
    };
}
