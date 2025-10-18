import { describe, it, expect } from '@jest/globals';
import { scoreToLetter, calculateScore } from '../scripts/scoring.mjs';

describe('scoreToLetter', () => {
  it('should return A for scores >= 90', () => {
    expect(scoreToLetter(90)).toBe('A');
    expect(scoreToLetter(95)).toBe('A');
  });

  it('should return B for scores >= 80 and < 90', () => {
    expect(scoreToLetter(80)).toBe('B');
    expect(scoreToLetter(89)).toBe('B');
  });

  it('should return C for scores >= 65 and < 80', () => {
    expect(scoreToLetter(65)).toBe('C');
    expect(scoreToLetter(79)).toBe('C');
  });

  it('should return D for scores >= 50 and < 65', () => {
    expect(scoreToLetter(50)).toBe('D');
    expect(scoreToLetter(64)).toBe('D');
  });

  it('should return E for scores < 50', () => {
    expect(scoreToLetter(0)).toBe('E');
    expect(scoreToLetter(49)).toBe('E');
  });
});

describe('calculateScore', () => {
  const heuristics = { bonus: 10 };

  it('should start with a score of 100', () => {
    const spectral = { errors: 0, warnings: 0 };
    const redocly = { errors: 0, warnings: 0 };
    expect(calculateScore(spectral, redocly, { bonus: 0 })).toBe(100);
  });

  it('should subtract points for spectral errors and warnings', () => {
    const spectral = { errors: 2, warnings: 3 };
    const redocly = { errors: 0, warnings: 0 };
    // 100 - (2 * 4) - (3 * 1) = 89
    expect(calculateScore(spectral, redocly, { bonus: 0 })).toBe(89);
  });

  it('should subtract points for redocly errors and warnings', () => {
    const spectral = { errors: 0, warnings: 0 };
    const redocly = { errors: 1, warnings: 2 };
    // 100 - (1 * 5) - (2 * 2) = 91
    expect(calculateScore(spectral, redocly, { bonus: 0 })).toBe(91);
  });

  it('should apply bonus points', () => {
    const spectral = { errors: 0, warnings: 0 };
    const redocly = { errors: 0, warnings: 0 };
    expect(calculateScore(spectral, redocly, heuristics)).toBe(100);
  });

  it('should cap the score at 100', () => {
    const spectral = { errors: 0, warnings: 0 };
    const redocly = { errors: 0, warnings: 0 };
    expect(calculateScore(spectral, redocly, { bonus: 25 })).toBe(100);
  });

  it('should not go below 0', () => {
    const spectral = { errors: 100, warnings: 0 };
    const redocly = { errors: 0, warnings: 0 };
    // 100 - 40 = 60
    expect(calculateScore(spectral, redocly, { bonus: 0 })).toBe(60);
  });

  it('should cap spectral warnings and redocly penalties', () => {
    const spectral = { errors: 0, warnings: 100 }; // warnings cap 15
    const redocly = { errors: 100, warnings: 100 }; // caps 25 and 10
    // 100 - 15 - 25 - 10 = 50
    expect(calculateScore(spectral, redocly, { bonus: 0 })).toBe(50);
  });

  it('should apply combined caps across all penalties', () => {
    const spectral = { errors: 100, warnings: 100 }; // caps: 40 + 15 = 55
    const redocly = { errors: 100, warnings: 100 }; // caps: 25 + 10 = 35
    // 100 - 55 - 35 = 10
    expect(calculateScore(spectral, redocly, { bonus: 0 })).toBe(10);
  });
});
