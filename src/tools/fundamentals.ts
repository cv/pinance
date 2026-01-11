import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";
import { PeriodType, ReportPeriodFilterParams, TickerParam } from "../schemas.js";
import { registerSimpleTool } from "../tool-helpers.js";

interface FinancialStatementsParams {
	ticker: string;
	period: "annual" | "quarterly" | "ttm";
	limit?: number;
	report_period_gt?: string;
	report_period_gte?: string;
	report_period_lt?: string;
	report_period_lte?: string;
}

const financialStatementsParams = Type.Object({
	ticker: TickerParam,
	period: PeriodType,
	limit: Type.Optional(
		Type.Number({
			description: "Maximum number of periods to return (default: 10)",
			default: 10,
		}),
	),
	...ReportPeriodFilterParams,
});

const buildParams = (params: FinancialStatementsParams) => ({
	ticker: params.ticker,
	period: params.period,
	limit: params.limit ?? 10,
	report_period_gt: params.report_period_gt,
	report_period_gte: params.report_period_gte,
	report_period_lt: params.report_period_lt,
	report_period_lte: params.report_period_lte,
});

interface FinancialToolConfig {
	name: string;
	label: string;
	description: string;
	endpoint: string;
	responseKey: string;
}

const financialTools: FinancialToolConfig[] = [
	{
		name: "get_income_statements",
		label: "Get Income Statements",
		description:
			"Fetches income statements detailing revenues, expenses, and net income. Useful for evaluating profitability and operational efficiency.",
		endpoint: "/financials/income-statements/",
		responseKey: "income_statements",
	},
	{
		name: "get_balance_sheets",
		label: "Get Balance Sheets",
		description:
			"Retrieves balance sheets showing assets, liabilities, and shareholders' equity. Useful for assessing financial position.",
		endpoint: "/financials/balance-sheets/",
		responseKey: "balance_sheets",
	},
	{
		name: "get_cash_flow_statements",
		label: "Get Cash Flow Statements",
		description:
			"Retrieves cash flow statements showing operating, investing, and financing activities. Useful for understanding liquidity and solvency.",
		endpoint: "/financials/cash-flow-statements/",
		responseKey: "cash_flow_statements",
	},
	{
		name: "get_all_financial_statements",
		label: "Get All Financial Statements",
		description:
			"Retrieves all three financial statements (income, balance sheet, cash flow) in one call. More efficient for comprehensive analysis.",
		endpoint: "/financials/",
		responseKey: "financials",
	},
];

export function registerFundamentalsTools(pi: ExtensionAPI): void {
	for (const tool of financialTools) {
		registerSimpleTool<FinancialStatementsParams, Record<string, unknown>>(pi, {
			name: tool.name,
			label: tool.label,
			description: tool.description,
			parameters: financialStatementsParams,
			endpoint: tool.endpoint,
			buildParams,
			extractData: (data) => data[tool.responseKey] ?? {},
		});
	}
}
