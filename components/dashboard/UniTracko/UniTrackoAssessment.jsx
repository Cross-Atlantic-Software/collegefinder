"use client";
// Drop-in React component for the UniTracko strengths assessment.
//
// Usage in a Next.js page (App Router):
//   import UniTrackoAssessment from "@/components/UniTrackoAssessment";
//   export default function Page() { return <UniTrackoAssessment />; }
//
// Requires (npm install html2canvas canvas-confetti) and the CSS in
// integration/styles/unitracko.css imported globally (see README for both).
// Logo assets are expected at /public/unitracko/*.svg — copy them from
// integration/public/unitracko/ into your Next.js project's /public folder.

import { useState, useMemo, useEffect, useRef } from "react";
import { THEMES, DOMAINS, STREAMS } from "./lib/themes.js";
import { buildAssessment, buildReport } from "./lib/engine.js";
import "./unitracko.css";

function domainOf(id) {
  return DOMAINS.find((d) => d.id === id) || DOMAINS[0];
}
function themeOf(id) {
  return THEMES.find((t) => t.id === id);
}

const SLIDER_LABELS = ["Not like me", "A little", "Somewhat", "A lot", "Very like me"];
const LOGO = "/unitracko/logo.svg";
const LOGO_WHITE = "/unitracko/logo-white.svg";

// Confetti + share-card download are optional extras. To avoid an npm install,
// we lazy-load them from a CDN the first time they're needed and read the
// browser global. If the CDN is blocked the feature simply no-ops — the core
// assessment UI never depends on these. (To bundle them instead, run
// `npm install html2canvas canvas-confetti` and swap these for dynamic imports.)
const CDN = {
  confetti: "https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.2/dist/confetti.browser.min.js",
  html2canvas: "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js",
};

function loadScriptOnce(src) {
  return new Promise((resolve, reject) => {
    if (typeof document === "undefined") return reject(new Error("no document"));
    const existing = document.querySelector(`script[data-ut-src="${src}"]`);
    if (existing) {
      if (existing.dataset.utLoaded === "true") return resolve();
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("script failed")));
      return;
    }
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.dataset.utSrc = src;
    s.addEventListener("load", () => { s.dataset.utLoaded = "true"; resolve(); });
    s.addEventListener("error", () => reject(new Error("script failed")));
    document.head.appendChild(s);
  });
}

async function getConfetti() {
  if (typeof window !== "undefined" && window.confetti) return window.confetti;
  await loadScriptOnce(CDN.confetti);
  return window.confetti;
}

async function getHtml2Canvas() {
  if (typeof window !== "undefined" && window.html2canvas) return window.html2canvas;
  await loadScriptOnce(CDN.html2canvas);
  return window.html2canvas;
}

function hypeFor(pct) {
  if (pct === 0) return "Let's go 🚀";
  if (pct < 25) return "Warming up 🔥";
  if (pct < 50) return "You're cooking 👨‍🍳";
  if (pct < 75) return "No thoughts, just vibes 💭";
  if (pct < 95) return "Final stretch 💪";
  return "So close 👀";
}

