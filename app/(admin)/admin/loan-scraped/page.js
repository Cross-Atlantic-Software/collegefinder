"use client";

import {
  downloadBankbazaarScrapedExcel,
  downloadPaisabazaarScrapedExcel,
  downloadScrapedLoansExcel,
  getBankbazaarEducationLoansScraped,
  getPaisabazaarEducationLoansScraped,
  getScrapedLoanBanks,
  getScrapedLoanBySlug,
} from "@/api/admin/loans";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Lender logos (Clearbit company logos). Falls back to initials if image fails to load.
 */
const LENDER_LOGO_URLS = {
  "sbi-education-loan": "https://logo.clearbit.com/sbi.co.in",
  "axis-education-loan": "https://logo.clearbit.com/axisbank.com",
  "icici-education-loan": "https://logo.clearbit.com/icicibank.com",
  "idfc-education-loan": "https://logo.clearbit.com/idfcfirstbank.com",
  "ubi-education-loan": "https://logo.clearbit.com/unionbankofindia.co.in",
  "credila-education-loan": "https://logo.clearbit.com/credila.com",
  "auxilo-education-loan": "https://logo.clearbit.com/auxilo.com",
  "avanse-education-loan": "https://logo.clearbit.com/avanse.com",
  "incred-education-loan": "https://logo.clearbit.com/incred.com",
  "mpower-financing-education-loan": "https://logo.clearbit.com/mpowerfinancing.com",
  "prodigy-finance-education-loan": "https://logo.clearbit.com/prodigyfinance.com",
  "bob-education-loan": "https://logo.clearbit.com/bankofbaroda.in",
  "tata-capital-education-loan": "https://logo.clearbit.com/tatacapital.com",
  "yes-bank-education-loan": "https://logo.clearbit.com/yesbank.in",
  "pnb-education-loan": "https://logo.clearbit.com/pnbindia.in",
  "poonawalla-fincorp-education-loan": "https://logo.clearbit.com/poonawallafincorp.com",
};

function Spinner({ sm }) {
  return (
    <span className="inline-flex items-center gap-2 text-gray-600">
      <span
        className={`inline-block animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 ${sm ? "h-3.5 w-3.5" : "h-4 w-4"}`}
        aria-hidden
      />
      {!sm && <span className="text-sm">Loading…</span>}
    </span>
  );
}

function LenderLogo({ slug, name }) {
  const url = LENDER_LOGO_URLS[slug];
  const [failed, setFailed] = useState(false);

  const initials =
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase() || "?";

  if (!url || failed) {
    return (
      <div
        className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 text-sm font-bold text-slate-600 shadow-inner"
        aria-hidden
      >
        {initials}
      </div>
    );
  }

  return (
    <img
      src={url}
      alt=""
      className="h-16 w-16 shrink-0 rounded-xl border border-gray-100 bg-white object-contain p-1.5 shadow-sm"
      onError={() => setFailed(true)}
    />
  );
}

