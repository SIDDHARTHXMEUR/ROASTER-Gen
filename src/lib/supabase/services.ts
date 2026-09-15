import { supabase, isSupabaseConfigured } from './client';
import { Employee, Shift, Assignment, Station, OvertimeRequest, ShiftSwapRequest } from '../types';
import { generateDataset } from '../seed';

// ==========================================================
// DB Data Mappers (snake_case <-> camelCase)
// ==========================================================

function mapDbEmployee(row: any): Employee {
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    department: row.department,
    hourlyWage: Number(row.hourly_wage),
    maxWeeklyHours: row.max_weekly_hours,
    assignedHours: row.assigned_hours || 0,
    skills: row.skills || [],
    availability: row.availability || {},
  };
}

function mapEmployeeToDb(emp: Employee) {
  return {
    id: emp.id,
    name: emp.name,
    role: emp.role,
    department: emp.department,
    hourly_wage: emp.hourlyWage,
    max_weekly_hours: emp.maxWeeklyHours,
    assigned_hours: emp.assignedHours,
    skills: emp.skills,
    availability: emp.availability,
  };
}

function mapDbShift(row: any): Shift {
  return {
    id: row.id,
    day: row.day,
    tier: row.tier,
    department: row.department,
    requiredHeadcount: row.required_headcount,
    requiredSkills: row.required_skills || [],
  };
}

function mapShiftToDb(shift: Shift) {
  return {
    id: shift.id,
    day: shift.day,
    tier: shift.tier,
    department: shift.department,
    required_headcount: shift.requiredHeadcount,
    required_skills: shift.requiredSkills,
  };
}

function mapDbAssignment(row: any): Assignment {
  return {
    shiftId: row.shift_id,
    employeeId: row.employee_id,
  };
}

function mapDbStation(row: any): Station {
  return {
    id: row.id,
    name: row.name,
    department: row.department,
    requiredSkill: row.required_skill,
  };
}

function mapStationToDb(st: Station) {
  return {
    id: st.id,
    name: st.name,
    department: st.department,
    required_skill: st.requiredSkill,
  };
}

function mapDbOvertime(row: any): OvertimeRequest {
  return {
    id: row.id,
    employeeId: row.employee_id,
    shiftId: row.shift_id,
    cost: Number(row.cost),
    priorityScore: Number(row.priority_score),
    approved: row.approved,
  };
}

function mapDbSwap(row: any): ShiftSwapRequest {
  return {
    id: row.id,
    requestingEmployeeId: row.requesting_employee_id,
    targetShiftId: row.target_shift_id,
    reason: row.reason,
    status: row.status,
  };
}

// ==========================================================
// SUPABASE DATA API SERVICES
// ==========================================================

export async function fetchFullRosterDataset() {
  if (!isSupabaseConfigured()) {
    console.warn('[Supabase] Missing NEXT_PUBLIC_SUPABASE_ANON_KEY. Falling back to local seed data.');
    return { isFromSupabase: false, data: { ...generateDataset(42), assignments: [] } };
  }

  try {
    const [empRes, shiftRes, assignRes, stationRes, otRes, swapRes] = await Promise.all([
      supabase.from('employees').select('*'),
      supabase.from('shifts').select('*'),
      supabase.from('assignments').select('*'),
      supabase.from('stations').select('*'),
      supabase.from('overtime_requests').select('*'),
      supabase.from('shift_swap_requests').select('*'),
    ]);

    if (empRes.error || shiftRes.error) {
      console.warn('[Supabase] Table query error:', empRes.error || shiftRes.error);
      return { isFromSupabase: false, data: { ...generateDataset(42), assignments: [] } };
    }

    const employees = (empRes.data || []).map(mapDbEmployee);
    const shifts = (shiftRes.data || []).map(mapDbShift);
    const assignments = (assignRes.data || []).map(mapDbAssignment);
    const stations = (stationRes.data || []).map(mapDbStation);
    const overtimeRequests = (otRes.data || []).map(mapDbOvertime);
    const shiftSwapRequests = (swapRes.data || []).map(mapDbSwap);

    // If database is currently empty, return local seed for initial population
    if (employees.length === 0 || shifts.length === 0) {
      return { isFromSupabase: false, data: { ...generateDataset(42), assignments: [] }, isEmptyDb: true };
    }

    return {
      isFromSupabase: true,
      data: {
        employees,
        shifts,
        assignments,
        stations,
        overtimeRequests,
        shiftSwapRequests,
      },
    };
  } catch (err) {
    console.error('[Supabase] Fetch error:', err);
    return { isFromSupabase: false, data: { ...generateDataset(42), assignments: [] } };
  }
}

/**
 * Seed Supabase database tables with local seed data
 */
export async function seedSupabaseDatabase() {
  if (!isSupabaseConfigured()) return false;

  const dataset = generateDataset(42);

  try {
    // 1. Employees
    const empDb = dataset.employees.map(mapEmployeeToDb);
    await supabase.from('employees').upsert(empDb);

    // 2. Shifts
    const shiftDb = dataset.shifts.map(mapShiftToDb);
    await supabase.from('shifts').upsert(shiftDb);

    // 3. Stations
    const stationDb = dataset.stations.map(mapStationToDb);
    await supabase.from('stations').upsert(stationDb);

    // 4. Overtime Requests
    const otDb = dataset.overtimeRequests.map((ot) => ({
      id: ot.id,
      employee_id: ot.employeeId,
      shift_id: ot.shiftId,
      cost: ot.cost,
      priority_score: ot.priorityScore,
      approved: ot.approved,
    }));
    await supabase.from('overtime_requests').upsert(otDb);

    // 5. Shift Swaps
    const swapDb = dataset.shiftSwapRequests.map((sw) => ({
      id: sw.id,
      requesting_employee_id: sw.requestingEmployeeId,
      target_shift_id: sw.targetShiftId,
      reason: sw.reason,
      status: sw.status || 'pending',
    }));
    await supabase.from('shift_swap_requests').upsert(swapDb);

    return true;
  } catch (err) {
    console.error('[Supabase] Seeding error:', err);
    return false;
  }
}

/**
 * Save roster assignments to Supabase
 */
export async function syncAssignmentsToSupabase(assignments: Assignment[]) {
  if (!isSupabaseConfigured()) return false;
  try {
    // Delete existing assignments and insert fresh
    await supabase.from('assignments').delete().neq('shift_id', '___');
    if (assignments.length > 0) {
      const dbRows = assignments.map((a) => ({
        shift_id: a.shiftId,
        employee_id: a.employeeId,
      }));
      const { error } = await supabase.from('assignments').insert(dbRows);
      if (error) console.error('[Supabase] Assignments insert error:', error);
    }
    return true;
  } catch (err) {
    console.error('[Supabase] Assignments sync error:', err);
    return false;
  }
}
