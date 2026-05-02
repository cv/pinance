import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import pinance from "./index.js";

// Mock all the tool registration functions
vi.mock("./tools/index.js", () => ({
	registerCryptoTools: vi.fn(),
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
	systemPrompt: string;
}) => Promise<{ systemPrompt: string }>;

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

	it("should append financial research guidance to the system prompt", async () => {
		const mockPi = createMockPi();

		pinance(mockPi as never);

		const handler = mockPi.handlers.get("before_agent_start");
		expect(handler).toBeDefined();

		const result = await handler?.({ systemPrompt: "Base prompt\n" });

		expect(result?.systemPrompt).toContain("Base prompt");
		expect(result?.systemPrompt).toContain("Financial Research Guidelines");
		expect(result?.systemPrompt).toContain("Sources:");
	});
});
