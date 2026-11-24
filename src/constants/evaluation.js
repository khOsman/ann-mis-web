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

// Result cut-offs on the participant's average score (0-100): 65 and above is
// Selected, 40 to below 65 is Waitlisted, below 40 is Rejected. Mirrors
// ann-mis-server/constants/evaluation.js.
export const SELECTED_MIN_SCORE = 65;
export const WAITLISTED_MIN_SCORE = 40;

// Mirrors ann-mis-server/constants/evaluation.js's deriveSelectionStatus
// exactly — used client-side only when a super admin removes an evaluation
// and the participant's aggregate needs recomputing without a round trip
// to the backend (Firestore rules already allow this write directly).
export const deriveSelectionStatus = (averageScore) => {
  if (averageScore >= SELECTED_MIN_SCORE) return "Selected";
  if (averageScore >= WAITLISTED_MIN_SCORE) return "Waitlisted";
  return "Rejected";
};

export const ATTENDANCE_OPTIONS = ["Pending", "Present", "Absent"];

// Two versions of BRAC's Participant Selection rubric exist side by side.
//   v1 (legacy): 7 weighted criteria, used by every FGD that already had
//     evaluations when v2 was introduced; an evaluation saved without a
//     rubric_version is v1.
//   v2 (current): 4 criteria of 25 points each (the "Updated Rubric" form).
// Each FGD is locked to one version the first time anyone evaluates in it, so
// all three committee members score on the same rubric and the participant's
// average is always like for like. Both are out of 100.
export const RUBRIC_VERSION = {
  V1: "v1",
  V2: "v2",
};

export const CURRENT_RUBRIC_VERSION = RUBRIC_VERSION.V2;

const RUBRIC_V1_CRITERIA = [
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

const RUBRIC_V2_CRITERIA = [
  {
    key: "social_consciousness",
    label: "Social Consciousness",
    description:
      "Demonstrates respect, empathy, inclusivity, and a non-judgmental attitude; understands social issues and local realities; shows sensitivity toward diverse perspectives and a genuine willingness to contribute to positive social change.",
    maxScore: 25,
  },
  {
    key: "learning_problem_solving",
    label: "Learning & Problem-Solving",
    description:
      "Demonstrates self-awareness and willingness to learn from experiences and feedback; reflects on actions and mistakes; analyses problems logically, considers multiple perspectives, questions assumptions, and develops practical, solution-oriented approaches.",
    maxScore: 25,
  },
  {
    key: "leadership_teamwork",
    label: "Leadership & Teamwork",
    description:
      "Takes ownership and demonstrates initiative in addressing problems; is proactive and solution-oriented; encourages participation, values others' contributions, works effectively in teams, and demonstrates the ability to lead or contribute constructively toward a shared goal.",
    maxScore: 25,
  },
  {
    key: "communication_expression",
    label: "Communication & Expression",
    description:
      "Expresses thoughts and ideas clearly and transparently; listens actively; communicates respectfully with others; can articulate observations and perspectives using relevant facts, examples, or data; and responds constructively to differing opinions.",
    maxScore: 25,
  },
];

const sumMax = (criteria) => criteria.reduce((sum, criterion) => sum + criterion.maxScore, 0);

export const RUBRICS = {
  [RUBRIC_VERSION.V1]: {
    version: RUBRIC_VERSION.V1,
    label: "Previous rubric (7 criteria)",
    criteria: RUBRIC_V1_CRITERIA,
    maxTotal: sumMax(RUBRIC_V1_CRITERIA), // 100
  },
  [RUBRIC_VERSION.V2]: {
    version: RUBRIC_VERSION.V2,
    label: "Updated rubric (4 criteria)",
    criteria: RUBRIC_V2_CRITERIA,
    maxTotal: sumMax(RUBRIC_V2_CRITERIA), // 100
  },
};

// A missing or unknown version is a pre-existing evaluation: v1.
export const getRubric = (version) => RUBRICS[version] || RUBRICS[RUBRIC_VERSION.V1];
