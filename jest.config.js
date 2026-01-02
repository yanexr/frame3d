module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  globalSetup: "./tests/globalSetup.ts",
  globalTeardown: "./tests/globalTeardown.ts",
  setupFilesAfterEnv: ["./tests/setup.ts"],
  testPathIgnorePatterns: ["/node_modules/", "/dist/"],
  forceExit: true,
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  roots: ["<rootDir>/src", "<rootDir>/tests"],
  testMatch: ["**/tests/**/*.test.ts", "**/?(*.)+(spec|test).ts"],
  transform: {
    "^.+\\.ts$": "ts-jest",
  },
  collectCoverageFrom: ["src/**/*.ts", "!src/**/*.d.ts", "!src/index.ts"],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html"],
  testTimeout: 60000,
};
