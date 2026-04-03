/**
 * Default copy for the public home (landing) page. Stored JSON merges over this.
 * Images / video sources remain in React components.
 */
const landingPageDefaults = {
  hero: {
    headingLine1: 'Your Entire Admission Journey',
    headingLine2: 'Finally Under Control',
    painPoints: ['No scattered portals', 'No forgotten forms', 'No last minute chaos'],
    ctaLabel: 'Find My Fit',
    ctaHref: '/login',
  },
  info: {
    label: 'THE REALITY',
    statsLine: '1k+ Exams • 40k+ Colleges • 20M Students',
    highlightQuestion: 'Still tracking it all manually?',
    body: 'UniTracko brings it all into one place - nothing slips, nothing gets missed.\nNo scattered portals · No forgotten forms · No last-minute chaos',
    ctaLabel: 'Let\'s Figure This Out',
    ctaHref: '/login',
  },
  features: {
    sectionTitleBefore: 'Unlock the',
    sectionTitleUnderline: 'Ultimate Command Centre',
    sectionSubtitle: "We've built the unfair advantage you've been looking for.",
    learnMoreLabel: 'Learn more',
    cards: [
      {
        title: 'Navigate the\nRight Exam',
        highlightWord: 'Right Exam',
        description:
          'Filter 1,000+ exams. Every detail verified. No exam ever slips through.',
      },
      {
        title: 'All‑In\nTracking',
        highlightWord: 'Tracking',
        description:
          'Exams, admits, and deadlines - all tracked from one dashboard. No confusion, no overlap.',
      },
      {
        title: 'The Clarity\nEngine',
        highlightWord: 'Clarity',
        description:
          'Compare every option - fees, cutoff trends, and college fit - before you decide.',
      },
      {
        title: 'One‑Click Form\nFilling',
        highlightWord: 'One‑Click',
        description:
          'Your data, entered once, filled everywhere. No repetition, no errors, no wasted hours.',
      },
      {
        title: 'Psycho-Analytical\nProfiling',
        highlightWord: 'Profiling',
        description:
          "Not just a quiz - a deep profile of who you are and where you'll thrive.",
      },
      {
        title: 'Assessment-Based Aptitude Mapping',
        highlightWord: 'Perfect Fit',
        description:
          'Maps your strengths to the right exams and courses. Clarity for students, peace of mind for parents.',
      },
    ],
  },
  howItWorks: {
    title: 'How UniTracko Standout?',
    subtitle: 'Five steps. One platform. Your entire admission journey, handled.',
    demoCta: 'Explore My Options',
    steps: [
      { title: 'Discover', description: 'Find your fit.' },
      { title: 'Plan', description: 'Track everything, miss nothing.' },
      { title: 'Apply', description: 'One click form.' },
      { title: 'Prepare', description: 'Stay ready, always.' },
      { title: 'Decide', description: 'Compare, choose, move forward.' },
    ],
  },
  audience: {
    headingBuiltFor: 'Built For',
    headingBoth: 'Both',
    headingStudents: 'Students',
    headingAndParents: 'And Parents',
    subtitle: 'Every feature, designed for both sides of the journey.',
    tabStudents: 'For Students',
    tabParents: 'For Parents',
    studentPoints: [
      '1,000+ exams, not just the big names',
      'One-click forms, hours saved',
      'Best-fit path, psycho-analytically mapped',
      'Personalised exam prep, built in',
    ],
    parentPoints: [
      'No missed forms, no surprises Cost and scholarship clarity',
      'Live progress tracking',
      'Confidence at every step',
    ],
    whyLabel: 'WHY UNITRACKO EXISTS?',
    whyTitle: 'Because One Missed Step',
    whyTitleBreak: 'Derails Career.',
    whyBody:
      "The admission race begins in Class 11 and most students don't realize how much they're missing until it's too late.",
    whyBody2: 'UniTracko makes sure that never happens.',
    whyCta: 'See What\'s Possible',
  },
  contact: {
    label: 'CONTACT US',
    titleBefore: 'Plan Your Admission',
    titleBreak: 'Journey With',
    titleUnderline: 'Precision',
    subtitle: 'Exam discovery to final decision, everything in one structured system.',
    points: [
      {
        title: 'Course & College Fit',
        description: 'Matched to your profile, not just popularity.',
      },
      {
        title: 'Application Roadmap',
        description: 'Every deadline and milestone, in one place.',
      },
      {
        title: 'Scholarships & Loan Clarity',
        description: 'Know the real cost before you decide.',
      },
    ],
    formTitle: 'Personal data',
    formSubtitle: 'Specify details as in your passport',
    formSubmit: 'Map My Admission',
    formPrivacy:
      'Your Data stays private. No spam. No pressure. No promotional calls',
  },
  faq: {
    titleLine1: 'Frequently Asked',
    titleLine2: 'Questions',
    items: [
      {
        question: 'How is UniTracko different from Google or WhatsApp groups?',
        answer:
          'Google gives information. UniTracko manages it. Instead of scattered tabs and missed reminders, you get one unified dashboard with automated tracking.',
      },
      {
        question: "Can UniTracko help me find exams I haven't heard of?",
        answer:
          'Yes. It surfaces relevant exams and opportunities based on your profile, not just the most popular options.',
      },
      {
        question: 'How does UniTracko complete forms in seconds?',
        answer:
          'Your profile is structured once, then reused across forms with one-click autofill to reduce repetitive manual entry.',
      },
      {
        question: 'Is One-Click Form Filling secure?',
        answer:
          'Yes. Personal details are stored with strict access controls and used only for your verified application workflow.',
      },
      {
        question: 'Is this only for Engineering or Medical students?',
        answer:
          'No. It supports multiple streams and pathways, including commerce, humanities, design and more.',
      },
      {
        question:
          'What is Psycho-Analytical Profiling and how is it different from regular career quizzes?',
        answer:
          'It combines aptitude, behavior and preference signals to suggest deeper-fit paths instead of generic one-dimensional outcomes.',
      },
      {
        question: 'How accurate is the Psycho-Analytical Profiling assessment?',
        answer:
          'Accuracy improves with profile completeness and usage behavior, giving increasingly relevant recommendations over time.',
      },
    ],
  },
};

module.exports = { landingPageDefaults };
