---
name: analyzing-financials
description: Retrieves company financial statements, metrics, estimates, and segments via Financial Datasets API. Use when asked about revenue, earnings, margins, P/E, valuations, or financial health.
---

# Analyzing Financials

## Tools

| Tool | Returns |
|------|---------|
| `get_income_statements` | Revenue, expenses, net income, EPS |
| `get_balance_sheets` | Assets, liabilities, equity |
| `get_cash_flow_statements` | Operating/investing/financing flows |
| `get_all_financial_statements` | All three above (more efficient) |
| `get_financial_metrics_snapshot` | Current P/E, market cap, dividend yield |
| `get_financial_metrics` | Historical metrics over time |
| `get_analyst_estimates` | EPS forecasts |
| `get_segmented_revenues` | Revenue by segment/geography |

## Parameters

All tools require `ticker`. Most accept:
- `period`: `annual`, `quarterly`, or `ttm`
- `limit`: Number of periods (default 10)
- `report_period_gte`/`report_period_lte`: Date filters (YYYY-MM-DD)

## Examples

**Input:** "What's Apple's P/E ratio?"
```
get_financial_metrics_snapshot(ticker: "AAPL")
```
**Output:** Lead with the number: "Apple's P/E ratio is 28.5 based on TTM earnings."

---

**Input:** "How has NVDA's revenue grown?"
```
get_income_statements(ticker: "NVDA", period: "annual", limit: 4)
```
**Output:** Calculate YoY growth from the data:
"NVIDIA's revenue grew 126% YoY to $60.9B in FY2024, up from $27.0B in FY2023."

---

**Input:** "Compare MSFT and GOOGL margins"
```
get_income_statements(ticker: "MSFT", period: "annual", limit: 1)
get_income_statements(ticker: "GOOGL", period: "annual", limit: 1)
```
**Output:** Calculate margins (operating_income / revenue), compare:
"Microsoft's operating margin (44%) exceeds Google's (32%) by 12 percentage points."

---

**Input:** "Is Tesla financially healthy?"
```
get_all_financial_statements(ticker: "TSLA", period: "annual", limit: 2)
```
**Output:** Assess liquidity, debt, cash flow:
"Tesla has $22B cash, $5B debt (0.2x debt-to-equity), and generated $4B free cash flow in FY2024."
