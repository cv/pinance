import type { AgentToolResult, ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";
import { callApi } from "../api.js";

interface EstimatesResponse {
	analyst_estimates: Record<string, unknown>[];
}

const estimatesParams = Type.Object({
	ticker: Type.String({
		description: "The stock ticker symbol (e.g., 'AAPL' for Apple)",
	}),
	period: Type.Optional(
		Type.Union([Type.Literal("annual"), Type.Literal("quarterly")], {
			description: "Period for estimates: 'annual' or 'quarterly' (default: 'annual')",
			default: "annual",
		}),
	),
});

export function registerEstimatesTools(pi: ExtensionAPI): void {
	pi.registerTool({
		name: "get_analyst_estimates",
		label: "Get Analyst Estimates",
		description:
			"Retrieves analyst estimates including EPS forecasts. Useful for understanding consensus expectations and future growth prospects.",
		parameters: estimatesParams,
		execute: async (
			_toolCallId,
			params,
			_onUpdate,
			_ctx,
			signal,
		): Promise<AgentToolResult<unknown>> => {
			const { data, url } = await callApi<EstimatesResponse>(
				"/analyst-estimates/",
				{
					ticker: params.ticker,
					period: params.period ?? "annual",
				},
				signal,
			);

			const estimates = data.analyst_estimates ?? [];

			return {
				content: [{ type: "text", text: JSON.stringify(estimates, null, 2) }],
				details: { url, count: estimates.length },
			};
		},
	});
}
