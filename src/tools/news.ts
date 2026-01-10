import type { AgentToolResult, ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";
import { callApi } from "../api.js";

interface NewsResponse {
	news: Record<string, unknown>[];
}

const newsParams = Type.Object({
	ticker: Type.String({
		description: "The stock ticker symbol (e.g., 'AAPL' for Apple)",
	}),
	start_date: Type.Optional(
		Type.String({
			description: "Start date for news articles (YYYY-MM-DD)",
		}),
	),
	end_date: Type.Optional(
		Type.String({
			description: "End date for news articles (YYYY-MM-DD)",
		}),
	),
	limit: Type.Optional(
		Type.Number({
			description: "Number of articles to retrieve (default: 10, max: 100)",
			default: 10,
		}),
	),
});

export function registerNewsTools(pi: ExtensionAPI): void {
	pi.registerTool({
		name: "get_news",
		label: "Get News",
		description:
			"Retrieves recent news articles for a company, covering financial announcements, market trends, and significant events. Useful for market sentiment analysis.",
		parameters: newsParams,
		execute: async (
			_toolCallId,
			params,
			_onUpdate,
			_ctx,
			signal,
		): Promise<AgentToolResult<unknown>> => {
			const { data, url } = await callApi<NewsResponse>(
				"/news/",
				{
					ticker: params.ticker,
					start_date: params.start_date,
					end_date: params.end_date,
					limit: params.limit ?? 10,
				},
				signal,
			);

			const news = data.news ?? [];

			return {
				content: [{ type: "text", text: JSON.stringify(news, null, 2) }],
				details: { url, count: news.length },
			};
		},
	});
}
