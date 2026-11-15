/**
 * End-to-end tests for pinance: each case runs a real `pi -p` session (a paid LLM call) against the
 * live Financial Datasets or Equibles API and checks which tools the model called.
 *
 * Two harnesses:
 * - plain: `pi --no-extensions -e ./src/index.ts`, so only this extension's tools exist and the model
 *   calls them by name, whatever extensions the user has installed globally.
 * - pit: `pi -e ./src/index.ts` with the user's global extensions. pit hides tools behind a single
 *   `typescript` tool, so these cases check that the model called the project's `fd.*` functions
 *   (.pi/functions/fd) from a program and cited https://api.financialdatasets.ai URLs. They are
 *   skipped when pit is not installed in the user's pi settings.
 *
 * Provider cases (skipped without EQUIBLES_API_KEY; Equibles' free plan allows 100 requests a day,
 * and these cases use about six):
 * - PINANCE_PROVIDER=equibles with both keys: shared tools answer from Equibles.
 * - Equibles only: FINANCIAL_DATASETS_API_KEY="" in a temp dir without .env, so Financial
 *   Datasets-only tools are not offered and Equibles-only tools are.
 * - pit with PINANCE_PROVIDER=equibles: programs use eq.* and cite https://api.equibles.com URLs.
 * The Financial Datasets cases pin PINANCE_PROVIDER=financialdatasets, whatever the shell sets.
 *
 * Run with: npm run test:e2e (needs FINANCIAL_DATASETS_API_KEY and, for the provider cases,
 * EQUIBLES_API_KEY, from the environment or .env).
 * Optional: PINANCE_E2E_MODEL=<pattern> picks the model; PINANCE_E2E_PIT=0 skips the pit cases.
 *
 * The API key behind these tests has no crypto price access (HTTP 403 "Crypto access restricted"),
 * so the crypto price cases accept either data or that error, surfaced to the user.
 */

import { spawn } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, type ExpectStatic, it } from "vitest";

const SKIP_E2E = !process.env.FINANCIAL_DATASETS_API_KEY;
const SKIP_EQUIBLES = !process.env.EQUIBLES_API_KEY;
/** Absolute, so pi can load the extension from any working directory. */
const EXTENSION = fileURLToPath(new URL("index.ts", import.meta.url));
const PI_TIMEOUT_MS = 240_000;
const TEST_TIMEOUT_MS = PI_TIMEOUT_MS + 30_000;
const SOURCE_URL = /https:\/\/api\.financialdatasets\.ai\//;
const EQUIBLES_URL = /https:\/\/api\.equibles\.com\//;
/** Tools only Financial Datasets backs: an Equibles-only setup must not offer them. */
const FD_ONLY_TOOLS = new Set([
	"get_news",
	"get_crypto_price_snapshot",
	"get_crypto_prices",
	"get_available_crypto_tickers",
	"get_10K_filing_items",
	"get_10Q_filing_items",
	"get_8K_filing_items",
]);
const EQUIBLES_ONLY_TOOLS = [
	"get_earnings_call_transcript",
	"get_institutional_holders",
	"get_short_interest",
	"get_congress_trades",
	"search_filings",
];
const CRYPTO_DENIED = /\b403\b|crypto access restricted|access denied|forbidden/i;
const DENIAL_EXPLAINED =
	/403|restricted|denied|forbidden|subscri|plan|access|permission|not available|unavailable/i;

