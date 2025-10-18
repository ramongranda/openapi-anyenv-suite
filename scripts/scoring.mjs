import { loadConfig } from './config.mjs';

const config = loadConfig();

/**
 * Convert numeric score to letter grade using configured thresholds.
 * @param {number} score - Final numeric score (0..100).
 * @returns {'A'|'B'|'C'|'D'|'E'} Letter grade.
 */
export function scoreToLetter(score) {
  if (score >= config.grades.A) return 'A';
  if (score >= config.grades.B) return 'B';
  if (score >= config.grades.C) return 'C';
  if (score >= config.grades.D) return 'D';
  return 'E';
}

/**
 * Calculate final score based on penalties and bonuses.
 *
 * @param {{errors:number, warnings:number, exitCode:number}} spectral - Spectral summary.
 * @param {{errors:number, warnings:number, exitCode:number}|null} redocly - Redocly summary or null.
 * @param {{bonus:number}} heuristics - Heuristics result including bonus points.
 * @returns {number} Normalized score (0..100).
 */
export function calculateScore(spectral, redocly, heuristics) {
  let score = 100;
  score -= Math.min(config.penalties.spectral.maxError, spectral.errors * config.penalties.spectral.error);
  score -= Math.min(config.penalties.spectral.maxWarning, spectral.warnings * config.penalties.spectral.warning);
  if (redocly) {
    score -= Math.min(config.penalties.redocly.maxError, redocly.errors * config.penalties.redocly.error);
    score -= Math.min(config.penalties.redocly.maxWarning, redocly.warnings * config.penalties.redocly.warning);
  }
  score += heuristics.bonus;
  if (score < 0) score = 0;
  if (score > 100) score = 100;
  return score;
}
