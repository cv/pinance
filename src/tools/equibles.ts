import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { callEquibles, equiblesTicker } from "../api.js";
import { TickerParam } from "../schemas.js";
import { registerEquiblesTool } from "../tool-helpers.js";

type Paged = { data?: unknown[]; meta?: Record<string, unknown> } & Record<string, unknown>;

/** Rows plus everything else in the response (paging, call details, report dates). */
function split(body: Paged): { rows: unknown[]; meta: Record<string, unknown> } {
	const { data = [], meta = {}, ...rest } = body;
	return { rows: data, meta: { ...rest, ...meta } };
}

const Limit = (description: string, maximum: number) =>
	Type.Optional(Type.Integer({ description, minimum: 1, maximum }));
const Offset = Type.Optional(Type.Integer({ description: "Rows to skip, for paging", minimum: 0 }));
const DateParam = (description: string) =>
	Type.Optional(Type.String({ description: `${description} (YYYY-MM-DD)` }));

const earningsCallParams = Type.Object({
	ticker: TickerParam,
	fiscal_year: Type.Integer({
		description: "The company's own fiscal year (e.g., 2027 for Nvidia's FY2027)",
		minimum: 1990,
	}),
	fiscal_quarter: Type.Integer({ description: "Fiscal quarter, 1-4", minimum: 1, maximum: 4 }),
	limit: Limit("Turns per call (default 50, max 200)", 200),
	offset: Offset,
});

const holdersParams = Type.Object({
	ticker: TickerParam,
	report_date: DateParam("A 13F report date of the stock; default the latest"),
	holder_types: Type.Optional(
		Type.Array(Type.String(), {
			description: "Holder types to keep: adv, era, ia, bank, ins, bd, fund, plan, nonus, hc, unk",
		}),
	),
	limit: Limit("Holders (default 20, max 500)", 500),
	offset: Offset,
});

const shortInterestParams = Type.Object({
	ticker: TickerParam,
	start_date: DateParam("First settlement date; default 12 months ago"),
	end_date: DateParam("Last settlement date"),
	limit: Limit("Settlements (default 24, max 500)", 500),
});

const congressParams = Type.Object({
	ticker: Type.Optional(TickerParam),
	member_id: Type.Optional(
		Type.String({ description: "Member id from an earlier result; give it or ticker, or both" }),
	),
	transaction_type: Type.Optional(Type.Enum(["Purchase", "Sale"], { description: "Default both" })),
	start_date: DateParam("First transaction date; default 12 months ago"),
	end_date: DateParam("Last transaction date"),
	limit: Limit("Trades (default 50, max 500)", 500),
});

const searchParams = Type.Object({
	query: Type.String({ description: "What to find, such as 'gross margin guidance'" }),
	ticker: Type.Optional(TickerParam),
	document_type: Type.Optional(
		Type.Array(Type.String(), {
			description: "Document types, such as ['TenK', 'TenQ', 'EightK']",
		}),
	),
	start_date: DateParam("Earliest filing date"),
	end_date: DateParam("Latest filing date"),
	limit: Limit("Passages (default 5, max 500)", 500),
	match: Type.Optional(
		Type.Enum(["ranked", "phrase"], {
			description: "'phrase' for an exact phrase; default ranked",
		}),
	),
});

export function registerEquiblesTools(pi: ExtensionAPI): void {
	registerEquiblesTool(pi, {
		name: "get_earnings_call_transcript",
		label: "Get Earnings Call Transcript",
		description:
			"Retrieves the speaker-labelled transcript of a quarterly earnings call, in spoken order. Page with offset while meta.hasMore is true.",
		parameters: earningsCallParams,
		run: async (params, signal) => {
			const path = `/v1/stocks/${equiblesTicker(params.ticker)}/earnings-calls/${params.fiscal_year}/${params.fiscal_quarter}/speakers`;
			const { data, url } = await callEquibles<Paged>(
				path,
				{ limit: params.limit, offset: params.offset },
				signal,
			);
			const { rows, meta } = split(data);
			return { data: { turns: rows, meta }, url };
		},
	});

	registerEquiblesTool(pi, {
		name: "get_institutional_holders",
		label: "Get Institutional Holders",
		description:
			"Retrieves the largest 13F institutional holders of a stock or ETF, with shares, value, share of total, holder type, and style.",
		parameters: holdersParams,
		run: async (params, signal) => {
			const { data, url } = await callEquibles<Paged>(
				`/v1/stocks/${equiblesTicker(params.ticker)}/institutional-holders`,
				{
					reportDate: params.report_date,
					holderTypes: params.holder_types?.join(","),
					limit: params.limit,
					offset: params.offset,
				},
				signal,
			);
			const { rows, meta } = split(data);
			return { data: { holders: rows, meta }, url };
		},
	});

	registerEquiblesTool(pi, {
		name: "get_short_interest",
		label: "Get Short Interest",
		description:
			"Retrieves bi-monthly FINRA short interest for a stock or ETF, newest first: short position, change, average daily volume, and days to cover.",
		parameters: shortInterestParams,
		run: async (params, signal) => {
			const { data, url } = await callEquibles<Paged>(
				`/v1/stocks/${equiblesTicker(params.ticker)}/short-interest`,
				{ startDate: params.start_date, endDate: params.end_date, limit: params.limit },
				signal,
			);
			return { data: split(data).rows, url };
		},
	});

	registerEquiblesTool(pi, {
		name: "get_congress_trades",
		label: "Get Congressional Trades",
		description:
			"Retrieves stock trades disclosed by members of the U.S. House and Senate, by ticker, member, or both.",
		parameters: congressParams,
		run: async (params, signal) => {
			if (!params.ticker && !params.member_id) {
				throw new Error("get_congress_trades needs ticker, member_id, or both.");
			}
			const { data, url } = await callEquibles<Paged>(
				"/v1/congress/trades",
				{
					ticker: params.ticker?.toUpperCase(),
					memberId: params.member_id,
					transactionType: params.transaction_type,
					startDate: params.start_date,
					endDate: params.end_date,
					limit: params.limit,
				},
				signal,
			);
			return { data: split(data).rows, url };
		},
	});

	registerEquiblesTool(pi, {
		name: "search_filings",
		label: "Search Filings",
		description:
			"Keyword and semantic search over SEC filings and earnings call transcripts since 2000, for one company or all. Each passage has a url deep link to cite.",
		parameters: searchParams,
		run: async (params, signal) => {
			const path = params.ticker
				? `/v1/stocks/${equiblesTicker(params.ticker)}/filings/search`
				: "/v1/filings/search";
			const { data, url } = await callEquibles<Paged>(
				path,
				{
					query: params.query,
					documentType: params.document_type?.join(","),
					startDate: params.start_date,
					endDate: params.end_date,
					limit: params.limit,
					match: params.match,
				},
				signal,
			);
			return { data: split(data).rows, url };
		},
	});
}
