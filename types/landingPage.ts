/** Mirrors backend `landingPageDefaults` — merged JSON from API. */
export type LandingPageContent = {
  hero: {
    headingLine1: string;
    headingLine2: string;
    painPoints: string[];
    ctaLabel: string;
    ctaHref: string;
  };
  info: {
    label: string;
    statsLine: string;
    highlightQuestion: string;
    body: string;
    ctaLabel: string;
    ctaHref: string;
  };
  features: {
    sectionTitleBefore: string;
    sectionTitleUnderline: string;
    sectionSubtitle: string;
    learnMoreLabel: string;
    cards: Array<{ title: string; highlightWord: string; description: string }>;
  };
  howItWorks: {
    title: string;
    subtitle: string;
    demoCta: string;
    getStartedCta: string;
    steps: Array<{ title: string; description: string }>;
  };
  audience: {
    headingBuiltFor: string;
    headingBoth: string;
    headingStudents: string;
    headingAndParents: string;
    subtitle: string;
    tabStudents: string;
    tabParents: string;
    studentPoints: string[];
    parentPoints: string[];
    whyLabel: string;
    whyTitle: string;
    whyTitleBreak: string;
    whyBody: string;
    whyBody2: string;
    whyCta: string;
  };
  contact: {
    label: string;
    titleBefore: string;
    titleBreak: string;
    titleUnderline: string;
    subtitle: string;
    points: Array<{ title: string; description: string }>;
    formTitle: string;
    formSubtitle: string;
    formSubmit: string;
    formPrivacy: string;
  };
  faq: {
    titleLine1: string;
    titleLine2: string;
    items: Array<{ question: string; answer: string }>;
  };
};
