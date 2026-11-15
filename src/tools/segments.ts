import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import type { ArrayResponse } from "../api.js";
import { PeriodTypeNoTtm, ReportPeriodFilterParams, TickerParam } from "../schemas.js";
import { registerArrayTool } from "../tool-helpers.js";

export const SEGMENTS_ENDPOINT = "/financials/income-statements/segments/";

const segmentedRevenuesParams = Type.Object({
	ticker: TickerParam,
	period: PeriodTypeNoTtm,
	limit: Type.Optional(
		Type.Integer({
			description: "Number of periods to retrieve (default: 4)",
			default: 4,
			minimum: 1,
		}),
	),
	report_period: Type.Optional(
		Type.String({ description: "Filter for exact report period date (YYYY-MM-DD)" }),
	),
	...ReportPeriodFilterParams,
});

// The API returns `income_statement_segments`; its docs still show `segmented_financials`.
type SegmentsResponse = Partial<
	ArrayResponse<"income_statement_segments"> & ArrayResponse<"segmented_financials">
>;

export function registerSegmentsTools(pi: ExtensionAPI): void {
	registerArrayTool<typeof segmentedRevenuesParams, SegmentsResponse>(pi, {
		name: "get_segmented_revenues",
		label: "Get Segmented Revenues",
		description:
			"Provides revenue by product line and by business segment or geography, plus segment operating income and depreciation, from 10-K and 10-Q filings. Useful for analyzing revenue composition.",
		parameters: segmentedRevenuesParams,
		endpoint: SEGMENTS_ENDPOINT,
		buildParams: (params) => ({
			ticker: params.ticker,
			period: params.period,
			limit: params.limit ?? 4,
			report_period: params.report_period,
			report_period_gt: params.report_period_gt,
			report_period_gte: params.report_period_gte,
			report_period_lt: params.report_period_lt,
			report_period_lte: params.report_period_lte,
		}),
		extractData: (response) =>
			response.income_statement_segments ?? response.segmented_financials ?? [],
	});
}
