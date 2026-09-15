'use client';

import { useAppStore } from '@/store';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, Zap, Activity, GitCompare, Sparkles, X } from 'lucide-react';
import { ReactNode } from 'react';
import clsx from 'clsx';

interface EvaluatorDrawerProps {
  algorithmName?: string;
  runtimeMs?: number;
  comparisons?: number;
  metaInfo?: Record<string, number>;
  isAlternateActive?: boolean;
  onToggleAlternate?: () => void;
  alternateLabel?: string;
  customControls?: ReactNode;
}

export default function EvaluatorDrawer({
  algorithmName,
  runtimeMs = 48.2,
  comparisons = 1420,
  metaInfo,
  isAlternateActive = false,
  onToggleAlternate,
  alternateLabel = 'Naive Comparison',
  customControls
}: EvaluatorDrawerProps) {
  const { role, isEvaluatorDrawerOpen, setEvaluatorDrawerOpen, isSidebarOpen } = useAppStore();
  const pathname = usePathname();

  // Compute default active algorithm description from pathname if not explicitly passed
  const currentAlgo = algorithmName || (
    pathname === '/' ? 'Constraint Backtracking with AC-3' :
    pathname === '/budget' ? '0/1 Dynamic Programming Knapsack' :
    pathname === '/stations' ? 'Branch & Bound Bipartite Matcher' :
    pathname === '/search' ? 'Knuth-Morris-Pratt (KMP) Substring Matcher' :
    pathname === '/forecast' ? 'Monte Carlo Empirical Stochastic Engine' :
    'AOA Algorithmic Solver'
  );

  const isVisible = role === 'Evaluator' || isEvaluatorDrawerOpen;

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className={clsx(
          "fixed bottom-0 right-0 z-50 px-4 md:px-8 pb-4 pointer-events-none transition-all duration-300 ease-in-out",
          isSidebarOpen ? "left-0 md:left-72" : "left-0"
        )}
      >
        <div className="pointer-events-auto max-w-[1300px] mx-auto rounded-none bg-white/95 backdrop-blur-xl border border-[#c3c6d5]/80 shadow-[0_16px_36px_-8px_rgba(17,17,17,0.18)] overflow-hidden">
          {/* Top Swiss Accent Hairline */}
          <div className="h-[2px] w-full bg-[#bb0400]" />

          <div className="px-5 py-3 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            {/* Algorithm Info & Live Runtime */}
            <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#111111] text-white flex items-center justify-center shrink-0">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold tracking-wider text-[#E30613] uppercase bg-[#E30613]/10 px-1.5 py-0.5 rounded">
                      AOA EVALUATOR TELEMETRY
                    </span>
                    <span className="text-[10px] text-[#888888] font-mono">Live Deterministic</span>
                  </div>
                  <h4 className="text-xs font-bold text-[#111111] tracking-tight font-sans">
                    {currentAlgo}
                  </h4>
                </div>
              </div>

              <div className="hidden sm:block h-6 w-px bg-[rgba(17,17,17,0.15)]" />

              {/* Execution Latency & Metrics */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-white px-2.5 py-1 rounded-md border border-[rgba(17,17,17,0.12)]">
                  <Zap className="w-3.5 h-3.5 text-[#0047AB]" />
                  <span className="text-xs font-mono font-bold text-[#111111]">
                    {runtimeMs.toFixed(2)} ms
                  </span>
                  <span className="text-[10px] text-[#888888] font-mono">latency</span>
                </div>

                <div className="flex items-center gap-2 bg-white px-2.5 py-1 rounded-md border border-[rgba(17,17,17,0.12)]">
                  <Activity className="w-3.5 h-3.5 text-[#007A3D]" />
                  <span className="text-xs font-mono font-bold text-[#111111]">
                    {comparisons.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-[#888888] font-mono">ops</span>
                </div>
              </div>

              {metaInfo && Object.keys(metaInfo).length > 0 && (
                <div className="hidden lg:flex items-center gap-3">
                  <div className="h-6 w-px bg-[rgba(17,17,17,0.15)]" />
                  {Object.entries(metaInfo).map(([key, val]) => (
                    <div key={key} className="flex flex-col">
                      <span className="text-[9px] uppercase text-[#888888] font-mono">{key}</span>
                      <span className="text-xs font-mono font-bold text-[#111111]">{val}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Heuristic Comparison & Toggle / Dismiss */}
            <div className="flex items-center justify-between md:justify-end gap-3">
              {customControls}

              {onToggleAlternate && (
                <div className="flex items-center gap-2 bg-white p-1 px-2.5 rounded-lg border border-[rgba(17,17,17,0.12)]">
                  <span className="text-[11px] text-[#555555] font-mono font-semibold">
                    {alternateLabel}
                  </span>
                  <button
                    type="button"
                    onClick={onToggleAlternate}
                    className={clsx(
                      "relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out",
                      isAlternateActive ? "bg-[#E30613]" : "bg-[#EDECE8]"
                    )}
                  >
                    <span
                      className={clsx(
                        "pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out mt-0.5",
                        isAlternateActive ? "translate-x-3.5" : "translate-x-0.5"
                      )}
                    />
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={() => setEvaluatorDrawerOpen(false)}
                className="p-1 rounded-md hover:bg-[#EDECE8] text-[#555555] hover:text-[#111111] transition-colors cursor-pointer"
                title="Dismiss Drawer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
