import fs from "fs";

const xml = fs.readFileSync("scripts-tmp-legal-document.xml", "utf8");
const paras = xml.split(/<w:p[\s>]/);
const out = [];
const re = /<w:t[^>]*>([\s\S]*?)<\/w:t>/g;
for (const para of paras) {
  let line = "";
  let m;
  while ((m = re.exec(para)) !== null) {
    line +=
      m[1]
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&amp;/g, "&")
        .replace(/&#xA0;/g, " ") + "";
  }
  line = line.replace(/\t/g, " ").replace(/\s+/g, " ").trim();
  if (line) out.push(line);
}
fs.writeFileSync("scripts-tmp-legal-lines.txt", out.join("\n"), "utf8");
console.log("lines", out.length);
