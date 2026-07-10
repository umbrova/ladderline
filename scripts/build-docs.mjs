import { readdirSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, basename } from "node:path";
import { marked } from "marked";

const SRC_DIR = "wiki-src";
const OUT_DIR = "dist/dashboard/public/docs";

// Testing/Error-Handling/Naming-Conventions are contributor-only.
// Dashboard-Tour is different: it's genuinely for end users, but its
// screenshot images live only in the real GitHub wiki repo (never
// bundled into the npm package), so linking to it from the LOCAL
// dashboard's Docs tab would show broken image icons — a dead end.
// The page still builds (for anyone reaching it via the real wiki
// or a direct link), it's just never linked to from another local page.
const HIDDEN_FROM_DASHBOARD = ["Error-Handling", "Testing-Conventions", "Naming-Conventions", "Dashboard-Tour"];

mkdirSync(OUT_DIR, { recursive: true });

const files = readdirSync(SRC_DIR).filter((f) => f.endsWith(".md"));

for (const file of files) {
  const pageName = basename(file, ".md");
  let raw = readFileSync(join(SRC_DIR, file), "utf-8");

  raw = raw.replace(/\[\[([^\]#]+)(#[^\]]+)?\]\]/g, (_match, page) => {
    if (HIDDEN_FROM_DASHBOARD.includes(page)) {
      return page;
    }
    return `[${page}](#docs/${page})`;
  });

  const html = marked.parse(raw);
  writeFileSync(join(OUT_DIR, `${pageName}.html`), html);
}

console.log(`Built ${files.length} doc pages into ${OUT_DIR}/`);