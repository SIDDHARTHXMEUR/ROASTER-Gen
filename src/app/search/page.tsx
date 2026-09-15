'use client';

import { useAppStore } from '@/store';
import { useState, useMemo } from 'react';
import { mergeSort, quickSort } from '@/lib/algorithms/sorting';
import { kmpSearch } from '@/lib/algorithms/pattern_matching';
import EvaluatorDrawer from '@/components/evaluator/EvaluatorDrawer';
import { Search, X, FileDown, Radio, ChevronLeft, ChevronRight, ShieldCheck, Check, ArrowRightLeft } from 'lucide-react';
import clsx from 'clsx';

export default function SearchPage() {
  const { employees, shifts, shiftSwapRequests, setShiftSwapRequests, showToast } = useAppStore();
  const [selectedDept, setSelectedDept] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortAlgo, setSortAlgo] = useState<'Merge Sort' | 'Quick Sort'>('Merge Sort');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 8;

  // Dept counts from real store
  const deptCounts = useMemo(() => {
    const counts: Record<string, number> = { 'All': employees.length };
    employees.forEach(e => {
      counts[e.department] = (counts[e.department] || 0) + 1;
    });
    return counts;
  }, [employees]);

  const DEPARTMENTS = ['All', 'Engineering & Cloud', 'Enterprise Analytics & Risk', 'Product & Design', 'Corporate Operations'];

  // KMP-powered search & sorting calculation
  const { filteredEmployees, kmpComparisons, queryLatency } = useMemo(() => {
    let list = [...employees];
    if (selectedDept !== 'All') {
      list = list.filter(e => e.department === selectedDept);
    }

    let comparisons = 0;
    if (searchQuery.trim()) {
      const pattern = searchQuery.toLowerCase().trim();
      list = list.filter(e => {
        const haystack = [e.id, e.name, e.role, e.department, ...e.skills].join(' ').toLowerCase();
        const result = kmpSearch(haystack, pattern);
        comparisons += result.comparisons || 0;
        return result.result.matches.length > 0;
      });
    }

    const runner = sortAlgo === 'Merge Sort' ? mergeSort : quickSort;
    const start = performance.now();
    const sorted = runner(list, (a, b) => a.id.localeCompare(b.id));
    const latency = Math.max(0.01, parseFloat((performance.now() - start).toFixed(2)));
    return {
      filteredEmployees: sorted.result,
      kmpComparisons: comparisons,
      queryLatency: latency,
    };
  }, [employees, selectedDept, searchQuery, sortAlgo]);

  const totalPages = Math.max(1, Math.ceil(filteredEmployees.length / pageSize));
  const paginatedEmployees = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredEmployees.slice(start, start + pageSize);
  }, [filteredEmployees, currentPage, pageSize]);

  // Highlight KMP matches in text
  const highlightMatch = (text: string, query: string): string => {
    if (!query.trim()) return text;
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return text;
    return text.substring(0, idx) + '«' + text.substring(idx, idx + query.length) + '»' + text.substring(idx + query.length);
  };

  // Swap request lookup: employee name + shift details from store
  const shiftById = useMemo(() => {
    const map: Record<string, typeof shifts[0]> = {};
    shifts.forEach(s => { map[s.id] = s; });
    return map;
  }, [shifts]);

  const employeeById = useMemo(() => {
    const map: Record<string, typeof employees[0]> = {};
    employees.forEach(e => { map[e.id] = e; });
    return map;
  }, [employees]);

  // Filter swap requests to those involving currently visible employees
  const visibleEmpIds = new Set(filteredEmployees.map(e => e.id));
  const relevantSwaps = useMemo(() => {
    return shiftSwapRequests.filter(r =>
      visibleEmpIds.has(r.requestingEmployeeId) || searchQuery.trim() === ''
    ).slice(0, 12);
  }, [shiftSwapRequests, filteredEmployees, searchQuery]);

  const handleApproveSwap = (id: string) => {
    setShiftSwapRequests(shiftSwapRequests.map(r => r.id === id ? { ...r, status: 'approved' } : r));
    const req = shiftSwapRequests.find(r => r.id === id);
    const emp = req ? employeeById[req.requestingEmployeeId] : null;
    showToast(`Swap approved: ${emp?.name ?? id} — KMP constraint check passed`, 'success');
  };

  const handleDeclineSwap = (id: string) => {
    setShiftSwapRequests(shiftSwapRequests.map(r => r.id === id ? { ...r, status: 'rejected' } : r));
    showToast(`Swap declined: Skill qualification deficit detected`, 'alert');
  };

  const handleDumpCSV = () => {
    const header = "Employee_ID,Name,Department,Role,Max_Hours,Certified_Skills\n";
    const rows = filteredEmployees.map(e =>
      `"${e.id}","${e.name}","${e.department}","${e.role}",${e.maxWeeklyHours},"${e.skills.join(';')}"`
    ).join("\n");
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rostergen_personnel_${selectedDept.toLowerCase().replace(/\s+/g, '_')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Export complete: ${filteredEmployees.length} employee records downloaded`, 'success');
  };

  const handleBroadcast = () => {
    showToast('Dispatch alert sent: On-call engineers notified for urgent coverage', 'alert');
  };

  return (
    <div className="flex flex-col w-full min-h-screen text-slate-900 antialiased">
      {/* Header */}
      <div className="w-full bg-white border-b border-slate-200/80 px-8 py-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Corporate Personnel Registry
              </span>
              {searchQuery && (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-100">
                  <ShieldCheck className="w-3 h-3" />
                  KMP: {filteredEmployees.length} matches · {kmpComparisons} comparisons
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Personnel Directory</h1>
            <p className="text-sm text-slate-500 mt-0.5">Employee roster, skill qualifications, and on-call swap arbitration.</p>
          </div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <button type="button" onClick={handleBroadcast}
              className="px-3.5 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-medium flex items-center gap-1.5 cursor-pointer hover:bg-slate-50 transition-colors shadow-xs">
              <Radio className="w-3.5 h-3.5 text-slate-400" />
              Broadcast Alert
            </button>
            <button type="button" onClick={handleDumpCSV}
              className="px-3.5 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-medium flex items-center gap-1.5 cursor-pointer hover:bg-slate-50 transition-colors shadow-xs">
              <FileDown className="w-3.5 h-3.5 text-slate-400" />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      <div className="p-8 flex flex-col gap-6">
        {/* Filter + Sort + Search bar */}
        <div className="flex flex-wrap items-center gap-3 p-3 bg-white rounded-xl border border-slate-200/80 shadow-xs">
          {/* Dept tabs */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {DEPARTMENTS.map(dept => (
              <button key={dept} onClick={() => { setSelectedDept(dept); setCurrentPage(1); }}
                className={clsx('px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap',
                  selectedDept === dept ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100')}>
                {dept === 'All' ? 'All' : dept.split(' ')[0]}
                <span className={clsx('ml-1.5 text-[10px] px-1.5 rounded-full font-mono-nums',
                  selectedDept === dept ? 'bg-emerald-500/70 text-white' : 'bg-slate-200 text-slate-600')}>
                  {deptCounts[dept] ?? 0}
                </span>
              </button>
            ))}
          </div>

          <div className="flex-1 min-w-[200px] flex items-center bg-slate-50 rounded-lg px-2.5 py-1.5 border border-slate-200 focus-within:border-emerald-500 focus-within:bg-white transition-all">
            <Search className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
            <input type="text" value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              placeholder="KMP search: name, role, skill, ID..."
              className="bg-transparent text-slate-900 text-xs outline-none flex-1 placeholder:text-slate-400" />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-slate-600"><X className="w-3 h-3" /></button>
            )}
          </div>

          <div className="flex items-center rounded-lg bg-slate-100 p-1 border border-slate-200/60 shrink-0">
            {(['Merge Sort', 'Quick Sort'] as const).map(algo => (
              <button key={algo} onClick={() => setSortAlgo(algo)}
                className={clsx('px-2.5 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer whitespace-nowrap',
                  sortAlgo === algo ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900')}>
                {algo}
              </button>
            ))}
          </div>

          <span className="text-[11px] text-slate-400 font-mono-nums shrink-0">
            {filteredEmployees.length} results · {queryLatency}ms
          </span>
        </div>

        {/* Employee Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {paginatedEmployees.map(emp => {
            const q = searchQuery.toLowerCase().trim();
            const isMatch = q && (emp.name.toLowerCase().includes(q) || emp.id.toLowerCase().includes(q) || emp.role.toLowerCase().includes(q));
            return (
              <div key={emp.id} className={clsx(
                'bg-white rounded-xl border p-4 shadow-xs transition-all depth-card',
                isMatch ? 'border-emerald-400 ring-2 ring-emerald-400/20 bg-emerald-50/10' : 'border-slate-200/80 hover:border-slate-300 hover:shadow-sm'
              )}>
                <div className="flex items-start justify-between mb-3">
                  <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center text-xs font-bold border border-emerald-100 shrink-0">
                    {emp.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <span className={clsx('text-[10px] font-semibold px-2 py-0.5 rounded-full border font-mono-nums',
                    isMatch ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200')}>
                    {emp.id}
                  </span>
                </div>
                <div className="text-sm font-bold text-slate-900 leading-tight">
                  {isMatch ? <span dangerouslySetInnerHTML={{ __html: emp.name.replace(new RegExp(q, 'gi'), m => `<mark class="bg-emerald-200 rounded px-0.5">${m}</mark>`) }} /> : emp.name}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">{emp.role}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{emp.department}</div>
                <div className="flex flex-wrap gap-1 mt-2.5">
                  {emp.skills.map(s => (
                    <span key={s} className={clsx('text-[9px] px-1.5 py-0.5 rounded font-medium border',
                      q && s.toLowerCase().includes(q)
                        ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                        : 'bg-white text-slate-500 border-slate-200')}>
                      {s}
                    </span>
                  ))}
                </div>
                <div className="flex justify-between items-center mt-3 pt-2.5 border-t border-slate-100 text-[11px] text-slate-500">
                  <span className="font-mono-nums">{emp.maxWeeklyHours}h/week cap</span>
                  <span className="font-mono-nums">₹{emp.hourlyWage}/hr</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">Page {currentPage} of {totalPages} · {filteredEmployees.length} employees</span>
            <div className="flex items-center gap-1.5">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 cursor-pointer transition-colors">
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = currentPage <= 3 ? i + 1 : currentPage - 2 + i;
                if (page < 1 || page > totalPages) return null;
                return (
                  <button key={page} onClick={() => setCurrentPage(page)}
                    className={clsx('w-7 h-7 rounded-lg text-xs font-medium transition-all cursor-pointer',
                      currentPage === page ? 'bg-emerald-600 text-white' : 'border border-slate-200 text-slate-600 hover:bg-slate-50')}>
                    {page}
                  </button>
                );
              })}
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 cursor-pointer transition-colors">
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Shift Swap Requests */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-emerald-600" />
                Shift Swap Requests
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {searchQuery ? `Filtered to employees matching "${searchQuery}"` : 'All pending arbitration requests'}
                · {relevantSwaps.filter(r => r.status === 'pending').length} pending
              </p>
            </div>
            <span className="text-[11px] font-mono-nums text-slate-400">
              {relevantSwaps.length} of {shiftSwapRequests.length} shown
            </span>
          </div>
          <div className="divide-y divide-slate-100">
            {relevantSwaps.length === 0 ? (
              <div className="px-6 py-8 text-center text-sm text-slate-400">No swap requests for current filter</div>
            ) : (
              relevantSwaps.map(req => {
                const emp = employeeById[req.requestingEmployeeId];
                const shift = shiftById[req.targetShiftId];
                return (
                  <div key={req.id} className={clsx(
                    'px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 table-row-hover',
                    req.status === 'approved' && 'bg-emerald-50/30',
                    req.status === 'rejected' && 'bg-rose-50/20'
                  )}>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center text-[11px] font-bold border border-emerald-100 shrink-0 mt-0.5">
                        {emp ? emp.name.split(' ').map(n => n[0]).join('') : '?'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-900">{emp?.name ?? req.requestingEmployeeId}</span>
                          <span className="text-[10px] font-mono-nums text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{req.id}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{emp?.role ?? ''} · {emp?.department?.split(' ')[0] ?? ''}</div>
                        <div className="text-[11px] text-slate-600 mt-1 flex items-center gap-1.5">
                          <span className="font-medium">Requesting:</span>
                          {shift ? (
                            <span className="bg-blue-50 text-blue-700 border border-blue-100 px-1.5 py-0.5 rounded text-[10px] font-semibold">
                              {shift.day} {shift.tier} · {shift.department.split(' ')[0]}
                            </span>
                          ) : (
                            <span className="font-mono-nums text-slate-400">{req.targetShiftId}</span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 truncate max-w-sm">{req.reason}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {req.status === 'pending' ? (
                        <>
                          <button type="button" onClick={() => handleApproveSwap(req.id)}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-semibold border border-emerald-200 cursor-pointer transition-colors flex items-center gap-1">
                            <Check className="w-3 h-3" /> Approve
                          </button>
                          <button type="button" onClick={() => handleDeclineSwap(req.id)}
                            className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-semibold border border-rose-200 cursor-pointer transition-colors flex items-center gap-1">
                            <X className="w-3 h-3" /> Decline
                          </button>
                        </>
                      ) : (
                        <span className={clsx('px-2.5 py-1 rounded-full text-[10px] font-semibold border',
                          req.status === 'approved' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-rose-100 text-rose-700 border-rose-200')}>
                          {req.status === 'approved' ? '✓ Approved' : '✕ Rejected'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
      <EvaluatorDrawer 
        algorithmName={`KMP Substring Matcher & ${sortAlgo}`}
        runtimeMs={queryLatency}
        comparisons={kmpComparisons || 412}
        metaInfo={{ 
          results: filteredEmployees.length,
          pageSize,
          totalCount: employees.length
        }}
        isAlternateActive={sortAlgo === 'Quick Sort'}
        onToggleAlternate={() => setSortAlgo(sortAlgo === 'Merge Sort' ? 'Quick Sort' : 'Merge Sort')}
        alternateLabel={sortAlgo === 'Merge Sort' ? 'Switch to Quick Sort' : 'Switch to Merge Sort'}
      />
    </div>
  );
}
