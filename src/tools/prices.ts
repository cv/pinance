import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";
import type { ArrayResponse, SnapshotResponse } from "../api.js";
import { DateRangeParams, PriceIntervalParams, TickerParam } from "../schemas.js";
import { registerArrayTool, registerSimpleTool } from "../tool-helpers.js";

interface PriceSnapshotParams {
	ticker: string;
}

interface PricesParams {
	ticker: string;
	interval?: "minute" | "day" | "week" | "month" | "year";
	interval_multiplier?: number;
	start_date: string;
	end_date: string;
}

const priceSnapshotParams = Type.Object({
	ticker: TickerParam,
});

const pricesParams = Type.Object({
	ticker: TickerParam,
	...PriceIntervalParams,
	...DateRangeParams,
});

export function registerPriceTools(pi: ExtensionAPI): void {
	registerSimpleTool<PriceSnapshotParams, SnapshotResponse>(pi, {
		name: "get_price_snapshot",
		label: "Get Price Snapshot",
		description:
			"Fetches the most recent price snapshot for a stock, including the latest price, trading volume, and OHLC data.",
		parameters: priceSnapshotParams,
		endpoint: "/prices/snapshot/",
		buildParams: (params) => ({ ticker: params.ticker }),
		extractData: (response) => response.snapshot ?? {},
	});

	registerArrayTool<PricesParams, ArrayResponse<"prices">>(pi, {
		name: "get_prices",
		label: "Get Prices",
		description:
			"Retrieves historical price data for a stock over a date range, including open, high, low, close prices, and volume.",
		parameters: pricesParams,
		endpoint: "/prices/",
		buildParams: (params) => ({
			ticker: params.ticker,
			interval: params.interval ?? "day",
			interval_multiplier: params.interval_multiplier ?? 1,
			start_date: params.start_date,
			end_date: params.end_date,
		}),
		extractData: (response) => response.prices ?? [],
	});
}
