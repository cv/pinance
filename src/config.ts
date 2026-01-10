import { config } from "dotenv";

// Load .env file
config();

export interface Config {
	financialDatasetsApiKey: string;
}

function getEnvVar(name: string): string {
	// biome-ignore lint/style/noProcessEnv: Centralized env access
	const value = process.env[name];
	if (value === undefined || value === "") {
		throw new Error(`${name} environment variable is not set`);
	}
	return value;
}

function loadConfig(): Config {
	return {
		financialDatasetsApiKey: getEnvVar("FINANCIAL_DATASETS_API_KEY"),
	};
}

let cachedConfig: Config | undefined;

export function getConfig(): Config {
	if (!cachedConfig) {
		cachedConfig = loadConfig();
	}
	return cachedConfig;
}

/** Reset config cache (for testing) */
export function resetConfig(): void {
	cachedConfig = undefined;
}
