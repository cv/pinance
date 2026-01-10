import type { AgentToolResult, ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";
import { callApi } from "../api.js";

interface CryptoSnapshotResponse {
	snapshot: Record<string, unknown>;
}

interface CryptoPricesResponse {
	prices: Record<string, unknown>[];
}

interface CryptoTickersResponse {
	tickers: string[];
}

const cryptoSnapshotParams = Type.Object({
	ticker: Type.String({
		description:
			"Crypto ticker (e.g., 'BTC-USD' for Bitcoin in USD, 'BTC-ETH' for Bitcoin in Ethereum)",
	}),
});

const cryptoPricesParams = Type.Object({
	ticker: Type.String({
		description:
			"Crypto ticker (e.g., 'BTC-USD' for Bitcoin in USD, 'BTC-ETH' for Bitcoin in Ethereum)",
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

export function registerCryptoTools(pi: ExtensionAPI): void {
	pi.registerTool({
		name: "get_crypto_price_snapshot",
		label: "Get Crypto Price Snapshot",
		description:
			"Fetches the most recent price snapshot for a cryptocurrency, including price, volume, and OHLC data.",
		parameters: cryptoSnapshotParams,
		execute: async (
			_toolCallId,
			params,
			_onUpdate,
			_ctx,
			signal,
		): Promise<AgentToolResult<unknown>> => {
			const { data, url } = await callApi<CryptoSnapshotResponse>(
				"/crypto/prices/snapshot/",
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
		name: "get_crypto_prices",
		label: "Get Crypto Prices",
		description:
			"Retrieves historical price data for a cryptocurrency over a date range, including OHLC and volume.",
		parameters: cryptoPricesParams,
		execute: async (
			_toolCallId,
			params,
			_onUpdate,
			_ctx,
			signal,
		): Promise<AgentToolResult<unknown>> => {
			const { data, url } = await callApi<CryptoPricesResponse>(
				"/crypto/prices/",
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
				content: [{ type: "text", text: JSON.stringify(prices, null, 2) }],
				details: { url, count: prices.length },
			};
		},
	});

	pi.registerTool({
		name: "get_available_crypto_tickers",
		label: "Get Available Crypto Tickers",
		description: "Retrieves the list of available cryptocurrency tickers.",
		parameters: Type.Object({}),
		execute: async (
			_toolCallId,
			_params,
			_onUpdate,
			_ctx,
			signal,
		): Promise<AgentToolResult<unknown>> => {
			const { data, url } = await callApi<CryptoTickersResponse>(
				"/crypto/prices/tickers/",
				{},
				signal,
			);

			const tickers = data.tickers ?? [];

			return {
				content: [{ type: "text", text: JSON.stringify(tickers, null, 2) }],
				details: { url, count: tickers.length },
			};
		},
	});
}
