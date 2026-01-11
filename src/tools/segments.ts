import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";
import type { ObjectResponse } from "../api.js";
import { PeriodTypeNoTtm, TickerParam } from "../schemas.js";
import { registerSimpleTool } from "../tool-helpers.js";

interface SegmentedRevenuesParams {
	ticker: string;
	period: "annual" | "quarterly";
	limit?: number;
}

const segmentedRevenuesParams = Type.Object({
	ticker: TickerParam,
	period: PeriodTypeNoTtm,
	limit: Type.Optional(
		Type.Number({
			description: "Number of periods to retrieve (default: 10)",
			default: 10,
		}),
	),
});

export function registerSegmentsTools(pi: ExtensionAPI): void {
	registerSimpleTool<SegmentedRevenuesParams, ObjectResponse<"segmented_revenues">>(pi, {
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
