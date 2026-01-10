import type { AgentToolResult, ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";
import { callApi } from "../api.js";

interface SegmentedRevenuesResponse {
	segmented_revenues: Record<string, unknown>;
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
	pi.registerTool({
		name: "get_segmented_revenues",
		label: "Get Segmented Revenues",
		description:
			"Provides revenue breakdown by operating segments (products, services, geographic regions). Useful for analyzing revenue composition.",
		parameters: segmentedRevenuesParams,
		execute: async (
			_toolCallId,
			params,
			_onUpdate,
			_ctx,
			signal,
		): Promise<AgentToolResult<unknown>> => {
			const { data, url } = await callApi<SegmentedRevenuesResponse>(
				"/financials/segmented-revenues/",
				{
					ticker: params.ticker,
					period: params.period,
					limit: params.limit ?? 10,
				},
				signal,
			);

			return {
				content: [{ type: "text", text: JSON.stringify(data.segmented_revenues ?? {}, null, 2) }],
				details: { url },
			};
		},
	});
}
