import { AlgorithmResult } from '../types';

export interface MonteCarloResult {
  probabilities: { shiftId: string, riskProbability: number }[];
  historyPoints: { trials: number, probabilities: number[] }[];
  overallShortfallProbability: number;
  totalExpectedDemand: number;
  maxExpectedShortfall: number;
}

/**
 * Monte Carlo Simulation to estimate understaffing probability.
 * Simulates random employee call-outs based on a base probability (e.g. 10%).
 * 
 * @param shiftAssignments A map of shiftId -> number of assigned employees
 * @param requiredHeadcounts A map of shiftId -> required headcount
 * @param N The number of trials (default 1000)
 */
export function simulateDemandMonteCarlo(
  shiftAssignments: Record<string, number>,
  requiredHeadcounts: Record<string, number>,
  N: number = 1000
): AlgorithmResult<MonteCarloResult> {
  const start = performance.now();
  
  const shiftIds = Object.keys(requiredHeadcounts);
  const understaffedCount: Record<string, number> = {};
  shiftIds.forEach(id => understaffedCount[id] = 0);
  
  const callOutProbability = 0.15; // 15% chance an employee calls out
  
  const historyPoints: { trials: number, probabilities: number[] }[] = [];
  
  for (let i = 1; i <= N; i++) {
    for (const shiftId of shiftIds) {
      const assigned = shiftAssignments[shiftId] || 0;
      const required = requiredHeadcounts[shiftId];
      
      let present = 0;
      for (let e = 0; e < assigned; e++) {
        if (Math.random() > callOutProbability) {
          present++;
        }
      }
      
      if (present < required) {
        understaffedCount[shiftId]++;
      }
    }
    
    // Save history point every N/10 trials or at N to animate convergence
    if (i % Math.max(1, Math.floor(N / 10)) === 0 || i === N) {
      const probabilities = shiftIds.map(id => understaffedCount[id] / i);
      historyPoints.push({ trials: i, probabilities });
    }
  }
  
  const probabilities = shiftIds.map(shiftId => ({
    shiftId,
    riskProbability: understaffedCount[shiftId] / N
  }));
  
  const overallShortfallProbability = probabilities.reduce((sum, p) => sum + p.riskProbability, 0) / probabilities.length;
  const totalExpectedDemand = Object.values(requiredHeadcounts).reduce((sum, val) => sum + val, 0);
  const maxExpectedShortfall = Math.max(...shiftIds.map(id => Math.max(0, requiredHeadcounts[id] - (shiftAssignments[id] || 0))));

  return {
    result: { 
      probabilities, 
      historyPoints, 
      overallShortfallProbability, 
      totalExpectedDemand, 
      maxExpectedShortfall 
    },
    runtimeMs: performance.now() - start,
    metaInfo: { trials: N }
  };
}