function Welcome({ onStart }) {
  const [name, setName] = useState("");
  const [grade, setGrade] = useState("10");
  const [stream, setStream] = useState("");

  const needsStream = grade !== "10";
  const canStart = name.trim().length > 0 && (!needsStream || stream);

  return (
    <div className="ut-card">
      <div className="ut-brand-bar"><img src={LOGO} alt="UniTracko" /></div>
      <div className="ut-welcome-badges">
        <span className="ut-welcome-badge">⏱ ~15 min</span>
        <span className="ut-welcome-badge">65 questions</span>
        <span className="ut-welcome-badge">25 strengths</span>
        <span className="ut-welcome-badge">20 exam matches</span>
      </div>
      <h1>What's your main character energy?</h1>
      <p className="ut-sub">
        No cap — answer how you'd <i>actually</i> react, not how you think you "should."
        There's no wrong answer, only an accurate one. You'll walk away knowing your top 5
        strengths, why they're actually yours, and the exams/careers worth exploring next.
      </p>

      <label>Your name</label>
      <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Aarav Sharma" />

      <label>Class</label>
      <select value={grade} onChange={(e) => setGrade(e.target.value)}>
        <option value="10">Class 10</option>
        <option value="11">Class 11</option>
        <option value="12">Class 12</option>
      </select>

      {needsStream && (
        <>
          <label>Your stream</label>
          <select value={stream} onChange={(e) => setStream(e.target.value)}>
            <option value="">Select your stream</option>
            {STREAMS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </>
      )}

      <button className="ut-primary" disabled={!canStart} onClick={() => onStart({ name: name.trim(), grade, stream: stream || null })}>
        Let's find out →
      </button>
    </div>
  );
}

function Questionnaire({ student, onFinish }) {
  // buildAssessment() draws a fresh random sample from the 6500-item pool every
  // time — useMemo with an empty dep array locks the sample for this session.
  const questions = useMemo(() => buildAssessment(), []);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [seconds, setSeconds] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  const q = questions[idx];
  const domainId = q.type === "slider" ? themeOf(q.theme).domain : q.domain;
  const domain = domainOf(domainId);
  const answered = answers[q.id] !== undefined;
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  const pct = Math.round((idx / questions.length) * 100);
  const sliderVal = answers[q.id] ?? 3;

  function setAnswer(value) {
    setAnswers((a) => ({ ...a, [q.id]: value }));
  }

  function next() {
    if (idx + 1 < questions.length) setIdx(idx + 1);
    else {
      clearInterval(timerRef.current);
      onFinish({ answers, questions });
    }
  }

  return (
    <div className="ut-card" style={{ "--ut-domain": domain.color }} key={q.id}>
      <div className="ut-top-row">
        <img src={LOGO} alt="UniTracko" style={{ height: 16 }} />
        <span>Q{idx + 1}/{questions.length} · ⏱ {mm}:{ss}</span>
      </div>
      <div className="ut-progress-track">
        <div className="ut-progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="ut-progress-pct">{hypeFor(pct)} · {pct}% complete</div>

      <span className="ut-domain-chip">{domain.icon} {domain.name}</span>

      <div className="ut-q-prompt">{q.type === "slider" ? q.text : q.prompt}</div>

      {q.type === "slider" && (
        <div className="ut-slider-wrap">
          <div className="ut-slider-value">
            <div className="ut-slider-bubble">{sliderVal}</div>
          </div>
          <input
            type="range"
            min="1"
            max="5"
            step="1"
            value={sliderVal}
            style={{ "--ut-fill": `${((sliderVal - 1) / 4) * 100}%` }}
            onChange={(e) => setAnswer(Number(e.target.value))}
          />
          <div className="ut-slider-labels">
            <span>Not like me</span>
            <span>{SLIDER_LABELS[sliderVal - 1]}</span>
            <span>Very like me</span>
          </div>
        </div>
      )}

      {q.type === "scenario" && (
        <div>
          {q.options.map((opt, i) => (
            <button
              key={i}
              className={"ut-option" + (answers[q.id] === i ? " ut-selected" : "")}
              onClick={() => setAnswer(i)}
            >
              <span className="ut-option-dot">{answers[q.id] === i ? "✓" : ""}</span>
              {opt.text}
            </button>
          ))}
        </div>
      )}

      <div className="ut-nav-row">
        <button className="ut-ghost" disabled={idx === 0} onClick={() => setIdx(idx - 1)}>Back</button>
        <button className="ut-primary" disabled={!answered} onClick={next} style={{ marginTop: 0 }}>
          {idx + 1 === questions.length ? "Reveal my results ✨" : "Next →"}
        </button>
      </div>
    </div>
  );
}

function ShareCard({ student, top5 }) {
  const cardRef = useRef(null);
  const [downloading, setDownloading] = useState(false);

  async function download() {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const html2canvas = await getHtml2Canvas();
      if (!html2canvas) throw new Error("html2canvas unavailable");
      const canvas = await html2canvas(cardRef.current, { scale: 2, backgroundColor: null });
      const link = document.createElement("a");
      link.download = `${student.name.replace(/\s+/g, "_")}_unitracko_strengths.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (e) {
      alert("Couldn't generate the image — try a screenshot instead!");
    }
    setDownloading(false);
  }

  return (
    <div className="ut-share-card-wrap">
      <div>
        <div className="ut-share-card" ref={cardRef}>
          <img className="ut-sc-logo" src={LOGO_WHITE} alt="UniTracko" />
          <div className="ut-sc-name">{student.name}'s Top 5 Strengths</div>
          <div className="ut-sc-label">unitracko.com strengths assessment</div>
          {top5.map((t, i) => {
            const d = domainOf(t.domain);
            return (
              <div className="ut-sc-row" key={t.id} style={{ "--ut-row-color": d.color }}>
                <span className="ut-sc-rank">{i + 1}</span>
                <span className="ut-sc-thumb">{t.icon}</span>
                <span className="ut-sc-row-name">{t.name}</span>
                <span className="ut-sc-row-score">{t.score}%</span>
              </div>
            );
          })}
          <div className="ut-sc-line">Find your strengths, find your path.</div>
        </div>
        <div className="ut-share-actions">
          <button className="ut-primary" style={{ marginTop: 14 }} disabled={downloading} onClick={download}>
            {downloading ? "Generating…" : "📲 Download my card"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Report({ student, answers, questions }) {
  const report = useMemo(
    () => buildReport({ name: student.name, grade: student.grade, declaredStream: student.stream, answers, questions }),
    [student, answers, questions]
  );

  const top1 = report.top5[0];
  const top2 = report.top5[1];

  useEffect(() => {
    (async () => {
      try {
        const confetti = await getConfetti();
        if (!confetti) return;
        const colors = [domainOf(top1.domain).color, domainOf(top2.domain).color, "#FAD53C"];
        confetti({ particleCount: 100, spread: 80, origin: { y: 0.3 }, colors });
        setTimeout(() => confetti({ particleCount: 60, spread: 100, origin: { y: 0.2 }, colors }), 250);
      } catch {
        /* confetti is a nice-to-have; ignore if the CDN is unavailable */
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="ut-card" id="ut-report">
      <div className="ut-top-row">
        <img src={LOGO} alt="UniTracko" style={{ height: 20 }} />
        <button className="ut-ghost" onClick={() => window.print()}>Print / Save PDF</button>
      </div>
      <h1>{student.name}, here's your vibe 🔮</h1>
      <p className="ut-sub">
        Class {student.grade} ·{" "}
        {report.stream.declared
          ? `Stream: ${report.stream.stream}`
          : `Recommended stream: ${report.stream.stream} (based on your strengths — you haven't picked one yet)`}
      </p>

      <ShareCard student={student} top5={report.top5} />

      <div className="ut-report-headline">
        <div className="ut-headline-text">
          {domainOf(top1.domain).icon} You lead with <b>{top1.name}</b> ({top1.score}%), backed by <b>{top2.name}</b>.
          That combination of {top1.domain}-and-{top2.domain}-style strengths is worth building a path around.
        </div>
      </div>

      <h2>Domain overview</h2>
      <p className="ut-sub" style={{ marginBottom: 10 }}>How your strengths spread across the 5 domains.</p>
      <div className="ut-domain-overview">
        {report.byDomain.map((d) => (
          <div className="ut-domain-row" key={d.id} style={{ "--ut-domain": d.color }}>
            <span className="ut-d-icon">{d.icon}</span>
            <span className="ut-d-name">{d.name}</span>
            <span className="ut-d-track"><span className="ut-d-fill" style={{ width: `${d.avgScore}%`, background: d.color }} /></span>
            <span className="ut-d-pct">{d.avgScore}%</span>
          </div>
        ))}
      </div>

      <h2>Your top 5 strengths</h2>
      {report.top5.map((t, i) => (
        <div className="ut-strength-card" key={t.id} style={{ "--ut-domain": domainOf(t.domain).color }}>
          <div className="ut-domain-pill">{domainOf(t.domain).icon} {t.domain}</div>
          <div className="ut-strength-head">
            <h2>{t.icon} {i + 1}. {t.name}</h2>
            <span className="ut-strength-rank">{t.score}%</span>
          </div>
          <div className="ut-bar-track"><div className="ut-bar-fill" style={{ width: `${t.score}%` }} /></div>
          <p className="ut-sc-section">{t.description}</p>
          <p className="ut-sc-section"><b>In practice:</b> {t.inPractice}</p>
          <p className="ut-sc-section"><b>Where this leads:</b> {t.careerAngle}</p>
          <p className="ut-sc-section ut-sc-tip"><b>Try this:</b> {t.growthTip}</p>
        </div>
      ))}

      <h2 style={{ marginTop: 28 }}>Exams worth exploring</h2>
      <p className="ut-sub" style={{ marginBottom: 8 }}>
        Matched to your top strengths and {report.stream.declared ? "your declared stream" : "your recommended stream"}. Tap one to learn more.
      </p>
      <div className="ut-exam-legend">
        {[...new Map(report.exams.map((e) => [e.category, e.color])).entries()].map(([category, color]) => (
          <span key={category}><span className="ut-dot" style={{ background: color }} />{category}</span>
        ))}
      </div>
      <div className="ut-exam-grid">
        {report.exams.map((e) => (
          <a
            className="ut-exam-chip"
            key={e.abbr}
            href={e.url}
            target="_blank"
            rel="noopener noreferrer"
            title={e.name}
            style={{ "--ut-cat": e.color }}
          >
            {e.abbr}
          </a>
        ))}
      </div>
    </div>
  );
}

// onComplete (optional) fires with { student, report } after the report renders,
// so the host site can log the result to its own backend/CRM if needed.
export default function UniTrackoAssessment({ onComplete }) {
  const [stage, setStage] = useState("welcome"); // welcome | quiz | report
  const [student, setStudent] = useState(null);
  const [result, setResult] = useState(null); // { answers, questions }

  useEffect(() => {
    if (stage === "report" && onComplete && student && result) {
      const report = buildReport({
        name: student.name,
        grade: student.grade,
        declaredStream: student.stream,
        answers: result.answers,
        questions: result.questions,
      });
      onComplete({ student, report });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  return (
    <div className="unitracko-widget">
      {stage === "welcome" && <Welcome onStart={(s) => { setStudent(s); setStage("quiz"); }} />}
      {stage === "quiz" && <Questionnaire student={student} onFinish={(r) => { setResult(r); setStage("report"); }} />}
      {stage === "report" && <Report student={student} answers={result.answers} questions={result.questions} />}
    </div>
  );
}
