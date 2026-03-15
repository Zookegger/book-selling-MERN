import type { Config } from "jest";

const config: Config = {
	preset: "ts-jest",
	testEnvironment: "node",
	roots: ["<rootDir>/src"],
	testMatch: ["**/__tests__/**/*.(spec|test).ts", "**/?(*.)+(spec|test).ts"],
	setupFilesAfterEnv: ["<rootDir>/src/__tests__/setup.ts"],
	moduleFileExtensions: ["ts", "js", "json"],
	moduleNameMapper: {
		"^@config/(.*)$": "<rootDir>/src/config/$1",
		"^@config$": "<rootDir>/src/config",
		"^@controllers/(.*)$": "<rootDir>/src/controllers/$1",
		"^@controllers$": "<rootDir>/src/controllers",
		"^@middleware/(.*)$": "<rootDir>/src/middleware/$1",
		"^@middleware$": "<rootDir>/src/middleware",
		"^@models/(.*)$": "<rootDir>/src/models/$1",
		"^@models$": "<rootDir>/src/models",
		"^@routes/(.*)$": "<rootDir>/src/routes/$1",
		"^@routes$": "<rootDir>/src/routes",
		"^@services/(.*)$": "<rootDir>/src/services/$1",
		"^@services$": "<rootDir>/src/services",
		"^@templates/(.*)$": "<rootDir>/src/templates/$1",
		"^@templates$": "<rootDir>/src/templates",
		"^@utils/(.*)$": "<rootDir>/src/utils/$1",
		"^@utils$": "<rootDir>/src/utils",
		"^@schemas/(.*)$": "<rootDir>/src/schemas/$1",
		"^@schemas$": "<rootDir>/src/schemas",
		"^@shared/(.*)$": "<rootDir>/../shared/src/$1",
		"^@shared$": "<rootDir>/../shared/src/index",
	},
	collectCoverageFrom: ["src/**/*.ts", "!src/server.ts", "!src/**/*.d.ts"],
	coverageDirectory: "coverage",
	testPathIgnorePatterns: ["/dist/", "/node_modules/"],
	testTimeout: 20000,
	verbose: true,
	collectCoverage: true,
	coverageThreshold: {
		global: {
			branches: 80, // IF/ELSE statements, switch cases, ternary operators
			functions: 85, // Every declared function must be called
			lines: 90, // Total lines of code executed
			statements: 90, // Total statements executed (similar to lines, but catches multi-statement lines)
		},
	},
};

export default config;
