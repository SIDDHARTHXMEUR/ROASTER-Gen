<div align="center">

# ⚡ ROASTER-Gen
### Enterprise Workforce Scheduler & Algorithm Evaluation Platform

[![Next.js](https://img.shields.io/badge/Next.js-14%2B%20App%20Router-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4.0-38bdf8?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Zustand](https://img.shields.io/badge/State-Zustand-764abc?style=for-the-badge)](https://github.com/pmndrs/zustand)
[![Supabase](https://img.shields.io/badge/Database-Supabase%20Postgres-3ecf8e?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![Build Status](https://img.shields.io/badge/Build-Passing-brightgreen?style=for-the-badge)]()

<br />

**RosterGen** is a full-stack, algorithm-driven employee shift generator and theoretical computer science evaluation suite. It pairs exact constraint solvers (**Backtracking + AC-3**, **0/1 Knapsack DP**, **Branch & Bound**) against fast greedy heuristics and stochastic simulations (**Monte Carlo Engine**) — accompanied by a live, microsecond-precision **Evaluator Mode Telemetry Drawer**.

[📖 Academic Report (HTML)](./PROJECT_REPORT_ROSTERGEN.html) • [📄 Academic Report (Markdown)](./PROJECT_REPORT_ROSTERGEN.md) • [🚀 Quickstart](#-quickstart) • [📊 Algorithm Benchmarks](#-algorithm-benchmark-matrix)

---

![RosterGen Enterprise Banner](./screenshots/rostergen_5_screenshots_combined.png)

</div>

---

## 🌟 Key Capabilities

- 🗓️ **Weekly Roster Engine (`/`)**: Constraint Backtracking with AC-3 Arc Consistency. Guarantees 100% shift coverage without hard-labor rule violations. Features 1-click **Standby Arbitration** for operational call-out resolution.
- 💰 **Budget & Overtime Planner (`/budget`)**: 0/1 Dynamic Programming Knapsack solver that maximizes priority output within strict financial caps ($\frac{1}{2}$-approximation bound greedy comparison).
- ⚙️ **Station Pod Matcher (`/stations`)**: Branch and Bound matrix solver matching personnel to physical workstation pods using optimistic upper-bounding state-space tree pruning.
- 🔍 **Personnel Directory Search (`/search`)**: Linear-time Knuth-Morris-Pratt (KMP) pattern search ($O(N+M)$ complexity) alongside Merge Sort ($O(N \log N)$) and Quick Sort telemetry.
- 📈 **Demand Surge Forecast (`/forecast`)**: Monte Carlo empirical risk engine executing 100 to 100,000 randomized Bernoulli trials to compute 95% Central Limit Theorem confidence intervals.
- ⚡ **Evaluator Mode Telemetry**: Real-time drawer measuring live execution latency in milliseconds via `performance.now()`, search branch pruning counts, and constraint check operations.

---

## 🏗️ Architecture & Stack

RosterGen is built on a decoupled, production-grade three-tier web architecture:

```mermaid
graph TB
    subgraph Client UI Tier (Next.js 14 App Router)
        UI1[Weekly Roster - /]
        UI2[Budget Planner - /budget]
        UI3[Station Matcher - /stations]
        UI4[Personnel Directory - /search]
        UI5[Demand Forecast - /forecast]
        ZUSTAND[Zustand Store - src/lib/store.ts]
        EVAL[Evaluator Telemetry Drawer]
    end

    subgraph Algorithm Engine Tier (src/lib/algorithms/)
        ALG1[Backtracking Solver with AC-3]
        ALG2[0/1 Knapsack DP Solver]
        ALG3[Branch & Bound Matcher]
        ALG4[KMP Substring Matcher]
        ALG5[Merge Sort & Quick Sort]
        ALG6[Monte Carlo Risk Engine]
    end

    subgraph Data & Persistence Tier (Supabase Postgres)
        DB1[(employees)]
        DB2[(shifts)]
        DB3[(stations)]
        DB4[(roster_assignments)]
        DB5[(swap_requests & overtime_requests)]
        AUTH[Supabase Auth & RLS Profiles]
    end

    UI1 --> ZUSTAND
    UI2 --> ZUSTAND
    UI3 --> ZUSTAND
    UI4 --> ZUSTAND
    UI5 --> ZUSTAND

    ZUSTAND <--> ALG1
    ZUSTAND <--> ALG2
    ZUSTAND <--> ALG3
    ZUSTAND <--> ALG4
    ZUSTAND <--> ALG5
    ZUSTAND <--> ALG6

    ZUSTAND --> EVAL

    ZUSTAND <--> DB1
    ZUSTAND <--> DB2
    ZUSTAND <--> DB3
    ZUSTAND <--> DB4
    ZUSTAND <--> DB5
    ZUSTAND <--> AUTH
```

---

## 📊 Algorithm Benchmark Matrix

| Module | Evaluated Algorithm | Baseline Algorithm | Worst-Case Time | Average-Case Time | Space Complexity | Optimality Guarantee |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Weekly Roster** | Backtracking (AC-3) | Greedy Fill | $O(M^N)$ | $O(V \cdot E \cdot d^3)$ | $O(N)$ | 100% Exact Constraint Satisfaction |
| **Overtime Budget** | 0/1 Knapsack DP | Greedy Density Ratio | $O(N \cdot W)$ | $O(N \cdot W)$ | $O(N \cdot W)$ | **Exact Globally Optimal** |
| **Station Matching**| Branch & Bound | Greedy Nearest-Fit | $O(M^N)$ | $O(B_{\text{pruned}})$ | $O(N)$ | **Exact Globally Optimal** |
| **Personnel Search**| Knuth-Morris-Pratt | Naive Substring | $O(N + M)$ | $O(N + M)$ | $O(M)$ | 100% Exact Linear Search |
| **Directory Sorting**| Merge Sort | Quick Sort | $O(N \log N)$ | $O(N \log N)$ | $O(N)$ | Stable $O(N \log N)$ Guaranteed |
| **Demand Forecast** | Monte Carlo Engine | Static Average | $O(N_{\text{trials}} \cdot S)$ | $O(N_{\text{trials}} \cdot S)$ | $O(S)$ | Empirical Convergence |

---

## 🧮 Theoretical Foundations

### 1. Strong NP-Hardness Proof ($X3C \to MRCSP$)
Shift scheduling under resource constraints is modeled as a Multi-Objective Mixed-Integer Binary Program (MIBP). We reduce from **Exact Cover by 3-Sets (X3C)** by mapping ground elements $u_j \in U$ to shifts needing 1 worker, and subsets $S_i \in F$ to candidate employee skill sets. Since X3C is strongly NP-Complete, **MRCSP is strongly NP-Hard** with an unpruned search space scaling as $O(M^N) \approx 10^{448}$ states.

### 2. Backtracking & AC-3 Arc Consistency (Mackworth 1977)
AC-3 maintains an arc consistency queue to prune variable candidate domains prior to recursive expansion:
$$D(X_i) \leftarrow \{ x \in D(X_i) \mid \exists y \in D(X_j) \text{ such that } (x, y) \text{ satisfies constraint } C_{ij} \}$$
Execution runs in $O(e \cdot d^3)$ time where $e = |C|$ arcs and $d = \max |D_i|$.

### 3. 0/1 Knapsack DP Recurrence & Approximation Bound
Computes state matrix $K[i, w] = \max\left(K[i-1, w], v_i + K[i-1, w - c_i]\right)$ in pseudo-polynomial $O(N \cdot W)$ time. The density ratio heuristic $r_i = v_i / c_i$ is proved to satisfy a $\frac{1}{2}$-approximation bound ($Z_{\text{greedy}} \ge \frac{1}{2} Z_{\text{opt}}$).

### 4. Monte Carlo Central Limit Theorem (CLT)
Simulates $N_{\text{trials}}$ independent Bernoulli call-out events ($p_{\text{callout}} = 0.15$). Applies CLT to calculate 95% confidence intervals:
$$\text{Margin of Error} = 1.96 \cdot \sqrt{\frac{p(1 - p)}{N_{\text{trials}}}} \approx \pm 0.70\% \quad (\text{for } 10,000 \text{ trials})$$

---

## 📸 Interactive Module Showcase

### 1. Weekly Shift Roster (`/`)
* **Algorithm**: Backtracking with AC-3 Arc Consistency.
* **Metrics**: $224 / 224$ shifts assigned ($100\%$ complete), $48.20 \text{ ms}$ execution latency, $1,420$ constraint check operations.
* **Features**: Swiss Bento timetable grid, clean middle dot (`·`) and en-dash (`–`) formatting, red-outlined standby slot for 1-click arbitration modal, and bottom Evaluator drawer.

![Weekly Roster](./screenshots/01_weekly_roster.png)

---

### 2. Budget & Overtime Planner (`/budget`)
* **Algorithm**: 0/1 Dynamic Programming Knapsack vs. Greedy Ratio.
* **Metrics**: ₹4,50,000 financial budget cap, $+72$ priority point optimality gap captured by DP over Greedy ratio.
* **Features**: Financial slider, approved overtime request ledger table, and DP optimality gap breakdown.

![Budget Planner](./screenshots/02_budget_planner.png)

---

### 3. Station Pod Matcher (`/stations`)
* **Algorithm**: Branch and Bound Bipartite Station Matcher.
* **Metrics**: 8 corporate workstation pods, $100\%$ skill fit rate, $77$ search tree branches pruned.
* **Features**: Station Trajectory line plot, worker assignment badges, and live branch pruning telemetry.

![Station Matching](./screenshots/03_station_matching.png)

---

### 4. Personnel Directory & Search (`/search`)
* **Algorithm**: Knuth-Morris-Pratt (KMP) Substring Matcher & Merge/Quick Sort.
* **Metrics**: $100$ corporate employees, $48$ matches found for query `"Kubernetes"` over $12,679$ character comparisons in $0.02 \text{ ms}$.
* **Features**: Live search query bar, sorting algorithm toggles, and employee profile cards.

![Personnel Search](./screenshots/04_personnel_search.png)

---

### 5. Demand Surge Forecast (`/forecast`)
* **Algorithm**: Monte Carlo Empirical Stochastic Engine.
* **Metrics**: $10,000$ simulation trials converged in $85.0 \text{ ms}$ at $15\%$ call-out rate.
* **Features**: Interactive Gaussian probability distribution histogram with hover tooltips and Standby Protocol authorization button.

![Demand Forecast](./screenshots/05_demand_forecast.png)

---

## 🚀 Quickstart

### Prerequisites
- **Node.js**: `v18.0.0` or higher
- **npm** or **pnpm** package manager

### 1. Clone & Install
```bash
git clone https://github.com/SIDDHARTHXMEUR/ROASTER-Gen.git
cd ROASTER-Gen
npm install
```

### 2. Environment Setup (Optional)
Create `.env.local` for Supabase persistence integration:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Launch Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your web browser.

### 4. Production Build & Verification
```bash
npx tsc --noEmit
npm run build
```

---

## 🗄️ Database Schema & Relational Model

```sql
-- Employees Registry
CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    department TEXT NOT NULL,
    hourly_wage NUMERIC NOT NULL,
    max_weekly_hours INT NOT NULL DEFAULT 40,
    skills TEXT[] NOT NULL,
    availability JSONB NOT NULL
);

-- Roster Shift Assignments
CREATE TABLE roster_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shift_id UUID REFERENCES shifts(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Row Level Security (RLS) Roles**:
- `Manager`: Read & write access to shift schedules and standby arbitrations.
- `Evaluator`: Read access to internal algorithm state variables and execution telemetry logs.
- `Employee`: Read-only access to assigned personal shifts and swap requests.

---

## 📂 Repository File Structure

```
ROASTER-Gen/
├── screenshots/
│   ├── 01_weekly_roster.png
│   ├── 02_budget_planner.png
│   ├── 03_station_matching.png
│   ├── 04_personnel_search.png
│   ├── 05_demand_forecast.png
│   └── rostergen_5_screenshots_combined.png
├── src/
│   ├── app/
│   │   ├── page.tsx            # Weekly Shift Roster (Backtracking + AC-3)
│   │   ├── budget/page.tsx     # Budget Planner (0/1 Knapsack DP)
│   │   ├── stations/page.tsx   # Station Matcher (Branch & Bound)
│   │   ├── search/page.tsx     # Personnel Search (KMP & Sorting)
│   │   └── forecast/page.tsx   # Demand Forecast (Monte Carlo Engine)
│   ├── lib/
│   │   ├── store.ts            # Zustand Global App Store
│   │   ├── seed.ts             # 100-Employee Data Seed Script
│   │   └── algorithms/         # Pure TypeScript Algorithm Implementations
│   │       ├── backtracking.ts
│   │       ├── knapsack.ts
│   │       ├── branchAndBound.ts
│   │       ├── kmp.ts
│   │       ├── sorting.ts
│   │       └── monteCarlo.ts
├── PROJECT_REPORT_ROSTERGEN.md # Full Academic Project Report (Markdown)
├── PROJECT_REPORT_ROSTERGEN.html# Printable Publication-Grade Academic HTML Report
└── README.md                   # Repository Master Documentation
```

---

## 📖 Academic References

1. **Cormen, T. H., Leiserson, C. E., Rivest, R. L., & Stein, C. (2009)**. *Introduction to Algorithms* (3rd ed.). MIT Press.
2. **Garey, M. R., & Johnson, D. S. (1979)**. *Computers and Intractability: A Guide to the Theory of NP-Completeness*. W. H. Freeman.
3. **Mackworth, A. K. (1977)**. Consistency in networks of relations. *Artificial Intelligence*, 8(1), 99-118.
4. **Martello, S., & Toth, P. (1990)**. *Knapsack Problems: Algorithms and Computer Implementations*. John Wiley & Sons.
5. **Knuth, D. E., Morris, J. H., & Pratt, V. R. (1977)**. Fast pattern matching in strings. *SIAM Journal on Computing*, 6(2), 323-350.
6. **Metropolis, N., & Ulam, S. (1949)**. The Monte Carlo method. *Journal of the American Statistical Association*, 44(247), 335-341.

---

<div align="center">

**RosterGen — Production-Grade Enterprise Workforce & Algorithm Evaluation System**  
Designed & Built by **Siddharth**

</div>
