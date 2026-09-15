'use client';

import { useAppStore } from '@/store';
import { useState, useMemo, useEffect } from 'react';
import { approveOvertimeKnapsack } from '@/lib/algorithms/knapsack';
import { approveOvertimeGreedy } from '@/lib/algorithms/greedy';
import { AlgorithmResult, OvertimeRequest } from '@/lib/types';
import EvaluatorDrawer from '@/components/evaluator/EvaluatorDrawer';
import { RotateCw, Check, Ban, Cpu, TrendingUp, ShieldCheck, SlidersHorizontal } from 'lucide-react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

export interface EnrichedOvertimeRequest extends OvertimeRequest {
  costINR: number;
  density: number;
  empName: string;
  empDept: string;
  empRole: string;
  shiftDay: string;
  shiftTier: string;
  skillRequired: string;
}

export default function BudgetPlanner() {
  const { overtimeRequests, employees, shifts, setOvertimeRequests, showToast } = useAppStore();
  const [budgetCap, setBudgetCap] = useState<number>(450000);
  const [algoResult, setAlgoResult] = useState<AlgorithmResult<OvertimeRequest[]> | null>(null);
  const [solverRequests, setSolverRequests] = useState<EnrichedOvertimeRequest[]>([]);
  const [manualOverrides, setManualOverrides] = useState<Record<string, boolean>>({});
  const [useGreedy, setUseGreedy] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);

  // Build real OT table: scale cost from seed (60–220) × 40 → ₹2,400–₹8,800
  const enrichedRequests = useMemo(() => {
    return overtimeRequests.slice(0, 15).map(r => {
      const emp = employees.find(e => e.id === r.employeeId);
      const shift = shifts.find(s => s.id === r.shiftId);
      const costINR = r.cost * 40; // scale to realistic INR
      const density = parseFloat((r.priorityScore / costINR * 1000).toFixed(3));
      return {
        ...r,
        costINR,
        density,
        empName: emp?.name ?? r.employeeId,
        empDept: emp?.department ?? 'Engineering & Cloud',
        empRole: emp?.role ?? 'Engineer',
        shiftDay: shift?.day ?? 'Monday',
        shiftTier: shift?.tier ?? 'Evening',
        skillRequired: shift?.requiredSkills?.[0] ?? 'Incident Triage',
      };
    });
  }, [overtimeRequests, employees, shifts]);

  // Display list: use solver results if available, else seed data
  const displayRequests = useMemo(() => {
    const base = solverRequests.length > 0 ? solverRequests : enrichedRequests;
    return base.map(r => {
      const manual = manualOverrides[r.id];
      const approved = manual !== undefined ? manual : r.approved;
      const isDeviation = algoResult !== null && manual !== undefined && manual !== r.approved;
      return { ...r, approved, isDeviation };
    });
  }, [solverRequests, enrichedRequests, manualOverrides, algoResult]);

  // Live budget summary
  const budgetSummary = useMemo(() => {
    const approved = displayRequests.filter(r => r.approved);
    const totalCost = approved.reduce((sum, r) => sum + r.costINR, 0);
    const totalPriority = approved.reduce((sum, r) => sum + r.priorityScore, 0);
    const utilizationPct = budgetCap > 0 ? (totalCost / budgetCap) * 100 : 0;
    const deviations = Object.keys(manualOverrides).length;
    return { approved: approved.length, totalCost, totalPriority, utilizationPct, deviations };
  }, [displayRequests, budgetCap, manualOverrides]);

  const handleOptimize = () => {
    setIsOptimizing(true);
    // Scale budget cap down to algo units (divide by 40 to match cost scale in seed)
    const algoCap = Math.floor(budgetCap / 40);
    setTimeout(() => {
      const runAlgo = useGreedy ? approveOvertimeGreedy : approveOvertimeKnapsack;
      const result = runAlgo(overtimeRequests.slice(0, 15), algoCap);
      setAlgoResult(result);
      setManualOverrides({}); // clear manual overrides on new solve
      // Enrich solver results
      const enriched = result.result.map(r => {
        const emp = employees.find(e => e.id === r.employeeId);
        const shift = shifts.find(s => s.id === r.shiftId);
        return {
          ...r,
          costINR: r.cost * 40,
          density: parseFloat((r.priorityScore / (r.cost * 40) * 1000).toFixed(3)),
          empName: emp?.name ?? r.employeeId,
          empDept: emp?.department ?? 'Engineering & Cloud',
          empRole: emp?.role ?? 'Engineer',
          shiftDay: shift?.day ?? 'Monday',
          shiftTier: shift?.tier ?? 'Evening',
          skillRequired: shift?.requiredSkills?.[0] ?? 'Incident Triage',
        };
      });
      setSolverRequests(enriched);
      setOvertimeRequests(result.result);
      setIsOptimizing(false);
      const approvedCount = result.result.filter(r => r.approved).length;
      const totalCost = result.result.filter(r => r.approved).reduce((s, r) => s + r.cost * 40, 0);
      showToast(
        `${useGreedy ? 'Greedy' : '0-1 Knapsack'} complete: ${approvedCount} approved · ₹${totalCost.toLocaleString('en-IN')} allocated · ${result.runtimeMs.toFixed(2)}ms`,
        'success'
      );
    }, 480);
  };

  useEffect(() => {
    const storeState = useAppStore.getState();
    const ots = storeState.overtimeRequests.length > 0 ? storeState.overtimeRequests : overtimeRequests;
    const emps = storeState.employees.length > 0 ? storeState.employees : employees;
    const sfts = storeState.shifts.length > 0 ? storeState.shifts : shifts;

    if (ots.length > 0) {
      const algoCap = Math.floor(budgetCap / 40);
      const runAlgo = useGreedy ? approveOvertimeGreedy : approveOvertimeKnapsack;
      const res = runAlgo(ots.slice(0, 15), algoCap);
      setAlgoResult(res);
      const enriched = res.result.map(r => {
        const emp = emps.find(e => e.id === r.employeeId);
        const shift = sfts.find(s => s.id === r.shiftId);
        return {
          ...r,
          costINR: r.cost * 40,
          density: parseFloat((r.priorityScore / (r.cost * 40) * 1000).toFixed(3)),
          empName: emp?.name ?? r.employeeId,
          empDept: emp?.department ?? 'Engineering & Cloud',
          empRole: emp?.role ?? 'Engineer',
          shiftDay: shift?.day ?? 'Monday',
          shiftTier: shift?.tier ?? 'Evening',
          skillRequired: shift?.requiredSkills?.[0] ?? 'Incident Triage',
        };
      });
      setSolverRequests(enriched);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overtimeRequests.length, budgetCap, useGreedy]);

  const toggleApproval = (id: string) => {
    const current = displayRequests.find(r => r.id === id);
    if (!current) return;
    const newVal = !current.approved;
    setManualOverrides(prev => ({ ...prev, [id]: newVal }));
    showToast(
      newVal
        ? `Override: ${current.empName} approved (deviates from solver recommendation)`
        : `Override: ${current.empName} rejected (deviates from solver recommendation)`,
      'info'
    );
  };

  return (
    <div className="flex flex-col w-full min-h-screen text-slate-900 antialiased">
      {/* Header */}
      <section className="w-full bg-white border-b border-slate-200/80 px-8 py-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-100">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                Budget & Overtime Control
              </span>
              {algoResult && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                  <ShieldCheck className="w-3 h-3" />
                  Solved in {algoResult.runtimeMs.toFixed(2)}ms
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Budget & Overtime Planner</h1>
            <p className="text-sm text-slate-500 mt-0.5">0-1 Knapsack DP optimization for overtime budget allocation with manual override controls.</p>
          </div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center rounded-lg bg-slate-100 p-1 border border-slate-200/60">
              <button type="button" onClick={() => setUseGreedy(false)}
                className={clsx('px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer', !useGreedy ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900')}>
                Knapsack DP
              </button>
              <button type="button" onClick={() => setUseGreedy(true)}
                className={clsx('px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer', useGreedy ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900')}>
                Greedy
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="p-8 flex flex-col gap-6">
        {/* Enhanced Interactive Budget Cap Controller */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0 border border-amber-500/20 shadow-2xs">
                <SlidersHorizontal className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900 tracking-tight">Weekly Overtime Budget Cap</h3>
                  <span className={clsx(
                    "px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide border",
                    budgetSummary.utilizationPct > 100 ? "bg-rose-50 text-rose-700 border-rose-200" :
                    budgetSummary.utilizationPct > 85 ? "bg-amber-50 text-amber-700 border-amber-200" :
                    "bg-emerald-50 text-emerald-700 border-emerald-200"
                  )}>
                    {budgetSummary.utilizationPct > 100 ? "Cap Exceeded" :
                     budgetSummary.utilizationPct > 85 ? "Near Capacity" : "Optimal Pool"}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Adjust maximum allowable overtime expenditure limit to trigger 0-1 Knapsack redistribution.
                </p>
              </div>
            </div>

            {/* Value Stepper Control */}
            <div className="flex items-center gap-2 self-start md:self-auto bg-slate-50 p-1.5 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setBudgetCap(Math.max(50000, budgetCap - 25000))}
                className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100 active:scale-95 transition-all shadow-2xs cursor-pointer"
                title="Decrease by ₹25,000"
              >
                -₹25k
              </button>
              <div className="px-3 text-base font-bold text-amber-700 font-mono-nums tracking-tight">
                ₹{budgetCap.toLocaleString('en-IN')}
              </div>
              <button
                type="button"
                onClick={() => setBudgetCap(Math.min(1000000, budgetCap + 25000))}
                className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100 active:scale-95 transition-all shadow-2xs cursor-pointer"
                title="Increase by ₹25,000"
              >
                +₹25k
              </button>
            </div>
          </div>

          {/* Slider & Presets Strip */}
          <div className="pt-5 space-y-4">
            {/* Custom Dual-Layer Gradient Track Slider */}
            <div className="space-y-2">
              <input
                type="range"
                min={50000}
                max={1000000}
                step={10000}
                value={budgetCap}
                onChange={e => setBudgetCap(Number(e.target.value))}
                style={{
                  background: `linear-gradient(to right, #d97706 0%, #f59e0b ${((budgetCap - 50000) / 950000) * 100}%, #e2e8f0 ${((budgetCap - 50000) / 950000) * 100}%, #e2e8f0 100%)`
                }}
                className="w-full h-2.5 rounded-full appearance-none cursor-pointer accent-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
              <div className="flex justify-between text-xs text-slate-500 font-mono-nums font-medium px-0.5">
                <span>Min: ₹50,000</span>
                <span className="text-slate-400">Current Cap: ₹{budgetCap.toLocaleString('en-IN')}</span>
                <span>Max: ₹10,00,000</span>
              </div>
            </div>

            {/* Quick Presets & Utilization Metrics */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1">Presets:</span>
                {[
                  { label: '₹2.5L', val: 250000 },
                  { label: '₹4.5L', val: 450000 },
                  { label: '₹6.5L', val: 650000 },
                  { label: '₹8.5L', val: 850000 },
                  { label: '₹10L',  val: 1000000 },
                ].map((preset) => (
                  <button
                    key={preset.val}
                    type="button"
                    onClick={() => setBudgetCap(preset.val)}
                    className={clsx(
                      "px-2.5 py-1 rounded-md text-xs font-semibold font-mono-nums transition-all cursor-pointer border",
                      budgetCap === preset.val
                        ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900"
                    )}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {/* Realtime Metrics Summary */}
              <div className="flex items-center gap-3 text-xs font-mono-nums font-semibold">
                <div className="flex items-center gap-1 text-slate-600">
                  <span className="text-slate-400 font-normal">Allocated:</span>
                  <span className="text-slate-900 font-bold">₹{budgetSummary.totalCost.toLocaleString('en-IN')}</span>
                </div>
                <span className="text-slate-300">·</span>
                <div className="flex items-center gap-1 text-emerald-700">
                  <span className="text-slate-400 font-normal">Available:</span>
                  <span className="font-bold">₹{Math.max(0, budgetCap - budgetSummary.totalCost).toLocaleString('en-IN')}</span>
                </div>
                <span className="text-slate-300">·</span>
                <div className={clsx(
                  "px-2 py-0.5 rounded font-bold",
                  budgetSummary.utilizationPct > 100 ? "bg-rose-100 text-rose-800" :
                  budgetSummary.utilizationPct > 85 ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
                )}>
                  {budgetSummary.utilizationPct.toFixed(1)}% Used
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="metric-card accent-amber p-5 stagger-1">
            <div className="flex justify-between items-center text-xs font-medium text-slate-500">
              <span>Approved requests</span>
              <span className="text-amber-600 font-semibold font-mono-nums">of {displayRequests.length} total</span>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold tracking-tight text-slate-900 font-mono-nums">{budgetSummary.approved}</span>
                <span className="text-sm text-slate-400">approved</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2.5 overflow-hidden">
                <motion.div animate={{ width: `${displayRequests.length > 0 ? (budgetSummary.approved / displayRequests.length) * 100 : 0}%` }} transition={{ duration: 0.8 }}
                  className="bg-amber-500 h-1.5 rounded-full" />
              </div>
              <div className="flex justify-between mt-2.5 text-xs text-slate-500">
                <span>{algoResult ? (useGreedy ? 'Greedy approx' : 'DP optimal') : 'No solver run'}</span>
                <span className="font-medium">{budgetSummary.deviations > 0 ? `${budgetSummary.deviations} overrides` : 'No overrides'}</span>
              </div>
            </div>
          </div>

          <div className="metric-card accent-amber p-5 stagger-2">
            <div className="flex justify-between items-center text-xs font-medium text-slate-500">
              <span>Total cost allocated</span>
              <span className="text-amber-600 font-semibold font-mono-nums">Budget: ₹{(budgetCap / 1000).toFixed(0)}K</span>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold tracking-tight text-slate-900 font-mono-nums">₹{(budgetSummary.totalCost / 1000).toFixed(1)}K</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2.5 overflow-hidden">
                <motion.div animate={{ width: `${Math.min(budgetSummary.utilizationPct, 100)}%` }} transition={{ duration: 0.8 }}
                  className={clsx('h-1.5 rounded-full', budgetSummary.utilizationPct > 90 ? 'bg-rose-500' : 'bg-amber-500')} />
              </div>
              <div className="flex justify-between mt-2.5 text-xs text-slate-500">
                <span className={budgetSummary.utilizationPct > 90 ? 'text-rose-600 font-medium' : 'text-emerald-600 font-medium'}>
                  {budgetSummary.utilizationPct.toFixed(1)}% utilized
                </span>
                <span>₹{Math.max(0, budgetCap - budgetSummary.totalCost).toLocaleString('en-IN')} left</span>
              </div>
            </div>
          </div>

          <div className="metric-card accent-amber p-5 stagger-3">
            <div className="flex justify-between items-center text-xs font-medium text-slate-500">
              <span>Priority score captured</span>
              <span className="text-amber-600 font-semibold font-mono-nums">Max value</span>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold tracking-tight text-slate-900 font-mono-nums">{budgetSummary.totalPriority}</span>
                <span className="text-sm text-slate-400">pts</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2.5 overflow-hidden">
                <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: `${Math.min((budgetSummary.totalPriority / (displayRequests.length * 99)) * 100, 100)}%` }} />
              </div>
              <div className="flex justify-between mt-2.5 text-xs text-slate-500">
                <span>Cumulative priority value</span>
                <span className="font-medium">{algoResult ? 'DP Optimal' : 'Pending'}</span>
              </div>
            </div>
          </div>

          <div className="metric-card accent-amber p-5 stagger-4">
            <div className="flex justify-between items-center text-xs font-medium text-slate-500">
              <span>Algorithm performance</span>
              <span className="text-amber-600 font-semibold">{useGreedy ? 'O(n log n)' : 'O(n·W)'}</span>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold tracking-tight text-slate-900 font-mono-nums">
                  {algoResult ? algoResult.runtimeMs.toFixed(2) : '—'}
                </span>
                {algoResult && <span className="text-sm text-slate-400">ms</span>}
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2.5 overflow-hidden">
                <div className="bg-emerald-600 h-1.5 rounded-full" style={{ width: algoResult ? '85%' : '0%' }} />
              </div>
              <div className="flex justify-between mt-2.5 text-xs text-slate-500">
                <span>{useGreedy ? 'Greedy (suboptimal)' : '0-1 Knapsack DP'}</span>
                <span className="text-emerald-600 font-medium">{algoResult ? 'Complete' : 'Idle'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* OT Requests Table */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Overtime Authorization Queue</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Real employee overtime requests — solver marks optimal approvals, manual overrides highlighted in amber
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="text-[11px] text-slate-500 font-medium">Approved</span>
              <span className="w-2 h-2 rounded-full bg-rose-400 ml-2"></span>
              <span className="text-[11px] text-slate-500 font-medium">Rejected</span>
              <span className="w-2 h-2 rounded-full bg-amber-400 ml-2"></span>
              <span className="text-[11px] text-slate-500 font-medium">Override</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-4 py-3 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">Request ID</th>
                  <th className="text-left px-4 py-3 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">Employee</th>
                  <th className="text-left px-4 py-3 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">Shift</th>
                  <th className="text-left px-4 py-3 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">Skill</th>
                  <th className="text-right px-4 py-3 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">Cost (₹)</th>
                  <th className="text-right px-4 py-3 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">Priority</th>
                  <th className="text-right px-4 py-3 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">Density</th>
                  <th className="text-center px-4 py-3 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">Status</th>
                  <th className="text-center px-4 py-3 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">Action</th>
                </tr>
              </thead>
              <tbody>
                {displayRequests.map((req, idx) => {
                  const r = req as typeof enrichedRequests[0] & { approved: boolean; isDeviation: boolean };
                  return (
                    <tr key={r.id} className={clsx(
                      'border-b border-slate-100 transition-colors table-row-hover',
                      r.isDeviation && 'bg-amber-50/50',
                      idx % 2 === 0 && !r.isDeviation && 'bg-white',
                      idx % 2 === 1 && !r.isDeviation && 'bg-slate-50/30'
                    )}>
                      <td className="px-4 py-3 font-mono-nums font-semibold text-slate-700">{r.id}</td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{r.empName}</div>
                        <div className="text-[11px] text-slate-500 truncate max-w-[140px]">{r.empDept?.split(' ')[0]}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-800">{r.shiftDay}</div>
                        <div className="text-[11px] text-slate-500">{r.shiftTier} tier</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-block px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100 text-[10px] font-medium truncate max-w-[100px]">
                          {r.skillRequired}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono-nums font-semibold text-slate-800">
                        ₹{(r.costINR ?? r.cost * 40).toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={clsx('font-bold font-mono-nums', r.priorityScore >= 75 ? 'text-emerald-600' : r.priorityScore >= 50 ? 'text-amber-600' : 'text-slate-600')}>
                          {r.priorityScore}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono-nums text-slate-500">{r.density ?? '—'}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={clsx('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border',
                          r.isDeviation
                            ? 'bg-amber-100 text-amber-800 border-amber-200'
                            : r.approved
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                              : 'bg-rose-100 text-rose-700 border-rose-200')}>
                          {r.isDeviation ? '⚡ Override' : r.approved ? '✓ Approved' : '✕ Rejected'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button type="button" onClick={() => toggleApproval(r.id)}
                          className={clsx('px-2.5 py-1 rounded-md text-[10px] font-semibold transition-all cursor-pointer border',
                            r.approved
                              ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100')}>
                          {r.approved ? 'Reject' : 'Approve'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 border-t border-slate-200">
                  <td colSpan={4} className="px-4 py-3 text-xs font-semibold text-slate-700">Totals ({budgetSummary.approved} approved)</td>
                  <td className="px-4 py-3 text-right font-mono-nums font-bold text-slate-900">
                    ₹{budgetSummary.totalCost.toLocaleString('en-IN')}
                  </td>
                  <td className="px-4 py-3 text-right font-mono-nums font-bold text-amber-700">{budgetSummary.totalPriority}</td>
                  <td colSpan={3} className="px-4 py-3 text-right text-xs text-slate-500">
                    {budgetSummary.utilizationPct.toFixed(1)}% of ₹{budgetCap.toLocaleString('en-IN')} cap
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
      <EvaluatorDrawer 
        algorithmName={useGreedy ? 'Greedy Density Ratio Solver' : '0/1 Dynamic Programming Knapsack'}
        runtimeMs={algoResult ? algoResult.runtimeMs : 1.25}
        comparisons={algoResult ? (algoResult.metaInfo?.statesEvaluated || 675) : 675}
        metaInfo={{ 
          capacity: budgetCap, 
          requestsCount: enrichedRequests.length,
          approved: budgetSummary.approved
        }}
        isAlternateActive={useGreedy}
        onToggleAlternate={() => { setUseGreedy(!useGreedy); }}
        alternateLabel="Greedy Heuristic"
      />
    </div>
  );
}
