import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";
import type { ArrayResponse, SnapshotResponse } from "../api.js";
import {
	PeriodType,
	ReportPeriodFilterParams,
	TickerOnlyParams,
	type TickerOnlyParamsType,
	TickerParam,
} from "../schemas.js";
import { registerArrayTool, registerSimpleTool } from "../tool-helpers.js";

interface MetricsParams {
	ticker: string;
	period?: "annual" | "quarterly" | "ttm";
	limit?: number;
	report_period?: string;
	report_period_gt?: string;
	report_period_gte?: string;
	report_period_lt?: string;
	report_period_lte?: string;
}

const metricsParams = Type.Object({
	ticker: TickerParam,
	period: Type.Optional(PeriodType),
	limit: Type.Optional(
		Type.Number({
			description: "Number of periods to retrieve (default: 4)",
			default: 4,
		}),
	),
	report_period: Type.Optional(
		Type.String({
			description: "Filter for exact report period date (YYYY-MM-DD)",
		}),
	),
	...ReportPeriodFilterParams,
});

export function registerMetricsTools(pi: ExtensionAPI): void {
	registerSimpleTool<TickerOnlyParamsType, SnapshotResponse>(pi, {
		name: "get_financial_metrics_snapshot",
		label: "Get Financial Metrics Snapshot",
		description:
			"Fetches current financial metrics including market cap, P/E ratio, and dividend yield. Useful for a quick overview of financial health.",
		parameters: TickerOnlyParams,
		endpoint: "/financial-metrics/snapshot/",
		buildParams: (params) => ({ ticker: params.ticker }),
		extractData: (response) => response.snapshot ?? {},
	});

	registerArrayTool<MetricsParams, ArrayResponse<"financial_metrics">>(pi, {
		name: "get_financial_metrics",
		label: "Get Financial Metrics",
		description:
			"Retrieves historical financial metrics like P/E ratio, revenue per share, and enterprise value. Useful for trend analysis.",
		parameters: metricsParams,
		endpoint: "/financial-metrics/",
		buildParams: (params) => ({
			ticker: params.ticker,
			period: params.period ?? "ttm",
			limit: params.limit ?? 4,
			report_period: params.report_period,
			report_period_gt: params.report_period_gt,
			report_period_gte: params.report_period_gte,
			report_period_lt: params.report_period_lt,
			report_period_lte: params.report_period_lte,
		}),
		extractData: (response) => response.financial_metrics ?? [],
	});
}
