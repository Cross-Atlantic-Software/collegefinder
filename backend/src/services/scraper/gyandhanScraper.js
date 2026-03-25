const axios = require("axios");
const cheerio = require("cheerio");

const GYANDHAN_BASE = "https://www.gyandhan.com";

/**
 * Lending partners — slug = URL path on gyandhan.com (e.g. sbi-education-loan).
 * Tables on each page are scraped into key/value rows; column headers differ per lender.
 * If a page 404s, verify slug on site and update here.
 */
const BANKS = [
  { name: "SBI", slug: "sbi-education-loan" },
  { name: "Axis Bank", slug: "axis-education-loan" },
  { name: "ICICI Bank", slug: "icici-education-loan" },
  { name: "IDFC First Bank", slug: "idfc-education-loan" },
  { name: "Union Bank of India (UBI)", slug: "ubi-education-loan" },
  { name: "Credila", slug: "credila-education-loan" },
  { name: "Auxilo", slug: "auxilo-education-loan" },
  { name: "Avanse", slug: "avanse-education-loan" },
  { name: "Incred", slug: "incred-education-loan" },
  /** Gyandhan URLs use “financing” / “finance” in the path (not …-education-loan only). */
  { name: "MPower Financing", slug: "mpower-financing-education-loan" },
  { name: "Prodigy Finance", slug: "prodigy-finance-education-loan" },
  { name: "Bank of Baroda (BOB)", slug: "bob-education-loan" },
  { name: "Tata Capital", slug: "tata-capital-education-loan" },
  { name: "Yes Bank", slug: "yes-bank-education-loan" },
  { name: "PNB", slug: "pnb-education-loan" },
  { name: "Poonawalla Fincorp", slug: "poonawalla-fincorp-education-loan" },
];

async function scrapeBank(bank) {
  const slug = typeof bank === "string" ? bank : bank.slug;
  const bankName = typeof bank === "string" ? bank : bank.name;
  const url = `${GYANDHAN_BASE}/${slug}`;

  try {
    const { data } = await axios.get(url, {
      timeout: 30000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    const $ = cheerio.load(data);

    const details = {};
    const norm = (s) =>
      String(s || "")
        .replace(/\u00a0/g, " ")
        .replace(/\s+/g, " ")
        .trim();

    /**
     * Gyandhan pages mix hero tables, feature grids, and nested tables.
     * Use first + second cell for 2+ td rows; th+td for header rows.
     * Skip rows where key === value (duplicate marketing cells).
     */
    $("table tr").each((i, el) => {
      const $tr = $(el);
      const $td = $tr.find("td");
      const $th = $tr.find("th");
      let key = "";
      let value = "";

      if ($td.length >= 2) {
        key = norm($td.eq(0).text());
        value = norm($td.eq(1).text());
      } else if ($th.length >= 1 && $td.length >= 1) {
        key = norm($th.first().text());
        value = norm($td.first().text());
      }

      if (key && value && key !== value) {
        details[key] = value;
      }
    });

    return {
      bank: bankName,
      ...details
    };

  } catch (err) {
    console.log(`Error scraping ${bankName}`, err.message);
    return null;
  }
}

async function scrapeAllBanks() {
  const results = [];
  for (let i = 0; i < BANKS.length; i++) {
    const data = await scrapeBank(BANKS[i]);
    if (data) results.push(data);
    if (i < BANKS.length - 1) {
      await new Promise((res) => setTimeout(res, 2000));
    }
  }
  return results;
}

module.exports = { BANKS, scrapeBank, scrapeAllBanks };