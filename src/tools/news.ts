import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";
import { OptionalDateRangeParams, TickerParam } from "../schemas.js";
import { registerArrayTool } from "../tool-helpers.js";

interface NewsResponse {
	news: Record<string, unknown>[];
}

interface NewsParams {
	ticker: string;
	start_date?: string;
	end_date?: string;
	limit?: number;
}

const newsParams = Type.Object({
	ticker: TickerParam,
	...OptionalDateRangeParams,
	limit: Type.Optional(
		Type.Number({
			description: "Number of articles to retrieve (default: 10, max: 100)",
			default: 10,
		}),
	),
});

export function registerNewsTools(pi: ExtensionAPI): void {
	registerArrayTool<NewsParams, NewsResponse>(pi, {
		name: "get_news",
		label: "Get News",
		description:
			"Retrieves recent news articles for a company, covering financial announcements, market trends, and significant events. Useful for market sentiment analysis.",
		parameters: newsParams,
		endpoint: "/news/",
		buildParams: (params) => ({
			ticker: params.ticker,
			start_date: params.start_date,
			end_date: params.end_date,
			limit: params.limit ?? 10,
		}),
		extractData: (response) => response.news ?? [],
	});
}
