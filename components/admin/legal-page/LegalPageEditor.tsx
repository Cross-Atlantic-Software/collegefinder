"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { FiArrowUpRight, FiBookOpen, FiLayers } from "react-icons/fi";
import RichTextEditor from "@/components/shared/RichTextEditor";
import type { LegalDocument, LegalSection } from "@/types/legalDocument";
import { introLinesToHtml, paragraphsToHtml } from "@/lib/legalHtml";

function editorHtmlForIntro(doc: LegalDocument): string {
  if (doc.introHtml?.trim()) return doc.introHtml;
  return introLinesToHtml(doc.intro || []);
}

function editorHtmlForSection(section: LegalSection): string {
  if (section.bodyHtml?.trim()) return section.bodyHtml;
  return paragraphsToHtml(section.paragraphs || []);
}

function SectionShell({
  icon,
  eyebrow,
  title,
  hint,
  children,
}: {
  icon: ReactNode;
  eyebrow: string;
  title: string;
  hint: string;
  children: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_12px_40px_-12px_rgba(52,16,80,0.12)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#341050] via-[#8B1E8B] to-[#f0c544]" />
      <div className="border-b border-slate-100 bg-gradient-to-br from-slate-50/95 to-white px-5 py-4 md:px-6">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#341050]/10 text-[#341050]">
            {icon}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#341050]/80">
              {eyebrow}
            </p>
            <h2 className="mt-1 text-lg font-bold text-slate-900">{title}</h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-600">{hint}</p>
          </div>
        </div>
      </div>
      <div className="p-5 md:p-6">{children}</div>
    </section>
  );
}

type Props = {
  value: LegalDocument;
  onChange: (next: LegalDocument) => void;
  disabled?: boolean;
};

export default function LegalPageEditor({ value, onChange, disabled }: Props) {
  const setIntroHtml = (introHtml: string) => {
    onChange({ ...value, introHtml });
  };

  const setSection = (index: number, patch: Partial<LegalSection>) => {
    const sections = value.sections.map((s, i) =>
      i === index ? { ...s, ...patch } : s,
    );
    onChange({ ...value, sections });
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-10">
      {/* Hero */}
      {/* <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-[#341050] via-[#4a1a62] to-[#341050] p-6 text-white shadow-xl md:p-8">
        <div className="pointer-events-none absolute -right-16 -top-24 h-56 w-56 rounded-full bg-[#f0c544]/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-sky-400/20 blur-3xl" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl">
            <h1 className="text-2xl font-extrabold tracking-tight md:text-3xl">
              Legal &amp; policies
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-white/85">
              Edit what visitors see on{" "}
              <code className="rounded bg-black/20 px-1.5 py-0.5 text-xs font-mono text-[#f0e6ff]">
                /legal
              </code>
              . Use bold, headings, and bullet lists — formatting matches the live page.
            </p>
          </div>
          <Link
            href="/legal"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-[#341050] shadow-lg transition hover:bg-[#f8f4fc]"
          >
            Open live page
            <FiArrowUpRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div> */}

      <SectionShell
        icon={<FiBookOpen className="h-5 w-5" />}
        eyebrow="Introduction"
        title="Top of page"
        hint="Usually your main title and short lead. First heading in the editor can act as the page H1."
      >
        <RichTextEditor
          value={editorHtmlForIntro(value)}
          onChange={setIntroHtml}
          placeholder="Title and introductory paragraphs…"
          disabled={disabled}
          className="legal-admin-editor"
        />
      </SectionShell>

      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        <FiLayers className="h-4 w-4 text-[#341050]" aria-hidden />
        Policy sections
      </div>

      <div className="space-y-8">
        {value.sections.map((section, index) => (
          <SectionShell
            key={section.id}
            icon={<span className="text-sm font-black text-[#341050]">{index + 1}</span>}
            eyebrow={`Anchor #${section.id}`}
            title={section.title}
            hint="Section title above is synced from the title field. Body supports bold, lists, and links."
          >
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Section title (navigation &amp; heading)
                </label>
                <input
                  type="text"
                  value={section.title}
                  onChange={(e) => setSection(index, { title: e.target.value })}
                  disabled={disabled}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-[#341050] focus:ring-2 focus:ring-[#341050]/20 disabled:bg-slate-50"
                />
                <p className="mt-1 text-[11px] text-slate-500">
                  URL hash:{" "}
                  <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[11px]">
                    /legal#{section.id}
                  </code>
                </p>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Content
                </label>
                <RichTextEditor
                  value={editorHtmlForSection(section)}
                  onChange={(html) => setSection(index, { bodyHtml: html })}
                  placeholder="Write policy text. Use the toolbar for bold, bullets, numbered lists…"
                  disabled={disabled}
                  className="legal-admin-editor"
                />
              </div>
            </div>
          </SectionShell>
        ))}
      </div>
    </div>
  );
}
