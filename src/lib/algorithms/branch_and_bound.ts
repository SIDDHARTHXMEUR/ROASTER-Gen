import { Employee, Station, AlgorithmResult } from '../types';

export interface StationAssignment {
  stationId: string;
  employeeId: string;
  fitScore: number;
}

/**
 * Branch and Bound for Station Assignment.
 * Minimizes cost (or maximizes fit score). We'll maximize total fit score.
 * Fit score logic:
 * - 10 if employee has required skill.
 * - 0 otherwise.
 */
export function assignStationsBranchAndBound(employees: Employee[], stations: Station[]): AlgorithmResult<StationAssignment[]> {
  const start = performance.now();
  
  let bestScore = -1;
  let bestAssignments: StationAssignment[] = [];
  let branchesPruned = 0;
  
  // Ensure we don't explore unnecessarily deep trees by capping search if we have too many employees
  const availableEmployees = employees.slice(0, 15); // taking a subset for performance
  
  function getFitScore(emp: Employee, station: Station): number {
    return emp.skills.includes(station.requiredSkill) ? 10 : 0;
  }
  
  function bound(stationIdx: number, currentScore: number): number {
    // max possible future score is if everyone else gets a perfect 10
    const remaining = stations.length - stationIdx;
    return currentScore + remaining * 10;
  }
  
  const usedEmployees = new Set<string>();
  const currentAssigments: StationAssignment[] = [];

  function bb(stationIdx: number, currentScore: number) {
    if (stationIdx === stations.length) {
      if (currentScore > bestScore) {
        bestScore = currentScore;
        bestAssignments = [...currentAssigments];
      }
      return;
    }
    
    // Prune
    if (bound(stationIdx, currentScore) <= bestScore) {
      branchesPruned++;
      return;
    }
    
    const station = stations[stationIdx];
    
    // Sort employees to explore better fits first (heuristic)
    const sortedAvailable = availableEmployees
        .filter(e => !usedEmployees.has(e.id))
        .sort((a, b) => getFitScore(b, station) - getFitScore(a, station));

    for (const emp of sortedAvailable) {
      const score = getFitScore(emp, station);
      usedEmployees.add(emp.id);
      currentAssigments.push({ stationId: station.id, employeeId: emp.id, fitScore: score });
      
      bb(stationIdx + 1, currentScore + score);
      
      usedEmployees.delete(emp.id);
      currentAssigments.pop();
    }
  }

  bb(0, 0);

  return {
    result: bestAssignments,
    runtimeMs: performance.now() - start,
    metaInfo: { branchesPruned, maxScorePossible: stations.length * 10, achievedScore: bestScore }
  };
}

export function assignStationsGreedy(employees: Employee[], stations: Station[]): AlgorithmResult<StationAssignment[]> {
    const start = performance.now();
    const result: StationAssignment[] = [];
    const used = new Set<string>();
    let totalScore = 0;

    for (const station of stations) {
        let bestEmp = null;
        let bestScore = -1;
        
        for (const emp of employees) {
            if (!used.has(emp.id)) {
                const score = emp.skills.includes(station.requiredSkill) ? 10 : 0;
                if (score > bestScore) {
                    bestScore = score;
                    bestEmp = emp;
                }
            }
        }
        
        if (bestEmp) {
            used.add(bestEmp.id);
            totalScore += bestScore;
            result.push({ stationId: station.id, employeeId: bestEmp.id, fitScore: bestScore });
        }
    }

    return {
        result,
        runtimeMs: performance.now() - start,
        metaInfo: { achievedScore: totalScore }
    };
}
