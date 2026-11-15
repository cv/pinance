import type {
	AgentToolResult,
	ExtensionAPI,
	ToolAnnotations,
} from "@earendil-works/pi-coding-agent";
import { type Static, type TObject, Type } from "typebox";
import { callApi } from "./api.js";

type ApiParams = Record<string, string | number | string[] | undefined>;
type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

/** Every pinance tool only reads from the Financial Datasets API. */
export const TOOL_ANNOTATIONS: ToolAnnotations = {
	readOnlyHint: true,
	destructiveHint: false,
	idempotentHint: true,
	openWorldHint: true,
};

/**
 * Structured result for programmatic callers (codemode scripts, pit's `tools.*`).
 * The model still receives the pretty-printed JSON plus a source line as text.
 */
export const ToolOutputSchema = Type.Object({
	url: Type.String({ description: "API URL the data came from (cite it as the source)" }),
	count: Type.Optional(Type.Integer({ minimum: 0, description: "Number of rows, for lists" })),
	data: Type.Unknown({ description: "Data extracted from the API response" }),
});

export type ToolOutput = Static<typeof ToolOutputSchema>;

/** Result details for the UI and session log: the source URL and, for lists, the row count. */
export interface ToolDetails {
	url: string;
	count?: number;
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
		outputSchema: ToolOutputSchema,
		annotations: TOOL_ANNOTATIONS,
		executionMode: "parallel",
		execute: async (_toolCallId, params, signal): Promise<AgentToolResult<ToolDetails>> => {
			const { data, url } = await callApi<TResponse>(
				config.endpoint,
				// Pi types params with its own Static; it is the same JSON value as TypeBox's.
				// oxlint-disable-next-line typescript/no-unsafe-type-assertion
				config.buildParams(params as Static<TParams>),
				signal,
			);

			const extracted = config.extractData(data);
			const details: ToolDetails = { url };
			if (config.getCount) {
				details.count = config.getCount(extracted);
			}

			// Include source URL in response text so LLM can cite it
			const responseText = `${JSON.stringify(extracted, null, 2)}\n\n[Source: ${url}]`;

			return {
				content: [{ type: "text", text: responseText }],
				details,
				// extracted is parsed JSON from the API, so the whole object is JSON.
				// oxlint-disable-next-line typescript/no-unsafe-type-assertion
				structuredContent: { ...details, data: extracted } as JsonValue,
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
		getCount: (data) => (Array.isArray(data) ? data.length : 0),
	});
}
