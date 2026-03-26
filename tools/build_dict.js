// tools/build_dict.js
// 터미널에 node tools/build_dict.js "CSV주소" dict.json 입력
import fs from "fs";

const [, , csvUrl, outPath = "dict.json"] = process.argv;
if (!csvUrl) {
  console.error('Usage: node tools/build_dict.js "CSV_URL" dict.json');
  process.exit(1);
}

const EN_COL = 3; // D열 (English)
const KO_COL = 4; // E열 (Korean)

const res = await fetch(csvUrl);
if (!res.ok) throw new Error(`Failed to fetch CSV: ${res.status}`);
const csv = await res.text();

const rows = csv
  .split(/\r?\n/)
  .map((r) => r.trim())
  .filter(Boolean)
  .map(parseCsvLine);

// 헤더가 있으면 자동 스킵(English/Korean이 들어있는 줄)
let start = 0;
const header = rows[0] || [];
const headerText = header.join(" ").toLowerCase();
if (headerText.includes("english") && headerText.includes("korean")) start = 1;

const dict = {};
let added = 0;
for (let i = start; i < rows.length; i++) {
  const row = rows[i];
  const en = (row[EN_COL] ?? "").trim();
  const ko = (row[KO_COL] ?? "").trim();
  if (!en || !ko) continue;
  dict[en] = ko;
  added++;
}

fs.writeFileSync(outPath, JSON.stringify(dict, null, 2), "utf-8");
console.log(
  `✅ Wrote ${added} entries to ${outPath} (unique keys: ${
    Object.keys(dict).length
  })`
);

function parseCsvLine(line) {
  const out = [];
  let cur = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else inQuotes = !inQuotes;
      continue;
    }
    if (ch === "," && !inQuotes) {
      out.push(cur);
      cur = "";
      continue;
    }
    cur += ch;
  }
  out.push(cur);
  return out;
}
