"use client";

import { useState, useEffect, useCallback, useRef, useMemo, KeyboardEvent } from "react";
import QRCode from "react-qr-code";
import {
  FiCopy, FiMail, FiCheck, FiX, FiSend, FiSearch,
} from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import { getMyReferralCode, sendReferralInvite, getMyReferralUses } from "@/api/referral";
import type { ReferralUse } from "@/api/types";

const PLATFORM = "UniTracko";

// ─── Email tag input ────────────────────────────────────────────────────────────

function EmailTagInput({
  tags,
  onChange,
  disabled,
}: {
  tags: string[];
  onChange: (t: string[]) => void;
  disabled?: boolean;
}) {
  const [val, setVal] = useState("");
  const [err, setErr] = useState("");
  const ref = useRef<HTMLInputElement>(null);

  const valid = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  const add = useCallback(
    (raw: string) => {
      const v = raw.trim().toLowerCase();
      if (!v) return;
      if (!valid(v)) return setErr("Invalid email");
      if (tags.includes(v)) return setErr("Already added");
      if (tags.length >= 10) return setErr("Max 10 recipients");
      onChange([...tags, v]);
      setVal("");
      setErr("");
    },
    [tags, onChange]
  );

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (["Enter", ",", "Tab"].includes(e.key)) {
      e.preventDefault();
      add(val);
    } else if (e.key === "Backspace" && !val && tags.length) {
      onChange(tags.slice(0, -1));
    } else {
      setErr("");
    }
  };

  return (
    <div>
      <div
        className="flex flex-wrap gap-1.5 min-h-[40px] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 cursor-text focus-within:ring-2 focus-within:ring-action-300 focus-within:border-action-500 transition-all"
        onClick={() => ref.current?.focus()}
      >
        {tags.map((t) => (
          <span
            key={t}
            className="inline-flex items-center gap-1 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 text-xs font-medium text-slate-700 dark:text-slate-300"
          >
            {t}
            {!disabled && (
              <button type="button" onClick={() => onChange(tags.filter((x) => x !== t))} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <FiX className="h-2.5 w-2.5" />
              </button>
            )}
          </span>
        ))}
        <input
          ref={ref}
          type="email"
          value={val}
          onChange={(e) => { setVal(e.target.value); setErr(""); }}
          onKeyDown={onKey}
          onBlur={() => val && add(val)}
          placeholder={tags.length ? "Add another…" : "Type email and press Enter…"}
          disabled={disabled}
          className="flex-1 min-w-[160px] bg-transparent text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 outline-none"
        />
      </div>
      {err && <p className="mt-1 text-xs text-red-500">{err}</p>}
    </div>
  );
}

// ─── Email composer modal ───────────────────────────────────────────────────────

type SendState = "idle" | "sending" | "success" | "partial" | "error";

