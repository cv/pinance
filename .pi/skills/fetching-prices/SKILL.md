---
name: fetching-prices
description: Retrieves stock and cryptocurrency price data via Financial Datasets API. Use when asked about stock prices, crypto prices, historical prices, or price performance.
---

# Fetching Prices

## Tools

| Tool | Financial Datasets | Equibles | Returns |
|------|--------------------|----------|---------|
| `get_price_snapshot` | `fd.priceSnapshot` | `eq.latestPrices({ tickers })` | Latest stock price, volume, OHLC |
| `get_prices` | `fd.prices` | `eq.prices` | Historical stock prices |
| `get_crypto_price_snapshot` | `fd.cryptoPriceSnapshot` | — | Latest crypto price |
| `get_crypto_prices` | `fd.cryptoPrices` | — | Historical crypto prices |
| `get_available_crypto_tickers` | `fd.cryptoTickers` | — | List of crypto pairs |

Tools pick the provider that has a key (Financial Datasets or Equibles; `PINANCE_PROVIDER` decides when both do). A dash means that provider lacks the data.

Under [pit](https://github.com/cv/pit), call the saved functions from one program. `market.quote`, `market.prices`, `market.filings`, `market.insiderTrades`, and `market.valuation` return the same normalized records from whichever provider has a key. For anything else use `fd.*` (Financial Datasets) or `eq.*` (Equibles); `pinance.providers()` says which is active. For example `({ market: { valuation } }) => valuation({ tickers: ["AAPL", "MSFT"] })`. Every function returns `{ provider, data, url }` (lists also `count`, Equibles results `meta`); cite `url`. For charts, use `chart.*` and post the `markdown` it returns (see the researching-stocks skill).

## Parameters

**Historical prices require:**
- `start_date`, `end_date`: YYYY-MM-DD format
- `interval`: `minute`, `day`, `week`, `month`, `year`
- `interval_multiplier`: e.g., 5 with `minute` = 5-min bars

**Crypto tickers:** Format is `BASE-QUOTE` (e.g., `BTC-USD`, `ETH-USD`)

## Examples

**Input:** "What's Apple's stock price?"
```
get_price_snapshot(ticker: "AAPL")
```
**Output:** "Apple (AAPL) is trading at $185.50, up 1.2% today on volume of 45M shares."

---

**Input:** "How has NVDA performed this year?"
```
get_prices(ticker: "NVDA", start_date: "2024-01-01", end_date: "2024-12-31", interval: "month")
```
**Output:** Calculate return from first to last price:
"NVIDIA is up 185% YTD, from $48.50 in January to $138.25 in December."

---

**Input:** "Bitcoin price"
```
get_crypto_price_snapshot(ticker: "BTC-USD")
```
**Output:** "Bitcoin is trading at $67,500 USD."

---

**Input:** "Compare AAPL and MSFT stock performance over 2024"
```
get_prices(ticker: "AAPL", start_date: "2024-01-01", end_date: "2024-12-31")
get_prices(ticker: "MSFT", start_date: "2024-01-01", end_date: "2024-12-31")
```
**Output:** Calculate returns for each:
"Microsoft (+25%) outperformed Apple (+18%) in 2024."
