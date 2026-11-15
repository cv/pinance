import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { type Static, Type } from "typebox";
import { PeriodType, ReportPeriodFilterParams, TickerParam } from "../schemas.js";
import * as equibles from "../equibles.js";
import { registerSimpleTool } from "../tool-helpers.js";

const financialStatementsParams = Type.Object({
	ticker: TickerParam,
	period: PeriodType,
	limit: Type.Optional(
		Type.Integer({
			description: "Maximum number of periods to return (default: 10)",
			default: 10,
			minimum: 1,
		}),
	),
	...ReportPeriodFilterParams,
	fiscal_year: Type.Optional(
		Type.Integer({
			description:
				"Equibles only: the fiscal year to return. Equibles returns one period per call (the latest by default); Financial Datasets uses limit and report_period filters instead.",
			minimum: 1900,
		}),
	),
	fiscal_period: Type.Optional(
		Type.Enum(["FY", "Q1", "Q2", "Q3", "Q4"], {
			description: "Equibles only: 'FY' or a fiscal quarter, with fiscal_year.",
		}),
	),
});

type FinancialStatementsParams = Static<typeof financialStatementsParams>;

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
	equibles: (
		params: FinancialStatementsParams,
		signal?: AbortSignal,
	) => ReturnType<typeof equibles.allStatements>;
}

const financialTools: FinancialToolConfig[] = [
	{
		name: "get_income_statements",
		label: "Get Income Statements",
		description:
			"Fetches income statements detailing revenues, expenses, and net income. Useful for evaluating profitability and operational efficiency.",
		endpoint: "/financials/income-statements/",
		responseKey: "income_statements",
		equibles: (params, signal) => equibles.statement("income", params, signal),
	},
	{
		name: "get_balance_sheets",
		label: "Get Balance Sheets",
		description:
			"Retrieves balance sheets showing assets, liabilities, and shareholders' equity. Useful for assessing financial position.",
		endpoint: "/financials/balance-sheets/",
		responseKey: "balance_sheets",
		equibles: (params, signal) => equibles.statement("balance", params, signal),
	},
	{
		name: "get_cash_flow_statements",
		label: "Get Cash Flow Statements",
		description:
			"Retrieves cash flow statements showing operating, investing, and financing activities. Useful for understanding liquidity and solvency.",
		endpoint: "/financials/cash-flow-statements/",
		responseKey: "cash_flow_statements",
		equibles: (params, signal) => equibles.statement("cash_flow", params, signal),
	},
	{
		name: "get_all_financial_statements",
		label: "Get All Financial Statements",
		description:
			"Retrieves all three financial statements (income, balance sheet, cash flow) in one call. More efficient for comprehensive analysis.",
		endpoint: "/financials/",
		responseKey: "financials",
		equibles: (params, signal) => equibles.allStatements(params, signal),
	},
];

export function registerFundamentalsTools(pi: ExtensionAPI): void {
	for (const tool of financialTools) {
		registerSimpleTool<typeof financialStatementsParams, Record<string, unknown>>(pi, {
			name: tool.name,
			label: tool.label,
			description: tool.description,
			parameters: financialStatementsParams,
			endpoint: tool.endpoint,
			buildParams,
			extractData: (data) => data[tool.responseKey] ?? {},
			equibles: tool.equibles,
		});
	}
}
