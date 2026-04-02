"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { FiBookmark, FiCalendar, FiCheckCircle, FiChevronDown, FiClock, FiTarget, FiTrendingUp } from "react-icons/fi";
import { MdOutlineInsights, MdSchool } from "react-icons/md";
import { ChevronRight } from "lucide-react";
import { getRecommendedColleges } from "@/api/auth/profile";
import { Button } from "@/components/shared";
import { Sidebar, TopBar } from "@/components/dashboard";

type SectionId =
  | "dashboard"
  | "profile"
  | "exam-shortlist"
  | "college-shortlist"
  | "applications"
  | "exam-prep"
  | "test-module"
  | "know-your-strengths"
  | "admission-help"
  | "referral";

type CollegeApiItem = {
  id: number;
  college_name: string;
  college_location: string | null;
  college_type: string | null;
  college_logo: string | null;
};

type CollegeCard = {
  id: string;
  college_name: string;
  college_location: string;
  college_type: string;
  college_logo: string;
  subtitle: string;
};

type TimelineItem = {
  label: string;
  month: string;
  note: string;
  critical?: boolean;
};

type DetailModel = {
  institutionType: string;
  accreditation: string;
  admissionMode: string;
  campusSize: string;
  placementOutlook: string;
  feeBand: string;
  intakeWindow: string;
  rankingBand: string;
  eligibility: string[];
  timeline: TimelineItem[];
  competitiveness: {
    applicants: string;
    seats: string;
    typicalCutoff: string;
    difficulty: string;
  };
  prep: string[];
  resources: string[];
  cutoffBenchmarks: string[];
  fitSignals: string[];
};

const SOURCE_BREADCRUMBS: Record<string, Array<{ label: string; href?: string }>> = {
  "dashboard-college-shortlist-recommended": [
    { label: "Dashboard", href: "/dashboard" },
    { label: "College Shortlist", href: "/dashboard?section=college-shortlist" },
    { label: "Recommended" },
  ],
  "dashboard-college-shortlist-shortlisted": [
    { label: "Dashboard", href: "/dashboard" },
    { label: "College Shortlist", href: "/dashboard?section=college-shortlist" },
    { label: "Shortlisted" },
  ],
  "dashboard-college-shortlist-all": [
    { label: "Dashboard", href: "/dashboard" },
    { label: "College Shortlist", href: "/dashboard?section=college-shortlist" },
    { label: "All Colleges" },
  ],
};

const LOCAL_COLLEGE_IMAGES = [
  "/college/image.png",
  "/college/image copy.png",
  "/college/image copy 2.png",
];

const PREVIEW_COLLEGES: CollegeCard[] = [
  {
    id: "preview-nit-trichy",
    college_name: "NIT Trichy",
    college_location: "Tiruchirappalli, Tamil Nadu",
    college_type: "Government",
    college_logo: "/college/image.png",
    subtitle: "Balanced academics and placements",
  },
  {
    id: "preview-bits-pilani",
    college_name: "BITS Pilani",
    college_location: "Pilani, Rajasthan",
    college_type: "Private Deemed",
    college_logo: "/college/image copy.png",
    subtitle: "Flexible curriculum and strong alumni",
  },
  {
    id: "preview-vit-vellore",
    college_name: "VIT Vellore",
    college_location: "Vellore, Tamil Nadu",
    college_type: "Private",
    college_logo: "/college/image copy 2.png",
    subtitle: "Large intake and many programs",
  },
  {
    id: "preview-iiit-hyderabad",
    college_name: "IIIT Hyderabad",
    college_location: "Hyderabad, Telangana",
    college_type: "Research Focused",
    college_logo: "/college/image.png",
    subtitle: "Computer science and research depth",
  },
  {
    id: "preview-manipal",
    college_name: "Manipal Institute of Technology",
    college_location: "Manipal, Karnataka",
    college_type: "Private",
    college_logo: "/college/image copy.png",
    subtitle: "Campus life with broad branch choices",
  },
  {
    id: "preview-iit-bombay",
    college_name: "IIT Bombay",
    college_location: "Mumbai, Maharashtra",
    college_type: "Government",
    college_logo: "/college/image copy 2.png",
    subtitle: "Top-tier placements and innovation",
  },
  {
    id: "preview-nit-warangal",
    college_name: "NIT Warangal",
    college_location: "Warangal, Telangana",
    college_type: "Government",
    college_logo: "/college/image.png",
    subtitle: "Reliable core engineering choice",
  },
];

