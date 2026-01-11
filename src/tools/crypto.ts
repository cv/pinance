import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";
import type { ArrayResponse, SnapshotResponse } from "../api.js";
import {
	CryptoTickerOnlyParams,
	CryptoTickerParam,
	DateRangeParams,
	PriceIntervalParams,
	type TickerOnlyParamsType,
} from "../schemas.js";
import { registerArrayTool, registerSimpleTool } from "../tool-helpers.js";

interface TickersResponse {
	tickers: string[];
}

interface CryptoPricesParams {
	ticker: string;
	interval?: "minute" | "day" | "week" | "month" | "year";
	interval_multiplier?: number;
	start_date: string;
	end_date: string;
}

const cryptoPricesParams = Type.Object({
	ticker: CryptoTickerParam,
	...PriceIntervalParams,
	...DateRangeParams,
});

export function registerCryptoTools(pi: ExtensionAPI): void {
	registerSimpleTool<TickerOnlyParamsType, SnapshotResponse>(pi, {
		name: "get_crypto_price_snapshot",
		label: "Get Crypto Price Snapshot",
		description:
			"Fetches the most recent price snapshot for a cryptocurrency, including price, volume, and OHLC data.",
		parameters: CryptoTickerOnlyParams,
		endpoint: "/crypto/prices/snapshot/",
		buildParams: (params) => ({ ticker: params.ticker }),
		extractData: (response) => response.snapshot ?? {},
	});

	registerArrayTool<CryptoPricesParams, ArrayResponse<"prices">>(pi, {
		name: "get_crypto_prices",
		label: "Get Crypto Prices",
		description:
			"Retrieves historical price data for a cryptocurrency over a date range, including OHLC and volume.",
		parameters: cryptoPricesParams,
		endpoint: "/crypto/prices/",
		buildParams: (params) => ({
			ticker: params.ticker,
			interval: params.interval ?? "day",
			interval_multiplier: params.interval_multiplier ?? 1,
			start_date: params.start_date,
			end_date: params.end_date,
		}),
		extractData: (response) => response.prices ?? [],
	});

	registerArrayTool<Record<string, never>, TickersResponse>(pi, {
		name: "get_available_crypto_tickers",
		label: "Get Available Crypto Tickers",
		description: "Retrieves the list of available cryptocurrency tickers.",
		parameters: Type.Object({}),
		endpoint: "/crypto/prices/tickers/",
		buildParams: () => ({}),
		extractData: (response) => response.tickers ?? [],
	});
}
