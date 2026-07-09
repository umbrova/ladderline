import { readdirSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, basename } from "node:path";
import { marked } from "marked";

const SRC_DIR = "wiki-src";
const OUT_DIR = "dist/dashboard/public/docs";

// Contributor-only pages — built and reachable by direct URL, but never
// linked to from other dashboard pages, so a reader never hits a page
// with no obvious way back. This only affects the dashboard's rendered
// HTML; the original [[WikiLink]] syntax stays intact in wiki-src/ for
// GitHub's own wiki, where these pages are genuinely useful to contributors.
const HIDDEN_FROM_DASHBOARD = ["Error-Handling", "Testing-Conventions", "Naming-Conventions"];

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