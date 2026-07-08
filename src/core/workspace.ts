import { existsSync, mkdirSync, writeFileSync, cpSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { WorkspaceAlreadyExistsError, WorkspaceNotFoundError } from "./errors.js";

// Where the compiled dist/core/workspace.js lives, used to locate the
// bundled dist/templates/ folder relative to this file — not relative
// to whatever directory the user happens to be running the command from.
const __dirname = dirname(fileURLToPath(import.meta.url));

const WORKSPACE_DIRNAME = "ladderline";

/**
 * Walks upward from `startDir` (like git does for .git) looking for a
 * ladderline/config.yaml file. This means commands work from any
 * subdirectory of a project, not only from the exact folder `init`
 * was run in — matching how git/npm/most CLI tools behave.
 */
export function findWorkspaceRoot(startDir: string = process.cwd()): string {
  let dir = resolve(startDir);

  while (true) {
    const candidate = join(dir, WORKSPACE_DIRNAME);
    if (existsSync(join(candidate, "config.yaml"))) {
      return candidate;
    }
    const parent = dirname(dir);
    if (parent === dir) {
      throw new WorkspaceNotFoundError();
    }
    dir = parent;
  }
}

/** True if a workspace exists at or above `startDir`, without throwing. */
export function workspaceExists(startDir: string = process.cwd()): boolean {
  try {
    findWorkspaceRoot(startDir);
    return true;
  } catch {
    return false;
  }
}

/**
 * Creates a new ./ladderline/ workspace in `targetDir`. Refuses if one
 * already exists there — never silently overwrites.
 */
export function createWorkspace(targetDir: string = process.cwd()): string {
  const workspacePath = join(resolve(targetDir), WORKSPACE_DIRNAME);

  if (existsSync(join(workspacePath, "config.yaml"))) {
    throw new WorkspaceAlreadyExistsError(workspacePath);
  }

  mkdirSync(join(workspacePath, "ladders"), { recursive: true });

  writeFileSync(join(workspacePath, "config.yaml"), `version: 1\n`);
  writeFileSync(join(workspacePath, "cycles.yaml"), `cycles: []\n`);

  const bundledLadder = join(__dirname, "..", "templates", "generic-ic-ladder.yaml");
  cpSync(bundledLadder, join(workspacePath, "ladders", "generic-ic-ladder.yaml"));

  return workspacePath;
}
