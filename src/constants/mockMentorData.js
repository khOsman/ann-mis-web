// Static demo data shown to every Mentor for this round — there is no real
// `projects` collection yet. Once Admin-side project creation/assignment
// exists, this module goes away in favor of live Firestore data.

export const MOCK_PROJECT_STATUS = {
  IN_PROGRESS: "In Progress",
  COMPLETED_SUCCESSFUL: "Completed - Successful",
  COMPLETED_UNSUCCESSFUL: "Completed - Unsuccessful",
};

export const MOCK_PROJECTS = [
  {
    id: "proj-001",
    name: "Clean Water Access Initiative",
    cohort_name: "Dhaka Cohort 3",
    cohort_code: "DHK-C3",
    pillar: "Health & Environment",
    status: MOCK_PROJECT_STATUS.IN_PROGRESS,
    description:
      "A youth-led project mapping unsafe water sources in three wards and running a community awareness campaign on low-cost filtration methods.",
    members: [
      { id: "mem-001", name: "Farhana Akter", institution: "Dhaka College" },
      { id: "mem-002", name: "Shahriar Kabir", institution: "Notre Dame College" },
      { id: "mem-003", name: "Ruma Begum", institution: "Viqarunnisa Noon School & College" },
    ],
  },
  {
    id: "proj-002",
    name: "Digital Literacy for Elders",
    cohort_name: "Dhaka Cohort 3",
    cohort_code: "DHK-C3",
    pillar: "Education",
    status: MOCK_PROJECT_STATUS.COMPLETED_SUCCESSFUL,
    description:
      "Weekend workshops teaching smartphone basics and mobile banking safety to elderly residents in Mirpur, reaching over 120 participants.",
    members: [
      { id: "mem-004", name: "Tanvir Ahmed", institution: "Dhaka University" },
      { id: "mem-005", name: "Nusrat Jahan", institution: "BRAC University" },
    ],
  },
  {
    id: "proj-003",
    name: "Street Children Nutrition Drive",
    cohort_name: "Chattogram Cohort 1",
    cohort_code: "CTG-C1",
    pillar: "Health & Environment",
    status: MOCK_PROJECT_STATUS.COMPLETED_UNSUCCESSFUL,
    description:
      "Planned to run a monthly nutrition support program for street children near Chattogram railway station; discontinued after funding fell through.",
    members: [
      { id: "mem-006", name: "Imran Hossain", institution: "Chittagong College" },
      { id: "mem-007", name: "Sadia Islam", institution: "Chittagong University" },
      { id: "mem-008", name: "Rakib Hasan", institution: "Port City International University" },
    ],
  },
  {
    id: "proj-004",
    name: "Girls in STEM Mentorship Circle",
    cohort_name: "Rajshahi Cohort 2",
    cohort_code: "RAJ-C2",
    pillar: "Gender Equity",
    status: MOCK_PROJECT_STATUS.IN_PROGRESS,
    description:
      "A peer-mentorship circle pairing secondary school girls interested in STEM with university-level role models for monthly guidance sessions.",
    members: [
      { id: "mem-009", name: "Mim Akter", institution: "Rajshahi University" },
      { id: "mem-010", name: "Jannatul Ferdous", institution: "Rajshahi College" },
    ],
  },
];

export const MOCK_YEARLY_TREND = [
  { year: 2023, total: 3, successful: 2 },
  { year: 2024, total: 5, successful: 3 },
  { year: 2025, total: 6, successful: 5 },
  { year: 2026, total: 4, successful: 1 },
];
