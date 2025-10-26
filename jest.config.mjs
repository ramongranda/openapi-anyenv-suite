export default {
  testEnvironment: 'node',
  transform: {},
  moduleFileExtensions: ['js', 'mjs'],
  // Keep the extensionsToTreatAsEsm empty: Node treats `.mjs` as ESM
  // by default and listing '.mjs' here causes a Jest validation error.
  // We'll enable ESM execution via NODE_OPTIONS when invoking the tests.
  extensionsToTreatAsEsm: [],
  // Use the modern test runner which works better with ESM environments.
  testRunner: 'jest-circus/runner',
  testMatch: ['**/test/**/*.test.mjs'],
};