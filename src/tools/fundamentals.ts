import type { AgentToolResult, ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";
import { callApi } from "../api.js";
import { PeriodType, ReportPeriodFilterParams, TickerParam } from "../schemas.js";

interface IncomeStatementsResponse {
	income_statements: Record<string, unknown>;
}

interface BalanceSheetsResponse {
	balance_sheets: Record<string, unknown>;
}

interface CashFlowStatementsResponse {
	cash_flow_statements: Record<string, unknown>;
}

interface FinancialsResponse {
	financials: Record<string, unknown>;
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

type FinancialStatementsParams = typeof financialStatementsParams.static;

function buildParams(
	params: FinancialStatementsParams,
): Record<string, string | number | undefined> {
	return {
		ticker: params.ticker,
		period: params.period,
		limit: params.limit ?? 10,
		report_period_gt: params.report_period_gt,
		report_period_gte: params.report_period_gte,
		report_period_lt: params.report_period_lt,
		report_period_lte: params.report_period_lte,
	};
}

export function registerFundamentalsTools(pi: ExtensionAPI): void {
	pi.registerTool({
		name: "get_income_statements",
		label: "Get Income Statements",
		description:
			"Fetches income statements detailing revenues, expenses, and net income. Useful for evaluating profitability and operational efficiency.",
		parameters: financialStatementsParams,
		execute: async (
			_toolCallId,
			params,
			_onUpdate,
			_ctx,
			signal,
		): Promise<AgentToolResult<unknown>> => {
			const { data, url } = await callApi<IncomeStatementsResponse>(
				"/financials/income-statements/",
				buildParams(params),
				signal,
			);

			return {
				content: [{ type: "text", text: JSON.stringify(data.income_statements ?? {}, null, 2) }],
				details: { url },
			};
		},
	});

	pi.registerTool({
		name: "get_balance_sheets",
		label: "Get Balance Sheets",
		description:
			"Retrieves balance sheets showing assets, liabilities, and shareholders' equity. Useful for assessing financial position.",
		parameters: financialStatementsParams,
		execute: async (
			_toolCallId,
			params,
			_onUpdate,
			_ctx,
			signal,
		): Promise<AgentToolResult<unknown>> => {
			const { data, url } = await callApi<BalanceSheetsResponse>(
				"/financials/balance-sheets/",
				buildParams(params),
				signal,
			);

			return {
				content: [{ type: "text", text: JSON.stringify(data.balance_sheets ?? {}, null, 2) }],
				details: { url },
			};
		},
	});

	pi.registerTool({
		name: "get_cash_flow_statements",
		label: "Get Cash Flow Statements",
		description:
			"Retrieves cash flow statements showing operating, investing, and financing activities. Useful for understanding liquidity and solvency.",
		parameters: financialStatementsParams,
		execute: async (
			_toolCallId,
			params,
			_onUpdate,
			_ctx,
			signal,
		): Promise<AgentToolResult<unknown>> => {
			const { data, url } = await callApi<CashFlowStatementsResponse>(
				"/financials/cash-flow-statements/",
				buildParams(params),
				signal,
			);

			return {
				content: [{ type: "text", text: JSON.stringify(data.cash_flow_statements ?? {}, null, 2) }],
				details: { url },
			};
		},
	});

	pi.registerTool({
		name: "get_all_financial_statements",
		label: "Get All Financial Statements",
		description:
			"Retrieves all three financial statements (income, balance sheet, cash flow) in one call. More efficient for comprehensive analysis.",
		parameters: financialStatementsParams,
		execute: async (
			_toolCallId,
			params,
			_onUpdate,
			_ctx,
			signal,
		): Promise<AgentToolResult<unknown>> => {
			const { data, url } = await callApi<FinancialsResponse>(
				"/financials/",
				buildParams(params),
				signal,
			);

			return {
				content: [{ type: "text", text: JSON.stringify(data.financials ?? {}, null, 2) }],
				details: { url },
			};
		},
	});
}
