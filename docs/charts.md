# Charts

The `chart.*` pit functions in [`.pi/functions/chart/`](../.pi/functions/chart/) turn pinance data into charts that GitHub renders in issues, pull requests, comments, discussions, wikis, and Markdown files. They write [Mermaid](https://mermaid.js.org/) blocks, so nothing needs hosting. pi-action posts them as part of its reply.

| Function | Draws |
|---|---|
| `chart.prices({ tickers, startDate, endDate, interval })` | Closing prices from `market.prices`, in dollars for one ticker or rebased to 100 for several |
| `chart.xy({ title, x, series, yLabel, unit })` | Line and bar series, such as revenue by year, P/E history, or short interest; `horizontal: true` for ranked bars |
| `chart.pie({ title, slices, unit })` | Breakdowns, such as revenue by segment or region |
| `chart.sparkline(values)` | A Unicode trend line (`▁▂▃▅▇`) for tables and terminals |

The first three return `{ markdown, mermaid, caption }`. Post `markdown` as is: the chart, then a caption naming each series by color, the points left out, and the sources.

```ts
async ({ chart: { prices } }) => (await prices({ tickers: ["NVDA", "AMD"], startDate: "2026-08-14", endDate: "2026-11-13", interval: "week" })).markdown
```

## Conventions

The functions apply these rules so charts look the same whoever draws them:

- **Colors:** series use 🟦 blue, 🟥 red, 🟩 green, 🟧 orange, 🟪 purple, and 🟨 yellow, in that order. Mermaid xycharts have no legend, so the caption names each series by its square.
- **Scale:** values are divided by K, M, B, or T to fit the largest one, and the axis label says so, such as "Revenue ($B)" or "Short interest (M shares)".
- **Points:** at most 40, sampled evenly and keeping the first and last. Positions where a series has no value are dropped. The caption counts both.
- **Labels:** ISO dates become `MM-DD` within about a year and `YYYY-MM` beyond. Only as many x labels as fit are printed (Mermaid prints all of them, overlapping). The rest are blank.
- **Bars** start at 0. Several bar series are stacked, because Mermaid would draw them on top of each other.
- **Pies** combine slices past six, or under 2%, into a gray "Other" slice and name them in the caption, because Mermaid's labels for tiny slices overlap.

## Limits

GitHub ran Mermaid v12.2.0 when these were tested ([rendered examples](https://github.com/cv/pinance/issues/60#issuecomment-6901496504)). Mermaid's xychart has no candlesticks, log scale, second y-axis, or legend, and its x-axis is categorical, so dates are labels rather than a time scale. Chart values with very different scales separately rather than on one axis.

Mermaid does not render in a terminal, where pi shows the source. There, use `chart.sparkline`, wrapped in backticks so a table gives it a monospace font:

```markdown
| Ticker | 3 months | Close |
|---|---|---|
| NVDA | `▅▆▆▇█▆▃▁` | $162.85 |
```
