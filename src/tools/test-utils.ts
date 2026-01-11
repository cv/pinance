import { vi } from "vitest";

export interface ToolResult {
	content: Array<{ type: string; text: string }>;
	details: Record<string, unknown>;
}

export interface MockTool {
	name: string;
	execute: (
		toolCallId: string,
		params: Record<string, unknown>,
		onUpdate: ReturnType<typeof vi.fn>,
		ctx: Record<string, unknown>,
		signal: AbortSignal | undefined,
	) => Promise<ToolResult>;
}

export interface MockPi {
	registerTool: ReturnType<typeof vi.fn>;
	tools: Map<string, MockTool>;
}

/**
 * Creates a mock ExtensionAPI for testing tool registration.
 * Tools are stored in the returned `tools` map for easy access.
 */
export function createMockPi(): MockPi {
	const tools = new Map<string, MockTool>();
	return {
		registerTool: vi.fn((tool: MockTool) => {
			tools.set(tool.name, tool);
		}),
		tools,
	};
}

export function getTool(tools: Map<string, MockTool>, name: string): MockTool {
	const tool = tools.get(name);
	if (!tool) {
		throw new Error(`Tool ${name} not found`);
	}
	return tool;
}

export function getResultText(result: ToolResult): string {
	const content = result.content[0];
	if (!content) {
		throw new Error("Result has no content");
	}
	return content.text;
}

/**
 * Extracts just the JSON data from a tool result, stripping the [Source: ...] suffix.
 */
export function getResultJson(result: ToolResult): unknown {
	const text = getResultText(result);
	// Strip the [Source: ...] suffix added by tool-helpers
	const jsonText = text.replace(/\n\n\[Source:.*\]$/, "");
	return JSON.parse(jsonText);
}

/**
 * Extracts the source URL from a tool result.
 */
export function getResultSource(result: ToolResult): string | undefined {
	const text = getResultText(result);
	const match = text.match(/\[Source: (.+)\]$/);
	return match?.[1];
}

export function getResultType(result: ToolResult): string {
	const content = result.content[0];
	if (!content) {
		throw new Error("Result has no content");
	}
	return content.type;
}
