export default {
  testEnvironment: 'node',
  transform: {},
  moduleFileExtensions: ['js', 'mjs'],
  // Jest throws a validation error if '.mjs' is listed in
  // extensionsToTreatAsEsm because '.mjs' is always ESM in Node.
  // Provide an explicit empty array to satisfy validation and
  // keep relying on Node's default behavior.
  extensionsToTreatAsEsm: [],
  testMatch: ['**/test/**/*.test.mjs'],
};