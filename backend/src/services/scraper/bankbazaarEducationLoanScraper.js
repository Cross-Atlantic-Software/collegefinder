const axios = require("axios");
const cheerio = require("cheerio");

const BANKBAZAAR_ORIGIN = "https://www.bankbazaar.com";
const LIST_URL = `${BANKBAZAAR_ORIGIN}/education-loan.html`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const randomDelay = async (min = 500, max = 1000) => {
  await sleep(Math.floor(Math.random() * (max - min + 1)) + min);
};

const norm = (v) =>
  String(v || "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();

function stripPa(str) {
  return norm(str.replace(/\s*p\.a\.?\s*/gi, " "));
}

function cleanBankName(text) {
  return stripPa(
    String(text || "")
      .replace(/\bEducation\s+Loan\b/gi, "")
      .replace(/\s+/g, " ")
      .trim()
  );
}

function toAbsoluteUrl(href) {
  if (!href || typeof href !== "string") return "";
  const h = href.trim();
  if (/^https?:\/\//i.test(h)) return h;
  if (h.startsWith("//")) return `https:${h}`;
  if (h.startsWith("/")) return `${BANKBAZAAR_ORIGIN}${h}`;
  return `${BANKBAZAAR_ORIGIN}/${h.replace(/^\.\//, "")}`;
}

function parseInterestRangeString(rateText) {
  const cleaned = stripPa(rateText);
  const nums = (cleaned.match(/[\d.]+/g) || []).map((n) => parseFloat(n)).filter((n) => !Number.isNaN(n));
  if (nums.length === 0) return { min: null, max: null };
  return { min: Math.min(...nums), max: Math.max(...nums) };
}

async function fetchHtml(url) {
  const { data } = await axios.get(url, {
    headers: {
      "User-Agent": "Mozilla/5.0",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
    timeout: 45000,
    maxRedirects: 5,
    validateStatus: (s) => s >= 200 && s < 400,
  });
  return typeof data === "string" ? data : String(data ?? "");
}

/**
 * Find comparison table: data-testid="table-" prefix (React-style ids).
 */
function findComparisonTable($) {
  let $table = $('table[data-testid^="table-"]').first();
  if (!$table.length) {
    $table = $('table[data-testid="table-"]').first();
  }
  if (!$table.length) {
    $("table").each((_, el) => {
      if ($table.length) return;
      const $t = $(el);
      const hasLink = $t.find('tbody a[href*="education-loan"]').length > 0;
      const hasRate = /%|p\.a\.|interest|processing/i.test($t.text());
      if (hasLink && hasRate) {
        $table = $t;
      }
    });
  }
  return $table;
}

/**
 * Parse list page → banks with link, rate, fees.
 */
function parseBankRowsFromListHtml(html) {
  const $ = cheerio.load(html);
  const $table = findComparisonTable($);
  if (!$table.length) return [];

  const rows = [];
  $table.find("tbody tr").each((_, tr) => {
    const $tr = $(tr);
    const $a = $tr.find("a[href]").first();
    if (!$a.length) return;

    const href = $a.attr("href") || "";
    if (!/education-loan/i.test(href)) return;

    const bankLink = toAbsoluteUrl(href);
    const rawName = norm($a.text());
    const bank = cleanBankName(rawName) || rawName;

    const $cells = $tr.find("td");
    const texts = [];
    $cells.each((__, td) => {
      texts.push(norm($(td).text()));
    });

    let interestRate = "";
    let processingFees = "";
    if (texts.length >= 3) {
      interestRate = stripPa(texts[1] || "");
      processingFees = stripPa(texts[2] || "");
    } else if (texts.length === 2) {
      interestRate = stripPa(texts[1] || "");
    }

    rows.push({ bank, bankLink, interestRate, processingFees });
  });

  const seen = new Set();
  return rows.filter((r) => {
    if (!r.bankLink || seen.has(r.bankLink)) return false;
    seen.add(r.bankLink);
    return true;
  });
}

async function getBankList() {
  const html = await fetchHtml(LIST_URL);
  return parseBankRowsFromListHtml(html);
}

const MAX_INTRO_LEN = 420;
const MAX_SCHEME_BODY = 4500;

function shortIntroAfterH1($) {
  const meta = norm($('meta[name="description"]').attr("content") || "");
  if (meta) {
    return meta.length > MAX_INTRO_LEN
      ? `${meta.slice(0, MAX_INTRO_LEN).replace(/\s+\S*$/, "")}…`
      : meta;
  }
  const $h1 = $("h1").first();
  if (!$h1.length) return "";
  let combined = "";
  let $anchor = $h1;
  for (let depth = 0; depth < 10 && combined.length < MAX_INTRO_LEN; depth += 1) {
    $anchor.nextAll().each((_, el) => {
      const tag = el.tagName && String(el.tagName).toLowerCase();
      if (tag === "h2" || tag === "h3") return false;
      if (tag === "p") {
        const t = norm($(el).text());
        if (t) combined += `${combined ? " " : ""}${t}`;
      }
      return undefined;
    });
    if (combined.trim()) break;
    $anchor = $anchor.parent();
    if (!$anchor.length || $anchor.is("body, html")) break;
  }
  combined = norm(combined);
  if (combined.length > MAX_INTRO_LEN) {
    return `${combined.slice(0, MAX_INTRO_LEN).replace(/\s+\S*$/, "")}…`;
  }
  return combined;
}

function isSchemeHeading(title) {
  const t = norm(title);
  if (!t) return false;
  const lower = t.toLowerCase();
  if (/^key points$/i.test(t)) return false;
  if (/^faqs?\b/i.test(t)) return false;
  if (/documents required/i.test(lower)) return false;
  if (/emi calculator/i.test(lower)) return false;
  if (/how to apply/i.test(lower)) return false;
  if (/disclaimer/i.test(lower)) return false;
  if (/check your (free )?credit score/i.test(lower)) return false;
  if (/explore more/i.test(lower)) return false;
  if (/education loan schemes?$/i.test(lower) && !/^\d/.test(t)) return false;
  if (/^\d+\.\s*\S/.test(t)) return true;
  if (
    /loan scheme|global ed|shaurya|skill loan|scholar|pmvl|pm-vidyalaxmi|vidyalaxmi scheme|pm vidyalaxmi/i.test(
      lower
    )
  ) {
    return true;
  }
  return false;
}

/**
 * Collect text in $root (depth-first) until we reach $stopH3 (exclusive).
 */
function extractTextBeforeH3($, $root, $stopH3) {
  const stopEl = $stopH3[0];
  const parts = [];

  const walk = (nodes) => {
    for (let i = 0; i < nodes.length; i += 1) {
      const node = nodes[i];
      if (node === stopEl) return false;
      if (node.type === "text") {
        const t = norm($(node).text());
        if (t) parts.push(t);
        continue;
      }
      if (node.type !== "tag") continue;
      const $node = $(node);
      if ($node[0] === stopEl) return false;
      if ($node.find($stopH3).length) {
        if (walk($node.contents().toArray()) === false) return false;
      } else {
        parts.push(norm($node.text()));
      }
    }
    return true;
  };

  walk($root.contents().toArray());
  return norm(parts.join(" "));
}

/**
 * BankBazaar often puts scheme 1's table in one large following div that also contains later scheme h3s.
 * Later schemes use a title row whose next sibling is h2 ("Key points") etc.
 */
function extractBodyAfterSchemeHeading($, $heading) {
  const titleKey = norm($heading.text()).toLowerCase();
  const $titleWrap = $heading.parent();
  let summary = "";

  const $nxt = $titleWrap.next().first();
  if ($nxt.length && $nxt.is("div")) {
    const $innerNext = $nxt.find("h3").filter((__, h) => {
      const ht = norm($(h).text()).toLowerCase();
      if (ht === titleKey) return false;
      return isSchemeHeading(norm($(h).text()));
    }).first();
    if ($innerNext.length) {
      summary = extractTextBeforeH3($, $nxt, $innerNext);
    } else {
      summary = norm($nxt.text());
    }
  }

  if (!summary && $titleWrap.length) {
    $titleWrap.nextAll().each((_, el) => {
      const $el = $(el);
      const $nextSchemes = $el
        .find("h3")
        .addBack("h3")
        .filter((__, h) => {
          if (h === $heading[0]) return false;
          const ht = norm($(h).text()).toLowerCase();
          if (ht === titleKey) return false;
          return isSchemeHeading(norm($(h).text()));
        });
      if ($nextSchemes.length) return false;
      summary += ` ${norm($el.text())}`;
      return undefined;
    });
    summary = norm(summary);
  }

  if (!summary) {
    summary = norm($heading.nextUntil("h3, h2").text());
  }

  if (summary.length > MAX_SCHEME_BODY) {
    summary = `${summary.slice(0, MAX_SCHEME_BODY).replace(/\s+\S*$/, "")}…`;
  }
  return summary;
}

function extractSchemes($) {
  const schemes = [];
  const addFromHeading = ($heading) => {
    const title = norm($heading.text());
    if (!isSchemeHeading(title)) return;
    const summary = extractBodyAfterSchemeHeading($, $heading);
    schemes.push({ title, summary });
  };

  $("h3").each((_, el) => addFromHeading($(el)));
  if (schemes.length === 0) {
    $("h2").each((_, el) => addFromHeading($(el)));
  }

  const seen = new Set();
  return schemes.filter((s) => {
    const k = s.title.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

function extractDetailFields($) {
  const intro = shortIntroAfterH1($);
  const schemes = extractSchemes($);

  return {
    intro,
    schemes,
    description: intro,
    eligibility: "",
    repayment: "",
    maxLoan: "",
    features: "",
  };
}

/**
 * Fetch one bank detail page; never throws — returns partial data on failure.
 */
async function getBankDetails(url) {
  const empty = {
    intro: "",
    schemes: [],
    description: "",
    eligibility: "",
    repayment: "",
    maxLoan: "",
    features: "",
  };
  try {
    const abs = toAbsoluteUrl(url);
    if (!abs || !/bankbazaar\.com/i.test(abs)) {
      return empty;
    }
    const html = await fetchHtml(abs);
    const $ = cheerio.load(html);
    return extractDetailFields($);
  } catch {
    return empty;
  }
}

/**
 * Full scrape: list + each detail with delay and per-bank try/catch.
 */
async function scrapeBankbazaarEducationLoans() {
  const list = await getBankList();
  const results = [];

  for (let i = 0; i < list.length; i++) {
    const row = list[i];
    try {
      if (i > 0) await randomDelay(500, 1000);
      const details = await getBankDetails(row.bankLink);
      const interestRange = parseInterestRangeString(row.interestRate);
      results.push({
        bank: row.bank,
        bankLink: row.bankLink,
        interestRate: row.interestRate,
        processingFees: row.processingFees,
        interestRange:
          interestRange.min != null && interestRange.max != null ? interestRange : undefined,
        details,
      });
    } catch (e) {
      console.warn("[bankbazaar] skip bank row:", row.bank, e.message);
    }
  }

  return results;
}

module.exports = {
  getBankList,
  getBankDetails,
  scrapeBankbazaarEducationLoans,
  LIST_URL,
  BANKBAZAAR_ORIGIN,
  toAbsoluteUrl,
  cleanBankName,
  parseBankRowsFromListHtml,
};
