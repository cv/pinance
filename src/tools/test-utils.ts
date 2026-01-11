import type { vi } from "vitest";

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

export function getResultType(result: ToolResult): string {
	const content = result.content[0];
	if (!content) {
		throw new Error("Result has no content");
	}
	return content.type;
}
