import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import type { ArrayResponse } from "../api.js";
import { OptionalDateRangeParams, TickerParam } from "../schemas.js";
import { registerArrayTool } from "../tool-helpers.js";

const newsParams = Type.Object({
	ticker: TickerParam,
	...OptionalDateRangeParams,
	limit: Type.Optional(
		Type.Integer({
			// The API rejects more than 10 ("Must be greater than 0 and less than or equal to 10").
			description: "Number of articles to retrieve (default and max: 10)",
			default: 10,
			maximum: 10,
			minimum: 1,
		}),
	),
});

export function registerNewsTools(pi: ExtensionAPI): void {
	registerArrayTool<typeof newsParams, ArrayResponse<"news">>(pi, {
		name: "get_news",
		label: "Get News",
		description:
			"Retrieves the latest news articles (up to 10) for a company, covering financial announcements, market trends, and significant events. Useful for market sentiment analysis. Date filters may not narrow the results, so check each article's date.",
		parameters: newsParams,
		endpoint: "/news/",
		buildParams: (params) => ({
			ticker: params.ticker,
			start_date: params.start_date,
			end_date: params.end_date,
			limit: Math.min(params.limit ?? 10, 10),
		}),
		extractData: (response) => response.news ?? [],
	});
}
