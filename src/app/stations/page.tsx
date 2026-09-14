'use client';

import { useAppStore } from '@/store';
import { useState, useMemo, useEffect } from 'react';
import { assignStationsBranchAndBound } from '@/lib/algorithms/branch_and_bound';
import { assignStationsGreedy } from '@/lib/algorithms/branch_and_bound';
import { StationAssignment } from '@/lib/algorithms/branch_and_bound';
import { AlgorithmResult } from '@/lib/types';
import EvaluatorDrawer from '@/components/evaluator/EvaluatorDrawer';
import { RotateCw, CheckCircle2, AlertCircle, Zap, ShieldCheck, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

export default function StationMatching() {
  const { employees, stations, showToast } = useAppStore();
  const [algoResult, setAlgoResult] = useState<AlgorithmResult<StationAssignment[]> | null>(null);
  const [greedyResult, setGreedyResult] = useState<AlgorithmResult<StationAssignment[]> | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [hasResolvedVacancy, setHasResolvedVacancy] = useState(false);
  const [relaxedAssignment, setRelaxedAssignment] = useState<StationAssignment | null>(null);

  const employeeById = useMemo(() => {
    const map: Record<string, typeof employees[0]> = {};
    employees.forEach(e => { map[e.id] = e; });
    return map;
  }, [employees]);

  // Best assignments: prefer B&B, fallback to greedy
  const activeAssignments = algoResult?.result ?? [];
  
  // Correct fit percent formula: count perfect fits / total
  const avgFitPercent = useMemo(() => {
    const source = activeAssignments;
    if (source.length === 0) return 0;
    const perfectFits = source.filter(a => a.fitScore === 10).length;
    return Math.round((perfectFits / source.length) * 100);
  }, [activeAssignments]);

  // Deficit station: first station with fitScore === 0 or not assigned
  const deficitStation = useMemo(() => {
    if (activeAssignments.length === 0 || hasResolvedVacancy) return null;
    return stations.find(st => {
      const assignment = activeAssignments.find(a => a.stationId === st.id);
      return !assignment || assignment.fitScore === 0;
    }) ?? null;
  }, [activeAssignments, stations, hasResolvedVacancy]);

  const handleRunBnB = () => {
    setIsRunning(true);
    setTimeout(() => {
      const bnb = assignStationsBranchAndBound(employees, stations);
      const greedy = assignStationsGreedy(employees, stations);
      setAlgoResult(bnb);
      setGreedyResult(greedy);
      setHasResolvedVacancy(false);
      setRelaxedAssignment(null);
      setIsRunning(false);
      const perfectFits = bnb.result.filter(a => a.fitScore === 10).length;
      showToast(
        `B&B complete: ${perfectFits}/${stations.length} perfect skill matches · ${bnb.metaInfo?.branchesPruned ?? 0} branches pruned · ${bnb.runtimeMs.toFixed(2)}ms`,
        'success'
      );
    }, 600);
  };

  useEffect(() => {
    if (!algoResult && !isRunning && employees.length > 0) {
      handleRunBnB();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employees]);

  // Handle heuristic deficit resolution employee with required skill not already assigned
  const handleResolveVacancy = () => {
    if (!deficitStation) return;
    const usedIds = new Set(activeAssignments.map(a => a.employeeId));
    // Try to find employee with matching skill first
    const best = employees.find(e => !usedIds.has(e.id) && e.skills.includes(deficitStation.requiredSkill))
      ?? employees.find(e => !usedIds.has(e.id));
    if (best) {
      const newAssignment: StationAssignment = {
        stationId: deficitStation.id,
        employeeId: best.id,
        fitScore: best.skills.includes(deficitStation.requiredSkill) ? 10 : 5,
      };
      setRelaxedAssignment(newAssignment);
      setHasResolvedVacancy(true);
      showToast(
        `Vacancy resolved: ${best.name} assigned to ${deficitStation.name} (fit: ${newAssignment.fitScore === 10 ? '100%' : '50% partial'})`,
        'success'
      );
    }
  };

  // Merge relaxed assignment into display
  const displayAssignments = useMemo(() => {
    if (!relaxedAssignment) return activeAssignments;
    return activeAssignments.map(a =>
      a.stationId === relaxedAssignment.stationId ? relaxedAssignment : a
    ).concat(
      activeAssignments.some(a => a.stationId === relaxedAssignment.stationId) ? [] : [relaxedAssignment]
    );
  }, [activeAssignments, relaxedAssignment]);

  return (
    <div className="flex flex-col w-full min-h-screen text-slate-900 antialiased">
      {/* Header */}
      <div className="w-full bg-white border-b border-slate-200/80 px-8 py-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-violet-50 text-violet-700 border border-violet-100">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse"></span>
                Station Assignment Engine
              </span>
              {algoResult && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                  <ShieldCheck className="w-3 h-3" />
                  {algoResult.metaInfo?.branchesPruned ?? 0} branches pruned · {algoResult.runtimeMs.toFixed(2)}ms
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Station & Pod Matching</h1>
            <p className="text-sm text-slate-500 mt-0.5">Branch & Bound optimization for corporate workstation skill-to-employee assignment.</p>
          </div>
          <div className="flex items-center gap-2.5">
            {deficitStation && !hasResolvedVacancy && algoResult && (
              <button type="button" onClick={handleResolveVacancy}
                className="px-3.5 py-2 rounded-lg bg-amber-50 border border-amber-300 text-amber-700 text-xs font-medium flex items-center gap-1.5 cursor-pointer hover:bg-amber-100 transition-colors">
                <AlertCircle className="w-3.5 h-3.5" />
                Resolve Vacancy
              </button>
            )}
            <button type="button" onClick={handleRunBnB} disabled={isRunning || employees.length === 0}
              className="btn-primary rounded-lg px-4 py-2 text-xs font-medium flex items-center gap-2 cursor-pointer disabled:opacity-50">
              <RotateCw className={clsx('w-3.5 h-3.5', isRunning && 'animate-spin')} />
              <span>{isRunning ? 'Running B&B...' : 'Run Branch & Bound'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="p-8 flex flex-col gap-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="metric-card accent-violet p-5 stagger-1">
            <div className="flex justify-between items-center text-xs font-medium text-slate-500">
              <span>Skill fit rate</span>
              <span className="text-violet-600 font-semibold font-mono-nums">Target: 100%</span>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold tracking-tight text-slate-900 font-mono-nums">
                  {algoResult ? avgFitPercent : '—'}
                </span>
                {algoResult && <span className="text-lg font-medium text-slate-400">%</span>}
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2.5 overflow-hidden">
                <motion.div animate={{ width: `${avgFitPercent}%` }} transition={{ duration: 0.8 }}
                  className={clsx('h-1.5 rounded-full', avgFitPercent === 100 ? 'bg-emerald-600' : avgFitPercent >= 70 ? 'bg-violet-600' : 'bg-amber-500')} />
              </div>
              <div className="flex justify-between mt-2.5 text-xs text-slate-500">
                <span>{displayAssignments.filter(a => a.fitScore === 10).length} perfect / {displayAssignments.filter(a => a.fitScore === 0).length} mismatch</span>
                <span className="font-medium">{avgFitPercent === 100 ? 'Optimal' : 'Partial'}</span>
              </div>
            </div>
          </div>

          <div className="metric-card accent-violet p-5 stagger-2">
            <div className="flex justify-between items-center text-xs font-medium text-slate-500">
              <span>Stations assigned</span>
              <span className="text-violet-600 font-semibold font-mono-nums">{stations.length} total pods</span>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold tracking-tight text-slate-900 font-mono-nums">{displayAssignments.length}</span>
                <span className="text-sm text-slate-400">of {stations.length}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2.5 overflow-hidden">
                <motion.div animate={{ width: stations.length > 0 ? `${(displayAssignments.length / stations.length) * 100}%` : '0%' }} transition={{ duration: 0.8 }}
                  className="bg-violet-600 h-1.5 rounded-full" />
              </div>
              <div className="flex justify-between mt-2.5 text-xs text-slate-500">
                <span>{stations.length - displayAssignments.length} unassigned</span>
                <span className="font-medium">{displayAssignments.length === stations.length ? 'Full coverage' : 'Partial'}</span>
              </div>
            </div>
          </div>

          <div className="metric-card accent-violet p-5 stagger-3">
            <div className="flex justify-between items-center text-xs font-medium text-slate-500">
              <span>Branches pruned</span>
              <span className="text-violet-600 font-semibold">B&B efficiency</span>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold tracking-tight text-slate-900 font-mono-nums">
                  {algoResult?.metaInfo?.branchesPruned ?? '—'}
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2.5 overflow-hidden">
                <div className="bg-violet-600 h-1.5 rounded-full" style={{ width: algoResult ? '80%' : '0%' }} />
              </div>
              <div className="flex justify-between mt-2.5 text-xs text-slate-500">
                <span>vs greedy: {algoResult && greedyResult ? `+${((algoResult.result.filter(a => a.fitScore === 10).length - greedyResult.result.filter(a => a.fitScore === 10).length))} better fits` : 'Run solver'}</span>
                <span className="font-medium text-violet-700">{algoResult ? algoResult.runtimeMs.toFixed(2) + 'ms' : '—'}</span>
              </div>
            </div>
          </div>

          <div className={clsx('metric-card p-5 stagger-4', hasResolvedVacancy || !deficitStation ? 'accent-emerald' : 'accent-rose')}>
            <div className="flex justify-between items-center text-xs font-medium">
              <span className={hasResolvedVacancy || !deficitStation ? 'text-emerald-700' : 'text-rose-700'}>Vacancy status</span>
              <span className={clsx('rounded-full px-2 py-0.5 text-[10px] font-semibold border',
                hasResolvedVacancy || !deficitStation
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                  : 'bg-rose-100 text-rose-800 border-rose-200 animate-pulse')}>
                {algoResult === null ? 'Pending' : hasResolvedVacancy || !deficitStation ? 'All filled' : 'Open vacancy'}
              </span>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold tracking-tight font-mono-nums">
                  {algoResult === null ? '—' : hasResolvedVacancy || !deficitStation ? '0' : stations.length - displayAssignments.filter(a => a.fitScore > 0).length}
                </span>
                {algoResult && <span className="text-sm font-medium opacity-70">vacancies</span>}
              </div>
              <div className="flex justify-between mt-4 text-xs">
                <span className="opacity-80">{deficitStation ? deficitStation.name.split('(')[0].trim() : 'All stations covered'}</span>
                {deficitStation && !hasResolvedVacancy && algoResult && (
                  <button type="button" onClick={handleResolveVacancy} className="font-semibold underline cursor-pointer hover:opacity-80">
                    Resolve →
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Station Cards Grid */}
        <div>
          <h2 className="text-sm font-bold text-slate-900 mb-3">Corporate Workstation Assignments</h2>
          {algoResult === null ? (
            <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center">
              <MapPin className="w-8 h-8 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-500">Run Branch & Bound to assign employees to stations</p>
              <p className="text-xs text-slate-400 mt-1">{stations.length} stations · {employees.length} employees available</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {stations.map(station => {
                const assignment = displayAssignments.find(a => a.stationId === station.id);
                const emp = assignment ? employeeById[assignment.employeeId] : null;
                const isPerfect = assignment?.fitScore === 10;
                const isPartial = assignment && assignment.fitScore > 0 && assignment.fitScore < 10;
                const isVacant = !assignment || assignment.fitScore === 0;
                return (
                  <div key={station.id} className={clsx(
                    'rounded-xl border p-4 bg-white transition-all depth-card',
                    isPerfect ? 'border-violet-200 shadow-xs' : isPartial ? 'border-amber-200' : isVacant ? 'border-rose-200 bg-rose-50/20' : 'border-slate-200'
                  )}>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{station.id}</div>
                        <div className="text-xs font-bold text-slate-900 mt-0.5 leading-snug">{station.name}</div>
                      </div>
                      <span className={clsx('rounded-full px-2 py-0.5 text-[10px] font-semibold border shrink-0 ml-2',
                        isPerfect ? 'bg-violet-100 text-violet-800 border-violet-200' :
                        isPartial ? 'bg-amber-100 text-amber-800 border-amber-200' :
                        'bg-rose-100 text-rose-700 border-rose-200')}>
                        {isPerfect ? '100% Fit' : isPartial ? '50% Fit' : 'Vacant'}
                      </span>
                    </div>
                    <div className="text-[11px] bg-slate-50 px-2 py-1 rounded text-slate-600 font-medium mb-3 border border-slate-100">
                      Req: {station.requiredSkill}
                    </div>
                    {emp ? (
                      <div className={clsx('rounded-lg p-2.5 border', isPerfect ? 'bg-violet-50/40 border-violet-100' : isPartial ? 'bg-amber-50/40 border-amber-100' : 'bg-rose-50/40 border-rose-100')}>
                        <div className="flex items-center gap-2">
                          <div className={clsx('w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold border shrink-0',
                            isPerfect ? 'bg-violet-100 text-violet-700 border-violet-200' : 'bg-amber-100 text-amber-700 border-amber-200')}>
                            {emp.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-slate-900">{emp.name}</div>
                            <div className="text-[11px] text-slate-500">{emp.role}</div>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {emp.skills.map(s => (
                            <span key={s} className={clsx('text-[9px] px-1.5 py-0.5 rounded font-medium border',
                              s === station.requiredSkill
                                ? 'bg-violet-100 text-violet-700 border-violet-200'
                                : 'bg-white text-slate-500 border-slate-200')}>
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-lg p-3 border border-dashed border-rose-300 bg-rose-50/30 text-center">
                        <AlertCircle className="w-4 h-4 text-rose-400 mx-auto mb-1" />
                        <div className="text-[11px] text-rose-600 font-medium">No qualified employee</div>
                      </div>
                    )}
                    <div className="text-[10px] text-slate-400 mt-2">{station.department}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* B&B vs Greedy comparison */}
        {algoResult && greedyResult && (
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-violet-600" />
              Algorithm Comparison: Branch & Bound vs Greedy
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg border border-violet-200 bg-violet-50/30">
                <div className="text-xs font-bold text-violet-700 mb-1">Branch & Bound (Optimal)</div>
                <div className="text-xs text-slate-600">Perfect fits: <span className="font-bold">{algoResult.result.filter(a => a.fitScore === 10).length}/{stations.length}</span></div>
                <div className="text-xs text-slate-600">Runtime: <span className="font-bold font-mono-nums">{algoResult.runtimeMs.toFixed(2)}ms</span></div>
                <div className="text-xs text-slate-600">Branches pruned: <span className="font-bold">{algoResult.metaInfo?.branchesPruned ?? 0}</span></div>
              </div>
              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50">
                <div className="text-xs font-bold text-slate-700 mb-1">Greedy (Approximate)</div>
                <div className="text-xs text-slate-600">Perfect fits: <span className="font-bold">{greedyResult.result.filter(a => a.fitScore === 10).length}/{stations.length}</span></div>
                <div className="text-xs text-slate-600">Runtime: <span className="font-bold font-mono-nums">{greedyResult.runtimeMs.toFixed(2)}ms</span></div>
                <div className="text-xs text-slate-600">Improvement by B&B: <span className="font-bold text-violet-700">+{algoResult.result.filter(a => a.fitScore === 10).length - greedyResult.result.filter(a => a.fitScore === 10).length} fits</span></div>
              </div>
            </div>
          </div>
        )}
      </div>
      <EvaluatorDrawer />
    </div>
  );
}
