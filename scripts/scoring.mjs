export function scoreToLetter(score) {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 65) return 'C';
  if (score >= 50) return 'D';
  return 'E';
}

export function calculateScore(spectral, redocly, heuristics) {
  let score = 100;
  score -= Math.min(40, spectral.errors * 4);
  score -= Math.min(15, spectral.warnings * 1);
  if (redocly) {
    score -= Math.min(25, redocly.errors * 5);
    score -= Math.min(10, redocly.warnings * 2);
  }
  score += heuristics.bonus;
  if (score < 0) score = 0;
  if (score > 100) score = 100;
  return score;
}
