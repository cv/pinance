---
name: tracking-signals
description: Retrieves insider trading data and company news via Financial Datasets API. Use when asked about insider buys/sells, Form 4 filings, executive transactions, or company news.
---

# Tracking Signals

## Tools

| Tool | Returns |
|------|---------|
| `get_insider_trades` | SEC Form 4 transactions (buys, sells, grants) |
| `get_news` | Recent news articles |

## Parameters

**Insider trades:**
- `ticker`: Required
- `limit`: Default 100, max 1000
- `filing_date_gte`/`filing_date_lte`: Date filters

**News:**
- `ticker`: Required
- `limit`: Default 10, max 100
- `start_date`/`end_date`: Optional date range

## Interpreting Insider Activity

**Strong signals:**
- Multiple insiders buying
- CEO/CFO open market purchases
- Large buys relative to salary

**Weak signals:**
- 10b5-1 plan sales (pre-scheduled)
- Option exercises with immediate sale
- Stock grants (not open market)

## Examples

**Input:** "Any insider buying at Apple?"
```
get_insider_trades(ticker: "AAPL", limit: 50, filing_date_gte: "2024-10-01")
```
**Output:** Filter for purchases, summarize:
"Two Apple insiders bought stock in Q4: Tim Cook (CEO) purchased 50K shares at $178 ($8.9M), and Luca Maestri (CFO) bought 10K shares at $175 ($1.75M). Signal: Positive—executives buying with their own money."

---

**Input:** "What's happening with Tesla?"
```
get_news(ticker: "TSLA", limit: 10)
```
**Output:** Group by theme:
"Recent Tesla news: (1) Q3 delivery numbers beat estimates, (2) Cybertruck production ramp, (3) FSD v12 rollout. Overall tone: Positive."

---

**Input:** "Insider activity at META before earnings"
```
get_insider_trades(ticker: "META", filing_date_gte: "2024-10-01", filing_date_lte: "2024-10-25")
```
**Output:** Note any unusual patterns:
"No significant insider buying before META's Oct 30 earnings. Two directors sold under 10b5-1 plans (routine)."

---

**Input:** "NVDA news and insider sentiment"
```
get_news(ticker: "NVDA", limit: 10)
get_insider_trades(ticker: "NVDA", limit: 30)
```
**Output:** Combine signals:
"News is bullish (AI demand, earnings beat). Insider activity is neutral (no recent open market buys, routine grant-related sales)."
