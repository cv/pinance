import type { AgentToolResult, ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";
import { callApi } from "../api.js";

interface InsiderTradesResponse {
	insider_trades: Record<string, unknown>[];
}

const insiderTradesParams = Type.Object({
	ticker: Type.String({
		description: "The stock ticker symbol (e.g., 'AAPL' for Apple)",
	}),
	limit: Type.Optional(
		Type.Number({
			description: "Maximum trades to return (default: 100, max: 1000)",
			default: 100,
		}),
	),
	filing_date: Type.Optional(
		Type.String({
			description: "Exact filing date to filter by (YYYY-MM-DD)",
		}),
	),
	filing_date_gt: Type.Optional(
		Type.String({
			description: "Filter for trades filed after this date (YYYY-MM-DD)",
		}),
	),
	filing_date_gte: Type.Optional(
		Type.String({
			description: "Filter for trades filed on or after this date (YYYY-MM-DD)",
		}),
	),
	filing_date_lt: Type.Optional(
		Type.String({
			description: "Filter for trades filed before this date (YYYY-MM-DD)",
		}),
	),
	filing_date_lte: Type.Optional(
		Type.String({
			description: "Filter for trades filed on or before this date (YYYY-MM-DD)",
		}),
	),
});

export function registerInsiderTradesTools(pi: ExtensionAPI): void {
	pi.registerTool({
		name: "get_insider_trades",
		label: "Get Insider Trades",
		description:
			"Retrieves insider trading transactions from SEC Form 4 filings. Shows purchases and sales by executives, directors, and other insiders.",
		parameters: insiderTradesParams,
		execute: async (
			_toolCallId,
			params,
			_onUpdate,
			_ctx,
			signal,
		): Promise<AgentToolResult<unknown>> => {
			const { data, url } = await callApi<InsiderTradesResponse>(
				"/insider-trades/",
				{
					ticker: params.ticker.toUpperCase(),
					limit: params.limit ?? 100,
					filing_date: params.filing_date,
					filing_date_gt: params.filing_date_gt,
					filing_date_gte: params.filing_date_gte,
					filing_date_lt: params.filing_date_lt,
					filing_date_lte: params.filing_date_lte,
				},
				signal,
			);

			const trades = data.insider_trades ?? [];

			return {
				content: [{ type: "text", text: JSON.stringify(trades, null, 2) }],
				details: { url, count: trades.length },
			};
		},
	});
}