const PRESETS: Record<string, Partial<DetailModel>> = {
  "iit-bombay": {
    institutionType: "Premier public technical institute",
    accreditation: "Institute of National Importance",
    admissionMode: "JEE Advanced + JoSAA",
    campusSize: "~550 acres",
    placementOutlook: "Very high for core + tech roles",
    feeBand: "Medium to high with scholarship support",
    rankingBand: "Top national tier",
    competitiveness: {
      applicants: "Highly selective intake",
      seats: "Limited program-wise seats",
      typicalCutoff: "Top rank bands required",
      difficulty: "Very High",
    },
  },
  "nit-trichy": {
    institutionType: "Premier NIT",
    accreditation: "Nationally accredited",
    admissionMode: "JEE Main + JoSAA",
    campusSize: "~800 acres",
    placementOutlook: "Strong across engineering branches",
    feeBand: "Moderate public fee structure",
    rankingBand: "Top NIT tier",
  },
};

const RECOMMENDED_VIDEOS = [
  {
    title: "Campus Placement Strategy for Engineers",
    duration: "18 min",
    thumbnail: "https://i.ytimg.com/vi/HGTJBPNC-Gw/hqdefault.jpg",
    videoUrl: "https://www.youtube.com/watch?v=HGTJBPNC-Gw",
  },
  {
    title: "How to Choose College Branch Wisely",
    duration: "14 min",
    thumbnail: "https://i.ytimg.com/vi/_uQrJ0TkZlc/hqdefault.jpg",
    videoUrl: "https://www.youtube.com/watch?v=_uQrJ0TkZlc",
  },
  {
    title: "Academic Planning for First Year",
    duration: "16 min",
    thumbnail: "https://i.ytimg.com/vi/kqtD5dpn9C8/hqdefault.jpg",
    videoUrl: "https://www.youtube.com/watch?v=kqtD5dpn9C8",
  },
  {
    title: "Scholarship and Fee Planning Guide",
    duration: "12 min",
    thumbnail: "https://i.ytimg.com/vi/rfscVS0vtbw/hqdefault.jpg",
    videoUrl: "https://www.youtube.com/watch?v=rfscVS0vtbw",
  },
];

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function getLocalCollegeImage(seed: number): string {
  return LOCAL_COLLEGE_IMAGES[seed % LOCAL_COLLEGE_IMAGES.length];
}

function mapApiCollege(college: CollegeApiItem): CollegeCard {
  return {
    id: `live-${college.id}`,
    college_name: college.college_name,
    college_location: college.college_location || "Location not set",
    college_type: college.college_type || "Recommended match",
    college_logo: getLocalCollegeImage(college.id),
    subtitle: college.college_type || "Live recommendation",
  };
}

