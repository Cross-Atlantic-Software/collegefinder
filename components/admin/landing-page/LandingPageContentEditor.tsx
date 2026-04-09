'use client';

import type { ReactNode } from 'react';
import { FiChevronRight, FiPlus, FiTrash2 } from 'react-icons/fi';
import type { LandingPageContent } from '@/types/landingPage';

const inputClass =
  'w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#341050]/25 focus:border-[#341050] outline-none bg-white disabled:bg-slate-50 disabled:text-slate-500';
const labelClass = 'block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1';
const hintClass = 'text-[11px] text-slate-500 mt-1';

const SECTIONS = [
  {
    id: 'home',
    title: 'UniTracko (Home)',
    blurb: 'Top of the home page — headline, main CTA, background video',
  },
  {
    id: 'reality',
    title: 'The Reality',
    blurb: 'The Problem — stats line, question highlight, body copy, CTA',
  },
  {
    id: 'the-playbook',
    title: 'The Playbook',
    blurb: 'Command center — section titles and six feature cards (images stay in code)',
  },
  {
    id: 'our-edge',
    title: 'Our Edge',
    blurb: 'How UniTracko stands out — title, subtitle, step list, demo CTA',
  },
  {
    id: 'audience',
    title: 'Audience',
    blurb: 'Students & parents tabs, bullet lists, “why” block (through Why UniTracko exists)',
  },
  {
    id: 'contact',
    title: 'Get in Touch',
    blurb: 'Contact us — headings, bullet points, form labels',
  },
  {
    id: 'faq',
    title: 'FAQ',
    blurb: 'Questions and answers below contact',
  },
] as const;

function SectionShell({
  id,
  title,
  blurb,
  children,
}: {
  id: string;
  title: string;
  blurb: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden scroll-mt-24"
    >
      <div className="border-b border-slate-200 px-4 py-3 bg-[#F6F8FA]">
        <h2 className="text-base font-bold text-slate-900">{title}</h2>
        <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{blurb}</p>
      </div>
      <div className="p-4 space-y-4">{children}</div>
    </section>
  );
}

function LabeledInput({
  label,
  hint,
  value,
  onChange,
  disabled,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      <input
        type="text"
        className={inputClass}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      />
      {hint ? <p className={hintClass}>{hint}</p> : null}
    </div>
  );
}

function LabeledTextarea({
  label,
  hint,
  value,
  rows,
  onChange,
  disabled,
}: {
  label: string;
  hint?: string;
  value: string;
  rows?: number;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      <textarea
        className={`${inputClass} resize-y min-h-[72px]`}
        rows={rows ?? 3}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      />
      {hint ? (
        <p className={hintClass}>{hint}</p>
      ) : (
        <p className={hintClass}>
          Press <kbd className="rounded border border-slate-300 bg-slate-100 px-1 py-0.5 font-mono text-[10px]">Enter</kbd> for a new line — the live site shows line breaks in these fields.
        </p>
      )}
    </div>
  );
}

