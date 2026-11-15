import type {
	AgentToolResult,
	ExtensionAPI,
	ToolAnnotations,
} from "@earendil-works/pi-coding-agent";
import { type Static, type TObject, Type } from "typebox";
import { type ApiResponse, callApi } from "./api.js";
import {
	PROVIDER_IDS,
	PROVIDERS,
	type ProviderId,
	canRegister,
	chooseProvider,
	providerState,
} from "./providers.js";

type ApiParams = Record<string, string | number | string[] | undefined>;
type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

/** Every pinance tool only reads from a financial data API. */
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
	provider: Type.Optional(
		Type.Enum([...PROVIDER_IDS], { description: "The data provider that answered" }),
	),
	count: Type.Optional(Type.Integer({ minimum: 0, description: "Number of rows, for lists" })),
	data: Type.Unknown({ description: "Data extracted from the API response" }),
});

export type ToolOutput = Static<typeof ToolOutputSchema>;

/** Result details for the UI and session log: the source URL, the provider and, for lists, the row count. */
export interface ToolDetails {
	url: string;
	provider?: ProviderId;
	count?: number;
}

/** Fetches a tool's data from one provider and returns it with the URL to cite. */
export type Backend<TParams extends TObject> = (
	params: Static<TParams>,
	signal?: AbortSignal,
) => Promise<ApiResponse<unknown>>;

interface BaseToolConfig<TParams extends TObject> {
	name: string;
	label: string;
	description: string;
	promptGuidelines?: string[];
	promptSnippet?: string;
	parameters: TParams;
}

interface ProviderToolConfig<TParams extends TObject> extends BaseToolConfig<TParams> {
	backends: Partial<Record<ProviderId, Backend<TParams>>>;
	/** Counts rows for details; by default, arrays are counted. */
	getCount?: (data: unknown) => number | undefined;
}

interface SimpleToolConfig<TParams extends TObject, TResponse> extends BaseToolConfig<TParams> {
	endpoint: string;
	buildParams: (params: Static<TParams>) => ApiParams;
	extractData: (response: TResponse) => unknown;
	/** The same tool on Equibles, for users with only an Equibles key. */
	equibles?: Backend<TParams>;
	/** If provided, adds count to details (for array responses) */
	getCount?: (data: unknown) => number;
}

const countArray = (data: unknown) => (Array.isArray(data) ? data.length : undefined);

/**
 * Registers a tool that runs on whichever supported provider has a key (PINANCE_PROVIDER breaks
 * ties). A tool for a single provider is registered only when that provider has a key, or when no
 * provider has one yet, so its error can say which key to set.
 */
export function registerProviderTool<TParams extends TObject>(
	pi: ExtensionAPI,
	config: ProviderToolConfig<TParams>,
): void {
	const supported = PROVIDER_IDS.filter((id) => config.backends[id]);
	if (!canRegister(supported, providerState())) {
		return;
	}
	const only = supported.length === 1 ? supported[0] : undefined;
	const description = only
		? `${config.description} Needs ${PROVIDERS[only].name} (${PROVIDERS[only].keyName}).`
		: config.description;

	pi.registerTool({
		name: config.name,
		label: config.label,
		description,
		promptSnippet: config.promptSnippet ?? config.description,
		...(config.promptGuidelines ? { promptGuidelines: config.promptGuidelines } : {}),
		parameters: config.parameters,
		outputSchema: ToolOutputSchema,
		annotations: TOOL_ANNOTATIONS,
		executionMode: "parallel",
		execute: async (_toolCallId, params, signal): Promise<AgentToolResult<ToolDetails>> => {
			const provider = chooseProvider(config.name, supported, providerState());
			const backend = config.backends[provider];
			if (!backend) {
				throw new Error(`${config.name} has no ${PROVIDERS[provider].name} backend.`);
			}
			// Pi types params with its own Static; it is the same JSON value as TypeBox's.
			// oxlint-disable-next-line typescript/no-unsafe-type-assertion
			const { data, url } = await backend(params as Static<TParams>, signal);

			const details: ToolDetails = { url, provider };
			const count = (config.getCount ?? countArray)(data);
			if (count !== undefined) {
				details.count = count;
			}

			// Include source URL in response text so LLM can cite it
			const responseText = `${JSON.stringify(data, null, 2)}\n\n[Source: ${url}]`;

			return {
				content: [{ type: "text", text: responseText }],
				details,
				// data is parsed JSON from the API, so the whole object is JSON.
				// oxlint-disable-next-line typescript/no-unsafe-type-assertion
				structuredContent: { ...details, data } as JsonValue,
			};
		},
	});
}

/**
 * Creates and registers a Financial Datasets tool, with an optional Equibles backend.
 * Handles the common pattern of: call API → extract data → return JSON result.
 * Includes source URL in both the response text (for LLM citation) and details.
 */
export function registerSimpleTool<TParams extends TObject, TResponse>(
	pi: ExtensionAPI,
	config: SimpleToolConfig<TParams, TResponse>,
): void {
	const { endpoint, buildParams, extractData, equibles, getCount, ...base } = config;
	const financialdatasets: Backend<TParams> = async (params, signal) => {
		const { data, url } = await callApi<TResponse>(endpoint, buildParams(params), signal);
		return { data: extractData(data), url };
	};
	registerProviderTool(pi, {
		...base,
		backends: { financialdatasets, ...(equibles ? { equibles } : {}) },
		getCount: getCount ?? (() => undefined),
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

/** Registers a tool that only Equibles provides. Array results are counted. */
export function registerEquiblesTool<TParams extends TObject>(
	pi: ExtensionAPI,
	config: BaseToolConfig<TParams> & { run: Backend<TParams> },
): void {
	const { run, ...base } = config;
	registerProviderTool(pi, { ...base, backends: { equibles: run } });
}
