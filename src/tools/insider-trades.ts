import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";
import type { ArrayResponse } from "../api.js";
import { FilingDateFilterParams, TickerParam } from "../schemas.js";
import { registerArrayTool } from "../tool-helpers.js";

interface InsiderTradesParams {
	ticker: string;
	limit?: number;
	filing_date?: string;
	filing_date_gt?: string;
	filing_date_gte?: string;
	filing_date_lt?: string;
	filing_date_lte?: string;
}

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
	registerArrayTool<InsiderTradesParams, ArrayResponse<"insider_trades">>(pi, {
		name: "get_insider_trades",
		label: "Get Insider Trades",
		description:
			"Retrieves insider trading transactions from SEC Form 4 filings. Shows purchases and sales by executives, directors, and other insiders.",
		parameters: insiderTradesParams,
		endpoint: "/insider-trades/",
		buildParams: (params) => ({
			ticker: params.ticker,
			limit: params.limit ?? 100,
			filing_date: params.filing_date,
			filing_date_gt: params.filing_date_gt,
			filing_date_gte: params.filing_date_gte,
			filing_date_lt: params.filing_date_lt,
			filing_date_lte: params.filing_date_lte,
		}),
		extractData: (response) => response.insider_trades ?? [],
	});
}
