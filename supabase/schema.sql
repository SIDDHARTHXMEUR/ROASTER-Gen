-- ==========================================================
-- ROASTER-X / RosterGen Supabase Database Schema
-- Project Ref: pwkqzzcecjxzmamzkdei
-- ==========================================================

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. EMPLOYEES TABLE
CREATE TABLE IF NOT EXISTS public.employees (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    department TEXT NOT NULL,
    hourly_wage NUMERIC(10, 2) NOT NULL,
    max_weekly_hours INT NOT NULL DEFAULT 40,
    assigned_hours INT NOT NULL DEFAULT 0,
    skills TEXT[] NOT NULL DEFAULT '{}',
    availability JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_employees_department ON public.employees(department);

-- 2. SHIFTS TABLE
CREATE TABLE IF NOT EXISTS public.shifts (
    id TEXT PRIMARY KEY,
    day TEXT NOT NULL,
    tier TEXT NOT NULL CHECK (tier IN ('Morning', 'Day', 'Evening', 'Night')),
    department TEXT NOT NULL,
    required_headcount INT NOT NULL DEFAULT 1,
    required_skills TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shifts_dept_day ON public.shifts(department, day);

-- 3. ASSIGNMENTS TABLE
CREATE TABLE IF NOT EXISTS public.assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shift_id TEXT NOT NULL REFERENCES public.shifts(id) ON DELETE CASCADE,
    employee_id TEXT NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_assignment UNIQUE (shift_id, employee_id)
);

CREATE INDEX IF NOT EXISTS idx_assignments_shift_id ON public.assignments(shift_id);
CREATE INDEX IF NOT EXISTS idx_assignments_employee_id ON public.assignments(employee_id);

-- 4. STATIONS TABLE
CREATE TABLE IF NOT EXISTS public.stations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    department TEXT NOT NULL,
    required_skill TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. OVERTIME REQUESTS TABLE
CREATE TABLE IF NOT EXISTS public.overtime_requests (
    id TEXT PRIMARY KEY,
    employee_id TEXT NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    shift_id TEXT NOT NULL REFERENCES public.shifts(id) ON DELETE CASCADE,
    cost NUMERIC(10, 2) NOT NULL,
    priority_score NUMERIC(5, 2) NOT NULL,
    approved BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_overtime_emp ON public.overtime_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_overtime_shift ON public.overtime_requests(shift_id);

-- 6. SHIFT SWAP REQUESTS TABLE
CREATE TABLE IF NOT EXISTS public.shift_swap_requests (
    id TEXT PRIMARY KEY,
    requesting_employee_id TEXT NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    target_shift_id TEXT NOT NULL REFERENCES public.shifts(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_swaps_req_emp ON public.shift_swap_requests(requesting_employee_id);

-- ==========================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================================

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.overtime_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_swap_requests ENABLE ROW LEVEL SECURITY;

-- Allow public read access to all public tables for web roster view
DROP POLICY IF EXISTS "Allow public select on employees" ON public.employees;
CREATE POLICY "Allow public select on employees" ON public.employees FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow public select on shifts" ON public.shifts;
CREATE POLICY "Allow public select on shifts" ON public.shifts FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow public select on assignments" ON public.assignments;
CREATE POLICY "Allow public select on assignments" ON public.assignments FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow public select on stations" ON public.stations;
CREATE POLICY "Allow public select on stations" ON public.stations FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow public select on overtime_requests" ON public.overtime_requests;
CREATE POLICY "Allow public select on overtime_requests" ON public.overtime_requests FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow public select on shift_swap_requests" ON public.shift_swap_requests;
CREATE POLICY "Allow public select on shift_swap_requests" ON public.shift_swap_requests FOR SELECT TO anon, authenticated USING (true);

-- Allow insert/update/delete for authenticated & anon clients (for app mutations)
DROP POLICY IF EXISTS "Allow all mutations on employees" ON public.employees;
CREATE POLICY "Allow all mutations on employees" ON public.employees FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all mutations on shifts" ON public.shifts;
CREATE POLICY "Allow all mutations on shifts" ON public.shifts FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all mutations on assignments" ON public.assignments;
CREATE POLICY "Allow all mutations on assignments" ON public.assignments FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all mutations on stations" ON public.stations;
CREATE POLICY "Allow all mutations on stations" ON public.stations FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all mutations on overtime_requests" ON public.overtime_requests;
CREATE POLICY "Allow all mutations on overtime_requests" ON public.overtime_requests FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all mutations on shift_swap_requests" ON public.shift_swap_requests;
CREATE POLICY "Allow all mutations on shift_swap_requests" ON public.shift_swap_requests FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 7. AUDIT LOGS TABLE FOR SOC-2 COMPLIANCE
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action TEXT NOT NULL,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public select on audit_logs" ON public.audit_logs;
CREATE POLICY "Allow public select on audit_logs" ON public.audit_logs FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Allow all mutations on audit_logs" ON public.audit_logs;
CREATE POLICY "Allow all mutations on audit_logs" ON public.audit_logs FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);


