export type QuickSelfStudyPick = {
  title: string;
  duration: string;
  tag: string;
  tags: string[];
  thumbnail: string;
  videoUrl: string;
};

export const QUICK_SELF_STUDY_PICKS: QuickSelfStudyPick[] = [
  {
    title: "JEE Main Physics Revision Marathon",
    duration: "42 min",
    tag: "Physics",
    tags: ["Physics", "Revision", "JEE Main"],
    thumbnail: "https://i.ytimg.com/vi/8hly31xKli0/hqdefault.jpg",
    videoUrl: "https://www.youtube.com/watch?v=8hly31xKli0",
  },
  {
    title: "Coordinate Geometry One Shot",
    duration: "35 min",
    tag: "Math",
    tags: ["Math", "Coordinate Geometry", "One Shot"],
    thumbnail: "https://i.ytimg.com/vi/rfscVS0vtbw/hqdefault.jpg",
    videoUrl: "https://www.youtube.com/watch?v=rfscVS0vtbw",
  },
  {
    title: "Organic Chemistry Quick Concepts",
    duration: "28 min",
    tag: "Chemistry",
    tags: ["Organic Chemistry", "Concepts", "Quick Revision"],
    thumbnail: "https://i.ytimg.com/vi/kqtD5dpn9C8/hqdefault.jpg",
    videoUrl: "https://www.youtube.com/watch?v=kqtD5dpn9C8",
  },
  {
    title: "Probability PYQ Strategy",
    duration: "19 min",
    tag: "Math",
    tags: ["Math", "PYQ", "Strategy"],
    thumbnail: "https://i.ytimg.com/vi/_uQrJ0TkZlc/hqdefault.jpg",
    videoUrl: "https://www.youtube.com/watch?v=_uQrJ0TkZlc",
  },
  {
    title: "Current Electricity Fast Revision",
    duration: "24 min",
    tag: "Physics",
    tags: ["Physics", "Current Electricity", "Fast Revision"],
    thumbnail: "https://i.ytimg.com/vi/3fumBcKC6RE/hqdefault.jpg",
    videoUrl: "https://www.youtube.com/watch?v=3fumBcKC6RE",
  },
  {
    title: "How to Attempt Mock Tests Better",
    duration: "16 min",
    tag: "Exam Prep",
    tags: ["Exam Prep", "Mock Tests", "Tactics"],
    thumbnail: "https://i.ytimg.com/vi/HGTJBPNC-Gw/hqdefault.jpg",
    videoUrl: "https://www.youtube.com/watch?v=HGTJBPNC-Gw",
  },
  {
    title: "Electrostatics Rapid Practice Session",
    duration: "21 min",
    tag: "Physics",
    tags: ["Physics", "Electrostatics", "Practice"],
    thumbnail: "https://i.ytimg.com/vi/9bZkp7q19f0/hqdefault.jpg",
    videoUrl: "https://www.youtube.com/watch?v=9bZkp7q19f0",
  },
  {
    title: "Ionic Equilibrium Problem Solving",
    duration: "26 min",
    tag: "Chemistry",
    tags: ["Chemistry", "Ionic Equilibrium", "Problem Solving"],
    thumbnail: "https://i.ytimg.com/vi/jNQXAC9IVRw/hqdefault.jpg",
    videoUrl: "https://www.youtube.com/watch?v=jNQXAC9IVRw",
  },
].slice(0, 4);

export function getQuickStudyYoutubeId(url: string): string {
  const match = url.match(/[?&]v=([^&]+)/);
  return match?.[1] ?? "";
}

export const QUICK_SELF_STUDY_VIDEO_CYCLE_MS = 10_000;
