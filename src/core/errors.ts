// Shared base class for every Ladderline-specific, "expected" error.
// Commands throw these; a single catch-all in cli.ts renders them as
// ✗ <message> / <suggestion> instead of a raw stack trace.
//
// This file starts small on purpose — it grows in Phase 4 once `note`
// needs "did you mean" fuzzy matching. Starting it now (rather than
// waiting) means `init` already follows the refuse-and-explain
// philosophy from day one, instead of a special case being bolted on later.

export class LadderlineError extends Error {
  constructor(message: string, public suggestion?: string) {
    super(message);
  }
}

export class WorkspaceAlreadyExistsError extends LadderlineError {
  constructor(path: string) {
    super(
      `A Ladderline workspace already exists at ${path}.`,
      `Nothing was changed. Delete that folder first if you really want to start over.`
    );
  }
}

export class WorkspaceNotFoundError extends LadderlineError {
  constructor() {
    super(
      `No Ladderline workspace found here or in any parent folder.`,
      `Run: ladderline init`
    );
  }
}

export class InvalidLadderFileError extends LadderlineError {
  constructor(path: string, reason: string) {
    super(
      `"${path}" isn't a valid ladder file: ${reason}`,
      `A ladder needs a "ladder" name and a "competencies" list, each with an "id" and "name".`
    );
  }
}

export class LadderAlreadyExistsError extends LadderlineError {
  constructor(filename: string) {
    super(
      `A ladder named "${filename}" is already registered in this workspace.`,
      `Nothing was changed.`
    );
  }
}

export class LadderNotFoundError extends LadderlineError {
  constructor(filename: string, available: string[]) {
    const closest = findClosestMatch(filename, available);
    super(
      `"${filename}" isn't a ladder registered in this workspace.`,
      closest ? `Did you mean: ${closest}?` : `Run: ladderline ladder list`
    );
  }
}

export class PersonAlreadyTrackedError extends LadderlineError {
  constructor(name: string) {
    super(`"${name}" is already tracked.`, `Nothing was changed.`);
  }
}

export class InvalidRelationshipError extends LadderlineError {
  constructor(value: string, validValues: string[]) {
    const closest = findClosestMatch(value, validValues);
    super(
      `"${value}" isn't a valid --as value.`,
      closest ? `Did you mean: ${closest}?` : `Valid values: ${validValues.join(", ")}`
    );
  }
}

/**
 * Simple Levenshtein-distance based "did you mean" suggestion, shared
 * by every error type above that needs one — one implementation, used
 * consistently for tags, ladder names, relationship values, and later
 * person names and cycle names too.
 */
export function findClosestMatch(input: string, options: string[]): string | undefined {
  if (options.length === 0) return undefined;

  function distance(a: string, b: string): number {
    const dp: number[][] = Array.from({ length: a.length + 1 }, () =>
      new Array(b.length + 1).fill(0)
    );
    for (let i = 0; i <= a.length; i++) dp[i][0] = i;
    for (let j = 0; j <= b.length; j++) dp[0][j] = j;
    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        dp[i][j] =
          a[i - 1] === b[j - 1]
            ? dp[i - 1][j - 1]
            : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
    return dp[a.length][b.length];
  }

  let best: string | undefined;
  let bestDistance = Infinity;
  for (const option of options) {
    const d = distance(input, option);
    if (d < bestDistance) {
      bestDistance = d;
      best = option;
    }
  }

  const threshold = Math.max(2, Math.floor(input.length / 3));
  return bestDistance <= threshold ? best : undefined;
}