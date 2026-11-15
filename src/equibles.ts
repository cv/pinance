import { type ApiResponse, callEquibles, equiblesTicker } from "./api.js";

/**
 * Equibles backends for the tools both providers support. Each returns provider-native JSON with
 * the URL to cite; field names differ from Financial Datasets (for example `close` and
 * `changePercent` instead of `price` and `day_change_percent`).
 */

/** A request that Equibles cannot answer, with what to do instead. */
export class UnsupportedOnEquiblesError extends Error {
	constructor(what: string, instead: string) {
		super(`Equibles does not provide ${what}. ${instead}`);
		this.name = "UnsupportedOnEquiblesError";
	}
}

type Rows = { data?: Record<string, unknown>[] };
type Body = Record<string, unknown>;

const stock = (ticker: string, rest: string) => `/v1/stocks/${equiblesTicker(ticker)}${rest}`;

/** The latest settled daily bar. On the Free plan a session appears 4 hours after the close. */
export async function latestPrice(
	ticker: string,
	signal?: AbortSignal,
): Promise<ApiResponse<unknown>> {
	const { data, url } = await callEquibles<Rows & { notice?: string }>(
		"/v1/prices/latest",
		{ tickers: ticker.trim().toUpperCase() },
		signal,
	);
	const row = data.data?.[0] ?? {};
	return { data: data.notice ? { ...row, notice: data.notice } : row, url };
}

export type PriceInterval = "minute" | "day" | "week" | "month" | "year";

export function priceInterval(interval: PriceInterval = "day", multiplier = 1): string {
	if (multiplier !== 1) {
		throw new UnsupportedOnEquiblesError(
			"interval multipliers",
			"Use interval_multiplier 1 with day, week, or month.",
		);
	}
	switch (interval) {
		case "day":
			return "daily";
		case "week":
			return "weekly";
		case "month":
			return "monthly";
		default:
			throw new UnsupportedOnEquiblesError(
				`${interval} bars through this tool`,
				"Use day, week, or month.",
			);
	}
}

export async function prices(
	params: {
		ticker: string;
		start_date: string;
		end_date: string;
		interval?: PriceInterval;
		interval_multiplier?: number;
	},
	signal?: AbortSignal,
): Promise<ApiResponse<unknown>> {
	const interval = priceInterval(params.interval, params.interval_multiplier);
	const { data, url } = await callEquibles<Rows>(
		stock(params.ticker, "/prices"),
		{ startDate: params.start_date, endDate: params.end_date, interval, limit: 500 },
		signal,
	);
	return { data: data.data ?? [], url };
}

export const STATEMENTS = { income: "income", balance: "balance", cash_flow: "cashflow" } as const;
export type Statement = keyof typeof STATEMENTS;
export type FiscalPeriod = "FY" | "Q1" | "Q2" | "Q3" | "Q4";

export interface StatementParams {
	ticker: string;
	period: "annual" | "quarterly" | "ttm";
	fiscal_year?: number;
	fiscal_period?: FiscalPeriod;
}

/** Equibles returns one period per call: the latest, or the one fiscal_year and fiscal_period name. */
export function statementQuery(
	params: StatementParams,
): Record<string, string | number | undefined> {
	if (params.period === "ttm") {
		throw new UnsupportedOnEquiblesError(
			"trailing-twelve-month statements",
			"Use period 'annual' or 'quarterly'; get_financial_metrics_snapshot has TTM figures.",
		);
	}
	return {
		year: params.fiscal_year,
		period: params.fiscal_period ?? (params.period === "annual" ? "FY" : undefined),
	};
}

export async function statement(
	which: Statement,
	params: StatementParams,
	signal?: AbortSignal,
): Promise<ApiResponse<unknown>> {
	return callEquibles<Body>(
		stock(params.ticker, `/financial-statements/${STATEMENTS[which]}`),
		statementQuery(params),
		signal,
	);
}

export async function allStatements(
	params: StatementParams,
	signal?: AbortSignal,
): Promise<ApiResponse<unknown>> {
	const [income, balance, cashFlow] = await Promise.all([
		statement("income", params, signal),
		statement("balance", params, signal),
		statement("cash_flow", params, signal),
	]);
	return {
		data: {
			income: income.data,
			balance: balance.data,
			cash_flow: cashFlow.data,
			sources: [income.url, balance.url, cashFlow.url],
		},
		url: income.url,
	};
}

export async function valuationMultiples(
	ticker: string,
	signal?: AbortSignal,
): Promise<ApiResponse<unknown>> {
	return callEquibles<Body>(stock(ticker, "/valuation-multiples"), {}, signal);
}

/** Quarterly valuation points, newest first, like Financial Datasets' metrics history. */
export async function valuationHistory(
	ticker: string,
	limit = 4,
	signal?: AbortSignal,
): Promise<ApiResponse<unknown>> {
	const { data, url } = await callEquibles<{ points?: Record<string, unknown>[] }>(
		stock(ticker, "/valuation-multiples/history"),
		{},
		signal,
	);
	return { data: (data.points ?? []).slice(-limit).toReversed(), url };
}

export async function analystEstimates(
	ticker: string,
	signal?: AbortSignal,
): Promise<ApiResponse<unknown>> {
	return callEquibles<Body>(stock(ticker, "/analyst-estimates"), { limit: 100 }, signal);
}

export async function revenueBreakdown(
	ticker: string,
	signal?: AbortSignal,
): Promise<ApiResponse<unknown>> {
	return callEquibles<Body>(stock(ticker, "/revenue-breakdown"), {}, signal);
}

export const DOCUMENT_TYPES = { "10-K": "TenK", "10-Q": "TenQ", "8-K": "EightK" } as const;

export async function filings(
	params: { ticker: string; filing_type?: keyof typeof DOCUMENT_TYPES; limit?: number },
	signal?: AbortSignal,
): Promise<ApiResponse<unknown>> {
	const { data, url } = await callEquibles<Rows>(
		stock(params.ticker, "/filings"),
		{
			documentType: params.filing_type ? DOCUMENT_TYPES[params.filing_type] : undefined,
			limit: Math.min(params.limit ?? 10, 500),
		},
		signal,
	);
	return { data: data.data ?? [], url };
}

export interface DateFilters {
	filing_date?: string;
	filing_date_gt?: string;
	filing_date_gte?: string;
	filing_date_lt?: string;
	filing_date_lte?: string;
}

/** Equibles filters insider trades by transaction date, inclusive; the bounds are the nearest match. */
export function transactionDateRange(filters: DateFilters): {
	startDate: string | undefined;
	endDate: string | undefined;
} {
	return {
		startDate: filters.filing_date_gte ?? filters.filing_date_gt ?? filters.filing_date,
		endDate: filters.filing_date_lte ?? filters.filing_date_lt ?? filters.filing_date,
	};
}

export async function insiderTransactions(
	params: DateFilters & { ticker: string; limit?: number },
	signal?: AbortSignal,
): Promise<ApiResponse<unknown>> {
	const { data, url } = await callEquibles<Rows>(
		stock(params.ticker, "/insider-transactions"),
		{ ...transactionDateRange(params), limit: Math.min(params.limit ?? 100, 500) },
		signal,
	);
	return { data: data.data ?? [], url };
}
