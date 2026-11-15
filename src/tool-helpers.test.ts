import type { ExtensionAPI, ToolDefinition } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { Value } from "typebox/value";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { callApi } from "./api.js";
import {
	registerArrayTool,
	registerSimpleTool,
	TOOL_ANNOTATIONS,
	ToolOutputSchema,
} from "./tool-helpers.js";

vi.mock("./api.js", () => ({
	callApi: vi.fn(),
}));

const mockCallApi = vi.mocked(callApi);
const paramsSchema = Type.Object({ ticker: Type.String() });

type RegisteredTool = ToolDefinition<typeof paramsSchema>;

function createMockPi(): { pi: ExtensionAPI; getTool: () => RegisteredTool } {
	let registeredTool: RegisteredTool | undefined;
	const pi = {
		registerTool: vi.fn((tool: RegisteredTool) => {
			registeredTool = tool;
		}),
	} as unknown as ExtensionAPI;

	return {
		pi,
		getTool: () => {
			if (!registeredTool) {
				throw new Error("Tool was not registered");
			}
			return registeredTool;
		},
	};
}

describe("tool helpers", () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	it("adds a prompt snippet to registered tools by default", () => {
		const { pi, getTool } = createMockPi();

		registerSimpleTool<typeof paramsSchema, { snapshot: Record<string, unknown> }>(pi, {
			name: "test_snapshot",
			label: "Test Snapshot",
			description: "Test snapshot tool",
			parameters: paramsSchema,
			endpoint: "/test/",
			buildParams: (params) => ({ ticker: params.ticker }),
			extractData: (response) => response.snapshot,
		});

		expect(getTool().promptSnippet).toBe("Test snapshot tool");
	});

	it("passes the current pi abort signal argument to API calls", async () => {
		mockCallApi.mockResolvedValue({
			data: { snapshot: { price: 123 } },
			url: "https://example.test",
		});
		const { pi, getTool } = createMockPi();
		const signal = new AbortController().signal;

		registerSimpleTool<typeof paramsSchema, { snapshot: Record<string, unknown> }>(pi, {
			name: "test_snapshot",
			label: "Test Snapshot",
			description: "Test snapshot tool",
			parameters: paramsSchema,
			endpoint: "/test/",
			buildParams: (params) => ({ ticker: params.ticker }),
			extractData: (response) => response.snapshot,
		});

		await getTool().execute("call-id", { ticker: "AAPL" }, signal, undefined, {} as never);

		expect(mockCallApi).toHaveBeenCalledWith("/test/", { ticker: "AAPL" }, signal);
	});

	it("declares read-only annotations and a structured output schema", () => {
		const { pi, getTool } = createMockPi();

		registerSimpleTool<typeof paramsSchema, { snapshot: Record<string, unknown> }>(pi, {
			name: "test_snapshot",
			label: "Test Snapshot",
			description: "Test snapshot tool",
			parameters: paramsSchema,
			endpoint: "/test/",
			buildParams: (params) => ({ ticker: params.ticker }),
			extractData: (response) => response.snapshot,
		});

		expect(getTool().annotations).toEqual(TOOL_ANNOTATIONS);
		expect(getTool().outputSchema).toBe(ToolOutputSchema);
		expect(getTool().executionMode).toBe("parallel");
	});

	it("returns structured content with the data, source URL, and count", async () => {
		const rows = [{ ticker: "AAPL" }];
		mockCallApi.mockResolvedValue({ data: { rows }, url: "https://example.test" });
		const { pi, getTool } = createMockPi();

		registerArrayTool<typeof paramsSchema, { rows: Record<string, unknown>[] }>(pi, {
			name: "test_array",
			label: "Test Array",
			description: "Test array tool",
			parameters: paramsSchema,
			endpoint: "/test/",
			buildParams: (params) => ({ ticker: params.ticker }),
			extractData: (response) => response.rows,
		});

		const result = await getTool().execute(
			"call-id",
			{ ticker: "AAPL" },
			undefined,
			undefined,
			{} as never,
		);

		expect(result.structuredContent).toEqual({ url: "https://example.test", count: 1, data: rows });
		expect(Value.Check(ToolOutputSchema, result.structuredContent)).toBe(true);
		expect(result.details).toEqual({ url: "https://example.test", count: 1 });
	});

	it("adds counts to array tool details", async () => {
		const rows = [{ ticker: "AAPL" }, { ticker: "MSFT" }];
		mockCallApi.mockResolvedValue({ data: { rows }, url: "https://example.test" });
		const { pi, getTool } = createMockPi();

		registerArrayTool<typeof paramsSchema, { rows: Record<string, unknown>[] }>(pi, {
			name: "test_array",
			label: "Test Array",
			description: "Test array tool",
			parameters: paramsSchema,
			endpoint: "/test/",
			buildParams: (params) => ({ ticker: params.ticker }),
			extractData: (response) => response.rows,
		});

		const result = await getTool().execute(
			"call-id",
			{ ticker: "AAPL" },
			undefined,
			undefined,
			{} as never,
		);

		expect(result.details).toMatchObject({ count: 2, url: "https://example.test" });
	});
});
