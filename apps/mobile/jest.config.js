const path = require("path")

/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  moduleNameMapper: {
    "^@chordially/shared$": path.resolve(__dirname, "../../packages/shared/src/index.ts"),
  },
}
