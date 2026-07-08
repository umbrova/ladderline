import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { findWorkspaceRoot } from "../core/workspace.js";
import { buildCaseData, formatCaseAsMarkdown, buildPromptText, CaseData } from "../core/case.js";
import { renderCaseAsDocx } from "../core/case-docx.js";
import { slugify, listTrackedPeople } from "../core/people.js";
import { listCycles } from "../core/cycles.js";
import { LadderlineError, CycleNotFoundError, EmptyCaseError } from "../core/errors.js";

interface CaseOptions {
  cycle: string;
  format?: "docx" | "md";
  all?: boolean;
  as?: string;
  prompt?: boolean;
}

async function writeCaseFiles(data: CaseData, outDir: string, format: "docx" | "md", prompt?: boolean): Promise<string> {
  mkdirSync(outDir, { recursive: true });
  const slug = slugify(data.personName);
  const outPath = join(outDir, `${slug}.${format}`);

  if (format === "docx") {
    writeFileSync(outPath, await renderCaseAsDocx(data));
  } else {
    writeFileSync(outPath, formatCaseAsMarkdown(data));
  }

  if (prompt) {
    writeFileSync(join(outDir, `${slug}.prompt.txt`), buildPromptText(data));
  }

  return outPath;
}

export async function runCase(personName: string, options: CaseOptions): Promise<void> {
  const format = options.format ?? "docx";

  try {
    const workspace = findWorkspaceRoot();

    if (options.all) {
      const cycles = listCycles(workspace);
      if (!cycles.some((c) => c.name === options.cycle)) {
        throw new CycleNotFoundError(options.cycle, cycles.map((c) => c.name));
      }

      let people = listTrackedPeople(workspace);
      if (options.as) {
        people = people.filter((p) => p.record.as === options.as);
      }

      const outDir = join(process.cwd(), "cases", options.cycle);
      let generated = 0;

      for (const person of people) {
        try {
          const data = buildCaseData(workspace, person.record.name, options.cycle);
          const outPath = await writeCaseFiles(data, outDir, format, options.prompt);
          console.log(`✓ ${person.record.name}: ${outPath}`);
          generated++;
        } catch (err) {
          if (err instanceof EmptyCaseError) {
            console.warn(`⚠ Skipped ${person.record.name}: no notes in ${options.cycle}`);
          } else {
            throw err;
          }
        }
      }
      console.log(`\n${generated} of ${people.length} case(s) generated in ${outDir}`);
      return;
    }

    const data = buildCaseData(workspace, personName, options.cycle);
    const outDir = join(process.cwd(), "cases", options.cycle);
    const outPath = await writeCaseFiles(data, outDir, format, options.prompt);
    console.log(`✓ Case written: ${outPath}`);
  } catch (err) {
    if (err instanceof LadderlineError) {
      console.error(`✗ ${err.message}`);
      if (err.suggestion) console.error(`  ${err.suggestion}`);
      process.exitCode = 1;
      return;
    }
    throw err;
  }
}
