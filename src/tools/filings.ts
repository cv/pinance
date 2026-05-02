import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";
import type { ArrayResponse } from "../api.js";
import { formatItemsDescription, ITEMS_10K_MAP, ITEMS_10Q_MAP } from "../constants.js";
import { TickerParam } from "../schemas.js";
import { registerArrayTool, registerSimpleTool } from "../tool-helpers.js";

const filingsParams = Type.Object({
	ticker: TickerParam,
	filing_type: Type.Optional(
		Type.Union([Type.Literal("10-K"), Type.Literal("10-Q"), Type.Literal("8-K")], {
			description:
				"Filing type: '10-K' for annual, '10-Q' for quarterly, '8-K' for current reports",
		}),
	),
	limit: Type.Optional(
		Type.Integer({
			description: "Maximum filings to return (default: 10)",
			default: 10,
			minimum: 1,
		}),
	),
});

const filing10KItemsParams = Type.Object({
	ticker: TickerParam,
	year: Type.Integer({
		description: "The year of the 10-K filing (e.g., 2023)",
		minimum: 1900,
	}),
	item: Type.Optional(
		Type.Array(Type.String(), {
			description: `Specific items to retrieve. Valid items:\n${formatItemsDescription(ITEMS_10K_MAP)}`,
		}),
	),
});

const filing10QItemsParams = Type.Object({
	ticker: TickerParam,
	year: Type.Integer({
		description: "The year of the 10-Q filing (e.g., 2023)",
		minimum: 1900,
	}),
	quarter: Type.Integer({
		description: "The quarter of the 10-Q filing (1, 2, 3, or 4)",
		maximum: 4,
		minimum: 1,
	}),
	item: Type.Optional(
		Type.Array(Type.String(), {
			description: `Specific items to retrieve. Valid items:\n${formatItemsDescription(ITEMS_10Q_MAP)}`,
		}),
	),
});

const filing8KItemsParams = Type.Object({
	ticker: TickerParam,
	accession_number: Type.String({
		description:
			"SEC accession number for the 8-K (e.g., '0000320193-24-000123'). Get from get_filings.",
	}),
});

export function registerFilingsTools(pi: ExtensionAPI): void {
	registerArrayTool<typeof filingsParams, ArrayResponse<"filings">>(pi, {
		name: "get_filings",
		label: "Get Filings",
		description:
			"Retrieves SEC filing metadata (accession numbers, types, URLs). Does NOT return content - use get_10K/10Q/8K_filing_items for that.",
		parameters: filingsParams,
		endpoint: "/filings/",
		buildParams: (params) => ({
			ticker: params.ticker,
			filing_type: params.filing_type,
			limit: params.limit ?? 10,
		}),
		extractData: (response) => response.filings ?? [],
	});

	registerSimpleTool<typeof filing10KItemsParams, Record<string, unknown>>(pi, {
		name: "get_10K_filing_items",
		label: "Get 10-K Filing Items",
		description:
			"Retrieves specific sections from a 10-K annual report (Business, Risk Factors, MD&A, Financial Statements, etc.)",
		parameters: filing10KItemsParams,
		endpoint: "/filings/items/",
		buildParams: (params) => ({
			ticker: params.ticker,
			filing_type: "10-K",
			year: params.year,
			item: params.item,
		}),
		extractData: (data) => data,
	});

	registerSimpleTool<typeof filing10QItemsParams, Record<string, unknown>>(pi, {
		name: "get_10Q_filing_items",
		label: "Get 10-Q Filing Items",
		description:
			"Retrieves specific sections from a 10-Q quarterly report (Financial Statements, MD&A, Market Risk, Controls).",
		parameters: filing10QItemsParams,
		endpoint: "/filings/items/",
		buildParams: (params) => ({
			ticker: params.ticker,
			filing_type: "10-Q",
			year: params.year,
			quarter: params.quarter,
			item: params.item,
		}),
		extractData: (data) => data,
	});

	registerSimpleTool<typeof filing8KItemsParams, Record<string, unknown>>(pi, {
		name: "get_8K_filing_items",
		label: "Get 8-K Filing Items",
		description:
			"Retrieves sections from an 8-K current report (material events like acquisitions, results, management changes).",
		parameters: filing8KItemsParams,
		endpoint: "/filings/items/",
		buildParams: (params) => ({
			ticker: params.ticker,
			filing_type: "8-K",
			accession_number: params.accession_number,
		}),
		extractData: (data) => data,
	});
}
