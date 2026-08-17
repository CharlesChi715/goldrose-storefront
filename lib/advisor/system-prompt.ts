/**
 * ROLE OF THIS FILE
 * Builds the advisor's system prompt — the only thing that tells the model
 * what ELDREVE is. The prompt is one curated document (docs/advisor/app-info.md,
 * the allowlist) plus the rules the advisor must follow. Nothing else about the
 * app is sent: no database rows, no source code, no feature records. If a fact
 * is not in that document, the advisor does not have it.
 *
 * The Claude API is stateless, so this prompt is re-sent on EVERY turn.
 */

import { promises as fs } from "fs";
import path from "path";

/** The owner-curated allowlist. Hand-edited; every change is a git diff. */
const APP_INFO_PATH = path.join(
  process.cwd(),
  "docs",
  "advisor",
  "app-info.md",
);

/** Shown in place of the document when the file is missing or unreadable. */
const NO_INFO =
  "(The app-info document could not be read. You have not been told anything " +
  "about ELDREVE — say so plainly if you are asked about it.)";

/**
 * The advisor's standing rules.
 *
 * Placed AFTER the document in the final prompt: with a long document, the
 * model follows instructions more reliably when they come last. That does not
 * hurt prompt caching — caching only cares about bytes changing *between*
 * requests, and both halves are identical on every turn.
 */
const RULES = `
You are the ELDREVE business advisor. You talk with the owners and teammates
of a small company that sells 24K gold-dipped roses as gifts.

LANGUAGE
- Reply in the same language the question was asked in. A question in Chinese
  gets a Chinese answer; a question in English gets an English answer.

WHAT YOU KNOW
- The document above is everything you know about ELDREVE. It is not a summary
  of a larger source you can consult — there is no larger source.
- If the answer is not in that document, say so plainly, in one sentence, and
  offer what you can help with instead. Never fill the gap with a guess.
- Never state a price, stock level, sales figure, delivery date or policy
  unless it appears literally in the document above. If asked for a number you
  were not given, say you do not have it. A wrong number is worse than none.
- You may draw on general business knowledge to answer "how could we improve
  this" — but label it as general advice, not as a fact about ELDREVE.

HOW YOU ANSWER
- Your reader is not technical. Use plain business language. No file paths, no
  code, no database or framework names.
- Lead with the answer, then the reasoning. Keep it short unless asked for more.
- You can only talk. You cannot change the website, the database, prices,
  stock or orders. If asked to change something, say who to ask instead.
`.trim();

/**
 * Reads the curated allowlist document.
 *
 * @returns The document text, or {@link NO_INFO} when it cannot be read.
 * A missing file degrades the advisor into "I was told nothing" rather than
 * breaking the chat — and never falls back to some other source of app data.
 */
export async function readAppInfo(): Promise<string> {
  try {
    return (await fs.readFile(APP_INFO_PATH, "utf8")).trim();
  } catch {
    return NO_INFO;
  }
}

/**
 * Builds the full system prompt to send on every turn.
 *
 * @returns The allowlist document followed by the advisor's standing rules.
 */
export async function buildSystemPrompt(): Promise<string> {
  const appInfo = await readAppInfo();
  return `Here is everything you know about ELDREVE.\n\n${appInfo}\n\n${RULES}`;
}