/** True when the user's pi settings install pit (cv/pit), which the pit cases need. */
const hasPit = (): boolean => {
	if (process.env.PINANCE_E2E_PIT === "0") {
		return false;
	}
	const agentDir = process.env.PI_CODING_AGENT_DIR ?? join(homedir(), ".pi", "agent");
	try {
		const settings = JSON.parse(readFileSync(join(agentDir, "settings.json"), "utf8")) as {
			packages?: unknown[];
			extensions?: unknown[];
		};
		const sources = [...(settings.packages ?? []), ...(settings.extensions ?? [])].map((s) =>
			typeof s === "string" ? s : JSON.stringify(s),
		);
		return sources.some((s) => /(^|[/:@])pit(\.git)?(@|$|\/|")/.test(s));
	} catch {
		return false;
	}
};

const PIT_INSTALLED = hasPit();
const SKIP_PIT = SKIP_E2E || !PIT_INSTALLED;
const SKIP_PIT_EQUIBLES = SKIP_EQUIBLES || !PIT_INSTALLED;

interface ToolCall {
	id: string;
	name: string;
	arguments: Record<string, unknown>;
}

interface ToolResult {
	toolCallId: string;
	toolName: string;
	isError: boolean;
	text: string;
}

/** A finished tool execution, from its `tool_execution_end` event. */
interface ToolExecution {
	toolCallId: string;
	toolName: string;
	isError: boolean;
	/** The provider that answered, from the result's details or structuredContent. */
	provider?: string;
	url?: string;
}

interface PiResult {
	/** Text of the last assistant message: the answer the user sees. */
	output: string;
	/** Tools declared to the model, replayed from the run's system messages. */
	offeredTools: string[];
	toolCalls: ToolCall[];
	toolResults: ToolResult[];
	executions: ToolExecution[];
	/** Every result text, for asserting what the tools returned. */
	resultText: string;
}

interface ContentBlock {
	type: string;
	text?: string;
	id?: string;
	name?: string;
	arguments?: Record<string, unknown>;
}

interface AgentMessage {
	role: string;
	content?: string | ContentBlock[];
	toolCallId?: string;
	toolName?: string;
	isError?: boolean;
	toolsAdded?: { name?: string }[];
	toolsRemoved?: { name?: string }[];
}

interface ResultFields {
	provider?: unknown;
	url?: unknown;
}

interface PiEvent {
	type?: string;
	messages?: AgentMessage[];
	toolCallId?: string;
	toolName?: string;
	isError?: boolean;
	result?: { details?: ResultFields; structuredContent?: ResultFields };
}

const stringField = (...values: unknown[]): string | undefined =>
	values.find((v): v is string => typeof v === "string");

const blocks = (content: AgentMessage["content"]): ContentBlock[] =>
	typeof content === "string" ? [{ type: "text", text: content }] : (content ?? []);

const textOf = (content: AgentMessage["content"]): string =>
	blocks(content)
		.filter((b) => b.type === "text")
		.map((b) => b.text ?? "")
		.join("\n");

/**
 * Parses `pi --mode json` output: the agent_end event carries the whole message history, and
 * tool_execution_end events carry each tool's full result.
 */
const parsePiJson = (stdout: string): PiResult => {
	let messages: AgentMessage[] | undefined;
	const executions: ToolExecution[] = [];
	for (const line of stdout.split("\n")) {
		if (!line.startsWith("{")) {
			continue;
		}
		let event: PiEvent;
		try {
			event = JSON.parse(line) as PiEvent;
		} catch {
			continue; // Not an event line.
		}
		if (event.type === "agent_end" && Array.isArray(event.messages)) {
			messages = event.messages;
		} else if (event.type === "tool_execution_end") {
			const details = event.result?.details;
			const structured = event.result?.structuredContent;
			const provider = stringField(details?.provider, structured?.provider);
			const url = stringField(details?.url, structured?.url);
			executions.push({
				toolCallId: event.toolCallId ?? "",
				toolName: event.toolName ?? "",
				isError: event.isError === true,
				...(provider ? { provider } : {}),
				...(url ? { url } : {}),
			});
		}
	}
	if (!messages) {
		throw new Error(`pi printed no agent_end event:\n${stdout.slice(-2000)}`);
	}

	const offered = new Set<string>();
	const toolCalls: ToolCall[] = [];
	const toolResults: ToolResult[] = [];
	let output = "";
	for (const msg of messages) {
		if (msg.role === "system") {
			for (const tool of msg.toolsAdded ?? []) {
				offered.add(tool.name ?? "");
			}
			for (const tool of msg.toolsRemoved ?? []) {
				offered.delete(tool.name ?? "");
			}
		} else if (msg.role === "assistant") {
			for (const block of blocks(msg.content)) {
				if (block.type === "toolCall") {
					toolCalls.push({
						id: block.id ?? "",
						name: block.name ?? "",
						arguments: block.arguments ?? {},
					});
				}
			}
			const text = textOf(msg.content).trim();
			if (text) {
				output = text;
			}
		} else if (msg.role === "toolResult") {
			toolResults.push({
				toolCallId: msg.toolCallId ?? "",
				toolName: msg.toolName ?? "",
				isError: msg.isError === true,
				text: textOf(msg.content),
			});
		}
	}
	return {
		output,
		offeredTools: [...offered],
		toolCalls,
		toolResults,
		executions,
		resultText: toolResults.map((r) => r.text).join("\n"),
	};
};

interface RunOptions {
	/** Variables to set for pi; undefined removes one. */
	env?: Record<string, string | undefined>;
	/** pi's working directory (default: the repo, whose .env pinance reads). */
	cwd?: string;
}

const runPi = async (
	prompt: string,
	mode: "plain" | "pit",
	options: RunOptions = {},
): Promise<PiResult> => {
	const env: NodeJS.ProcessEnv = {
		...process.env,
		PINANCE_PROVIDER: "financialdatasets",
		...options.env,
	};
	for (const [name, value] of Object.entries(env)) {
		if (value === undefined) {
			delete env[name];
		}
	}
	const args = [
		...(mode === "plain" ? ["--no-extensions"] : []),
		"-e",
		EXTENSION,
		// Trust project-local files (skills, pit's .pi/functions) without a prompt.
		"--approve",
		"--no-session",
		...(process.env.PINANCE_E2E_MODEL ? ["--model", process.env.PINANCE_E2E_MODEL] : []),
		"--mode",
		"json",
		"-p",
		"--",
		prompt,
	];
	// stdin must be closed: with an open pipe, `pi -p` waits for piped input until the timeout.
	const { code, signal, stdout, stderr } = await new Promise<{
		code: number | null;
		signal: NodeJS.Signals | null;
		stdout: string;
		stderr: string;
	}>((resolve, reject) => {
		const child = spawn("pi", args, {
			env,
			...(options.cwd ? { cwd: options.cwd } : {}),
			stdio: ["ignore", "pipe", "pipe"],
			timeout: PI_TIMEOUT_MS,
		});
		let out = "";
		let err = "";
		child.stdout.setEncoding("utf8").on("data", (chunk: string) => {
			out += chunk;
		});
		child.stderr.setEncoding("utf8").on("data", (chunk: string) => {
			err += chunk;
		});
		child.on("error", reject);
		child.on("close", (exitCode, exitSignal) =>
			resolve({ code: exitCode, signal: exitSignal, stdout: out, stderr: err }),
		);
	});
	if (code !== 0) {
		throw new Error(
			`pi exited with ${signal ?? String(code)} for ${JSON.stringify(prompt)}\n${stderr.slice(-2000)}\n${stdout.slice(-1000)}`,
		);
	}
	return parsePiJson(stdout);
};

const toolNames = (r: PiResult): string[] => r.toolCalls.map((tc) => tc.name);

/** Results of the calls to one tool. */
const resultsOf = (r: PiResult, name: string): ToolResult[] => {
	const ids = new Set(r.toolCalls.filter((tc) => tc.name === name).map((tc) => tc.id));
	return r.toolResults.filter((tr) => ids.has(tr.toolCallId) || tr.toolName === name);
};

/** Executions of one tool, with the provider each result came from. */
const executionsOf = (r: PiResult, name: string): ToolExecution[] =>
	r.executions.filter((e) => e.toolName === name);

/**
 * Function names a pit program used from one namespace (`fd`, `eq`, `pinance`), from
 * `ns: { a, b: alias }` destructuring or `ns.a`.
 */
const functionsIn = (code: string, ns: string): string[] => {
	const names = new Set<string>();
	for (const match of code.matchAll(new RegExp(`\\b${ns}\\s*:\\s*\\{([^}]*)\\}`, "g"))) {
		for (const part of (match[1] ?? "").split(",")) {
			const name = part.split(":")[0]?.trim();
			if (name && /^\w+$/.test(name)) {
				names.add(name);
			}
		}
	}
	for (const match of code.matchAll(new RegExp(`\\b${ns}\\.(\\w+)`, "g"))) {
		names.add(match[1] ?? "");
	}
	return [...names];
};

const pitPrograms = (r: PiResult): string[] =>
	r.toolCalls
		.filter((tc) => tc.name === "typescript")
		.map((tc) => (typeof tc.arguments.code === "string" ? tc.arguments.code : ""));

const functionsUsed = (r: PiResult, ns: string): string[] => [
	...new Set(pitPrograms(r).flatMap((code) => functionsIn(code, ns))),
];

const fdFunctionsUsed = (r: PiResult): string[] => functionsUsed(r, "fd");

/** Suites run concurrently (each case is a separate pi process) with room for slow model turns. */
const SUITE = { timeout: TEST_TIMEOUT_MS };

/** Crypto prices need a plan this key lacks: accept data, or the 403 surfaced to the user. */
const expectCryptoPrices = (expect: ExpectStatic, r: PiResult, tool: string): void => {
	const results = resultsOf(r, tool);
	expect(results.length).toBeGreaterThan(0);
	if (results.some((tr) => tr.isError && CRYPTO_DENIED.test(tr.text))) {
		expect(r.output).toMatch(DENIAL_EXPLAINED);
	} else {
		expect(results.some((tr) => !tr.isError)).toBe(true);
		expect(r.output.toLowerCase()).toMatch(/btc|bitcoin|price|close|open|\$/);
	}
};

/** The tool ran on Equibles: every successful result says so, and the answer cites Equibles. */
const expectFromEquibles = (expect: ExpectStatic, r: PiResult, tool: string): void => {
	expect(toolNames(r)).toContain(tool);
	const done = executionsOf(r, tool).filter((e) => !e.isError);
	expect(done.length).toBeGreaterThan(0);
	expect(done.map((e) => e.provider)).toEqual(done.map(() => "equibles"));
	for (const e of done) {
		expect(e.url).toMatch(EQUIBLES_URL);
	}
	expect(r.output).toMatch(EQUIBLES_URL);
	expect(r.output).not.toMatch(SOURCE_URL);
};

/** Under pit the model must reach the API through fd.* functions in a typescript program. */
const expectPitPrograms = (expect: ExpectStatic, r: PiResult): void => {
	expect(toolNames(r)).toContain("typescript");
	// pit hides extension tools, so none of them may be called directly.
	expect(toolNames(r).filter((n) => n.startsWith("get_"))).toEqual([]);
};

describe.skipIf(SKIP_E2E).concurrent("E2E: Stock Prices", SUITE, () => {
	it("get_price_snapshot returns AAPL price", async ({ expect }) => {
		const r = await runPi("Get the current stock price of AAPL", "plain");
		expect(toolNames(r)).toContain("get_price_snapshot");
		const done = executionsOf(r, "get_price_snapshot").filter((e) => !e.isError);
		expect(done.length).toBeGreaterThan(0);
		expect(done.map((e) => e.provider)).toEqual(done.map(() => "financialdatasets"));
		expect(r.output.toLowerCase()).toMatch(/price|aapl|\$[\d,]+/);
		expect(r.output).toMatch(SOURCE_URL);
	});

	it("get_prices returns historical data", async ({ expect }) => {
		const r = await runPi("Get AAPL daily stock prices from 2024-01-01 to 2024-01-10", "plain");
		expect(toolNames(r)).toContain("get_prices");
		expect(r.output.toLowerCase()).toMatch(/price|close|open|2024/);
	});
});

describe.skipIf(SKIP_E2E).concurrent("E2E: Crypto", SUITE, () => {
	it("get_crypto_price_snapshot returns BTC price or surfaces 403", async ({ expect }) => {
		const r = await runPi("Get the current Bitcoin price in USD", "plain");
		expect(toolNames(r)).toContain("get_crypto_price_snapshot");
		expectCryptoPrices(expect, r, "get_crypto_price_snapshot");
	});

	it("get_crypto_prices returns historical data or surfaces 403", async ({ expect }) => {
		const r = await runPi("Get BTC-USD daily prices from 2024-01-01 to 2024-01-10", "plain");
		expect(toolNames(r)).toContain("get_crypto_prices");
		expectCryptoPrices(expect, r, "get_crypto_prices");
	});

	it("get_available_crypto_tickers lists tickers", async ({ expect }) => {
		const r = await runPi("List all available crypto tickers", "plain");
		expect(toolNames(r)).toContain("get_available_crypto_tickers");
		expect(r.output).toMatch(/BTC|ETH|USD/);
	});
});

describe.skipIf(SKIP_E2E).concurrent("E2E: Financial Statements", SUITE, () => {
	it("get_income_statements returns income data", async ({ expect }) => {
		const r = await runPi("Get Apple's annual income statements", "plain");
		expect(toolNames(r)).toContain("get_income_statements");
		expect(r.output.toLowerCase()).toMatch(/revenue|income|net/);
	});

	it("get_balance_sheets returns balance sheet", async ({ expect }) => {
		const r = await runPi("Get Apple's latest annual balance sheet", "plain");
		expect(toolNames(r)).toContain("get_balance_sheets");
		expect(r.output.toLowerCase()).toMatch(/assets|liabilities|equity/);
	});

	it("get_cash_flow_statements returns cash flow", async ({ expect }) => {
		const r = await runPi("Get Tesla's annual cash flow statements", "plain");
		expect(toolNames(r)).toContain("get_cash_flow_statements");
		expect(r.output.toLowerCase()).toMatch(/cash|operating|flow/);
	});

	it("get_all_financial_statements returns all statements", async ({ expect }) => {
		const r = await runPi("Get all annual financial statements for MSFT", "plain");
		expect(toolNames(r)).toContain("get_all_financial_statements");
		expect(r.output.toLowerCase()).toMatch(/revenue|assets|cash/);
	});
});

describe.skipIf(SKIP_E2E).concurrent("E2E: Financial Metrics", SUITE, () => {
	it("get_financial_metrics_snapshot returns current metrics", async ({ expect }) => {
		const r = await runPi("What is Apple's current P/E ratio and market cap?", "plain");
		expect(toolNames(r)).toContain("get_financial_metrics_snapshot");
		expect(r.output.toLowerCase()).toMatch(/p\/e|ratio|market.*cap|\$/);
	});

	it("get_financial_metrics returns historical metrics", async ({ expect }) => {
		const r = await runPi("Get historical financial metrics for GOOGL", "plain");
		expect(toolNames(r)).toContain("get_financial_metrics");
		expect(r.output.toLowerCase()).toMatch(/metric|p\/e|ratio|margin/);
	});
});

describe.skipIf(SKIP_E2E).concurrent("E2E: SEC Filings", SUITE, () => {
	it("get_filings lists recent filings", async ({ expect }) => {
		const r = await runPi("List recent SEC filings for Apple", "plain");
		expect(toolNames(r)).toContain("get_filings");
		expect(r.output).toMatch(/10-K|10-Q|8-K|filing|accession/i);
	});

	it("get_10K_filing_items returns 10-K sections", async ({ expect }) => {
		const r = await runPi(
			"Get the Risk Factors section from Apple's 2023 10-K annual report",
			"plain",
		);
		expect(toolNames(r)).toContain("get_10K_filing_items");
		expect(r.output.toLowerCase()).toMatch(/risk|business|apple/);
	});

	it("get_10Q_filing_items returns 10-Q sections", async ({ expect }) => {
		const r = await runPi(
			"Get the MD&A section from Apple's Q1 2024 10-Q quarterly report",
			"plain",
		);
		expect(toolNames(r)).toContain("get_10Q_filing_items");
		expect(r.output.toLowerCase()).toMatch(/management|discussion|quarter|q1/);
	});

	it("get_8K_filing_items returns 8-K content", async ({ expect }) => {
		const r = await runPi(
			"First get the latest 8-K filing for AAPL, then get its content using the accession number",
			"plain",
		);
		expect(toolNames(r)).toContain("get_filings");
		expect(toolNames(r)).toContain("get_8K_filing_items");
		expect(r.output.toLowerCase()).toMatch(/8-k|filing|apple|item/);
	});
});

describe.skipIf(SKIP_E2E).concurrent("E2E: Analyst Estimates", SUITE, () => {
	it("get_analyst_estimates returns EPS estimates", async ({ expect }) => {
		const r = await runPi("What are the analyst EPS estimates for NVDA?", "plain");
		expect(toolNames(r)).toContain("get_analyst_estimates");
		expect(r.output.toLowerCase()).toMatch(/eps|estimate|nvda|nvidia/);
	});
});

describe.skipIf(SKIP_E2E).concurrent("E2E: Insider Trades", SUITE, () => {
	it("get_insider_trades returns insider transactions", async ({ expect }) => {
		const r = await runPi("Show recent insider trades for Apple", "plain");
		expect(toolNames(r)).toContain("get_insider_trades");
		expect(r.output.toLowerCase()).toMatch(/insider|trade|shares|sell|buy/);
	});
});

describe.skipIf(SKIP_E2E).concurrent("E2E: News", SUITE, () => {
	it("get_news returns company news", async ({ expect }) => {
		const r = await runPi("Get recent news articles about Microsoft", "plain");
		expect(toolNames(r)).toContain("get_news");
		expect(r.output.toLowerCase()).toMatch(/news|article|microsoft/);
	});
});

describe.skipIf(SKIP_E2E).concurrent("E2E: Segmented Revenues", SUITE, () => {
	it("get_segmented_revenues returns revenue breakdown", async ({ expect }) => {
		const r = await runPi("Show Apple's annual revenue breakdown by segment", "plain");
		expect(toolNames(r)).toContain("get_segmented_revenues");
		const results = resultsOf(r, "get_segmented_revenues");
		expect(results.some((tr) => !tr.isError)).toBe(true);
		expect(r.output.toLowerCase()).toMatch(/segment|revenue|iphone|services/);
	});
});

describe.skipIf(SKIP_PIT).concurrent("E2E: pit (fd.* project functions)", SUITE, () => {
	it("fd.priceSnapshot answers a price question and cites the API URL", async ({ expect }) => {
		const r = await runPi("Get the current stock price of AAPL", "pit");
		expectPitPrograms(expect, r);
		expect(fdFunctionsUsed(r)).toEqual(expect.arrayContaining(["priceSnapshot"]));
		expect(r.resultText).toMatch(SOURCE_URL);
		expect(r.output).toMatch(/\$\s?[\d,]+(\.\d+)?/);
		expect(r.output).toMatch(
			/https:\/\/api\.financialdatasets\.ai\/prices\/snapshot\/\?ticker=AAPL/,
		);
	});

	it("fd.financialStatements compares two companies with cited URLs", async ({ expect }) => {
		const r = await runPi(
			"Compare Apple's and Microsoft's total revenue in their latest annual income statements",
			"pit",
		);
		expectPitPrograms(expect, r);
		expect(fdFunctionsUsed(r)).toEqual(expect.arrayContaining(["financialStatements"]));
		const programs = pitPrograms(r).join("\n");
		expect(programs).toMatch(/AAPL/i);
		expect(programs).toMatch(/MSFT/i);
		expect(r.output).toMatch(/https:\/\/api\.financialdatasets\.ai\/\S*ticker=AAPL/);
		expect(r.output).toMatch(/https:\/\/api\.financialdatasets\.ai\/\S*ticker=MSFT/);
	});

	it("fd.cryptoPriceSnapshot surfaces the crypto 403 or returns a price", async ({ expect }) => {
		const r = await runPi("Get the current Bitcoin price in USD", "pit");
		expectPitPrograms(expect, r);
		const used = fdFunctionsUsed(r);
		expect(used.some((n) => n === "cryptoPriceSnapshot" || n === "cryptoPrices")).toBe(true);
		if (CRYPTO_DENIED.test(r.resultText)) {
			expect(r.output).toMatch(DENIAL_EXPLAINED);
		} else {
			expect(r.output).toMatch(SOURCE_URL);
			expect(r.output.toLowerCase()).toMatch(/btc|bitcoin|\$/);
		}
	});
});

describe.skipIf(SKIP_EQUIBLES).concurrent("E2E: Equibles via PINANCE_PROVIDER", SUITE, () => {
	const env = { PINANCE_PROVIDER: "equibles" };

	it("get_price_snapshot answers from Equibles", async ({ expect }) => {
		const r = await runPi("Get the current stock price of AAPL", "plain", { env });
		expectFromEquibles(expect, r, "get_price_snapshot");
		expect(r.output).toMatch(/\$\s?[\d,]+(\.\d+)?/);
		// Both keys are set, so Financial Datasets-only tools stay available.
		if (process.env.FINANCIAL_DATASETS_API_KEY) {
			expect(r.offeredTools).toContain("get_news");
		}
	});

	it("get_income_statements answers from Equibles", async ({ expect }) => {
		const r = await runPi("Get Apple's latest annual income statement", "plain", { env });
		expectFromEquibles(expect, r, "get_income_statements");
		expect(r.output.toLowerCase()).toMatch(/revenue|income|net/);
	});
});

describe.skipIf(SKIP_EQUIBLES).concurrent("E2E: Equibles only", SUITE, () => {
	it("offers Equibles tools only and get_institutional_holders works", async ({ expect }) => {
		// No .env in the temp dir and an empty Financial Datasets key: only Equibles is configured.
		const cwd = mkdtempSync(join(tmpdir(), "pinance-e2e-"));
		try {
			const r = await runPi("Who are the top 3 institutional holders of AAPL?", "plain", {
				cwd,
				env: {
					FINANCIAL_DATASETS_API_KEY: "",
					EQUIBLES_API_KEY: process.env.EQUIBLES_API_KEY,
					PINANCE_PROVIDER: undefined,
				},
			});
			expect(r.offeredTools).toEqual(
				expect.arrayContaining([...EQUIBLES_ONLY_TOOLS, "get_price_snapshot"]),
			);
			expect(r.offeredTools.filter((name) => FD_ONLY_TOOLS.has(name))).toEqual([]);
			expectFromEquibles(expect, r, "get_institutional_holders");
			expect(r.output).toMatch(/blackrock|vanguard|state street|berkshire/i);
		} finally {
			rmSync(cwd, { recursive: true, force: true });
		}
	});
});

describe.skipIf(SKIP_PIT_EQUIBLES).concurrent("E2E: pit (eq.* project functions)", SUITE, () => {
	it("eq.* answers a price question and cites Equibles URLs", async ({ expect }) => {
		const r = await runPi("Get the current stock price of AAPL", "pit", {
			env: { PINANCE_PROVIDER: "equibles" },
		});
		expectPitPrograms(expect, r);
		const eq = functionsUsed(r, "eq");
		expect(eq.some((n) => n === "latestPrices" || n === "prices")).toBe(true);
		expect(fdFunctionsUsed(r)).toEqual([]);
		expect(r.resultText).toMatch(EQUIBLES_URL);
		expect(r.output).toMatch(/\$\s?[\d,]+(\.\d+)?/);
		expect(r.output).toMatch(/https:\/\/api\.equibles\.com\/\S*AAPL/);
	});
});