function getModel(college: CollegeCard | null, collegeId: string): DetailModel {
  const key = college ? slugify(college.college_name) : slugify(collegeId);
  const now = new Date();
  const year = now.getFullYear();

  const base: DetailModel = {
    institutionType: "Public / Private (varies by institute)",
    accreditation: "NAAC / NBA and statutory approvals",
    admissionMode: "Entrance + counselling pathway",
    campusSize: "Medium to large residential campus",
    placementOutlook: "Depends on branch, profile, and market cycle",
    feeBand: "Varies by institute and quota",
    intakeWindow: `${year}-${year + 1} cycle`,
    rankingBand: "State to national tier",
    eligibility: [
      "Class 12 pass/appearing with stream-specific subjects",
      "Meet exam and counselling eligibility for target branch",
      "Keep category, income, and domicile documents ready",
    ],
    timeline: [
      { label: "Application/Registration", month: `Jan ${year}`, note: "Submit applications and verify academic records.", critical: true },
      { label: "Exam / Score Window", month: `Apr ${year}`, note: "Secure a competitive score for your target branch." },
      { label: "Counselling Start", month: `Jun ${year}`, note: "Fill choices and lock preferences carefully.", critical: true },
      { label: "Seat Allotment", month: `Jul ${year}`, note: "Monitor round-wise movement and upgrade options.", critical: true },
      { label: "Reporting & Admission", month: `Aug ${year}`, note: "Confirm seat, upload docs, and pay initial fee." },
    ],
    competitiveness: {
      applicants: "High demand in top branches",
      seats: "Limited seats per branch and category",
      typicalCutoff: "Tight in top institutes",
      difficulty: "Medium to Very High",
    },
    prep: [
      "Map branch priorities into dream, target, and safe buckets.",
      "Track prior cutoff trends for 3 recent counselling cycles.",
      "Prepare backup options early to avoid last-round stress.",
    ],
    resources: [
      "College fit comparison checklist",
      "Branch-wise trend and placement context",
      "Counselling round strategy with realistic preference ordering",
    ],
    cutoffBenchmarks: [
      "Previous year opening-closing ranks",
      "Category-wise rank movement per round",
      "Campus and branch demand patterns",
    ],
    fitSignals: [
      "Strong alignment between interests and branch curriculum",
      "Comfort with campus location and fee structure",
      "Balanced plan across ambition and admission safety",
    ],
  };

  const preset = PRESETS[key] || {};

  return {
    ...base,
    ...preset,
    competitiveness: {
      ...base.competitiveness,
      ...preset.competitiveness,
    },
  };
}