function EmailModal({
  referralCode,
  emailSubject,
  onClose,
}: {
  referralCode: string;
  emailSubject: string;
  onClose: () => void;
}) {
  const [to, setTo] = useState<string[]>([]);
  const [state, setState] = useState<SendState>("idle");
  const [msg, setMsg] = useState("");

  const busy = state === "sending";
  const canSend = to.length > 0 && state === "idle";

  const send = async () => {
    if (!canSend) return;
    setState("sending");
    try {
      const res = await sendReferralInvite(to);
      if (res.success && res.data) {
        const { sent, failed } = res.data;
        if (!failed.length) {
          setState("success");
          setMsg(`Sent to ${sent.length} recipient${sent.length > 1 ? "s" : ""}.`);
          setTimeout(onClose, 2000);
        } else {
          setState("partial");
          setMsg(`Sent: ${sent.length}. Failed: ${failed.join(", ")}`);
        }
      } else {
        setState("error");
        setMsg(res.message || "Failed to send.");
      }
    } catch {
      setState("error");
      setMsg("Something went wrong.");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30 backdrop-blur-sm p-0 sm:p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl flex flex-col max-h-[92dvh] bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">New Message</p>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <FiX className="h-4 w-4" />
          </button>
        </div>

        {/* ── Compose fields ── */}
        <div className="shrink-0 border-b border-slate-100 dark:border-slate-800">
          {/* From */}
          <div className="flex items-center gap-3 px-5 py-2.5 border-b border-slate-100 dark:border-slate-800">
            <span className="w-12 text-xs text-slate-400 dark:text-slate-500 text-right shrink-0">From</span>
            <p className="text-sm text-slate-500 dark:text-slate-400">{PLATFORM}</p>
          </div>
          {/* To */}
          <div className="flex items-start gap-3 px-5 py-2.5 border-b border-slate-100 dark:border-slate-800">
            <span className="w-12 text-xs text-slate-400 dark:text-slate-500 text-right shrink-0 pt-2">To</span>
            <div className="flex-1 min-w-0">
              <EmailTagInput tags={to} onChange={setTo} disabled={busy} />
              <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
                Press Enter after each address · max 10
              </p>
            </div>
          </div>
          {/* Subject */}
          <div className="flex items-center gap-3 px-5 py-2.5">
            <span className="w-12 text-xs text-slate-400 dark:text-slate-500 text-right shrink-0">Subject</span>
            <p className="text-sm text-slate-600 dark:text-slate-300 truncate" title={emailSubject}>
              {emailSubject}
            </p>
          </div>
        </div>

        {/* ── Email body preview ── */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
            Preview
          </p>
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden text-left">
            {/* Mini header */}
            <div className="px-4 py-3 bg-gradient-to-r from-[#140E27] via-[#341050] to-[#9705F9] text-center">
              <p className="text-[9px] font-bold tracking-[3px] uppercase text-white/50 mb-0.5">You&rsquo;re Invited</p>
              <p className="text-sm font-bold text-white">{PLATFORM}</p>
              <p className="text-[10px] text-white/60">College Admissions &mdash; Simplified</p>
            </div>
            {/* Colour stripe */}
            <div className="flex h-1">
              <div className="flex-1 bg-[#9705F9]" />
              <div className="flex-1 bg-[#B903B8]" />
              <div className="flex-1 bg-[#DB0078]" />
            </div>
            {/* Body */}
            <div className="px-4 py-4 space-y-3 bg-white dark:bg-slate-900/60">
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                <strong>Hey there!</strong> Your friend thinks you&rsquo;d love {PLATFORM} — the smartest way to navigate college admissions.
              </p>
              {/* Code block */}
              <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 py-3 text-center">
                <p className="text-[9px] font-bold tracking-[2px] uppercase text-slate-500 dark:text-slate-400 mb-1">Referral Code</p>
                <p className="text-xl font-black tracking-[5px] text-slate-900 dark:text-slate-100 font-mono">{referralCode}</p>
              </div>
              {/* CTA */}
              <div className="text-center">
                <span className="inline-block rounded-lg px-4 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-[#140E27] to-[#9705F9]">
                  Create My Free Account →
                </span>
              </div>
            </div>
            {/* Footer */}
            <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-700/50 text-center">
              <p className="text-[10px] text-slate-400 dark:text-slate-500">
                © {new Date().getFullYear()} {PLATFORM}. All rights reserved.
              </p>
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="shrink-0 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-5 py-3.5">
          {state !== "idle" && state !== "sending" && (
            <div className={`mb-3 flex items-start gap-2 rounded-lg px-3 py-2 text-xs ${
              state === "success"
                ? "bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800/40"
                : state === "partial"
                ? "bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40"
                : "bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/40"
            }`}>
              {state === "success" && <FiCheck className="h-3.5 w-3.5 shrink-0 mt-0.5" />}
              {msg}
            </div>
          )}
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] text-slate-400 dark:text-slate-500">Sent via {PLATFORM} servers</p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={busy}
                className="px-3 py-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors disabled:opacity-40"
              >
                Discard
              </button>
              <button
                type="button"
                onClick={send}
                disabled={!canSend || busy}
                className="inline-flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-sm font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-brand-ink hover:bg-brand-ink/90 dark:bg-action-500 dark:hover:bg-action-600"
              >
                {busy ? (
                  <><span className="h-3 w-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />Sending…</>
                ) : (
                  <><FiSend className="h-3.5 w-3.5" />Send{to.length > 1 ? ` (${to.length})` : ""}</>
                )}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// ─── Referral Uses list (inside scroll region) ───────────────────────────────────

function ReferralUsesList({
  uses,
  searchQuery,
  totalCount,
}: {
  uses: ReferralUse[];
  searchQuery: string;
  totalCount: number;
}) {
  if (totalCount === 0) {
    return (
      <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-8 px-2">
        No sign-ups through your code yet. Share it and watch the list grow!
      </p>
    );
  }

  if (uses.length === 0) {
    return (
      <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-8 px-2">
        No results for &ldquo;{searchQuery}&rdquo;
      </p>
    );
  }

  return (
    <ul className="divide-y divide-slate-100 dark:divide-slate-800">
      {uses.map((u, i) => {
        const date = new Date(u.used_at);
        const formatted = date.toLocaleDateString(undefined, {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
        const time = date.toLocaleTimeString(undefined, {
          hour: "2-digit",
          minute: "2-digit",
        });
        return (
          <li key={`${u.used_by_email}-${u.used_at}-${i}`} className="flex items-center justify-between gap-3 py-2.5 px-1">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase">
                {u.used_by_email.charAt(0)}
              </span>
              <span className="text-sm text-slate-700 dark:text-slate-300 truncate" title={u.used_by_email}>
                {u.used_by_email}
              </span>
            </div>
            <span className="shrink-0 text-[11px] text-slate-400 dark:text-slate-500 whitespace-nowrap tabular-nums">
              {formatted} · {time}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

// ─── Main card ─────────────────────────────────────────────────────────────────

export default function ReferralCard() {
  const [code, setCode] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [whatsappShareText, setWhatsappShareText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const [uses, setUses] = useState<ReferralUse[]>([]);
  const [usesLoading, setUsesLoading] = useState(true);
  const [usesSearch, setUsesSearch] = useState("");

  const filteredUses = useMemo(() => {
    const q = usesSearch.trim().toLowerCase();
    if (!q) return uses;
    return uses.filter((u) => u.used_by_email.toLowerCase().includes(q));
  }, [uses, usesSearch]);

  useEffect(() => {
    getMyReferralCode().then((res) => {
      if (res.success && res.data) {
        setCode(res.data.referralCode);
        setShareUrl(res.data.shareUrl);
        setEmailSubject(
          res.data.emailSubject ||
            `Your friend invited you to join ${PLATFORM}`
        );
        setWhatsappShareText(
          res.data.whatsappShareText ||
            `Join me on ${PLATFORM}!\n\nUse my referral code *${res.data.referralCode}* when signing up:\n${res.data.shareUrl}`
        );
      } else {
        setError(res.message || "Could not load referral code");
      }
    }).catch(() => setError("Failed to fetch referral code"))
      .finally(() => setLoading(false));

    getMyReferralUses().then((res) => {
      if (res.success && res.data) {
        setUses(res.data.uses);
      }
    }).catch(() => {})
      .finally(() => setUsesLoading(false));
  }, []);

  const copy = useCallback(async () => {
    if (!code) return;
    await navigator.clipboard.writeText(code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  const waHref =
    code && whatsappShareText
      ? `https://wa.me/?text=${encodeURIComponent(whatsappShareText)}`
      : "#";

  if (loading) {
    return (
      <article className="rounded-2xl bg-white dark:bg-slate-900 p-5 space-y-4 animate-pulse">
        <div className="h-5 w-36 rounded-md bg-slate-200 dark:bg-slate-700" />
        <div className="h-3 w-72 rounded-md bg-slate-100 dark:bg-slate-800" />
        <div className="h-16 rounded-xl bg-slate-100 dark:bg-slate-800" />
        <div className="grid gap-6 lg:grid-cols-2 lg:items-stretch">
          <div className="space-y-3 rounded-xl border border-slate-100 dark:border-slate-800 p-4 lg:min-h-[320px]">
            <div className="h-16 rounded-xl bg-slate-100 dark:bg-slate-800" />
            <div className="mx-auto h-48 w-48 rounded-xl bg-slate-100 dark:bg-slate-800" />
            <div className="grid grid-cols-2 gap-3">
              <div className="h-9 rounded-lg bg-slate-100 dark:bg-slate-800" />
              <div className="h-9 rounded-lg bg-slate-100 dark:bg-slate-800" />
            </div>
          </div>
          <div className="min-h-[280px] rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 lg:min-h-[320px]" />
        </div>
      </article>
    );
  }

  if (error) {
    return (
      <article className="rounded-2xl bg-white dark:bg-slate-900 p-5 text-sm text-slate-500 dark:text-slate-400">
        {error}
      </article>
    );
  }

  return (
    <>
      {showModal && code && (
        <EmailModal
          referralCode={code}
          emailSubject={emailSubject || `Your friend invited you to join ${PLATFORM}`}
          onClose={() => setShowModal(false)}
        />
      )}

      <article className="rounded-2xl bg-white dark:bg-slate-900 p-5">

        {/* Title */}
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">
          Refer &amp; Earn
        </h2>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-5">
          Invite friends to {PLATFORM} and help them get started on their admissions journey.
        </p>

        {/* Two columns: code + QR + share (left) · sign-ups (right) — equal height on lg */}
        <div className="grid gap-6 lg:grid-cols-2 lg:gap-8 lg:items-stretch">
          {/* ── Left: referral code + QR + share ── */}
          <div className="flex h-full min-h-0 flex-col items-center lg:items-stretch rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/20 p-5">
            {/* Referral code */}
            <div className="flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-3.5 mb-5">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-0.5">
                  Your Referral Code
                </p>
                <p className="text-xl sm:text-2xl font-black tracking-[3px] sm:tracking-[4px] text-slate-900 dark:text-slate-100 font-mono leading-none truncate">
                  {code}
                </p>
              </div>
              <button
                type="button"
                onClick={copy}
                className={`shrink-0 inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-semibold transition-all ${
                  copied
                    ? "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950/30 dark:text-green-400"
                    : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:shadow-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                {copied
                  ? <><FiCheck className="h-3.5 w-3.5" />Copied</>
                  : <><FiCopy className="h-3.5 w-3.5" />Copy</>}
              </button>
            </div>

            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 text-center lg:text-left mb-3 w-full">
              Scan to sign up
            </p>
            <div className="flex justify-center mb-3">
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white p-4 shadow-sm">
                <QRCode value={shareUrl} size={176} fgColor="#0f172a" bgColor="#ffffff" level="M" />
              </div>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center mb-5 max-w-xs mx-auto lg:mx-0 lg:max-w-none lg:text-left">
              Opens sign-up with your referral code pre-filled
            </p>

            {/* Grows so Share via stays at bottom when column matches right panel height */}
            <div className="min-h-0 flex-1 w-full" aria-hidden />

            <div className="flex items-center gap-3 mb-3 w-full shrink-0">
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
              <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500 shrink-0">
                Share via
              </span>
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
            </div>

            <div className="grid grid-cols-2 gap-3 w-full shrink-0">
              <button
                type="button"
                onClick={() => setShowModal(true)}
                className="flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-200 ease-out hover:bg-slate-50 hover:shadow dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <FiMail className="h-4 w-4 shrink-0" />
                Send Email
              </button>
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-200 ease-out hover:bg-slate-50 hover:shadow dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <FaWhatsapp className="h-4 w-4 shrink-0 text-[#25D366]" />
                WhatsApp
              </a>
            </div>
          </div>

          {/* ── Right: sign-ups (search + scroll) ── */}
          <div className="flex h-full min-h-0 flex-col rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden">
            <div className="shrink-0 border-b border-slate-100 dark:border-slate-800 px-4 py-3">
              <div className="flex items-center justify-between gap-3 mb-3">
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Sign-ups via your code
                </h3>
                {!usesLoading && uses.length > 0 && (
                  <span className="inline-flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-xs font-semibold text-slate-600 dark:text-slate-300 tabular-nums">
                    {uses.length}
                  </span>
                )}
              </div>
              <div className="relative">
                <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
                <input
                  type="search"
                  value={usesSearch}
                  onChange={(e) => setUsesSearch(e.target.value)}
                  placeholder="Search by email…"
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/60 py-2 pl-9 pr-3 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-200 dark:focus:border-slate-500 dark:focus:ring-slate-700/50"
                  disabled={usesLoading || uses.length === 0}
                  aria-label="Search referred users by email"
                />
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 py-2">
              {usesLoading ? (
                <div className="space-y-2 py-2">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3 animate-pulse px-1 py-2">
                      <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 shrink-0" />
                      <div className="flex-1 h-3 rounded bg-slate-100 dark:bg-slate-800" />
                      <div className="h-3 w-20 rounded bg-slate-100 dark:bg-slate-800 shrink-0" />
                    </div>
                  ))}
                </div>
              ) : (
                <ReferralUsesList
                  uses={filteredUses}
                  searchQuery={usesSearch.trim()}
                  totalCount={uses.length}
                />
              )}
            </div>
          </div>
        </div>

      </article>
    </>
  );
}
