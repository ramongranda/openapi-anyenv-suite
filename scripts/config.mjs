import { readFileSync } from 'node:fs';

const defaultConfig = {
  "penalties": {
    "spectral": {
      "error": 4,
      "warning": 1,
      "maxError": 40,
      "maxWarning": 15
    },
    "redocly": {
      "error": 5,
      "warning": 2,
      "maxError": 25,
      "maxWarning": 10
    }
  },
  "bonuses": {
    "max": 20,
    "rules": {
      "info.title": 2,
      "info.version": 2,
      "servers": 1,
      "summaryRatio": {
        "threshold": 0.8,
        "points": 5
      },
      "descriptionRatio": {
        "threshold": 0.8,
        "points": 5
      },
      "4xxRatio": {
        "threshold": 0.7,
        "points": 5
      },
      "securitySchemes": 3
    }
  },
  "grades": {
    "A": 90,
    "B": 80,
    "C": 65,
    "D": 50
  }
};

/**
 * Load grading configuration from grade.config.json if present; otherwise uses defaults.
 * Logs a non-fatal error on parse or read failure and proceeds with built-ins.
 *
 * @returns {{penalties:any, bonuses:any, grades:any}} Parsed configuration.
 */
export function loadConfig() {
  try {
    const configData = readFileSync('./grade.config.json', 'utf8');
    return JSON.parse(configData);
  } catch (error) {
    // Avoid noisy stack traces in CI/tests when configuration is absent.
    // Emit a short, non-fatal warning and continue with defaults.
    console.warn(`grade.config.json not found or unreadable — using default grading configuration. Reason: ${error.message}`);
    return defaultConfig;
  }
}
