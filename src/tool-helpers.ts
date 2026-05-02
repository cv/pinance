import type { AgentToolResult, ExtensionAPI } from "@mariozechner/pi-coding-agent";
import type { Static, TObject } from "@sinclair/typebox";
import { callApi } from "./api.js";

type ApiParams = Record<string, string | number | string[] | undefined>;

function isAbortSignal(value: unknown): value is AbortSignal {
	return (
		typeof value === "object" && value !== null && "aborted" in value && "addEventListener" in value
	);
}

interface SimpleToolConfig<TParams extends TObject, TResponse> {
	name: string;
	label: string;
	description: string;
	promptGuidelines?: string[];
	promptSnippet?: string;
	parameters: TParams;
	endpoint: string;
	buildParams: (params: Static<TParams>) => ApiParams;
	extractData: (response: TResponse) => unknown;
	/** If provided, adds count to details (for array responses) */
	getCount?: (data: unknown) => number;
}

/**
 * Creates and registers a simple API tool with standardized execute pattern.
 * Handles the common pattern of: call API → extract data → return JSON result.
 * Includes source URL in both the response text (for LLM citation) and details.
 */
export function registerSimpleTool<TParams extends TObject, TResponse>(
	pi: ExtensionAPI,
	config: SimpleToolConfig<TParams, TResponse>,
): void {
	pi.registerTool({
		name: config.name,
		label: config.label,
		description: config.description,
		promptSnippet: config.promptSnippet ?? config.description,
		...(config.promptGuidelines ? { promptGuidelines: config.promptGuidelines } : {}),
		parameters: config.parameters,
		execute: async (
			_toolCallId,
			params,
			signal,
			_onUpdate,
			_ctx,
		): Promise<AgentToolResult<unknown>> => {
			const abortSignal = isAbortSignal(signal) ? signal : isAbortSignal(_ctx) ? _ctx : undefined;
			const { data, url } = await callApi<TResponse>(
				config.endpoint,
				config.buildParams(params as Static<TParams>),
				abortSignal,
			);

			const extracted = config.extractData(data);

			const details: Record<string, unknown> = { url };
			if (config.getCount) {
				details.count = config.getCount(extracted);
			}

			// Include source URL in response text so LLM can cite it
			const responseText = `${JSON.stringify(extracted, null, 2)}\n\n[Source: ${url}]`;

			return {
				content: [{ type: "text", text: responseText }],
				details,
			};
		},
	});
}

/**
 * Helper for array responses - automatically adds count to details.
 */
export function registerArrayTool<TParams extends TObject, TResponse>(
	pi: ExtensionAPI,
	config: Omit<SimpleToolConfig<TParams, TResponse>, "getCount"> & {
		extractData: (response: TResponse) => unknown[];
	},
): void {
	registerSimpleTool(pi, {
		...config,
		getCount: (data) => (data as unknown[]).length,
	});
}
