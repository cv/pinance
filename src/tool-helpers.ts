import type { AgentToolResult, ExtensionAPI } from "@mariozechner/pi-coding-agent";
import type { TObject } from "@sinclair/typebox";
import { callApi } from "./api.js";

type ApiParams = Record<string, string | number | string[] | undefined>;

interface SimpleToolConfig<TParams, TResponse> {
	name: string;
	label: string;
	description: string;
	parameters: TObject;
	endpoint: string;
	buildParams: (params: TParams) => ApiParams;
	extractData: (response: TResponse) => unknown;
	/** If provided, adds count to details (for array responses) */
	getCount?: (data: unknown) => number;
}

/**
 * Creates and registers a simple API tool with standardized execute pattern.
 * Handles the common pattern of: call API → extract data → return JSON result.
 * Includes source URL in both the response text (for LLM citation) and details.
 */
export function registerSimpleTool<TParams, TResponse>(
	pi: ExtensionAPI,
	config: SimpleToolConfig<TParams, TResponse>,
): void {
	pi.registerTool({
		name: config.name,
		label: config.label,
		description: config.description,
		parameters: config.parameters,
		execute: async (
			_toolCallId,
			params,
			_onUpdate,
			_ctx,
			signal,
		): Promise<AgentToolResult<unknown>> => {
			const { data, url } = await callApi<TResponse>(
				config.endpoint,
				config.buildParams(params as TParams),
				signal,
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
export function registerArrayTool<TParams, TResponse>(
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
