export type DummyCounsellingExam = {
  id: string;
  name: string;
  code: string;
};

export type RankSource = "actual" | "unitracko" | "unitracko_predictor";

export type CounsellingCollegeResult = {
  id: string;
  examId: string;
  name: string;
  location: string;
  collegeType: string;
  branch: string;
  closingRank: number;
  probability: "High" | "Moderate" | "Reach";
};

export const DUMMY_COUNSELLING_EXAMS: DummyCounsellingExam[] = [
  { id: "jee-main", name: "JEE Main 2026", code: "JEE_MAIN" },
  { id: "jee-advanced", name: "JEE Advanced 2026", code: "JEE_ADV" },
  { id: "neet-ug", name: "NEET UG 2026", code: "NEET_UG" },
  { id: "cuet", name: "CUET 2026", code: "CUET" },
  { id: "bitsat", name: "BITSAT 2026", code: "BITSAT" },
];

export const DUMMY_COUNSELLING_COLLEGES: CounsellingCollegeResult[] = [
  {
    id: "1",
    examId: "jee-main",
    name: "NIT Trichy",
    location: "Tiruchirappalli, Tamil Nadu",
    collegeType: "Government",
    branch: "Computer Science & Engineering",
    closingRank: 4200,
    probability: "High",
  },
  {
    id: "2",
    examId: "jee-main",
    name: "NIT Warangal",
    location: "Warangal, Telangana",
    collegeType: "Government",
    branch: "Electronics & Communication",
    closingRank: 5800,
    probability: "High",
  },
  {
    id: "3",
    examId: "jee-main",
    name: "IIIT Hyderabad",
    location: "Hyderabad, Telangana",
    collegeType: "Autonomous",
    branch: "Computer Science & Engineering",
    closingRank: 3100,
    probability: "Moderate",
  },
  {
    id: "4",
    examId: "jee-main",
    name: "DTU Delhi",
    location: "New Delhi, Delhi",
    collegeType: "Government",
    branch: "Software Engineering",
    closingRank: 7200,
    probability: "High",
  },
  {
    id: "5",
    examId: "jee-main",
    name: "NSUT Delhi",
    location: "New Delhi, Delhi",
    collegeType: "Government",
    branch: "Information Technology",
    closingRank: 9100,
    probability: "Moderate",
  },
  {
    id: "6",
    examId: "jee-advanced",
    name: "IIT Bombay",
    location: "Mumbai, Maharashtra",
    collegeType: "IIT",
    branch: "Computer Science & Engineering",
    closingRank: 650,
    probability: "Reach",
  },
  {
    id: "7",
    examId: "jee-advanced",
    name: "IIT Delhi",
    location: "New Delhi, Delhi",
    collegeType: "IIT",
    branch: "Electrical Engineering",
    closingRank: 980,
    probability: "Moderate",
  },
  {
    id: "8",
    examId: "neet-ug",
    name: "AIIMS Delhi",
    location: "New Delhi, Delhi",
    collegeType: "Medical",
    branch: "MBBS",
    closingRank: 120,
    probability: "Reach",
  },
  {
    id: "9",
    examId: "neet-ug",
    name: "Maulana Azad Medical College",
    location: "New Delhi, Delhi",
    collegeType: "Medical",
    branch: "MBBS",
    closingRank: 890,
    probability: "Moderate",
  },
  {
    id: "10",
    examId: "cuet",
    name: "Delhi University — SRCC",
    location: "New Delhi, Delhi",
    collegeType: "Central University",
    branch: "B.Com (Hons)",
    closingRank: 450,
    probability: "High",
  },
  {
    id: "11",
    examId: "bitsat",
    name: "BITS Pilani",
    location: "Pilani, Rajasthan",
    collegeType: "Private",
    branch: "Computer Science",
    closingRank: 5200,
    probability: "High",
  },
];

/** Dummy rank-based filter — integration will replace this later. */
export function getDummyCollegesForRank(
  examId: string,
  rank: number
): CounsellingCollegeResult[] {
  if (!examId || !Number.isFinite(rank) || rank <= 0) return [];

  return DUMMY_COUNSELLING_COLLEGES.filter((c) => c.examId === examId)
    .map((college) => {
      let probability: CounsellingCollegeResult["probability"];
      if (rank <= college.closingRank * 0.85) {
        probability = "High";
      } else if (rank <= college.closingRank * 1.15) {
        probability = "Moderate";
      } else if (rank <= college.closingRank * 1.5) {
        probability = "Reach";
      } else {
        return null;
      }
      return { ...college, probability };
    })
    .filter((c): c is CounsellingCollegeResult => c !== null)
    .sort((a, b) => a.closingRank - b.closingRank);
}

export const RANK_SOURCE_LABELS: Record<RankSource, string> = {
  actual: "Actual AIR Rank",
  unitracko: "Unitracko Rank",
  unitracko_predictor: "Unitracko Predictor Rank",
};