function StringListEditor({
  label,
  hint,
  items,
  onChange,
  disabled,
  addLabel,
}: {
  label: string;
  hint?: string;
  items: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
  addLabel: string;
}) {
  const updateAt = (i: number, v: string) => {
    const next = [...items];
    next[i] = v;
    onChange(next);
  };
  const removeAt = (i: number) => {
    onChange(items.filter((_, j) => j !== i));
  };
  const add = () => onChange([...items, '']);

  return (
    <div>
      <label className={labelClass}>{label}</label>
      {hint ? <p className={`${hintClass} mb-2`}>{hint}</p> : null}
      <p className={`${hintClass} mb-2`}>
        Press Enter inside a row for line breaks on the site (where that block is shown).
      </p>
      <div className="space-y-2">
        {items.map((line, i) => (
          <div key={i} className="flex gap-2 items-start">
            <textarea
              rows={2}
              className={`${inputClass} resize-y min-h-[2.5rem]`}
              value={line}
              onChange={(e) => updateAt(i, e.target.value)}
              disabled={disabled}
              placeholder={`Line ${i + 1} (Enter for line break)`}
            />
            <button
              type="button"
              onClick={() => removeAt(i)}
              disabled={disabled || items.length <= 1}
              className="shrink-0 p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 disabled:opacity-40 disabled:hover:bg-transparent"
              title="Remove line"
            >
              <FiTrash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={add}
          disabled={disabled}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#341050] hover:underline disabled:opacity-50"
        >
          <FiPlus className="h-3.5 w-3.5" />
          {addLabel}
        </button>
      </div>
    </div>
  );
}

type Props = {
  value: LandingPageContent;
  onChange: (next: LandingPageContent) => void;
  disabled?: boolean;
};

export default function LandingPageContentEditor({ value, onChange, disabled }: Props) {
  const patch = (partial: Partial<LandingPageContent>) => {
    onChange({ ...value, ...partial });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <p className="text-xs text-slate-600 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
        <span className="font-semibold text-slate-800">Line breaks: </span>
        In multi-line fields and list rows, press Enter for a new line. Single-line fields keep one line — use separate heading lines or add another list row.
      </p>
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
      <aside className="lg:w-52 shrink-0">
        <div className="lg:sticky lg:top-24 rounded-lg border border-slate-200 bg-white shadow-sm p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-2 px-1">
            On this page
          </p>
          <nav className="flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-1 lg:pb-0 -mx-1 px-1 lg:mx-0 lg:px-0">
            {SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="flex items-center gap-1 shrink-0 lg:w-full text-left text-xs font-medium text-slate-700 py-2 px-2.5 rounded-lg hover:bg-[#F6F8FA] border border-transparent hover:border-slate-200 transition-colors whitespace-nowrap lg:whitespace-normal"
              >
                <FiChevronRight className="h-3.5 w-3.5 text-slate-400 hidden lg:block shrink-0" />
                <span>{s.title}</span>
              </a>
            ))}
          </nav>
        </div>
      </aside>

      <div className="flex-1 min-w-0 space-y-5">
        <SectionShell id="home" title="UniTracko (Home)" blurb={SECTIONS[0].blurb}>
          <LabeledInput
            label="Heading — line 1"
            value={value.hero.headingLine1}
            onChange={(headingLine1) => patch({ hero: { ...value.hero, headingLine1 } })}
            disabled={disabled}
          />
          <LabeledInput
            label="Heading — line 2"
            value={value.hero.headingLine2}
            onChange={(headingLine2) => patch({ hero: { ...value.hero, headingLine2 } })}
            disabled={disabled}
          />
          <StringListEditor
            label="Pain points"
            hint="Short lines under the headline (the site shows an icon per line — three lines is typical)."
            items={value.hero.painPoints?.length ? value.hero.painPoints : ['']}
            onChange={(painPoints) => patch({ hero: { ...value.hero, painPoints } })}
            disabled={disabled}
            addLabel="Add pain point"
          />
          <div className="grid sm:grid-cols-2 gap-4">
            <LabeledInput
              label="Primary button label"
              value={value.hero.ctaLabel}
              onChange={(ctaLabel) => patch({ hero: { ...value.hero, ctaLabel } })}
              disabled={disabled}
            />
            <LabeledInput
              label="Primary button link"
              hint="Path or URL, e.g. /login"
              value={value.hero.ctaHref}
              onChange={(ctaHref) => patch({ hero: { ...value.hero, ctaHref } })}
              disabled={disabled}
            />
          </div>
        </SectionShell>

        <SectionShell id="reality" title="The Reality" blurb={SECTIONS[1].blurb}>
          <LabeledInput
            label="Eyebrow label"
            value={value.info.label}
            onChange={(label) => patch({ info: { ...value.info, label } })}
            disabled={disabled}
          />
          <LabeledTextarea
            label="Stats line"
            rows={3}
            value={value.info.statsLine}
            onChange={(statsLine) => patch({ info: { ...value.info, statsLine } })}
            disabled={disabled}
            hint="Press Enter for multiple lines before the yellow highlight question."
          />
          <LabeledInput
            label="Highlight question"
            value={value.info.highlightQuestion}
            onChange={(highlightQuestion) => patch({ info: { ...value.info, highlightQuestion } })}
            disabled={disabled}
          />
          <LabeledTextarea
            label="Body"
            rows={4}
            value={value.info.body}
            onChange={(body) => patch({ info: { ...value.info, body } })}
            disabled={disabled}
          />
          <div className="grid sm:grid-cols-2 gap-4">
            <LabeledInput
              label="CTA label"
              value={value.info.ctaLabel}
              onChange={(ctaLabel) => patch({ info: { ...value.info, ctaLabel } })}
              disabled={disabled}
            />
            <LabeledInput
              label="CTA link"
              value={value.info.ctaHref}
              onChange={(ctaHref) => patch({ info: { ...value.info, ctaHref } })}
              disabled={disabled}
            />
          </div>
        </SectionShell>

        <SectionShell id="the-playbook" title="The Playbook" blurb={SECTIONS[2].blurb}>
          <LabeledInput
            label="Section title (before highlight)"
            value={value.features.sectionTitleBefore}
            onChange={(sectionTitleBefore) =>
              patch({ features: { ...value.features, sectionTitleBefore } })
            }
            disabled={disabled}
          />
          <LabeledInput
            label="Underlined word in title"
            value={value.features.sectionTitleUnderline}
            onChange={(sectionTitleUnderline) =>
              patch({ features: { ...value.features, sectionTitleUnderline } })
            }
            disabled={disabled}
          />
          <LabeledTextarea
            label="Section subtitle"
            rows={2}
            value={value.features.sectionSubtitle}
            onChange={(sectionSubtitle) =>
              patch({ features: { ...value.features, sectionSubtitle } })
            }
            disabled={disabled}
          />
          <div className="grid sm:grid-cols-3 gap-4">
            <LabeledInput
              label="Learn more label"
              value={value.features.learnMoreLabel}
              onChange={(learnMoreLabel) =>
                patch({ features: { ...value.features, learnMoreLabel } })
              }
              disabled={disabled}
            />
          </div>
          <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/80">
            <label className={labelClass}>Feature cards</label>
            <p className={`${hintClass} mb-3`}>
              Order matches on-page images (first card = first image, etc.).
            </p>
            <div className="space-y-4">
              {(value.features.cards || []).map((card, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-slate-200 bg-white p-3 space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-600">Card {i + 1}</span>
                    <button
                      type="button"
                      disabled={disabled || (value.features.cards || []).length <= 1}
                      onClick={() => {
                        const cards = [...(value.features.cards || [])];
                        cards.splice(i, 1);
                        patch({ features: { ...value.features, cards } });
                      }}
                      className="text-xs text-red-600 hover:underline disabled:opacity-40 disabled:no-underline"
                    >
                      Remove
                    </button>
                  </div>
                  <LabeledInput
                    label="Title"
                    value={card.title}
                    onChange={(title) => {
                      const cards = [...(value.features.cards || [])];
                      cards[i] = { ...cards[i], title };
                      patch({ features: { ...value.features, cards } });
                    }}
                    disabled={disabled}
                  />
                  <LabeledInput
                    label="Highlight word"
                    hint="Word styled in the title"
                    value={card.highlightWord}
                    onChange={(highlightWord) => {
                      const cards = [...(value.features.cards || [])];
                      cards[i] = { ...cards[i], highlightWord };
                      patch({ features: { ...value.features, cards } });
                    }}
                    disabled={disabled}
                  />
                  <LabeledTextarea
                    label="Description"
                    rows={2}
                    value={card.description}
                    onChange={(description) => {
                      const cards = [...(value.features.cards || [])];
                      cards[i] = { ...cards[i], description };
                      patch({ features: { ...value.features, cards } });
                    }}
                    disabled={disabled}
                  />
                </div>
              ))}
              <button
                type="button"
                disabled={disabled}
                onClick={() =>
                  patch({
                    features: {
                      ...value.features,
                      cards: [
                        ...(value.features.cards || []),
                        { title: '', highlightWord: '', description: '' },
                      ],
                    },
                  })
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-slate-300 rounded-lg bg-white hover:bg-[#F6F8FA]"
              >
                <FiPlus className="h-3.5 w-3.5" />
                Add feature card
              </button>
            </div>
          </div>
        </SectionShell>

        <SectionShell id="our-edge" title="Our Edge" blurb={SECTIONS[3].blurb}>
          <LabeledInput
            label="Title"
            value={value.howItWorks.title}
            onChange={(title) => patch({ howItWorks: { ...value.howItWorks, title } })}
            disabled={disabled}
          />
          <LabeledTextarea
            label="Subtitle"
            rows={2}
            value={value.howItWorks.subtitle}
            onChange={(subtitle) => patch({ howItWorks: { ...value.howItWorks, subtitle } })}
            disabled={disabled}
          />
          <div className="grid sm:grid-cols-2 gap-4">
            {/* <LabeledInput
              label="Demo CTA label"
              value={value.howItWorks.demoCta}
              onChange={(demoCta) => patch({ howItWorks: { ...value.howItWorks, demoCta } })}
              disabled={disabled}
            /> */}

          </div>
          <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/80">
            <label className={labelClass}>Steps</label>
            <div className="space-y-4 mt-2">
              {(value.howItWorks.steps || []).map((step, i) => (
                <div key={i} className="rounded-lg border border-slate-200 bg-white p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-600">Step {i + 1}</span>
                    <button
                      type="button"
                      disabled={disabled || (value.howItWorks.steps || []).length <= 1}
                      onClick={() => {
                        const steps = [...(value.howItWorks.steps || [])];
                        steps.splice(i, 1);
                        patch({ howItWorks: { ...value.howItWorks, steps } });
                      }}
                      className="text-xs text-red-600 hover:underline disabled:opacity-40"
                    >
                      Remove
                    </button>
                  </div>
                  <LabeledInput
                    label="Step title"
                    value={step.title}
                    onChange={(title) => {
                      const steps = [...(value.howItWorks.steps || [])];
                      steps[i] = { ...steps[i], title };
                      patch({ howItWorks: { ...value.howItWorks, steps } });
                    }}
                    disabled={disabled}
                  />
                  <LabeledTextarea
                    label="Step description"
                    rows={2}
                    value={step.description}
                    onChange={(description) => {
                      const steps = [...(value.howItWorks.steps || [])];
                      steps[i] = { ...steps[i], description };
                      patch({ howItWorks: { ...value.howItWorks, steps } });
                    }}
                    disabled={disabled}
                  />
                </div>
              ))}
              <button
                type="button"
                disabled={disabled}
                onClick={() =>
                  patch({
                    howItWorks: {
                      ...value.howItWorks,
                      steps: [...(value.howItWorks.steps || []), { title: '', description: '' }],
                    },
                  })
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-slate-300 rounded-lg bg-white hover:bg-[#F6F8FA]"
              >
                <FiPlus className="h-3.5 w-3.5" />
                Add step
              </button>
            </div>
          </div>
        </SectionShell>

        <SectionShell id="audience" title="Audience" blurb={SECTIONS[4].blurb}>
          <LabeledInput
            label="Heading — “Built for”"
            value={value.audience.headingBuiltFor}
            onChange={(headingBuiltFor) =>
              patch({ audience: { ...value.audience, headingBuiltFor } })
            }
            disabled={disabled}
          />
          <div className="grid sm:grid-cols-2 gap-4">
            <LabeledInput
              label="Heading — “both”"
              value={value.audience.headingBoth}
              onChange={(headingBoth) => patch({ audience: { ...value.audience, headingBoth } })}
              disabled={disabled}
            />
            <LabeledInput
              label="Heading — “students”"
              value={value.audience.headingStudents}
              onChange={(headingStudents) =>
                patch({ audience: { ...value.audience, headingStudents } })
              }
              disabled={disabled}
            />
          </div>
          <LabeledInput
            label="Heading — “and parents”"
            value={value.audience.headingAndParents}
            onChange={(headingAndParents) =>
              patch({ audience: { ...value.audience, headingAndParents } })
            }
            disabled={disabled}
          />
          <LabeledTextarea
            label="Subtitle"
            rows={2}
            value={value.audience.subtitle}
            onChange={(subtitle) => patch({ audience: { ...value.audience, subtitle } })}
            disabled={disabled}
          />
          <div className="grid sm:grid-cols-2 gap-4">
            <LabeledInput
              label="Tab — students"
              value={value.audience.tabStudents}
              onChange={(tabStudents) => patch({ audience: { ...value.audience, tabStudents } })}
              disabled={disabled}
            />
            <LabeledInput
              label="Tab — parents"
              value={value.audience.tabParents}
              onChange={(tabParents) => patch({ audience: { ...value.audience, tabParents } })}
              disabled={disabled}
            />
          </div>
          <StringListEditor
            label="Student bullet points"
            items={value.audience.studentPoints?.length ? value.audience.studentPoints : ['']}
            onChange={(studentPoints) => patch({ audience: { ...value.audience, studentPoints } })}
            disabled={disabled}
            addLabel="Add student point"
          />
          <StringListEditor
            label="Parent bullet points"
            items={value.audience.parentPoints?.length ? value.audience.parentPoints : ['']}
            onChange={(parentPoints) => patch({ audience: { ...value.audience, parentPoints } })}
            disabled={disabled}
            addLabel="Add parent point"
          />
          <div className="border-t border-slate-200 pt-4 space-y-4">
            <p className="text-xs font-semibold text-slate-800">“Why” block</p>
            <LabeledInput
              label="Eyebrow"
              value={value.audience.whyLabel}
              onChange={(whyLabel) => patch({ audience: { ...value.audience, whyLabel } })}
              disabled={disabled}
            />
            <LabeledInput
              label="Title line 1"
              value={value.audience.whyTitle}
              onChange={(whyTitle) => patch({ audience: { ...value.audience, whyTitle } })}
              disabled={disabled}
            />
            <LabeledInput
              label="Title line 2 (break)"
              value={value.audience.whyTitleBreak}
              onChange={(whyTitleBreak) =>
                patch({ audience: { ...value.audience, whyTitleBreak } })
              }
              disabled={disabled}
            />
            <LabeledTextarea
              label="Body paragraph 1"
              rows={3}
              value={value.audience.whyBody}
              onChange={(whyBody) => patch({ audience: { ...value.audience, whyBody } })}
              disabled={disabled}
            />
            <LabeledTextarea
              label="Body paragraph 2"
              rows={2}
              value={value.audience.whyBody2}
              onChange={(whyBody2) => patch({ audience: { ...value.audience, whyBody2 } })}
              disabled={disabled}
            />
            <LabeledInput
              label="CTA label"
              value={value.audience.whyCta}
              onChange={(whyCta) => patch({ audience: { ...value.audience, whyCta } })}
              disabled={disabled}
            />
          </div>
        </SectionShell>

        <SectionShell id="contact" title="Get in Touch" blurb={SECTIONS[5].blurb}>
          <LabeledInput
            label="Eyebrow label"
            value={value.contact.label}
            onChange={(label) => patch({ contact: { ...value.contact, label } })}
            disabled={disabled}
          />
          <LabeledInput
            label="Title — before break"
            value={value.contact.titleBefore}
            onChange={(titleBefore) => patch({ contact: { ...value.contact, titleBefore } })}
            disabled={disabled}
          />
          <LabeledInput
            label="Title — break (highlight)"
            value={value.contact.titleBreak}
            onChange={(titleBreak) => patch({ contact: { ...value.contact, titleBreak } })}
            disabled={disabled}
          />
          <LabeledInput
            label="Title — underlined segment"
            value={value.contact.titleUnderline}
            onChange={(titleUnderline) =>
              patch({ contact: { ...value.contact, titleUnderline } })
            }
            disabled={disabled}
          />
          <LabeledTextarea
            label="Subtitle"
            rows={2}
            value={value.contact.subtitle}
            onChange={(subtitle) => patch({ contact: { ...value.contact, subtitle } })}
            disabled={disabled}
          />
          <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/80">
            <label className={labelClass}>Bullet points</label>
            <div className="space-y-3 mt-2">
              {(value.contact.points || []).map((pt, i) => (
                <div key={i} className="rounded-lg border border-slate-200 bg-white p-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-slate-600">Point {i + 1}</span>
                    <button
                      type="button"
                      disabled={disabled || (value.contact.points || []).length <= 1}
                      onClick={() => {
                        const points = [...(value.contact.points || [])];
                        points.splice(i, 1);
                        patch({ contact: { ...value.contact, points } });
                      }}
                      className="text-xs text-red-600 hover:underline disabled:opacity-40"
                    >
                      Remove
                    </button>
                  </div>
                  <LabeledInput
                    label="Title"
                    value={pt.title}
                    onChange={(title) => {
                      const points = [...(value.contact.points || [])];
                      points[i] = { ...points[i], title };
                      patch({ contact: { ...value.contact, points } });
                    }}
                    disabled={disabled}
                  />
                  <LabeledTextarea
                    label="Description"
                    rows={2}
                    value={pt.description}
                    onChange={(description) => {
                      const points = [...(value.contact.points || [])];
                      points[i] = { ...points[i], description };
                      patch({ contact: { ...value.contact, points } });
                    }}
                    disabled={disabled}
                  />
                </div>
              ))}
              <button
                type="button"
                disabled={disabled}
                onClick={() =>
                  patch({
                    contact: {
                      ...value.contact,
                      points: [...(value.contact.points || []), { title: '', description: '' }],
                    },
                  })
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-slate-300 rounded-lg bg-white hover:bg-[#F6F8FA]"
              >
                <FiPlus className="h-3.5 w-3.5" />
                Add point
              </button>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4 border-t border-slate-200 pt-4">
            <LabeledInput
              label="Form title"
              value={value.contact.formTitle}
              onChange={(formTitle) => patch({ contact: { ...value.contact, formTitle } })}
              disabled={disabled}
            />
            <LabeledInput
              label="Form subtitle"
              value={value.contact.formSubtitle}
              onChange={(formSubtitle) =>
                patch({ contact: { ...value.contact, formSubtitle } })
              }
              disabled={disabled}
            />
            <LabeledInput
              label="Submit button"
              value={value.contact.formSubmit}
              onChange={(formSubmit) => patch({ contact: { ...value.contact, formSubmit } })}
              disabled={disabled}
            />
            <LabeledTextarea
              label="Privacy note"
              rows={2}
              value={value.contact.formPrivacy}
              onChange={(formPrivacy) =>
                patch({ contact: { ...value.contact, formPrivacy } })
              }
              disabled={disabled}
            />
          </div>
        </SectionShell>

        <SectionShell id="faq" title="FAQ" blurb={SECTIONS[6].blurb}>
          <div className="grid sm:grid-cols-2 gap-4">
            <LabeledInput
              label="Title — line 1"
              value={value.faq.titleLine1}
              onChange={(titleLine1) => patch({ faq: { ...value.faq, titleLine1 } })}
              disabled={disabled}
            />
            <LabeledInput
              label="Title — line 2"
              value={value.faq.titleLine2}
              onChange={(titleLine2) => patch({ faq: { ...value.faq, titleLine2 } })}
              disabled={disabled}
            />
          </div>
          <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/80">
            <label className={labelClass}>Questions & answers</label>
            <div className="space-y-4 mt-2">
              {(value.faq.items || []).map((item, i) => (
                <div key={i} className="rounded-lg border border-slate-200 bg-white p-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-slate-600">FAQ {i + 1}</span>
                    <button
                      type="button"
                      disabled={disabled || (value.faq.items || []).length <= 1}
                      onClick={() => {
                        const items = [...(value.faq.items || [])];
                        items.splice(i, 1);
                        patch({ faq: { ...value.faq, items } });
                      }}
                      className="text-xs text-red-600 hover:underline disabled:opacity-40"
                    >
                      Remove
                    </button>
                  </div>
                  <LabeledInput
                    label="Question"
                    value={item.question}
                    onChange={(question) => {
                      const items = [...(value.faq.items || [])];
                      items[i] = { ...items[i], question };
                      patch({ faq: { ...value.faq, items } });
                    }}
                    disabled={disabled}
                  />
                  <LabeledTextarea
                    label="Answer"
                    rows={4}
                    value={item.answer}
                    onChange={(answer) => {
                      const items = [...(value.faq.items || [])];
                      items[i] = { ...items[i], answer };
                      patch({ faq: { ...value.faq, items } });
                    }}
                    disabled={disabled}
                  />
                </div>
              ))}
              <button
                type="button"
                disabled={disabled}
                onClick={() =>
                  patch({
                    faq: {
                      ...value.faq,
                      items: [...(value.faq.items || []), { question: '', answer: '' }],
                    },
                  })
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-slate-300 rounded-lg bg-white hover:bg-[#F6F8FA]"
              >
                <FiPlus className="h-3.5 w-3.5" />
                Add FAQ item
              </button>
            </div>
          </div>
        </SectionShell>
      </div>
      </div>
    </div>
  );
}
