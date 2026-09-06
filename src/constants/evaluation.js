export const FEEDBACK_OPTIONS = {
  needs_improvement: { label: "Needs Improvement", weight: 1 },
  average: { label: "Average", weight: 2 },
  good: { label: "Good", weight: 3 },
  excellent: { label: "Excellent", weight: 4 },
};

export const RECOMMENDATION_OPTIONS = {
  do_not_recommend: { label: "Do not Recommend", weight: 1 },
  waiting: { label: "Waiting", weight: 2 },
  recommend: { label: "Recommend", weight: 3 },
  strongly_recommend: { label: "Strongly Recommend", weight: 4 },
};

export const REQUIRED_EVALUATIONS = 3;

// Mirrors ann-mis-server/constants/evaluation.js's deriveSelectionStatus
// exactly — used client-side only when a super admin removes an evaluation
// and the participant's aggregate needs recomputing without a round trip
// to the backend (Firestore rules already allow this write directly).
export const deriveSelectionStatus = (averageScore) => {
  if (averageScore >= 70) return "Selected";
  if (averageScore >= 40) return "Waitlisted";
  return "Rejected";
};

export const ATTENDANCE_OPTIONS = ["Pending", "Present", "Absent"];

// BRAC's official Participant Selection rubric — 7 weighted criteria summing
// to 100, replacing the old manual 0-10 "FGD Score" field. Mirrors
// ann-mis-server/constants/evaluation.js exactly.
export const RUBRIC_CRITERIA = [
  {
    key: "values_empathy",
    label: "Values & Empathy",
    description:
      "Respect others, possess a compassionate mindset, inclusive and non-judgmental attitude",
    maxScore: 20,
  },
  {
    key: "social_awareness",
    label: "Social Awareness",
    description:
      "Aware of social issues, seeks to understand local realities, and is willing to contribute",
    maxScore: 15,
  },
  {
    key: "growth_mindset",
    label: "Growth Mindset",
    description:
      "Self-aware and reflects on the actions, learns from mistakes, is open to feedback",
    maxScore: 10,
  },
  {
    key: "leadership_initiative",
    label: "Leadership & Initiative",
    description:
      "Takes ownership of the problem, emphasizes personal and group initiatives to solve it through solution-oriented thinking",
    maxScore: 15,
  },
  {
    key: "critical_thinking",
    label: "Critical Thinking",
    description:
      "Applies logical reasoning, analyses multiple perspectives, and practical solutions",
    maxScore: 20,
  },
  {
    key: "communication",
    label: "Communication",
    description:
      "Expresses personal thoughts with transparency, brings up data-driven insights and factual information, engages in active listening, respects others' opinions",
    maxScore: 10,
  },
  {
    key: "collaboration",
    label: "Collaboration",
    description:
      "Encourages participation, acknowledges others' contribution and teamwork",
    maxScore: 10,
  },
];

export const RUBRIC_MAX_TOTAL = RUBRIC_CRITERIA.reduce(
  (sum, criterion) => sum + criterion.maxScore,
  0
); // 100
