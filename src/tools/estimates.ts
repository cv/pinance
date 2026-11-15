import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import type { ArrayResponse } from "../api.js";
import { PeriodTypeNoTtm, TickerParam } from "../schemas.js";
import * as equibles from "../equibles.js";
import { registerArrayTool } from "../tool-helpers.js";

const estimatesParams = Type.Object({
	ticker: TickerParam,
	period: Type.Optional(PeriodTypeNoTtm),
});

export function registerEstimatesTools(pi: ExtensionAPI): void {
	registerArrayTool<typeof estimatesParams, ArrayResponse<"analyst_estimates">>(pi, {
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
		equibles: (params, signal) => equibles.analystEstimates(params.ticker, signal),
	});
}
