const axios = require("axios");
const cheerio = require("cheerio");

const PAISABAZAAR_EDU_LOAN_URL = "https://www.paisabazaar.com/education-loan/";

const norm = (v) =>
  String(v || "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();

function cleanRate(str) {
  return norm(str.replace(/\s*p\.a\.?\s*/gi, "").replace(/\s+/g, " "));
}

function extractPercentagesFromHtml(html) {
  if (!html) return [];
  const matches = String(html).match(/[\d.]+\s*%/g) || [];
  return [...new Set(matches.map((m) => cleanRate(m)))];
}

function looksLikeEducationLoanRateTable($, $table) {
  const t = norm($table.text());
  return (
    /loan\s*amount\s*\/?\s*interest\s*rates/i.test(t) &&
    /max\.?\s*amount\s*offered/i.test(t) &&
    /repayment\s*tenure/i.test(t)
  );
}

function parseLoanTable($, $table) {
  let interestRates = [];
  let maxLoan = "";
  let repayment = "";

  $table.find("tr").each((_, tr) => {
    const $tr = $(tr);
    const $cells = $tr.find("td");
    if ($cells.length < 2) return;

    const first = norm($cells.first().text());

    if (/loan\s*amount\s*\/?\s*interest\s*rates/i.test(first)) {
      $cells.slice(1).each((__, td) => {
        const html = $(td).html() || "";
        extractPercentagesFromHtml(html).forEach((p) => interestRates.push(p));
      });
    } else if (/max\.?\s*amount\s*offered/i.test(first)) {
      const parts = [];
      $cells.slice(1).each((__, c) => {
        const t = norm($(c).text());
        if (t) parts.push(t);
      });
      maxLoan = norm(parts.join(" "));
    } else if (/repayment\s*tenure/i.test(first)) {
      const parts = [];
      $cells.slice(1).each((__, c) => {
        const t = norm($(c).text());
        if (t) parts.push(t);
      });
      repayment = norm(parts.join(" "));
    }
  });

  interestRates = [...new Set(interestRates.map(cleanRate))];
  return { interestRates, maxLoan, repayment };
}

/**
 * Walk backward from a rate table to the bank intro (p with u, or h3 + p).
 */
function resolveBankMeta($, $table) {
  let $p = $table.prev("p").first();
  let $h3 = null;

  if ($p.length && $p.find("u").length) {
    const bankName = norm($p.find("u").first().text());
    const description = norm($p.text());
    return { bank: bankName, description };
  }

  if ($p.length) {
    $h3 = $p.prev("h3").first();
    if ($h3.length) {
      let bank = "";
      if ($h3.find("u").length) {
        bank = norm($h3.find("u").first().text());
      } else {
        bank = norm($h3.text()).replace(/\s*[–-]+\s*$/u, "").trim();
      }
      const description = norm($p.text());
      if (bank) return { bank, description };
    }
  }

  $h3 = $table.prev("h3").first();
  if ($h3.length) {
    let bank = "";
    if ($h3.find("u").length) {
      bank = norm($h3.find("u").first().text());
    } else {
      bank = norm($h3.text()).replace(/\s*[–-]+\s*$/u, "").trim();
    }
    const $nextP = $h3.next("p").first();
    const description = $nextP.length ? norm($nextP.text()) : "";
    if (bank) return { bank, description };
  }

  return { bank: "Unknown bank", description: "" };
}

function parseEducationLoanPage(html) {
  const $ = cheerio.load(html);
  const results = [];

  $("table").each((_, table) => {
    const $table = $(table);
    if (!looksLikeEducationLoanRateTable($, $table)) return;

    const { bank, description } = resolveBankMeta($, $table);
    const { interestRates, maxLoan, repayment } = parseLoanTable($, $table);

    if (!bank || bank === "Unknown bank") return;

    results.push({
      bank,
      description,
      interestRates,
      maxLoan,
      repayment,
    });
  });

  return results;
}

async function fetchEducationLoanHtml() {
  const { data } = await axios.get(PAISABAZAAR_EDU_LOAN_URL, {
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

async function scrapePaisabazaarEducationLoans() {
  const html = await fetchEducationLoanHtml();
  return parseEducationLoanPage(html);
}

module.exports = {
  scrapePaisabazaarEducationLoans,
  parseEducationLoanPage,
  PAISABAZAAR_EDU_LOAN_URL,
};
