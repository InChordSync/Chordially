const path = require("path")

/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  testMatch: ['<rootDir>/src/__tests__/**/*.test.[jt]s?(x)'],
  moduleNameMapper: {
    "^@chordially/shared$": path.resolve(__dirname, "../../packages/shared/src/index.ts"),
  },
}
