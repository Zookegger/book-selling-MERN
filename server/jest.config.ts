import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src", "<rootDir>/test"],
  testMatch: [
    "**/__tests__/**/*.(spec|test).ts",
    "**/?(*.)+(spec|test).ts"
  ],
  setupFilesAfterEnv: ["<rootDir>/src/__tests__/setup.ts"],
  moduleFileExtensions: ["ts", "js", "json"],
  collectCoverageFrom: ["src/**/*.ts", "!src/server.ts", "!src/**/*.d.ts"],
  coverageDirectory: "coverage",
  testPathIgnorePatterns: ["/dist/", "/node_modules/"]
};

export default config;
