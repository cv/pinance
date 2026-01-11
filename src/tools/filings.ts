import type { AgentToolResult, ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";
import { callApi } from "../api.js";
import { formatItemsDescription, ITEMS_10K_MAP, ITEMS_10Q_MAP } from "../constants.js";

interface FilingsResponse {
	filings: Record<string, unknown>[];
}

interface FilingItemsResponse {
	[key: string]: unknown;
}

const filingsParams = Type.Object({
	ticker: Type.String({
		description: "The stock ticker symbol (e.g., 'AAPL' for Apple)",
	}),
	filing_type: Type.Optional(
		Type.Union([Type.Literal("10-K"), Type.Literal("10-Q"), Type.Literal("8-K")], {
			description:
				"Filing type: '10-K' for annual, '10-Q' for quarterly, '8-K' for current reports",
		}),
	),
	limit: Type.Optional(
		Type.Number({
			description: "Maximum filings to return (default: 10)",
			default: 10,
		}),
	),
});

const filing10KItemsParams = Type.Object({
	ticker: Type.String({
		description: "The stock ticker symbol (e.g., 'AAPL' for Apple)",
	}),
	year: Type.Number({
		description: "The year of the 10-K filing (e.g., 2023)",
	}),
	item: Type.Optional(
		Type.Array(Type.String(), {
			description: `Specific items to retrieve. Valid items:\n${formatItemsDescription(ITEMS_10K_MAP)}`,
		}),
	),
});

const filing10QItemsParams = Type.Object({
	ticker: Type.String({
		description: "The stock ticker symbol (e.g., 'AAPL' for Apple)",
	}),
	year: Type.Number({
		description: "The year of the 10-Q filing (e.g., 2023)",
	}),
	quarter: Type.Number({
		description: "The quarter of the 10-Q filing (1, 2, 3, or 4)",
	}),
	item: Type.Optional(
		Type.Array(Type.String(), {
			description: `Specific items to retrieve. Valid items:\n${formatItemsDescription(ITEMS_10Q_MAP)}`,
		}),
	),
});

const filing8KItemsParams = Type.Object({
	ticker: Type.String({
		description: "The stock ticker symbol (e.g., 'AAPL' for Apple)",
	}),
	accession_number: Type.String({
		description:
			"SEC accession number for the 8-K (e.g., '0000320193-24-000123'). Get from get_filings.",
	}),
});

export function registerFilingsTools(pi: ExtensionAPI): void {
	pi.registerTool({
		name: "get_filings",
		label: "Get Filings",
		description:
			"Retrieves SEC filing metadata (accession numbers, types, URLs). Does NOT return content - use get_10K/10Q/8K_filing_items for that.",
		parameters: filingsParams,
		execute: async (
			_toolCallId,
			params,
			_onUpdate,
			_ctx,
			signal,
		): Promise<AgentToolResult<unknown>> => {
			const { data, url } = await callApi<FilingsResponse>(
				"/filings/",
				{
					ticker: params.ticker,
					filing_type: params.filing_type,
					limit: params.limit ?? 10,
				},
				signal,
			);

			const filings = data.filings ?? [];

			return {
				content: [{ type: "text", text: JSON.stringify(filings, null, 2) }],
				details: { url, count: filings.length },
			};
		},
	});

	pi.registerTool({
		name: "get_10K_filing_items",
		label: "Get 10-K Filing Items",
		description:
			"Retrieves specific sections from a 10-K annual report (Business, Risk Factors, MD&A, Financial Statements, etc.)",
		parameters: filing10KItemsParams,
		execute: async (
			_toolCallId,
			params,
			_onUpdate,
			_ctx,
			signal,
		): Promise<AgentToolResult<unknown>> => {
			const { data, url } = await callApi<FilingItemsResponse>(
				"/filings/items/",
				{
					ticker: params.ticker,
					filing_type: "10-K",
					year: params.year,
					item: params.item,
				},
				signal,
			);

			return {
				content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
				details: { url },
			};
		},
	});

	pi.registerTool({
		name: "get_10Q_filing_items",
		label: "Get 10-Q Filing Items",
		description:
			"Retrieves specific sections from a 10-Q quarterly report (Financial Statements, MD&A, Market Risk, Controls).",
		parameters: filing10QItemsParams,
		execute: async (
			_toolCallId,
			params,
			_onUpdate,
			_ctx,
			signal,
		): Promise<AgentToolResult<unknown>> => {
			const { data, url } = await callApi<FilingItemsResponse>(
				"/filings/items/",
				{
					ticker: params.ticker,
					filing_type: "10-Q",
					year: params.year,
					quarter: params.quarter,
					item: params.item,
				},
				signal,
			);

			return {
				content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
				details: { url },
			};
		},
	});

	pi.registerTool({
		name: "get_8K_filing_items",
		label: "Get 8-K Filing Items",
		description:
			"Retrieves sections from an 8-K current report (material events like acquisitions, results, management changes).",
		parameters: filing8KItemsParams,
		execute: async (
			_toolCallId,
			params,
			_onUpdate,
			_ctx,
			signal,
		): Promise<AgentToolResult<unknown>> => {
			const { data, url } = await callApi<FilingItemsResponse>(
				"/filings/items/",
				{
					ticker: params.ticker,
					filing_type: "8-K",
					accession_number: params.accession_number,
				},
				signal,
			);

			return {
				content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
				details: { url },
			};
		},
	});
}