function GyandhanTab({
  banksError,
  rows,
  selectedSlug,
  setSelectedSlug,
  downloadingExcel,
  fetchOne,
  refreshAll,
  handleDownloadExcel,
}) {
  const selectedRow = selectedSlug ? rows.find((r) => r.slug === selectedSlug) : null;
  const detailEntries =
    selectedRow?.details &&
    Object.entries(selectedRow.details).filter(([k]) => k !== "bank");

  return (
    <>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Gyandhan — scraped lenders</h2>
          <p className="mt-1 text-sm text-gray-600">
            Tap a card to view scraped fields. Each lender loads separately to avoid timeouts.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadExcel}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-800 shadow-sm hover:bg-gray-50 disabled:opacity-50"
            disabled={downloadingExcel}
          >
            {downloadingExcel ? "Preparing Excel..." : "Download Excel"}
          </button>
          <button
            type="button"
            onClick={refreshAll}
            className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
            disabled={rows.length === 0}
          >
            Refresh all
          </button>
        </div>
      </div>

      {banksError && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
          {banksError}
        </div>
      )}

      {rows.length === 0 && !banksError ? (
        <p className="text-gray-500">Loading lender list…</p>
      ) : rows.length === 0 ? null : (
        <div className="space-y-8">
          <ul className="grid list-none gap-4 p-0 m-0 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {rows.map((row) => {
              const isSelected = selectedSlug === row.slug;
              return (
                <li key={row.slug}>
                  <button
                    type="button"
                    onClick={() => setSelectedSlug((s) => (s === row.slug ? null : row.slug))}
                    className={`flex w-full flex-col gap-3 rounded-2xl border bg-white p-4 text-left shadow-sm transition-all hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
                      isSelected
                        ? "border-blue-500 ring-2 ring-blue-100"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <LenderLogo key={row.slug} slug={row.slug} name={row.name} />
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-gray-900 leading-tight">{row.name}</h3>
                        <p className="mt-1 text-xs text-gray-500 truncate" title={row.slug}>
                          {row.slug}
                        </p>
                        <div className="mt-2">
                          {row.loading ? (
                            <Spinner sm />
                          ) : row.error ? (
                            <span className="text-xs font-medium text-red-600">{row.error}</span>
                          ) : (
                            <span className="text-xs font-medium text-emerald-600">Data ready</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400">
                      {isSelected ? "Tap again to hide details" : "Tap to view scraped details"}
                    </p>
                  </button>
                </li>
              );
            })}
          </ul>

          {selectedRow && (
            <section
              className="rounded-2xl border border-gray-200 bg-gradient-to-b from-white to-slate-50/80 p-6 shadow-lg"
              aria-labelledby="lender-detail-heading"
            >
              <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-4">
                <div className="flex items-center gap-4">
                  <LenderLogo key={selectedRow.slug} slug={selectedRow.slug} name={selectedRow.name} />
                  <div>
                    <h3 id="lender-detail-heading" className="text-lg font-bold text-gray-900">
                      {selectedRow.name}
                    </h3>
                    <p className="text-sm text-gray-500">Raw fields from Gyandhan tables</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fetchOne(selectedRow.slug)}
                    disabled={selectedRow.loading}
                    className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Refresh this lender
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedSlug(null)}
                    className="rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800"
                  >
                    Close
                  </button>
                </div>
              </div>

              {selectedRow.loading ? (
                <div className="flex items-center gap-2 py-8 text-gray-600">
                  <Spinner />
                </div>
              ) : selectedRow.error ? (
                <p className="text-red-600">{selectedRow.error}</p>
              ) : detailEntries?.length ? (
                <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {detailEntries.map(([k, v]) => (
                    <div
                      key={k}
                      className="rounded-xl border border-gray-100 bg-white/80 p-4 shadow-sm"
                    >
                      <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        {k}
                      </dt>
                      <dd className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-gray-900">
                        {String(v)}
                      </dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="text-gray-500">No fields scraped for this lender.</p>
              )}
            </section>
          )}
        </div>
      )}
    </>
  );
}

function schemeTitleForList(title) {
  return String(title || "").replace(/^\d+\.\s*/, "").trim() || String(title || "");
}

function bankbazaarHasDetails(details) {
  const d = details || {};
  if (Array.isArray(d.schemes) && d.schemes.length) return true;
  const intro = String(d.intro || d.description || "").trim();
  if (intro) return true;
  return ["eligibility", "maxLoan", "repayment", "features"].some((k) => d[k] && String(d[k]).trim());
}

/** Same data as Excel `intro` + `schemes` columns — used in modal only. */
function BankbazaarDetailsContent({ details, size = "sm" }) {
  const d = details || {};
  const schemes = Array.isArray(d.schemes) ? d.schemes : [];
  const intro = String(d.intro || d.description || "").trim();
  const textMain = size === "md" ? "text-sm" : "text-xs";
  const textMuted = size === "md" ? "text-sm text-gray-700" : "text-xs text-gray-700";

  if (schemes.length) {
    return (
      <div className={`max-w-none space-y-3 ${textMain} text-gray-800`}>
        {intro ? <p className={`leading-relaxed ${textMuted}`}>{intro}</p> : null}
        <ol className="list-decimal space-y-3 pl-4 marker:font-semibold">
          {schemes.map((s, idx) => (
            <li key={`${s.title}-${idx}`} className="pl-1">
              <span className="font-semibold text-gray-900">{schemeTitleForList(s.title)}</span>
              {s.summary ? (
                <p className={`mt-1 whitespace-pre-wrap leading-relaxed ${textMuted}`}>{s.summary}</p>
              ) : null}
            </li>
          ))}
        </ol>
      </div>
    );
  }

  if (intro) {
    return (
      <p className={`max-w-none whitespace-pre-wrap leading-relaxed ${textMain} text-gray-800`}>{intro}</p>
    );
  }

  const fields = [
    ["Eligibility", d.eligibility],
    ["Max loan", d.maxLoan],
    ["Repayment", d.repayment],
    ["Features", d.features],
  ].filter(([, v]) => v && String(v).trim());

  if (!fields.length) {
    return <span className="text-sm text-gray-400">No details scraped for this bank.</span>;
  }

  return (
    <dl className={`max-w-none space-y-2 ${textMain} text-gray-800`}>
      {fields.map(([label, val]) => (
        <div key={label}>
          <dt className="font-semibold text-gray-600">{label}</dt>
          <dd className="mt-0.5 whitespace-pre-wrap leading-relaxed">{val}</dd>
        </div>
      ))}
    </dl>
  );
}

function BankbazaarTab({
  bbRows,
  bbError,
  bbLoading,
  loadBankbazaar,
  downloadingBbExcel,
  onDownloadExcel,
}) {
  const [detailModal, setDetailModal] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!detailModal) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") setDetailModal(null);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [detailModal]);

  const modal =
    mounted &&
    detailModal &&
    createPortal(
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4"
        role="presentation"
        onClick={() => setDetailModal(null)}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="bb-detail-modal-title"
          className="max-h-[min(90vh,880px)] w-full max-w-3xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-4 border-b border-gray-100 bg-violet-50/60 px-5 py-4">
            <h2 id="bb-detail-modal-title" className="text-lg font-semibold text-gray-900">
              {detailModal.bank}
            </h2>
            <button
              type="button"
              onClick={() => setDetailModal(null)}
              className="shrink-0 rounded-lg px-2 py-1 text-sm font-medium text-gray-600 hover:bg-white/80 hover:text-gray-900"
            >
              Close
            </button>
          </div>
          <div className="max-h-[min(78vh,720px)] overflow-y-auto px-5 py-4">
            <BankbazaarDetailsContent details={detailModal.details} size="md" />
          </div>
        </div>
      </div>,
      document.body
    );

  return (
    <>
      {modal}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">BankBazaar — education loan</h2>
          <p className="mt-1 text-sm text-gray-600">
            List from{" "}
            <span className="font-mono text-xs text-gray-500">bankbazaar.com/education-loan.html</span>
            , then each bank page (throttled). First load may take a few minutes.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onDownloadExcel}
            disabled={downloadingBbExcel}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-800 shadow-sm hover:bg-gray-50 disabled:opacity-50"
          >
            {downloadingBbExcel ? "Preparing Excel…" : "Download Excel"}
          </button>
          <button
            type="button"
            onClick={() => loadBankbazaar()}
            disabled={bbLoading}
            className="rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-violet-700 disabled:opacity-50"
          >
            {bbLoading ? "Scraping…" : "Refresh"}
          </button>
        </div>
      </div>

      {bbError && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
          {bbError}
        </div>
      )}

      {bbLoading && bbRows.length === 0 ? (
        <div className="flex items-center gap-2 py-12 text-gray-600">
          <Spinner />
        </div>
      ) : bbRows.length === 0 ? (
        <p className="text-gray-500">No banks parsed from the comparison table.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
          <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 font-semibold text-gray-900">Bank</th>
                <th className="px-4 py-3 font-semibold text-gray-900">Interest</th>
                <th className="px-4 py-3 font-semibold text-gray-900">Processing fees</th>
                <th className="px-4 py-3 font-semibold text-gray-900">Range (min–max %)</th>
                <th className="px-4 py-3 font-semibold text-gray-900">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {bbRows.map((row, i) => (
                <tr key={`${row.bank}-${i}`} className="align-top">
                  <td className="px-4 py-3 font-medium text-gray-900">{row.bank}</td>
                  <td className="whitespace-pre-wrap px-4 py-3 text-gray-700">{row.interestRate || "—"}</td>
                  <td className="px-4 py-3 text-gray-700">{row.processingFees || "—"}</td>
                  <td className="px-4 py-3 text-gray-700">
                    {row.interestRange &&
                    row.interestRange.min != null &&
                    row.interestRange.max != null ? (
                      <>
                        {row.interestRange.min} – {row.interestRange.max}
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {bankbazaarHasDetails(row.details) ? (
                      <button
                        type="button"
                        onClick={() => setDetailModal({ bank: row.bank, details: row.details })}
                        className="rounded-lg border border-violet-200 bg-violet-50 px-3 py-1.5 text-sm font-medium text-violet-800 shadow-sm hover:bg-violet-100"
                      >
                        View details
                      </button>
                    ) : (
                      <span className="text-sm text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function PaisabazaarTab({
  paiseRows,
  paiseError,
  paiseLoading,
  loadPaisabazaar,
  downloadingPaiseExcel,
  onDownloadExcel,
}) {
  return (
    <>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Paisabazaar — education loan</h2>
          <p className="mt-1 text-sm text-gray-600">
            Live scrape from{" "}
            <span className="font-mono text-xs text-gray-500">paisabazaar.com/education-loan/</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onDownloadExcel}
            disabled={downloadingPaiseExcel}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-800 shadow-sm hover:bg-gray-50 disabled:opacity-50"
          >
            {downloadingPaiseExcel ? "Preparing Excel…" : "Download Excel"}
          </button>
          <button
            type="button"
            onClick={() => loadPaisabazaar()}
            disabled={paiseLoading}
            className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
          >
            {paiseLoading ? "Scraping…" : "Refresh"}
          </button>
        </div>
      </div>

      {paiseError && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
          {paiseError}
        </div>
      )}

      {paiseLoading && paiseRows.length === 0 ? (
        <div className="flex items-center gap-2 py-12 text-gray-600">
          <Spinner />
        </div>
      ) : paiseRows.length === 0 ? (
        <p className="text-gray-500">No bank tables parsed.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
          <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 font-semibold text-gray-900">Bank</th>
                <th className="px-4 py-3 font-semibold text-gray-900">Interest rates</th>
                <th className="px-4 py-3 font-semibold text-gray-900">Max loan</th>
                <th className="px-4 py-3 font-semibold text-gray-900">Repayment</th>
                <th className="px-4 py-3 font-semibold text-gray-900">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {paiseRows.map((row, i) => (
                <tr key={`${row.bank}-${i}`} className="align-top">
                  <td className="px-4 py-3 font-medium text-gray-900">{row.bank}</td>
                  <td className="px-4 py-3 text-gray-700">
                    {Array.isArray(row.interestRates) && row.interestRates.length ? (
                      <ul className="list-disc pl-4">
                        {row.interestRates.map((r) => (
                          <li key={r}>{r}</li>
                        ))}
                      </ul>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="max-w-xs px-4 py-3 whitespace-pre-wrap text-gray-700">
                    {row.maxLoan || "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{row.repayment || "—"}</td>
                  <td className="max-w-md px-4 py-3 text-gray-600">{row.description || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

export default function LoansScrapedPage() {
  const [activeTab, setActiveTab] = useState("gyandhan");

  const [banksError, setBanksError] = useState(null);
  const [rows, setRows] = useState([]);
  const [selectedSlug, setSelectedSlug] = useState(null);
  const [downloadingExcel, setDownloadingExcel] = useState(false);

  const [paiseRows, setPaiseRows] = useState([]);
  const [paiseError, setPaiseError] = useState(null);
  const [paiseLoading, setPaiseLoading] = useState(false);
  const [paiseLoadedOnce, setPaiseLoadedOnce] = useState(false);

  const [bbRows, setBbRows] = useState([]);
  const [bbError, setBbError] = useState(null);
  const [bbLoading, setBbLoading] = useState(false);
  const [bbLoadedOnce, setBbLoadedOnce] = useState(false);
  const [downloadingPaiseExcel, setDownloadingPaiseExcel] = useState(false);
  const [downloadingBbExcel, setDownloadingBbExcel] = useState(false);

  const applyRowResult = useCallback((slug, res) => {
    setRows((prev) =>
      prev.map((r) =>
        r.slug === slug
          ? {
              ...r,
              loading: false,
              details: res.success ? res.data : null,
              error: res.success ? null : res.message || "Failed",
            }
          : r
      )
    );
  }, []);

  const fetchOne = useCallback(
    async (slug) => {
      setRows((prev) =>
        prev.map((r) => (r.slug === slug ? { ...r, loading: true, error: null } : r))
      );
      const res = await getScrapedLoanBySlug(slug);
      applyRowResult(slug, res);
    },
    [applyRowResult]
  );

  const loadBanksAndScrape = useCallback(async () => {
    setBanksError(null);
    setSelectedSlug(null);
    try {
      const listRes = await getScrapedLoanBanks();
      if (!listRes.success || !Array.isArray(listRes.data)) {
        setRows([]);
        setBanksError(listRes.message || "Could not load lender list");
        return;
      }
      const banks = listRes.data;
      setRows(
        banks.map((b) => ({
          name: b.name,
          slug: b.slug,
          details: null,
          loading: true,
          error: null,
        }))
      );
      await Promise.all(
        banks.map(async (b) => {
          const res = await getScrapedLoanBySlug(b.slug);
          applyRowResult(b.slug, res);
        })
      );
    } catch (e) {
      console.error(e);
      setBanksError(e?.message || "Failed to load");
      setRows([]);
    }
  }, [applyRowResult]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      void loadBanksAndScrape();
    }, 0);
    return () => window.clearTimeout(id);
  }, [loadBanksAndScrape]);

  const loadPaisabazaar = useCallback(async () => {
    setPaiseError(null);
    setPaiseLoading(true);
    try {
      const res = await getPaisabazaarEducationLoansScraped();
      if (!res.success || !Array.isArray(res.data)) {
        setPaiseRows([]);
        setPaiseError(res.message || "Could not load Paisabazaar data");
        return;
      }
      setPaiseRows(res.data);
      setPaiseLoadedOnce(true);
    } catch (e) {
      console.error(e);
      setPaiseRows([]);
      setPaiseError(e?.message || "Failed to load");
    } finally {
      setPaiseLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab !== "paisabazaar" || paiseLoadedOnce || paiseLoading) return;
    void loadPaisabazaar();
  }, [activeTab, paiseLoadedOnce, paiseLoading, loadPaisabazaar]);

  const loadBankbazaar = useCallback(async () => {
    setBbError(null);
    setBbLoading(true);
    try {
      const res = await getBankbazaarEducationLoansScraped();
      if (!res.success || !Array.isArray(res.data)) {
        setBbRows([]);
        setBbError(res.message || "Could not load BankBazaar data");
        return;
      }
      setBbRows(res.data);
      setBbLoadedOnce(true);
    } catch (e) {
      console.error(e);
      setBbRows([]);
      setBbError(e?.message || "Failed to load");
    } finally {
      setBbLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab !== "bankbazaar" || bbLoadedOnce || bbLoading) return;
    void loadBankbazaar();
  }, [activeTab, bbLoadedOnce, bbLoading, loadBankbazaar]);

  const refreshAll = () => loadBanksAndScrape();
  const handleDownloadExcel = async () => {
    try {
      setDownloadingExcel(true);
      await downloadScrapedLoansExcel();
    } catch (err) {
      setBanksError(err?.message || "Failed to download scraped Excel");
    } finally {
      setDownloadingExcel(false);
    }
  };

  const handleDownloadPaiseExcel = async () => {
    try {
      setDownloadingPaiseExcel(true);
      setPaiseError(null);
      await downloadPaisabazaarScrapedExcel();
    } catch (err) {
      setPaiseError(err?.message || "Failed to download Paisabazaar Excel");
    } finally {
      setDownloadingPaiseExcel(false);
    }
  };

  const handleDownloadBbExcel = async () => {
    try {
      setDownloadingBbExcel(true);
      setBbError(null);
      await downloadBankbazaarScrapedExcel();
    } catch (err) {
      setBbError(err?.message || "Failed to download BankBazaar Excel");
    } finally {
      setDownloadingBbExcel(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Loan scraped data</h1>
        <p className="mt-1 text-sm text-gray-600">
          Compare sources: Gyandhan, Paisabazaar, and BankBazaar education loan pages.
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2 border-b border-gray-200 pb-1">
        <button
          type="button"
          onClick={() => setActiveTab("gyandhan")}
          className={`rounded-t-lg px-4 py-2.5 text-sm font-medium transition-colors ${
            activeTab === "gyandhan"
              ? "border-b-2 border-blue-600 text-blue-700"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Gyandhan
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("paisabazaar")}
          className={`rounded-t-lg px-4 py-2.5 text-sm font-medium transition-colors ${
            activeTab === "paisabazaar"
              ? "border-b-2 border-emerald-600 text-emerald-700"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Paisabazaar
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("bankbazaar")}
          className={`rounded-t-lg px-4 py-2.5 text-sm font-medium transition-colors ${
            activeTab === "bankbazaar"
              ? "border-b-2 border-violet-600 text-violet-700"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          BankBazaar
        </button>
      </div>

      {activeTab === "gyandhan" && (
        <GyandhanTab
          banksError={banksError}
          rows={rows}
          selectedSlug={selectedSlug}
          setSelectedSlug={setSelectedSlug}
          downloadingExcel={downloadingExcel}
          fetchOne={fetchOne}
          refreshAll={refreshAll}
          handleDownloadExcel={handleDownloadExcel}
        />
      )}

      {activeTab === "paisabazaar" && (
        <PaisabazaarTab
          paiseRows={paiseRows}
          paiseError={paiseError}
          paiseLoading={paiseLoading}
          loadPaisabazaar={loadPaisabazaar}
          downloadingPaiseExcel={downloadingPaiseExcel}
          onDownloadExcel={handleDownloadPaiseExcel}
        />
      )}

      {activeTab === "bankbazaar" && (
        <BankbazaarTab
          bbRows={bbRows}
          bbError={bbError}
          bbLoading={bbLoading}
          loadBankbazaar={loadBankbazaar}
          downloadingBbExcel={downloadingBbExcel}
          onDownloadExcel={handleDownloadBbExcel}
        />
      )}
    </div>
  );
}
