'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { FiSearch } from "react-icons/fi";
import { FaCheckCircle } from "react-icons/fa";
import { MdSchool } from "react-icons/md";
import { getRecommendedColleges } from "@/api/auth/profile";
import { Button } from "@/components/shared";

type TabId = "recommended" | "shortlisted" | "all";

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
  overview: string;
  source: string;
  shortlisted: boolean;
  detailHref: string;
};

const TABS: { id: TabId; label: string; icon: ReactNode }[] = [
  { id: "recommended", label: "Recommended", icon: <FiSearch /> },
  { id: "shortlisted", label: "Shortlisted", icon: <FaCheckCircle /> },
  { id: "all", label: "All Colleges", icon: <MdSchool /> },
];

const LOCAL_COLLEGE_IMAGES = [
  "/college/image.png",
  "/college/image copy.png",
  "/college/image copy 2.png",
];

function getLocalCollegeImage(seed: number): string {
  return LOCAL_COLLEGE_IMAGES[seed % LOCAL_COLLEGE_IMAGES.length];
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

const PREVIEW_COLLEGES: CollegeCard[] = [
  {
    id: "preview-nit-trichy",
    college_name: "NIT Trichy",
    college_location: "Tiruchirappalli, Tamil Nadu",
    college_type: "Government",
    college_logo: getLocalCollegeImage(0),
    subtitle: "Balanced academics and placements",
    overview: "A dependable shortlist option with a broad branch mix and a consistent campus reputation.",
    source: "Dev preview",
    shortlisted: true,
    detailHref: "/dashboard/colleges/nit-trichy?from=dashboard-college-shortlist-recommended",
  },
  {
    id: "preview-bits-pilani",
    college_name: "BITS Pilani",
    college_location: "Pilani, Rajasthan",
    college_type: "Private Deemed",
    college_logo: getLocalCollegeImage(1),
    subtitle: "Flexible curriculum and strong alumni",
    overview: "Popular for its open curriculum, strong peer group, and premium private campus experience.",
    source: "Dev preview",
    shortlisted: true,
    detailHref: "/dashboard/colleges/bits-pilani?from=dashboard-college-shortlist-recommended",
  },
  {
    id: "preview-vit-vellore",
    college_name: "VIT Vellore",
    college_location: "Vellore, Tamil Nadu",
    college_type: "Private",
    college_logo: getLocalCollegeImage(2),
    subtitle: "Large intake and many programs",
    overview: "A practical backup choice with broad branch availability and a polished admissions flow.",
    source: "Dev preview",
    shortlisted: false,
    detailHref: "/dashboard/colleges/vit-vellore?from=dashboard-college-shortlist-recommended",
  },
  {
    id: "preview-iiit-hyderabad",
    college_name: "IIIT Hyderabad",
    college_location: "Hyderabad, Telangana",
    college_type: "Research Focused",
    college_logo: getLocalCollegeImage(0),
    subtitle: "Computer science and research depth",
    overview: "A premium technology shortlist entry with deep CS strength and a research-first environment.",
    source: "Dev preview",
    shortlisted: true,
    detailHref: "/dashboard/colleges/iiit-hyderabad?from=dashboard-college-shortlist-recommended",
  },
  {
    id: "preview-manipal",
    college_name: "Manipal Institute of Technology",
    college_location: "Manipal, Karnataka",
    college_type: "Private",
    college_logo: getLocalCollegeImage(1),
    subtitle: "Campus life with broad branch choices",
    overview: "Useful for students who want a large, active campus and flexible college-fit options.",
    source: "Dev preview",
    shortlisted: false,
    detailHref: "/dashboard/colleges/manipal-institute-of-technology?from=dashboard-college-shortlist-recommended",
  },
  {
    id: "preview-iit-bombay",
    college_name: "IIT Bombay",
    college_location: "Mumbai, Maharashtra",
    college_type: "Government",
    college_logo: getLocalCollegeImage(2),
    subtitle: "Top-tier placements and innovation",
    overview: "A marquee option for students aiming for the most competitive engineering tracks.",
    source: "Dev preview",
    shortlisted: true,
    detailHref: "/dashboard/colleges/iit-bombay?from=dashboard-college-shortlist-recommended",
  },
  {
    id: "preview-nit-warangal",
    college_name: "NIT Warangal",
    college_location: "Warangal, Telangana",
    college_type: "Government",
    college_logo: getLocalCollegeImage(0),
    subtitle: "Reliable core engineering choice",
    overview: "A stable shortlist candidate with strong academics, alumni support, and campus reputation.",
    source: "Dev preview",
    shortlisted: false,
    detailHref: "/dashboard/colleges/nit-warangal?from=dashboard-college-shortlist-recommended",
  },
];

function mapApiCollege(college: CollegeApiItem): CollegeCard {
  const fallbackImage = getLocalCollegeImage(college.id);
  return {
    id: `live-${college.id}`,
    college_name: college.college_name,
    college_location: college.college_location || "Location not set",
    college_type: college.college_type || "Recommended match",
    college_logo: fallbackImage,
    subtitle: college.college_type || "Live recommendation",
    overview: "Pulled from your recommendation feed so the shortlist stays tied to your profile.",
    source: "Live recommendation",
    shortlisted: false,
    detailHref: `/dashboard/colleges/${slugify(college.college_name)}?from=dashboard-college-shortlist-all`,
  };
}

export default function ShortlistColleges() {
  const [activeTab, setActiveTab] = useState<TabId>("recommended");
  const [liveColleges, setLiveColleges] = useState<CollegeCard[]>([]);
  const [loading, setLoading] = useState(true);
  const tabRefs = useRef<Record<TabId, HTMLButtonElement | null>>({
    recommended: null,
    shortlisted: null,
    all: null,
  });
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const [shortlistedIds] = useState<string[]>(
    PREVIEW_COLLEGES.filter((college) => college.shortlisted).map((college) => college.id),
  );

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setLoading(true);
      try {
        const res = await getRecommendedColleges();
        if (cancelled) return;

        const colleges = res.success && res.data?.colleges ? res.data.colleges.map(mapApiCollege) : [];
        setLiveColleges(colleges);
      } catch {
        if (!cancelled) {
          setLiveColleges([]);
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

  useEffect(() => {
    const updateIndicator = () => {
      const activeEl = tabRefs.current[activeTab];
      if (!activeEl) return;
      setIndicatorStyle({
        left: activeEl.offsetLeft,
        width: activeEl.offsetWidth,
      });
    };

    updateIndicator();
    window.addEventListener("resize", updateIndicator);
    return () => window.removeEventListener("resize", updateIndicator);
  }, [activeTab]);

  const colleges = useMemo(() => {
    const merged: CollegeCard[] = [...PREVIEW_COLLEGES];
    const seen = new Set(PREVIEW_COLLEGES.map((college) => college.college_name.toLowerCase()));

    liveColleges.forEach((college) => {
      const key = college.college_name.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        merged.push(college);
      }
    });

    return merged;
  }, [liveColleges]);

  const recommendedColleges = PREVIEW_COLLEGES;

  const shortlistedColleges = useMemo(() => {
    return colleges.filter((college) => shortlistedIds.includes(college.id));
  }, [colleges, shortlistedIds]);
  const shortlistedCount = shortlistedColleges.length;

  const visibleColleges = activeTab === "recommended"
    ? recommendedColleges
    : activeTab === "shortlisted"
      ? shortlistedColleges
      : colleges;

  const isLoading = activeTab === "recommended" ? false : loading;
  const viewFrom = activeTab === "recommended"
    ? "dashboard-college-shortlist-recommended"
    : activeTab === "shortlisted"
      ? "dashboard-college-shortlist-shortlisted"
      : "dashboard-college-shortlist-all";

  return (
    <div className="w-full min-h-screen bg-[#f5f9ff] text-black dark:bg-slate-950 dark:text-slate-50">
      <section className="w-full bg-[#f5f9ff]">
        <header className="border-b border-slate-200 bg-white px-4 pt-2 pb-0 dark:border-slate-800 dark:bg-slate-900 md:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3">
                <div>
                  <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">College Shortlist</p>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    Manage recommendations, shortlist picks, and the full college list.
                  </p>
                </div>
                {shortlistedCount > 0 && (
                  <span className="shrink-0 rounded-full bg-[#FAD53C] px-2.5 py-0.5 text-xs font-bold text-black">
                    {shortlistedCount}
                  </span>
                )}
              </div>

              <div className="relative -mb-px mt-3 flex gap-1 overflow-x-auto scrollbar-hide">
                {TABS.map((tab) => {
                  const isActive = tab.id === activeTab;

                  return (
                    <button
                      key={tab.id}
                      ref={(el) => {
                        tabRefs.current[tab.id] = el;
                      }}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={[
                        "flex min-w-max items-center gap-2 border-b-2 border-transparent px-4 py-2.5 text-sm font-medium transition-colors duration-300 ease-in-out",
                        isActive
                          ? "border-b-slate-900 text-slate-900 dark:border-b-slate-100 dark:text-slate-100"
                          : "text-black/30 hover:text-black/60 dark:text-white/40 dark:hover:text-white/75",
                      ].join(" ")}
                    >
                      <span className="text-[15px]">{tab.icon}</span>
                      <span>{tab.label}</span>
                    </button>
                  );
                })}

                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute bottom-0 h-0.5 bg-slate-900 transition-all duration-300 ease-in-out dark:bg-slate-100"
                  style={{
                    left: indicatorStyle.left,
                    width: indicatorStyle.width,
                  }}
                />
              </div>
            </div>
          </div>
        </header>

        <div className="bg-[#f8fbff] p-4 dark:bg-slate-950/40 md:p-6">
          <div key={activeTab} style={{ animation: "fade-in 220ms ease-out" }}>
            {isLoading ? (
              <div className="flex flex-col items-center justify-center rounded-xl bg-white px-4 py-16 text-center text-sm font-medium text-slate-500 shadow-sm dark:bg-slate-900 dark:text-slate-300">
                <div className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900 dark:border-slate-700 dark:border-t-slate-100" />
                Loading colleges...
              </div>
            ) : visibleColleges.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl bg-white px-4 py-16 text-center shadow-sm dark:bg-slate-900">
                <MdSchool className="mb-3 h-10 w-10 text-slate-200 dark:text-slate-700" />
                <p className="text-sm font-medium text-slate-500 dark:text-slate-300">No colleges available in this section.</p>
                <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">Try switching tabs or update your profile preferences.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
                {visibleColleges.map((college) => (
                  <article
                    key={college.id}
                    className="group flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:bg-slate-900"
                  >
                    <div className="relative aspect-[23/9] overflow-hidden bg-slate-100 dark:bg-slate-800">
                      <img
                        src={college.college_logo}
                        alt={college.college_name}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                      <div className="absolute left-3 top-3 inline-flex rounded-full bg-black/70 px-2.5 py-1 text-[10px] font-medium text-white backdrop-blur-sm">
                        {college.college_type}
                      </div>
                    </div>

                    <div className="flex flex-1 flex-col gap-2 p-3">
                      <div>
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="truncate text-xs font-semibold text-slate-900 dark:text-slate-100">
                              {college.college_name}
                            </h3>
                            <p className="mt-0.5 truncate text-[11px] text-slate-500 dark:text-slate-400">{college.subtitle}</p>
                          </div>

                          <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            {college.source}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          {college.college_location}
                        </span>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          {college.college_type}
                        </span>
                      </div>

                      <div className="mt-auto flex items-center gap-2 pt-1">
                        <Button
                          variant="themeButtonOutline"
                          size="sm"
                          href={college.detailHref.replace(/from=[^&]*/, `from=${viewFrom}`)}
                          className="flex-1 justify-center !rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 active:scale-95 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800"
                        >
                          View
                        </Button>
                        <Button
                          variant="themeButton"
                          size="sm"
                          href="/dashboard?section=applications"
                          className="flex-1 justify-center !rounded-full !border-black !bg-black !text-[#FAD53C] shadow-sm transition-all duration-200 hover:!bg-black/90 active:scale-95"
                        >
                          Apply
                        </Button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
