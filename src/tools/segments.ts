import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";
import { registerSimpleTool } from "../tool-helpers.js";

interface SegmentedRevenuesResponse {
	segmented_revenues: Record<string, unknown>;
}

interface SegmentedRevenuesParams {
	ticker: string;
	period: "annual" | "quarterly";
	limit?: number;
}

const segmentedRevenuesParams = Type.Object({
	ticker: Type.String({
		description: "The stock ticker symbol (e.g., 'AAPL' for Apple)",
	}),
	period: Type.Union([Type.Literal("annual"), Type.Literal("quarterly")], {
		description: "Reporting period: 'annual' or 'quarterly'",
	}),
	limit: Type.Optional(
		Type.Number({
			description: "Number of periods to retrieve (default: 10)",
			default: 10,
		}),
	),
});

export function registerSegmentsTools(pi: ExtensionAPI): void {
	registerSimpleTool<SegmentedRevenuesParams, SegmentedRevenuesResponse>(pi, {
		name: "get_segmented_revenues",
		label: "Get Segmented Revenues",
		description:
			"Provides revenue breakdown by operating segments (products, services, geographic regions). Useful for analyzing revenue composition.",
		parameters: segmentedRevenuesParams,
		endpoint: "/financials/segmented-revenues/",
		buildParams: (params) => ({
			ticker: params.ticker,
			period: params.period,
			limit: params.limit ?? 10,
		}),
		extractData: (response) => response.segmented_revenues ?? {},
	});
}
