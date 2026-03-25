"use client";

import {
  downloadScrapedLoansExcel,
  getScrapedLoanBanks,
  getScrapedLoanBySlug,
} from "@/api/admin/loans";
import { useCallback, useEffect, useState } from "react";

/**
 * Lender logos (Clearbit company logos). Falls back to initials if image fails to load.
 * Domains are approximate brand sites; swap for your own CDN URLs if needed.
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
      {!sm && <span className="text-sm">Scraping…</span>}
    </span>
  );
}

function LenderLogo({ slug, name }) {
  const url = LENDER_LOGO_URLS[slug];
  const [failed, setFailed] = useState(false);

  const initials = name
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

export default function LoansScrapedPage() {
  const [banksError, setBanksError] = useState(null);
  const [rows, setRows] = useState([]);
  const [selectedSlug, setSelectedSlug] = useState(null);
  const [downloadingExcel, setDownloadingExcel] = useState(false);

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

  const selectedRow = selectedSlug ? rows.find((r) => r.slug === selectedSlug) : null;
  const detailEntries =
    selectedRow?.details &&
    Object.entries(selectedRow.details).filter(([k]) => k !== "bank");

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gyandhan — scraped lenders</h1>
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
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 list-none p-0 m-0">
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
                        <h2 className="font-semibold text-gray-900 leading-tight">{row.name}</h2>
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
                    <h2 id="lender-detail-heading" className="text-lg font-bold text-gray-900">
                      {selectedRow.name}
                    </h2>
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
    </div>
  );
}
