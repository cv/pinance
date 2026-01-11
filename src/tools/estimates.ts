import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";
import { TickerParam } from "../schemas.js";
import { registerArrayTool } from "../tool-helpers.js";

interface EstimatesResponse {
	analyst_estimates: Record<string, unknown>[];
}

interface EstimatesParams {
	ticker: string;
	period?: "annual" | "quarterly";
}

const estimatesParams = Type.Object({
	ticker: TickerParam,
	period: Type.Optional(
		Type.Union([Type.Literal("annual"), Type.Literal("quarterly")], {
			description: "Period for estimates: 'annual' or 'quarterly' (default: 'annual')",
			default: "annual",
		}),
	),
});

export function registerEstimatesTools(pi: ExtensionAPI): void {
	registerArrayTool<EstimatesParams, EstimatesResponse>(pi, {
		name: "get_analyst_estimates",
		label: "Get Analyst Estimates",
		description:
			"Retrieves analyst estimates including EPS forecasts. Useful for understanding consensus expectations and future growth prospects.",
		parameters: estimatesParams,
		endpoint: "/analyst-estimates/",
		buildParams: (params) => ({
			ticker: params.ticker,
			period: params.period ?? "annual",
		}),
		extractData: (response) => response.analyst_estimates ?? [],
	});
}
