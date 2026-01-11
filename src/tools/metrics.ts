import type { AgentToolResult, ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";
import { callApi } from "../api.js";
import { TickerParam } from "../schemas.js";

interface MetricsSnapshotResponse {
	snapshot: Record<string, unknown>;
}

interface MetricsResponse {
	financial_metrics: Record<string, unknown>[];
}

const metricsSnapshotParams = Type.Object({
	ticker: TickerParam,
});

const metricsParams = Type.Object({
	ticker: TickerParam,
	period: Type.Optional(
		Type.Union([Type.Literal("annual"), Type.Literal("quarterly"), Type.Literal("ttm")], {
			description: "Reporting period (default: 'ttm')",
			default: "ttm",
		}),
	),
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
});

export function registerMetricsTools(pi: ExtensionAPI): void {
	pi.registerTool({
		name: "get_financial_metrics_snapshot",
		label: "Get Financial Metrics Snapshot",
		description:
			"Fetches current financial metrics including market cap, P/E ratio, and dividend yield. Useful for a quick overview of financial health.",
		parameters: metricsSnapshotParams,
		execute: async (
			_toolCallId,
			params,
			_onUpdate,
			_ctx,
			signal,
		): Promise<AgentToolResult<unknown>> => {
			const { data, url } = await callApi<MetricsSnapshotResponse>(
				"/financial-metrics/snapshot/",
				{ ticker: params.ticker },
				signal,
			);

			return {
				content: [{ type: "text", text: JSON.stringify(data.snapshot ?? {}, null, 2) }],
				details: { url },
			};
		},
	});

	pi.registerTool({
		name: "get_financial_metrics",
		label: "Get Financial Metrics",
		description:
			"Retrieves historical financial metrics like P/E ratio, revenue per share, and enterprise value. Useful for trend analysis.",
		parameters: metricsParams,
		execute: async (
			_toolCallId,
			params,
			_onUpdate,
			_ctx,
			signal,
		): Promise<AgentToolResult<unknown>> => {
			const { data, url } = await callApi<MetricsResponse>(
				"/financial-metrics/",
				{
					ticker: params.ticker,
					period: params.period ?? "ttm",
					limit: params.limit ?? 4,
					report_period: params.report_period,
					report_period_gt: params.report_period_gt,
					report_period_gte: params.report_period_gte,
					report_period_lt: params.report_period_lt,
					report_period_lte: params.report_period_lte,
				},
				signal,
			);

			const metrics = data.financial_metrics ?? [];

			return {
				content: [{ type: "text", text: JSON.stringify(metrics, null, 2) }],
				details: { url, count: metrics.length },
			};
		},
	});
}
