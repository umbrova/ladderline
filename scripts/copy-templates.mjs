// tsc only compiles .ts files — it silently ignores .yaml templates.
// This copies them into dist/ after every build, using Node's own
// fs.cpSync rather than a shell "cp" command, so it works identically
// on Windows, macOS, and Linux regardless of which shell runs npm scripts.
import { cpSync } from "node:fs";

cpSync("src/templates", "dist/templates", { recursive: true });
cpSync("src/dashboard/public", "dist/dashboard/public", { recursive: true });
console.log("Copied templates and dashboard assets to dist/");