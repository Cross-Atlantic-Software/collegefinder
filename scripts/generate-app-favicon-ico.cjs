/* Run: node scripts/generate-app-favicon-ico.cjs (needs: npm install sharp to-ico --no-save) */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const toIco = require("to-ico");

const root = path.join(__dirname, "..");
const svgPath = path.join(root, "public", "UniTracko logo 2", "final logo-16.svg");
const outPath = path.join(root, "app", "favicon.ico");

(async () => {
  const png32 = await sharp(svgPath).resize(32, 32).png().toBuffer();
  const png16 = await sharp(svgPath).resize(16, 16).png().toBuffer();
  const ico = await toIco([png16, png32]);
  fs.writeFileSync(outPath, ico);
  console.log("Wrote", outPath);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
