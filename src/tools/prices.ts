import type { AgentToolResult, ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";
import { callApi } from "../api.js";

interface PriceSnapshot {
	snapshot: Record<string, unknown>;
}

interface PricesResponse {
	prices: Record<string, unknown>[];
}

const priceSnapshotParams = Type.Object({
	ticker: Type.String({
		description: "The stock ticker symbol (e.g., 'AAPL' for Apple)",
	}),
});

const pricesParams = Type.Object({
	ticker: Type.String({
		description: "The stock ticker symbol (e.g., 'AAPL' for Apple)",
	}),
	interval: Type.Optional(
		Type.Union(
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
		),
	),
	interval_multiplier: Type.Optional(
		Type.Number({
			description: "Multiplier for the interval (default: 1)",
			default: 1,
		}),
	),
	start_date: Type.String({
		description: "Start date in YYYY-MM-DD format (required)",
	}),
	end_date: Type.String({
		description: "End date in YYYY-MM-DD format (required)",
	}),
});

export function registerPriceTools(pi: ExtensionAPI): void {
	pi.registerTool({
		name: "get_price_snapshot",
		label: "Get Price Snapshot",
		description:
			"Fetches the most recent price snapshot for a stock, including the latest price, trading volume, and OHLC data.",
		parameters: priceSnapshotParams,
		execute: async (
			_toolCallId,
			params,
			_onUpdate,
			_ctx,
			signal,
		): Promise<AgentToolResult<unknown>> => {
			const { data, url } = await callApi<PriceSnapshot>(
				"/prices/snapshot/",
				{ ticker: params.ticker },
				signal,
			);

			return {
				content: [
					{
						type: "text",
						text: JSON.stringify(data.snapshot ?? {}, null, 2),
					},
				],
				details: { url, snapshot: data.snapshot },
			};
		},
	});

	pi.registerTool({
		name: "get_prices",
		label: "Get Prices",
		description:
			"Retrieves historical price data for a stock over a date range, including open, high, low, close prices, and volume.",
		parameters: pricesParams,
		execute: async (
			_toolCallId,
			params,
			_onUpdate,
			_ctx,
			signal,
		): Promise<AgentToolResult<unknown>> => {
			const { data, url } = await callApi<PricesResponse>(
				"/prices/",
				{
					ticker: params.ticker,
					interval: params.interval ?? "day",
					interval_multiplier: params.interval_multiplier ?? 1,
					start_date: params.start_date,
					end_date: params.end_date,
				},
				signal,
			);

			const prices = data.prices ?? [];

			return {
				content: [
					{
						type: "text",
						text: JSON.stringify(prices, null, 2),
					},
				],
				details: { url, count: prices.length },
			};
		},
	});
}
