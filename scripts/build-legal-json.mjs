import fs from "fs";

const raw = fs.readFileSync("scripts-tmp-legal-lines.txt", "utf8");
const lines = raw.split("\n").map((line) =>
  line
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
);

const sectionMatchers = [
  { id: "privacy-policy", title: "Privacy Policy", re: /^1\. Privacy Policy$/ },
  { id: "terms-of-use", title: "Terms of Use", re: /^2\. Terms & Conditions$/ },
  { id: "cookie-policy", title: "Cookie Policy", re: /^3\. Cookie Policy$/ },
  { id: "disclaimer", title: "Disclaimer", re: /^4\. Disclaimer$/ },
  { id: "our-data-promise", title: "Our Data Promise", re: /^5\. Our Data Promise$/ },
  { id: "refund-policy", title: "Refund Policy", re: /^6\. Refund & Cancellation Policy$/ },
];

/** Intro: everything before the *second* "1. Privacy Policy" (first is TOC, second starts body) */
const privacyIdx = [];
for (let i = 0; i < lines.length; i++) {
  if (sectionMatchers[0].re.test(lines[i])) privacyIdx.push(i);
}
const introEnd = privacyIdx.length >= 2 ? privacyIdx[1] : privacyIdx[0] ?? 0;

const introLines = lines.slice(0, introEnd).filter(Boolean);
const docListPos = introLines.indexOf("Documents Included:");
const introFiltered =
  docListPos === -1
    ? introLines
    : introLines.filter((l, idx) => {
        if (idx <= docListPos) return true;
        if (/^[1-6]\.\s/.test(l)) return false;
        return true;
      });

const sections = [];
let current = null;
for (let i = introEnd; i < lines.length; i++) {
  const line = lines[i];
  if (!line) continue;
  const match = sectionMatchers.find((m) => m.re.test(line));
  if (match) {
    if (current) sections.push(current);
    current = { id: match.id, title: match.title, paragraphs: [line] };
  } else if (current) {
    current.paragraphs.push(line);
  }
}
if (current) sections.push(current);

const out = {
  intro: introFiltered,
  sections,
  meta: {
    effectiveDate: "1 April 2026",
    version: "1.0",
  },
};

fs.mkdirSync("data", { recursive: true });
fs.writeFileSync("data/legal-document.json", JSON.stringify(out, null, 2), "utf8");
console.log("intro lines", introFiltered.length, "sections", sections.length);
