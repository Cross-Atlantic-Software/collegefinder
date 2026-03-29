const express = require("express");
const router = express.Router();
const { scrapePaisabazaarEducationLoans } = require("../../services/scraper/paisabazaarEducationLoanScraper");
const { scrapeBankbazaarEducationLoans } = require("../../services/scraper/bankbazaarEducationLoanScraper");

/**
 * GET /api/loans/paisabazaar
 * Public scrape of Paisabazaar education loan comparison table (no DB).
 */
router.get("/paisabazaar", async (req, res) => {
  try {
    const data = await scrapePaisabazaarEducationLoans();
    res.json({ success: true, data });
  } catch (err) {
    console.error("Paisabazaar education loan scrape:", err);
    res.status(502).json({
      success: false,
      message: err.message || "Failed to scrape Paisabazaar education loan page",
    });
  }
});

/**
 * GET /api/loans/bankbazaar
 * List page + per-bank detail pages (sequential, throttled).
 */
router.get("/bankbazaar", async (req, res) => {
  try {
    const data = await scrapeBankbazaarEducationLoans();
    res.json({ success: true, data });
  } catch (err) {
    console.error("BankBazaar education loan scrape:", err);
    res.status(502).json({
      success: false,
      message: err.message || "Failed to scrape BankBazaar education loan data",
    });
  }
});

module.exports = router;
