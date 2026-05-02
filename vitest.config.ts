import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		testTimeout: 120000,
		coverage: {
			exclude: ["src/e2e.test.ts", "src/tools/test-utils.ts", "vitest.setup.ts"],
			provider: "v8",
			reporter: ["text", "lcov"],
			thresholds: {
				branches: 90,
				functions: 90,
				lines: 90,
				statements: 90,
			},
		},
		env: {
			// Load from .env file - vitest does this automatically
		},
		setupFiles: ["./vitest.setup.ts"],
	},
});
