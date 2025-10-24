import { writeFileSync, mkdirSync } from "node:fs";

/**
 * Parse JSON robustly by trimming noise around the first JSON block.
 * If parsing fails, optionally writes the raw text to dist/debug-<label>.txt
 * when DEBUG_JSON=1.
 *
 * @param {string} text - Raw stdout/stderr text that should contain JSON.
 * @param {string} [fallbackLabel='payload'] - Label for debug dumps on failure.
 * @returns {any|null} Parsed JSON value or null on failure.
 */
export function safeJsonParse(text, fallbackLabel = "payload") {
  if (!text) return null;
  const firstBrace = text.indexOf("{");
  const firstBracket = text.indexOf("[");
  const first = Math.min(
    firstBrace === -1 ? Infinity : firstBrace,
    firstBracket === -1 ? Infinity : firstBracket
  );
  const last = Math.max(text.lastIndexOf("}"), text.lastIndexOf("]"));
  const slice =
    first !== Infinity && last >= first ? text.slice(first, last + 1) : text;
  try {
    return JSON.parse(slice);
  } catch (e) {
    console.error(`Failed to parse JSON for ${fallbackLabel}:`, e);
    if (process.env.DEBUG_JSON === "1") {
      mkdirSync("dist", { recursive: true });
      writeFileSync(`dist/debug-${fallbackLabel}.txt`, text);
    }
    return null;
  }
}
