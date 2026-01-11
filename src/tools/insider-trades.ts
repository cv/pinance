import type { AgentToolResult, ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";
import { type ArrayResponse, callApi } from "../api.js";
import { FilingDateFilterParams, TickerParam } from "../schemas.js";

const insiderTradesParams = Type.Object({
	ticker: TickerParam,
	limit: Type.Optional(
		Type.Number({
			description: "Maximum trades to return (default: 100, max: 1000)",
			default: 100,
		}),
	),
	...FilingDateFilterParams,
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
			const { data, url } = await callApi<ArrayResponse<"insider_trades">>(
				"/insider-trades/",
				{
					ticker: params.ticker,
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