export default function CollegeDetailPage() {
  const router = useRouter();
  const params = useParams<{ collegeId: string }>();
  const searchParams = useSearchParams();
  const collegeId = decodeURIComponent(params.collegeId || "");
  const from = searchParams.get("from") || "";

  const [allColleges, setAllColleges] = useState<CollegeCard[]>(PREVIEW_COLLEGES);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [tracking, setTracking] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setLoading(true);
      try {
        const res = await getRecommendedColleges();
        if (cancelled) return;

        const live = res.success && res.data?.colleges ? res.data.colleges.map(mapApiCollege) : [];
        const merged: CollegeCard[] = [...PREVIEW_COLLEGES];
        const seen = new Set(PREVIEW_COLLEGES.map((item) => item.college_name.toLowerCase()));

        live.forEach((item) => {
          const key = item.college_name.toLowerCase();
          if (!seen.has(key)) {
            seen.add(key);
            merged.push(item);
          }
        });

        setAllColleges(merged);
      } catch {
        if (!cancelled) {
          setAllColleges(PREVIEW_COLLEGES);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, []);

  const college = useMemo(() => {
    const normalized = slugify(collegeId);
    return (
      allColleges.find((item) => item.id === collegeId) ||
      allColleges.find((item) => slugify(item.college_name) === normalized) ||
      null
    );
  }, [allColleges, collegeId]);

  const model = useMemo(() => getModel(college, collegeId), [college, collegeId]);
  const collegeName = college?.college_name || collegeId.split("-").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
  const collegeType = college?.college_type || "College Profile";
  const breadcrumbTrail = SOURCE_BREADCRUMBS[from] || [
    { label: "Dashboard", href: "/dashboard" },
    { label: "College Shortlist", href: "/dashboard?section=college-shortlist" },
  ];

  const handleSectionChange = (section: SectionId) => {
    router.push(`/dashboard?section=${section}`);
  };

  useEffect(() => {
    if (!collegeId) return;

    const raw = localStorage.getItem(`college-detail-state:${collegeId}`);
    if (!raw) {
      setSaved(false);
      setTracking(false);
      return;
    }

    try {
      const parsed = JSON.parse(raw) as { saved?: boolean; tracking?: boolean };
      setSaved(Boolean(parsed.saved));
      setTracking(Boolean(parsed.tracking));
    } catch {
      setSaved(false);
      setTracking(false);
    }
  }, [collegeId]);

  useEffect(() => {
    if (!collegeId) return;
    localStorage.setItem(`college-detail-state:${collegeId}`, JSON.stringify({ saved, tracking }));
  }, [collegeId, saved, tracking]);

  if (loading) {
    return (
      <div className="h-screen flex bg-[#F6F8FA] dark:bg-slate-950 text-slate-900 dark:text-slate-50">
        <Sidebar
          sidebarOpen={sidebarOpen}
          onToggle={() => setSidebarOpen((v) => !v)}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
          activeSection="college-shortlist"
          onSectionChange={handleSectionChange}
        />
        <div className="flex h-screen flex-1 flex-col bg-[#F6F8FA] dark:bg-slate-950">
          <TopBar
            onToggleSidebar={() => setSidebarOpen((v) => !v)}
            onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
            isSidebarCollapsed={sidebarCollapsed}
          />
          <div className="flex-1 overflow-y-auto px-4 py-4 md:px-6">
            <div className="mx-auto max-w-6xl rounded-2xl bg-white p-8 text-sm text-slate-500 dark:bg-slate-900 dark:text-slate-400">
              Loading college details...
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-[#F6F8FA] dark:bg-slate-950 text-slate-900 dark:text-slate-50">
      <Sidebar
        sidebarOpen={sidebarOpen}
        onToggle={() => setSidebarOpen((v) => !v)}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
        activeSection="college-shortlist"
        onSectionChange={handleSectionChange}
      />

      <div className="flex h-screen flex-1 flex-col bg-[#F6F8FA] dark:bg-slate-950">
        <TopBar
          onToggleSidebar={() => setSidebarOpen((v) => !v)}
          onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
          isSidebarCollapsed={sidebarCollapsed}
        />

        <div className="flex-1 overflow-y-auto bg-[#F6F8FA] dark:bg-slate-950">
          <section className="bg-white dark:bg-slate-900">
            <div className="px-4 py-3 md:px-6">
              <div className="flex items-center gap-3">
                <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full ring-1 ring-slate-200 dark:ring-slate-700">
                  <Image
                    src={college?.college_logo || "/college/image.png"}
                    alt="College logo"
                    fill
                    className="object-cover"
                    sizes="44px"
                    priority
                  />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 md:text-[2rem]">{collegeName}</h1>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{collegeType}</p>
                </div>
              </div>
            </div>
          </section>

          <section className="border-y border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <div className="px-4 py-2 md:px-6">
              <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                {breadcrumbTrail.map((crumb, index) => (
                  <div key={`${crumb.label}-${index}`} className="inline-flex items-center gap-1.5">
                    {index > 0 && <ChevronRight className="h-3 w-3" />}
                    {crumb.href ? (
                      <Link href={crumb.href} className="font-medium text-black/70 hover:text-black hover:underline dark:text-slate-200 dark:hover:text-white">
                        {crumb.label}
                      </Link>
                    ) : (
                      <span>{crumb.label}</span>
                    )}
                  </div>
                ))}
                <ChevronRight className="h-3 w-3" />
                <span className="font-semibold text-slate-700 dark:text-slate-200">{collegeName}</span>
              </div>
            </div>
          </section>

          <div className="px-4 py-4 md:px-6">
            <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-5 xl:grid-cols-[1fr_320px]">
              <section className="space-y-5">
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  <div className="rounded-xl bg-white p-3 dark:bg-slate-900">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Admission</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{model.admissionMode}</p>
                  </div>
                  <div className="rounded-xl bg-white p-3 dark:bg-slate-900">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Campus</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{model.campusSize}</p>
                  </div>
                  <div className="rounded-xl bg-white p-3 dark:bg-slate-900">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Intake</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{model.intakeWindow}</p>
                  </div>
                  <div className="rounded-xl bg-white p-3 dark:bg-slate-900">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Ranking</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{model.rankingBand}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <article className="rounded-2xl bg-white p-5 dark:bg-slate-900">
                    <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">College Snapshot</h2>
                    <div className="mt-3 space-y-2 text-sm">
                      <p className="rounded-lg bg-[#F6F8FA] px-3 py-2 text-slate-700 dark:bg-slate-950 dark:text-slate-300">Type: {model.institutionType}</p>
                      <p className="rounded-lg bg-[#F6F8FA] px-3 py-2 text-slate-700 dark:bg-slate-950 dark:text-slate-300">Accreditation: {model.accreditation}</p>
                      <p className="rounded-lg bg-[#F6F8FA] px-3 py-2 text-slate-700 dark:bg-slate-950 dark:text-slate-300">Fee Band: {model.feeBand}</p>
                      <p className="rounded-lg bg-[#F6F8FA] px-3 py-2 text-slate-700 dark:bg-slate-950 dark:text-slate-300">Placement: {model.placementOutlook}</p>
                    </div>
                  </article>

                  <article className="rounded-2xl bg-white p-5 dark:bg-slate-900">
                    <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Cutoff & Benchmarking</h2>
                    <div className="mt-3 space-y-2 text-sm">
                      {model.cutoffBenchmarks.map((item) => (
                        <p key={item} className="rounded-lg bg-[#F6F8FA] px-3 py-2 text-slate-700 dark:bg-slate-950 dark:text-slate-300">{item}</p>
                      ))}
                    </div>
                  </article>
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <article className="rounded-2xl bg-white p-5 dark:bg-slate-900">
                    <div className="flex items-center gap-2">
                      <FiCheckCircle className="h-4 w-4 text-emerald-600" />
                      <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Am I eligible?</h2>
                    </div>
                    <ul className="mt-3 space-y-2 text-sm text-slate-700 dark:text-slate-300">
                      {model.eligibility.map((rule) => (
                        <li key={rule} className="rounded-lg bg-[#F6F8FA] px-3 py-2 dark:bg-slate-950">
                          {rule}
                        </li>
                      ))}
                    </ul>
                  </article>

                  <article className="rounded-2xl bg-white p-5 dark:bg-slate-900">
                    <div className="flex items-center gap-2">
                      <MdOutlineInsights className="h-4 w-4 text-[#b88900]" />
                      <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">How competitive is this college?</h2>
                    </div>
                    <div className="mt-3 space-y-2 text-sm">
                      <div className="rounded-lg bg-[#F6F8FA] px-3 py-2 dark:bg-slate-950">
                        <p className="text-xs text-slate-500 dark:text-slate-400">Applicants</p>
                        <p className="font-semibold text-slate-900 dark:text-slate-100">{model.competitiveness.applicants}</p>
                      </div>
                      <div className="rounded-lg bg-[#F6F8FA] px-3 py-2 dark:bg-slate-950">
                        <p className="text-xs text-slate-500 dark:text-slate-400">Seats</p>
                        <p className="font-semibold text-slate-900 dark:text-slate-100">{model.competitiveness.seats}</p>
                      </div>
                      <div className="rounded-lg bg-[#F6F8FA] px-3 py-2 dark:bg-slate-950">
                        <p className="text-xs text-slate-500 dark:text-slate-400">Typical Cutoff</p>
                        <p className="font-semibold text-slate-900 dark:text-slate-100">{model.competitiveness.typicalCutoff}</p>
                      </div>
                    </div>
                  </article>
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <article className="rounded-2xl bg-white p-5 dark:bg-slate-900">
                    <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Institution Type & Admissions</h2>
                    <div className="mt-3 space-y-2 text-sm">
                      <p className="rounded-lg bg-[#F6F8FA] px-3 py-2 text-slate-700 dark:bg-slate-950 dark:text-slate-300">Type: {model.institutionType}</p>
                      <p className="rounded-lg bg-[#F6F8FA] px-3 py-2 text-slate-700 dark:bg-slate-950 dark:text-slate-300">Admission Mode: {model.admissionMode}</p>
                    </div>
                  </article>

                  <article className="rounded-2xl bg-white p-5 dark:bg-slate-900">
                    <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Preparation Resources</h2>
                    <div className="mt-3 space-y-2 text-sm">
                      {model.resources.map((item) => (
                        <p key={item} className="rounded-lg bg-[#F6F8FA] px-3 py-2 text-slate-700 dark:bg-slate-950 dark:text-slate-300">{item}</p>
                      ))}
                    </div>
                  </article>
                </div>

                <details open className="group rounded-2xl bg-white p-5 dark:bg-slate-900">
                  <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-slate-900 dark:text-slate-100">
                    <span className="inline-flex items-center gap-2">
                      <FiCalendar className="h-4 w-4 text-[#b88900]" />
                      When are the key dates?
                    </span>
                    <FiChevronDown className="h-4 w-4 transition group-open:rotate-180" />
                  </summary>
                  <div className="mt-4 space-y-3">
                    {model.timeline.map((item) => (
                      <div key={item.label} className="rounded-xl bg-[#F6F8FA] p-3 dark:bg-slate-950">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{item.label}</p>
                          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${item.critical ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" : "bg-[#F6F8FA] text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}>
                            {item.month}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{item.note}</p>
                      </div>
                    ))}
                  </div>
                </details>

                <details className="group rounded-2xl bg-white p-5 dark:bg-slate-900">
                  <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-slate-900 dark:text-slate-100">
                    <span className="inline-flex items-center gap-2">
                      <FiTarget className="h-4 w-4 text-[#b88900]" />
                      How do I prepare effectively?
                    </span>
                    <FiChevronDown className="h-4 w-4 transition group-open:rotate-180" />
                  </summary>
                  <div className="mt-4 space-y-2">
                    {model.prep.map((step) => (
                      <p key={step} className="rounded-lg bg-[#F6F8FA] px-3 py-2 text-sm text-slate-700 dark:bg-slate-950 dark:text-slate-300">
                        {step}
                      </p>
                    ))}
                  </div>
                </details>
              </section>

              <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
                <div className="rounded-2xl bg-white p-4 dark:bg-slate-900">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Next best actions</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Take action where intent is highest.</p>
                  <div className="mt-3 space-y-2">
                    <Button variant={saved ? "secondary" : "themeButton"} size="sm" className="w-full justify-center rounded-full" onClick={() => setSaved((v) => !v)}>
                      <FiBookmark className="h-4 w-4" /> {saved ? "Saved" : "Save College"}
                    </Button>
                    <Button variant={tracking ? "secondary" : "themeButton"} size="sm" className="w-full justify-center rounded-full" onClick={() => setTracking((v) => !v)}>
                      <FiClock className="h-4 w-4" /> {tracking ? "Tracking Active" : "Track Deadlines"}
                    </Button>
                    <Button variant="themeButton" size="sm" className="w-full justify-center rounded-full" href="/dashboard?section=applications">
                      <MdSchool className="h-4 w-4" /> Start Application
                    </Button>
                    <Button variant="themeButtonOutline" size="sm" className="w-full justify-center rounded-full" href="/dashboard?section=college-shortlist">
                      <FiTrendingUp className="h-4 w-4" /> Back to Shortlist
                    </Button>
                  </div>
                </div>

                <div className="rounded-2xl bg-white p-4 dark:bg-slate-900">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Fit signals</p>
                  <div className="mt-2 space-y-2 text-xs text-slate-600 dark:text-slate-400">
                    {model.fitSignals.map((item) => (
                      <p key={item} className="rounded-lg bg-[#F6F8FA] px-3 py-2 dark:bg-slate-950">{item}</p>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl bg-white p-4 dark:bg-slate-900">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Recommended videos</p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Quick picks inspired by dashboard study cards.</p>
                    </div>
                  </div>

                  <div className="mt-3 overflow-hidden rounded-xl bg-[#F6F8FA] p-2 dark:bg-slate-950">
                    <a href={RECOMMENDED_VIDEOS[0].videoUrl} target="_blank" rel="noreferrer" className="block">
                      <div className="relative overflow-hidden rounded-lg bg-black">
                        <img
                          src={RECOMMENDED_VIDEOS[0].thumbnail}
                          alt={RECOMMENDED_VIDEOS[0].title}
                          className="h-36 w-full object-cover"
                          loading="lazy"
                        />
                        <span className="absolute bottom-2 right-2 rounded bg-black/80 px-1.5 py-0.5 text-[10px] font-medium text-white">
                          {RECOMMENDED_VIDEOS[0].duration}
                        </span>
                      </div>
                    </a>
                  </div>

                  <div className="mt-3 space-y-2">
                    {RECOMMENDED_VIDEOS.slice(1).map((video) => (
                      <a
                        key={video.title}
                        href={video.videoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-start gap-3 rounded-lg bg-[#F6F8FA] p-2 transition-colors hover:bg-[#e9edf3] dark:bg-slate-950 dark:hover:bg-slate-900"
                      >
                        <img src={video.thumbnail} alt={video.title} className="h-14 w-20 rounded object-cover" loading="lazy" />
                        <div className="min-w-0">
                          <p className="line-clamp-2 text-xs font-semibold text-slate-900 dark:text-slate-100">{video.title}</p>
                          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">{video.duration}</p>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
