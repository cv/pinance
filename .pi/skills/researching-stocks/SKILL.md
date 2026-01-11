---
name: researching-stocks
description: Workflow for multi-step financial research requiring multiple data sources. Use for company comparisons, due diligence, comprehensive analysis, or complex financial questions.
---

# Researching Stocks

Use this workflow for complex queries requiring multiple tools or analysis steps.

## Workflow Checklist

Copy and track progress:
```
Research Progress:
- [ ] Step 1: Parse query (tickers, metrics, time period)
- [ ] Step 2: Plan tool calls (parallelize independent fetches)
- [ ] Step 3: Execute and gather data
- [ ] Step 4: Validate completeness
- [ ] Step 5: Synthesize answer with numbers and sources
```

## Step 1: Parse Query

Extract:
- **Tickers**: Normalize names → symbols (Apple → AAPL)
- **Metrics**: What's being asked (margins, growth, valuation)
- **Period**: Time range or comparison period

## Step 2: Plan Tool Calls

Simple query → Single tool, answer directly
Data query → Identify tools, call in parallel
Complex query → Break into dependent steps

**Parallelize independent fetches:**
```
# These can run together:
get_income_statements(ticker: "AAPL", ...)
get_income_statements(ticker: "MSFT", ...)

# This depends on results above:
Compare and analyze margins
```

## Step 3: Execute

Call tools. Related skills:
- `analyzing-financials` - Statements, metrics, estimates
- `reading-sec-filings` - 10-K, 10-Q, 8-K content
- `fetching-prices` - Stock and crypto prices
- `tracking-signals` - Insider trades, news

## Step 4: Validate

Before answering, check:

✅ **Complete if:**
- Can answer the core question
- Have data for all mentioned entities
- For comparisons: have all sides

❌ **Incomplete only if:**
- Missing data for a PRIMARY entity
- Comparison but only have one side
- Tool calls failed completely

Do NOT fetch more data for "nice-to-have" enrichment.

## Step 5: Synthesize

Structure your response:
1. **Key finding first** - Answer in the first sentence
2. **Specific numbers** - Cite actual data
3. **Brief analysis** - What the numbers mean
4. **Sources** - List API URLs used

## Examples

**Input:** "Compare profitability of AAPL, MSFT, and GOOGL"
```
Research Progress:
- [x] Step 1: Tickers: AAPL, MSFT, GOOGL. Metric: profitability (margins). Period: latest.
- [x] Step 2: Three parallel income statement fetches, then compare.
- [x] Step 3: Fetched all three.
- [x] Step 4: Have data for all three. Complete.
- [x] Step 5: Synthesizing...
```
**Output:**
"Microsoft leads in operating margin (44%), followed by Apple (30%) and Google (27%).

| Company | Revenue | Op. Income | Op. Margin |
|---------|---------|------------|------------|
| MSFT | $245B | $108B | 44.1% |
| AAPL | $383B | $114B | 29.8% |
| GOOGL | $350B | $94B | 26.9% |

Microsoft's margin advantage comes from high-margin cloud and software licensing.

Sources:
- MSFT: https://api.financialdatasets.ai/...
- AAPL: https://api.financialdatasets.ai/...
- GOOGL: https://api.financialdatasets.ai/..."

---

**Input:** "Quick overview of Amazon"
```
Research Progress:
- [x] Step 1: Ticker: AMZN. Metric: general overview. Period: current.
- [x] Step 2: Single call to get_all_financial_statements + metrics snapshot.
- [x] Step 3: Fetched.
- [x] Step 4: Have comprehensive data. Complete.
- [x] Step 5: Synthesizing...
```
