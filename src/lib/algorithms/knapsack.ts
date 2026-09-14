import { OvertimeRequest, AlgorithmResult } from '../types';

/**
 * 0/1 Knapsack using Dynamic Programming for the Budget Planner.
 * Maximizes total priority score within a given budget cap.
 */
export function approveOvertimeKnapsack(requests: OvertimeRequest[], budgetCap: number): AlgorithmResult<OvertimeRequest[]> {
  const start = performance.now();
  
  const n = requests.length;
  // DP table: dp[i][w] is max value with first i items and budget w
  // Since budget can be large, this might be slow if we iterate up to full budget by 1.
  // For a web app, let's assume we can scale down or just run it. (Cost in whole numbers).
  
  // dp matrix: rows = 2 (space optimized), cols = budgetCap + 1
  let dp = new Array(budgetCap + 1).fill(0);
  let keep = Array.from({ length: n }, () => new Array(budgetCap + 1).fill(false));
  
  for (let i = 0; i < n; i++) {
    const cost = Math.floor(requests[i].cost);
    const value = requests[i].priorityScore;
    const nextDp = [...dp];
    
    for (let w = cost; w <= budgetCap; w++) {
      if (dp[w - cost] + value > dp[w]) {
        nextDp[w] = dp[w - cost] + value;
        keep[i][w] = true;
      }
    }
    dp = nextDp;
  }
  
  // Backtrack to find chosen items
  let w = budgetCap;
  const chosen = new Set<string>();
  for (let i = n - 1; i >= 0; i--) {
    if (keep[i][w]) {
      chosen.add(requests[i].id);
      w -= Math.floor(requests[i].cost);
    }
  }
  
  const result = requests.map(req => ({
    ...req,
    approved: chosen.has(req.id)
  }));
  
  return {
    result,
    runtimeMs: performance.now() - start
  };
}
