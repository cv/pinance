import type { vi } from "vitest";

export interface MockTool {
	name: string;
	execute: (
		toolCallId: string,
		params: Record<string, unknown>,
		onUpdate: ReturnType<typeof vi.fn>,
		ctx: Record<string, unknown>,
		signal: AbortSignal | undefined,
	) => Promise<{
		content: Array<{ type: string; text: string }>;
		details: Record<string, unknown>;
	}>;
}

export function getTool(tools: Map<string, MockTool>, name: string): MockTool {
	const tool = tools.get(name);
	if (!tool) {
		throw new Error(`Tool ${name} not found`);
	}
	return tool;
}
