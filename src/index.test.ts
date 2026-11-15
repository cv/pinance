import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import pinance, { FINANCIAL_RESEARCH_PROMPT, providerPromptLine } from "./index.js";

// Mock all the tool registration functions
vi.mock("./tools/index.js", () => ({
	registerCryptoTools: vi.fn(),
	registerEquiblesTools: vi.fn(),
	registerEstimatesTools: vi.fn(),
	registerFilingsTools: vi.fn(),
	registerFundamentalsTools: vi.fn(),
	registerInsiderTradesTools: vi.fn(),
	registerMetricsTools: vi.fn(),
	registerNewsTools: vi.fn(),
	registerPriceTools: vi.fn(),
	registerSegmentsTools: vi.fn(),
}));

import {
	registerCryptoTools,
	registerEquiblesTools,
	registerEstimatesTools,
	registerFilingsTools,
	registerFundamentalsTools,
	registerInsiderTradesTools,
	registerMetricsTools,
	registerNewsTools,
	registerPriceTools,
	registerSegmentsTools,
} from "./tools/index.js";

type BeforeAgentStartHandler = (event: {
	systemPromptOptions: { sections: Record<string, string> };
}) => unknown;

interface MockPi {
	handlers: Map<string, BeforeAgentStartHandler>;
	on: ReturnType<typeof vi.fn>;
}

function createMockPi(): MockPi {
	const handlers = new Map<string, BeforeAgentStartHandler>();
	return {
		handlers,
		on: vi.fn((event: string, handler: BeforeAgentStartHandler) => {
			handlers.set(event, handler);
		}),
	};
}

describe("pinance extension", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.resetAllMocks();
	});

	it("should register all tools when initialized", () => {
		const mockPi = createMockPi();

		pinance(mockPi as never);

		expect(registerCryptoTools).toHaveBeenCalledWith(mockPi);
		expect(registerEquiblesTools).toHaveBeenCalledWith(mockPi);
		expect(registerEstimatesTools).toHaveBeenCalledWith(mockPi);
		expect(registerFilingsTools).toHaveBeenCalledWith(mockPi);
		expect(registerFundamentalsTools).toHaveBeenCalledWith(mockPi);
		expect(registerInsiderTradesTools).toHaveBeenCalledWith(mockPi);
		expect(registerMetricsTools).toHaveBeenCalledWith(mockPi);
		expect(registerNewsTools).toHaveBeenCalledWith(mockPi);
		expect(registerPriceTools).toHaveBeenCalledWith(mockPi);
		expect(registerSegmentsTools).toHaveBeenCalledWith(mockPi);
	});

	it("should call all registration functions exactly once", () => {
		const mockPi = createMockPi();

		pinance(mockPi as never);

		expect(registerCryptoTools).toHaveBeenCalledTimes(1);
		expect(registerEquiblesTools).toHaveBeenCalledTimes(1);
		expect(registerEstimatesTools).toHaveBeenCalledTimes(1);
		expect(registerFilingsTools).toHaveBeenCalledTimes(1);
		expect(registerFundamentalsTools).toHaveBeenCalledTimes(1);
		expect(registerInsiderTradesTools).toHaveBeenCalledTimes(1);
		expect(registerMetricsTools).toHaveBeenCalledTimes(1);
		expect(registerNewsTools).toHaveBeenCalledTimes(1);
		expect(registerPriceTools).toHaveBeenCalledTimes(1);
		expect(registerSegmentsTools).toHaveBeenCalledTimes(1);
	});

	it("should register before_agent_start event handler", () => {
		const mockPi = createMockPi();

		pinance(mockPi as never);

		expect(mockPi.on).toHaveBeenCalledWith("before_agent_start", expect.any(Function));
	});

	it("should add financial research guidance as a system prompt section", async () => {
		const mockPi = createMockPi();

		pinance(mockPi as never);

		const handler = mockPi.handlers.get("before_agent_start");
		expect(handler).toBeDefined();

		const event: { systemPromptOptions: { sections: Record<string, string> } } = {
			systemPromptOptions: { sections: { existing: "Keep me" } },
		};
		const result = await handler?.(event);

		expect(result).toBeUndefined();
		expect(event.systemPromptOptions.sections.existing).toBe("Keep me");
		const section = event.systemPromptOptions.sections.financial_research;
		expect(section).toContain(FINANCIAL_RESEARCH_PROMPT);
		expect(section).toMatch(/Data provider: |No data provider key is set/);
		expect(FINANCIAL_RESEARCH_PROMPT).toContain("Sources:");
	});
});

describe("providerPromptLine", () => {
	it("names the active provider and the alternatives", () => {
		expect(providerPromptLine({ configured: [], preferred: undefined })).toContain(
			"No data provider key is set",
		);
		expect(providerPromptLine({ configured: ["equibles"], preferred: undefined })).toBe(
			'Data provider: Equibles. Shared tools use it; tools marked "Needs" another provider fail without that key.',
		);
		expect(
			providerPromptLine({ configured: ["financialdatasets", "equibles"], preferred: undefined }),
		).toContain(
			'Data provider: Financial Datasets. Shared tools use it; tools marked "Needs" another provider fail without that key. Equibles is also configured; set PINANCE_PROVIDER to switch.',
		);
		expect(
			providerPromptLine({
				configured: ["financialdatasets"],
				preferred: undefined,
				invalidPreference: "yahoo",
			}),
		).toContain("PINANCE_PROVIDER=yahoo names no provider");
	});
});
