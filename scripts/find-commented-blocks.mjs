// scans for 5+ consecutive commented lines or long block comments
import { readdirSync, readFileSync, writeFileSync, statSync } from "fs";
import { join, extname } from "path";

const roots = ["client", "server"];
const exts = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".html"]);
const ignoreDirs = new Set(["node_modules", "dist", ".git", ".next", "build"]);

const hits = [];
function walk(dir) {
  for (const name of readdirSync(dir)) {
    if (ignoreDirs.has(name)) continue;
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) walk(p);
    else if (exts.has(extname(p))) scanFile(p);
  }
}

function scanFile(file) {
  const lines = readFileSync(file, "utf8").split(/\r?\n/);
  let i = 0, inBlock = false, blockStart = 0, blockLen = 0;

  const flush = (start, len, kind) => {
    if (len >= 5) hits.push({ file, start: start + 1, end: start + len, len, kind });
  };

  while (i < lines.length) {
    const line = lines[i];

    if (inBlock) {
      blockLen++;
      if (line.includes("*/") || line.includes("-->")) {
        flush(blockStart, blockLen, "block");
        inBlock = false;
        blockLen = 0;
      }
      i++;
      continue;
    }

    // start of block comments
    if (/\s*\/\*/.test(line) || /\s*<!--/.test(line)) {
      inBlock = true;
      blockStart = i;
      blockLen = 1;
      i++;
      continue;
    }

    // consecutive line comments
    if (/^\s*\/\//.test(line)) {
      const start = i;
      let len = 0;
      while (i < lines.length && /^\s*\/\//.test(lines[i])) { len++; i++; }
      flush(start, len, "line");
      continue;
    }

    i++;
  }
}

for (const r of roots) try { walk(r); } catch { /* ignore missing dirs */ }

hits.sort((a,b)=> a.file.localeCompare(b.file) || a.start - b.start);

const out = hits.map(h => `${h.file}:${h.start}-${h.end}  (${h.len} lines, ${h.kind})`).join("\n");
if (!out) {
  console.log("No large commented-out blocks (>=5 lines) found.");
} else {
  writeFileSync("commented-out-report.txt", out + "\n");
  console.log(`Wrote commented-out-report.txt with ${hits.length} blocks.`);
}
