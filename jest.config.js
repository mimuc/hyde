/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  setupFilesAfterEnv: [
    '<rootDir>/app/src/index.ts',
    '<rootDir>/app/tests/crypto.js',
  ],
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
};
