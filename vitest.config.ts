import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		testTimeout: 120000,
		env: {
			// Load from .env file - vitest does this automatically
		},
		setupFiles: ["./vitest.setup.ts"],
	},
});
