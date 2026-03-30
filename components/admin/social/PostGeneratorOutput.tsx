'use client';

import type { SocialGenerateResult } from '@/api/admin/social';
import { SectionCard } from './SectionCard';

type Props = {
  data: SocialGenerateResult;
};

export function PostGeneratorOutput({ data }: Props) {
  const tweets = data.twitter?.length ? data.twitter : [];
  const slides = data.instagramSlides?.length ? data.instagramSlides : [];
  const threadCopy = tweets.map((t, i) => `${i + 1}/ ${t}`).join('\n\n');
  const slidesCopy = slides.map((s, i) => `Slide ${i + 1}: ${s}`).join('\n\n');
  const imagePromptsCopy = [
    `LinkedIn: ${data.imagePrompts.linkedin}`,
    `Twitter: ${data.imagePrompts.twitter}`,
    ...(data.imagePrompts.instagram || []).map((p, i) => `Instagram ${i + 1}: ${p}`),
  ].join('\n\n');

  return (
    <div className="space-y-4">
      <SectionCard title="Title" copyText={data.title}>
        <p className="text-base font-medium text-gray-900">{data.title}</p>
      </SectionCard>

      <SectionCard title="Article (300–500 words)" copyText={data.article}>
        <div className="max-h-72 overflow-y-auto rounded-lg bg-gray-50 p-3 text-sm leading-relaxed text-gray-800 whitespace-pre-wrap">
          {data.article}
        </div>
      </SectionCard>

      <SectionCard title="LinkedIn post" copyText={data.linkedin}>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800">{data.linkedin}</p>
      </SectionCard>

      <SectionCard title="Twitter / X thread" copyText={threadCopy || '(empty)'}>
        {tweets.length === 0 ? (
          <p className="text-sm text-gray-500">No tweets returned — try generating again.</p>
        ) : (
          <ol className="list-decimal space-y-3 pl-5 text-sm text-gray-800">
            {tweets.map((tweet, i) => (
              <li key={i} className="pl-1 leading-relaxed whitespace-pre-wrap">
                {tweet}
              </li>
            ))}
          </ol>
        )}
      </SectionCard>

      <SectionCard title="Instagram slides" copyText={slidesCopy || '(empty)'}>
        {slides.length === 0 ? (
          <p className="text-sm text-gray-500">No slides returned — try generating again.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {slides.map((slide, i) => (
              <div
                key={i}
                className="rounded-lg border border-pink-100 bg-gradient-to-br from-pink-50/80 to-violet-50/80 p-4 shadow-sm"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-pink-700/80">
                  Slide {i + 1}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-gray-800 whitespace-pre-wrap">{slide}</p>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard title="Image prompts (for future generation)" copyText={imagePromptsCopy}>
        <div className="space-y-4 text-sm text-gray-800">
          <div>
            <p className="text-xs font-semibold uppercase text-gray-500">LinkedIn</p>
            <p className="mt-1 leading-relaxed">{data.imagePrompts.linkedin}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-gray-500">Twitter</p>
            <p className="mt-1 leading-relaxed">{data.imagePrompts.twitter}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-gray-500">Instagram (per slide)</p>
            <ul className="mt-2 list-disc space-y-2 pl-5">
              {(data.imagePrompts.instagram || []).map((p, i) => (
                <li key={i} className="leading-relaxed">
                  {p}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
