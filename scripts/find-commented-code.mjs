import { readdirSync, readFileSync, statSync, writeFileSync } from "fs";
import { join, extname } from "path";

// scan only source, skip builds
const roots = ["client/src", "server"];
const codeExts = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);
const ignoreDirs = new Set(["node_modules", "dist", ".git", ".next", "build"]);

const CODEY = /\b(import|export|function|class|return|await|=>|try\s*\{|catch\s*\(|new\s+Promise|ReactDOM|createRoot|StrictMode|app\.use|router\.(get|post|put|delete)|fetch\s*\(|axios\s*\(|useEffect\s*\(|useState\s*\()/
const DOCY = /\b(@param|@returns|eslint|ts-nocheck|todo|fixme|copyright|license|Fetch data|request|response|schema|zod|types?)\b/i;

const suspects = [];

function walk(dir) {
  for (const name of readdirSync(dir)) {
    if (ignoreDirs.has(name)) continue;
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) walk(p);
    else if (codeExts.has(extname(p))) scan(p);
  }
}

function nextNonCommentLine(lines, i) {
  for (let j = i + 1; j < lines.length; j++) {
    const L = lines[j].trim();
    if (!L) continue;
    if (L.startsWith("//")) continue;
    if (L.startsWith("/*")) {
      // skip block comment
      while (j < lines.length && !lines[j].includes("*/")) j++;
      continue;
    }
    return { index: j, text: lines[j] };
  }
  return null;
}

function scan(file) {
  const lines = readFileSync(file, "utf8").split(/\r?\n/);
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // ----- block comments -----
    if (/^\s*\/\*/.test(line)) {
      const start = i;
      let buf = line, len = 1;
      while (i + 1 < lines.length && !/\*\//.test(lines[i])) {
        i++; len++; buf += "\n" + lines[i];
      }
      // include closing */
      if (i + 1 < lines.length) { i++; len++; buf += "\n" + lines[i]; }

      const content = buf.replace(/^\/\*+|\*+\/$/g, "").trim();
      const looksLikeCode = CODEY.test(content) || /;|=>|\{|\}/.test(content);
      const isDoc = DOCY.test(content);

      if (looksLikeCode && !isDoc) {
        suspects.push(`${file}:${start + 1}-${start + len}  (block, ${len} lines)`);
      }
      i++;
      continue;
    }

    // ----- consecutive // lines -----
    if (/^\s*\/\//.test(line)) {
      const start = i;
      let len = 0, hasCodey = false, hasDocy = false;
      while (i < lines.length && /^\s*\/\//.test(lines[i])) {
        const body = lines[i].replace(/^\s*\/\//, "");
        if (CODEY.test(body) || /;|=>|\{|\}/.test(body)) hasCodey = true;
        if (DOCY.test(body)) hasDocy = true;
        len++; i++;
      }
      // If next meaningful line is real code, this was a doc header → ignore
      const next = nextNonCommentLine(lines, start + len - 1);
      const headerBeforeCode = next && /[A-Za-z0-9_$]/.test(next.text) && !next.text.trim().startsWith("}");

      if (hasCodey && !headerBeforeCode && len >= 2 && !hasDocy) {
        suspects.push(`${file}:${start + 1}-${start + len}  (line, ${len} lines)`);
      }
      continue;
    }

    i++;
  }
}

for (const r of roots) {
  try { walk(r); } catch { /* ignore missing folders */ }
}
suspects.sort();
if (suspects.length) {
  writeFileSync("commented-code-SUSPECT.txt", suspects.join("\n") + "\n");
  console.log(`Wrote commented-code-SUSPECT.txt with ${suspects.length} probable disabled code blocks.`);
} else {
  console.log("No probable commented-out code found.");
}
