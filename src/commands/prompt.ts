import { createInterface } from "node:readline/promises";

/**
 * A simple y/N confirmation prompt. Lives in commands/, not core/ —
 * core functions stay pure and testable without needing to mock stdin;
 * only this interactive, command-layer helper touches the terminal directly.
 */
export async function confirm(question: string): Promise<boolean> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    const answer = await rl.question(`${question} (y/N) `);
    return /^y(es)?$/i.test(answer.trim());
  } finally {
    rl.close();
  }
}

/**
 * A "type the exact text to confirm" prompt, used for the most
 * destructive actions (untrack --purge). This needs only ONE
 * question() call rather than two sequential y/N prompts — calling
 * readline's question() twice in a row on piped/non-TTY stdin hangs
 * forever, since the stream is fully consumed by the first call. A
 * single stronger prompt (same pattern GitHub uses for repo deletion)
 * sidesteps that bug entirely while being an even clearer safety check.
 */
export async function confirmByTyping(question: string, requiredText: string): Promise<boolean> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    const answer = await rl.question(`${question} `);
    return answer.trim() === requiredText;
  } finally {
    rl.close();
  }
}