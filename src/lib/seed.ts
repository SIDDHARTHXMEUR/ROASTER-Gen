import { Employee, Shift, Station, OvertimeRequest, ShiftSwapRequest } from './types';

// Deterministic PRNG (Linear Congruential Generator)
class PRNG {
  private seed: number;
  constructor(seed: number) {
    this.seed = seed;
  }
  
  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }
  
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
  
  choice<T>(array: T[]): T {
    return array[this.nextInt(0, array.length - 1)];
  }
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const TIERS = ['Morning', 'Day', 'Evening', 'Night'] as const;
const DEPARTMENTS = [
  'Engineering & Cloud',
  'Enterprise Analytics & Risk',
  'Product & Design',
  'Corporate Operations'
];

const ROLES_BY_DEPT: Record<string, string[]> = {
  'Engineering & Cloud': [
    'Principal Architect', 'Staff Cloud Engineer', 'Lead SRE Specialist',
    'Senior Backend Engineer', 'DevOps Infrastructure Engineer', 'Kubernetes Systems Lead'
  ],
  'Enterprise Analytics & Risk': [
    'Lead Risk Analyst', 'Senior Data Scientist', 'Statutory Audit Lead',
    'Enterprise Threat Analyst', 'PostgreSQL DBA Lead'
  ],
  'Product & Design': [
    'Product Operations Lead', 'UX Infrastructure Strategist', 'Technical Product Manager',
    'Release Train Manager'
  ],
  'Corporate Operations': [
    'SOC Incident Lead', 'FinOps Program Manager', 'Corporate Ops Specialist',
    'Compliance Director'
  ]
};

const SKILLS = [
  'Kubernetes CKA',
  'AWS Cloud Arch',
  'Go / Rust Systems',
  'SOC-2 Compliance',
  'Incident Triage',
  'Data Pipelines',
  'Threat Modeling',
  'PostgreSQL DBA',
  'FinOps / APM'
];

const FIRST_NAMES = [
  'Aarav', 'Vikram', 'Neha', 'Priya', 'Aditya', 'Rohan', 'Ananya', 'Rahul', 'Kavita',
  'Arjun', 'Siddharth', 'Meera', 'Rishi', 'Sneha', 'Tanvi', 'Dev', 'Ishaan', 'Tara',
  'Rajesh', 'Pooja', 'Sanjay', 'Kiran', 'Deepak', 'Anita', 'Sunil', 'Divya', 'Varun',
  'Marcus', 'Elena', 'Chloe', 'David', 'Sarah', 'Liam', 'Amina', 'Alexander', 'Sophia'
];

const LAST_NAMES = [
  'Sharma', 'Verma', 'Mehta', 'Nair', 'Iyer', 'Patel', 'Kapoor', 'Malhotra', 'Chawla',
  'Reddy', 'Roy', 'Joshi', 'Bose', 'Gupta', 'Deshmukh', 'Rao', 'Singhania', 'Chopra',
  'Vance', 'Rossi', 'Chen', 'Bennett', 'Kowalski', 'O\'Connor'
];

const SWAP_REASONS = [
  "Major enterprise client deployment sync conflict",
  "Cross-region latency mitigation on-call rotation overlap",
  "Board executive presentation & architecture review",
  "Statutory SOC-2 compliance external audit interview",
  "Conflicting production distributed database migration window",
  "Attending Global Cloud Architecture summit",
  "Sprint release train overlap with EMEA operations",
  "Urgent family leave / personal day",
  "Scheduled doctor consultation during overlap hours",
  "Double booked critical incident post-mortem arbitration"
];

