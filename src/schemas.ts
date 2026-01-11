import { Type } from "@sinclair/typebox";

// Common interval types for price data
export const IntervalType = Type.Union(
	[
		Type.Literal("minute"),
		Type.Literal("day"),
		Type.Literal("week"),
		Type.Literal("month"),
		Type.Literal("year"),
	],
	{
		description: "Time interval for price data (default: 'day')",
		default: "day",
	},
);

// Common period types for financial data
export const PeriodType = Type.Union(
	[Type.Literal("annual"), Type.Literal("quarterly"), Type.Literal("ttm")],
	{
		description:
			"Reporting period: 'annual' for yearly, 'quarterly' for quarterly, 'ttm' for trailing twelve months",
	},
);

export const PeriodTypeNoTtm = Type.Union([Type.Literal("annual"), Type.Literal("quarterly")], {
	description: "Reporting period: 'annual' or 'quarterly'",
});

// Stock ticker parameter
export const TickerParam = Type.String({
	description: "The stock ticker symbol (e.g., 'AAPL' for Apple)",
});

// Crypto ticker parameter
export const CryptoTickerParam = Type.String({
	description:
		"Crypto ticker (e.g., 'BTC-USD' for Bitcoin in USD, 'BTC-ETH' for Bitcoin in Ethereum)",
});

// Common ticker-only params schemas (for snapshot endpoints)
export const TickerOnlyParams = Type.Object({ ticker: TickerParam });
export const CryptoTickerOnlyParams = Type.Object({ ticker: CryptoTickerParam });

// TypeScript type for ticker-only params
export type TickerOnlyParamsType = { ticker: string };

// Date range parameters
export const DateRangeParams = {
	start_date: Type.String({
		description: "Start date in YYYY-MM-DD format (required)",
	}),
	end_date: Type.String({
		description: "End date in YYYY-MM-DD format (required)",
	}),
} as const;

// Optional date range parameters
export const OptionalDateRangeParams = {
	start_date: Type.Optional(
		Type.String({
			description: "Start date in YYYY-MM-DD format",
		}),
	),
	end_date: Type.Optional(
		Type.String({
			description: "End date in YYYY-MM-DD format",
		}),
	),
} as const;

// Report period filter parameters (for financial data)
export const ReportPeriodFilterParams = {
	report_period_gt: Type.Optional(
		Type.String({
			description: "Filter for periods after this date (YYYY-MM-DD)",
		}),
	),
	report_period_gte: Type.Optional(
		Type.String({
			description: "Filter for periods on or after this date (YYYY-MM-DD)",
		}),
	),
	report_period_lt: Type.Optional(
		Type.String({
			description: "Filter for periods before this date (YYYY-MM-DD)",
		}),
	),
	report_period_lte: Type.Optional(
		Type.String({
			description: "Filter for periods on or before this date (YYYY-MM-DD)",
		}),
	),
} as const;

// Filing date filter parameters (for SEC filings)
export const FilingDateFilterParams = {
	filing_date: Type.Optional(
		Type.String({
			description: "Exact filing date to filter by (YYYY-MM-DD)",
		}),
	),
	filing_date_gt: Type.Optional(
		Type.String({
			description: "Filter for filings after this date (YYYY-MM-DD)",
		}),
	),
	filing_date_gte: Type.Optional(
		Type.String({
			description: "Filter for filings on or after this date (YYYY-MM-DD)",
		}),
	),
	filing_date_lt: Type.Optional(
		Type.String({
			description: "Filter for filings before this date (YYYY-MM-DD)",
		}),
	),
	filing_date_lte: Type.Optional(
		Type.String({
			description: "Filter for filings on or before this date (YYYY-MM-DD)",
		}),
	),
} as const;

// Price interval parameters
export const PriceIntervalParams = {
	interval: Type.Optional(IntervalType),
	interval_multiplier: Type.Optional(
		Type.Number({
			description: "Multiplier for the interval (default: 1)",
			default: 1,
		}),
	),
} as const;