export function generateDataset(seed: number = 42) {
  const rng = new PRNG(seed);
  
  const employees: Employee[] = [];
  const shifts: Shift[] = [];
  const stations: Station[] = [];
  const overtimeRequests: OvertimeRequest[] = [];
  const shiftSwapRequests: ShiftSwapRequest[] = [];

  // 1. Generate Corporate Employees (100 engineers with broad availability to ensure 100% shift coverage)
  for (let i = 0; i < 100; i++) {
    const department = DEPARTMENTS[i % DEPARTMENTS.length];
    const roleList = ROLES_BY_DEPT[department] || ROLES_BY_DEPT['Engineering & Cloud'];
    const role = roleList[i % roleList.length];
    
    // Assign 3-5 relevant skills
    const employeeSkills: string[] = [];
    const availableSkills = [...SKILLS];
    const numSkills = rng.nextInt(3, 5);
    for (let j = 0; j < numSkills; j++) {
      const skillIdx = (i + j * 2) % availableSkills.length;
      const skill = availableSkills[skillIdx];
      if (!employeeSkills.includes(skill)) {
        employeeSkills.push(skill);
      }
    }
    
    // Full availability for corporate staffing
    const availability: Employee['availability'] = {} as Employee['availability'];
    for (const day of DAYS) {
      availability[day] = {
        Morning: true,
        Day: true,
        Evening: true,
        Night: rng.next() > 0.35 // 65% available for night shifts
      };
    }

    employees.push({
      id: `CR-${(1000 + i).toString()}`,
      name: `${FIRST_NAMES[i % FIRST_NAMES.length]} ${LAST_NAMES[(i * 3) % LAST_NAMES.length]}`,
      role,
      department,
      hourlyWage: rng.nextInt(65, 185), 
      maxWeeklyHours: rng.choice([40, 45, 48]),
      assignedHours: 0,
      skills: employeeSkills,
      availability
    });
  }

  // 2. Generate Corporate Shifts (1 shift per day/tier/department)
  let shiftCounter = 1;
  for (const day of DAYS) {
    for (const tier of TIERS) {
      for (const department of DEPARTMENTS) {
        let headcount = 2;
        if (tier === 'Day') headcount = 3;
        else if (tier === 'Morning') headcount = 2;
        else if (tier === 'Evening') headcount = 2;
        else if (tier === 'Night') headcount = 1;

        shifts.push({
          id: `SHF-${shiftCounter.toString().padStart(3, '0')}`,
          day,
          tier,
          department,
          requiredHeadcount: headcount,
          requiredSkills: [SKILLS[(shiftCounter - 1) % SKILLS.length]]
        });
        shiftCounter++;
      }
    }
  }

  // 3. Generate Corporate Workstations (Pods / Hubs)
  stations.push(
    { id: 'ST-01', name: 'Incident Command Post (ICN-01)', department: 'Engineering & Cloud', requiredSkill: 'Incident Triage' },
    { id: 'ST-02', name: 'Cloud SRE Reliability Cluster (SRE-02)', department: 'Engineering & Cloud', requiredSkill: 'Kubernetes CKA' },
    { id: 'ST-03', name: 'Enterprise Data Pipeline Pod (ETL-03)', department: 'Enterprise Analytics & Risk', requiredSkill: 'Data Pipelines' },
    { id: 'ST-04', name: 'SOC Threat Monitoring Terminal (SOC-04)', department: 'Corporate Operations', requiredSkill: 'Threat Modeling' },
    { id: 'ST-05', name: 'FinOps & Budget Control Desk (FIN-05)', department: 'Corporate Operations', requiredSkill: 'FinOps / APM' },
    { id: 'ST-06', name: 'Platform Architecture Review (ARC-06)', department: 'Product & Design', requiredSkill: 'AWS Cloud Arch' },
    { id: 'ST-07', name: 'Compliance & Statutory Gate (AUD-07)', department: 'Enterprise Analytics & Risk', requiredSkill: 'SOC-2 Compliance' },
    { id: 'ST-08', name: 'PostgreSQL Core DB Hub (DBA-08)', department: 'Engineering & Cloud', requiredSkill: 'PostgreSQL DBA' }
  );

  // 4. Generate Corporate Overtime Requests
  for (let i = 1; i <= 60; i++) {
    const emp = employees[i % employees.length];
    const shift = shifts[(i * 3) % shifts.length];
    overtimeRequests.push({
      id: `OT-${i.toString().padStart(3, '0')}`,
      employeeId: emp.id,
      shiftId: shift.id,
      cost: rng.nextInt(60, 220),
      priorityScore: rng.nextInt(40, 99),
      approved: false
    });
  }

  // 5. Generate Shift Swap Requests
  for (let i = 1; i <= 40; i++) {
    const emp = employees[(i * 2) % employees.length];
    const shift = shifts[(i * 5) % shifts.length];
    let reason = SWAP_REASONS[i % SWAP_REASONS.length];

    shiftSwapRequests.push({
      id: `SWP-${i.toString().padStart(3, '0')}`,
      requestingEmployeeId: emp.id,
      targetShiftId: shift.id,
      reason,
      status: 'pending'
    });
  }

  return {
    employees,
    shifts,
    stations,
    overtimeRequests,
    shiftSwapRequests
  };
}
