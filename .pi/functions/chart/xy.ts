/**
 * A line and/or bar chart as a Mermaid xychart block that GitHub renders, with consistent colors, captions, scaling, and labels.
 *
 * @param input.title - Chart title.
 * @param input.x - Labels, oldest first: ISO dates ("2026-11-13") or periods ("FY2026").
 * @param input.series - Up to 6 series: { name, values (one per x label; null when missing), kind: "line" (default) or "bar" }.
 * @param input.yLabel - Axis label, such as "P/E" or "Short interest".
 * @param input.unit - Unit after the scale, such as "$", "%", "x", or "shares".
 * @param input.scale - "auto" (default: K/M/B/T from the largest value), or "none", "K", "M", "B", "T".
 * @param input.decimals - Decimal places after scaling (default: 2 below 10, 1 below 1000, else 0).
 * @param input.maxPoints - Most points to plot (default 40).
 * @param input.yMin - Axis minimum (bars default to 0).
 * @param input.yMax - Axis maximum.
 * @param input.horizontal - Draw horizontally, such as for ranked bars.
 * @param input.source - URL or URLs to cite under the chart.
 */
async function xy(
  {},
  input: {
    title: string;
    x: (string | number)[];
    series: { name: string; values: (number | null)[]; kind?: "line" | "bar" }[];
    yLabel?: string;
    unit?: string;
    scale?: "auto" | "none" | "K" | "M" | "B" | "T";
    decimals?: number;
    maxPoints?: number;
    yMin?: number;
    yMax?: number;
    horizontal?: boolean;
    source?: string | string[];
  },
): Promise<{
  markdown: string;
  mermaid: string;
  caption: string;
  points: number;
  dropped: number;
  scale: string;
}> {
  const palette: [string, string][] = [
    ["🟦", "#3b82f6"],
    ["🟥", "#ef4444"],
    ["🟩", "#22c55e"],
    ["🟧", "#f97316"],
    ["🟪", "#a855f7"],
    ["🟨", "#eab308"],
  ];
  const { series } = input;
  if (series.length === 0) throw new Error("chart.xy needs at least one series.");
  if (series.length > palette.length)
    throw new Error(`chart.xy draws at most ${palette.length} series; split the chart.`);
  for (const s of series) {
    if (s.values.length !== input.x.length)
      throw new Error(
        `Series ${s.name} has ${s.values.length} values for ${input.x.length} x labels.`,
      );
  }
  const has = (v: number | null | undefined): v is number =>
    typeof v === "number" && Number.isFinite(v);
  // Mermaid needs a value in every series at every position, so positions with a gap are dropped.
  let idx = input.x.map((_, i) => i).filter((i) => series.every((s) => has(s.values[i])));
  const dropped = input.x.length - idx.length;
  if (idx.length === 0) throw new Error("No x label has a value in every series.");
  const total = idx.length;
  const max = Math.max(2, Math.floor(input.maxPoints ?? 40));
  if (idx.length > max)
    idx = [
      ...new Set(
        Array.from({ length: max }, (_, k) => idx[Math.round((k * (idx.length - 1)) / (max - 1))]),
      ),
    ];

  const bars = series.map((s, k) => ({ s, k })).filter(({ s }) => s.kind === "bar");
  const lines = series.map((s, k) => ({ s, k })).filter(({ s }) => s.kind !== "bar");
  if (bars.length > 1 && bars.some(({ s }) => idx.some((i) => (s.values[i] as number) < 0))) {
    throw new Error(
      "Several bar series are stacked, so their values must not be negative; chart them separately or as lines.",
    );
  }
  // Stacked bars: running totals, drawn largest first so each series shows in its own color on top of the next.
  const stacks = bars.map((_, j) =>
    idx.map((i) => bars.slice(0, j + 1).reduce((sum, b) => sum + (b.s.values[i] as number), 0)),
  );
  const plotted = [
    ...stacks.flat(),
    ...lines.flatMap(({ s }) => idx.map((i) => s.values[i] as number)),
  ];
  const peak = Math.max(...plotted.map(Math.abs));
  const factors: Record<string, number> = { none: 1, K: 1e3, M: 1e6, B: 1e9, T: 1e12 };
  const scale =
    input.scale && input.scale !== "auto"
      ? input.scale
      : peak >= 1e12
        ? "T"
        : peak >= 1e9
          ? "B"
          : peak >= 1e6
            ? "M"
            : peak >= 1e4
              ? "K"
              : "none";
  const div = factors[scale];
  const scaledPeak = peak / div;
  const decimals = input.decimals ?? (scaledPeak < 10 ? 2 : scaledPeak < 1000 ? 1 : 0);
  const fmt = (v: number) => Number((v / div).toFixed(decimals));
  const quote = (s: string) => `"${s.replace(/"/g, "'")}"`;

  let labels = idx.map((i) => String(input.x[i]));
  if (labels.every((l) => /^\d{4}-\d{2}-\d{2}/.test(l))) {
    const days =
      (Date.parse(labels[labels.length - 1].slice(0, 10)) - Date.parse(labels[0].slice(0, 10))) /
      864e5;
    labels = labels.map((l) => (days > 400 ? l.slice(0, 7) : l.slice(5, 10)));
  }
  if (!input.horizontal) {
    // Mermaid prints every x label, and they overlap past about 600px of text. Keep every step-th label and give the
    // rest unique zero-width names (categories must stay distinct).
    const longest = Math.max(...labels.map((l) => l.length));
    const fit = Math.max(2, Math.floor(600 / (longest * 8 + 16)));
    const step = Math.ceil(labels.length / fit);
    if (step > 1) labels = labels.map((l, k) => (k % step === 0 ? l : "\u200b".repeat(k + 1)));
  }
  const suffix = scale === "none" ? "" : scale;
  const unit = input.unit === "$" ? `$${suffix}` : [suffix, input.unit ?? ""].join(" ").trim();
  const axis = [input.yLabel ?? "Value", unit && `(${unit})`].filter(Boolean).join(" ");
  const scaled = plotted.map(fmt);
  let range = "";
  if (input.yMin !== undefined || input.yMax !== undefined || bars.length > 0) {
    const lo =
      input.yMin !== undefined
        ? fmt(input.yMin)
        : bars.length > 0
          ? Math.min(0, ...scaled)
          : Math.min(...scaled);
    const hi =
      input.yMax !== undefined
        ? fmt(input.yMax)
        : Number((Math.max(...scaled) * 1.05).toFixed(decimals));
    range = ` ${lo} --> ${hi}`;
  }
  // Mermaid colors plots in statement order: stacked bars from the top of the stack down, then lines.
  const order = [
    ...bars.map((b, j) => ({ k: b.k, values: stacks[j], kind: "bar" })).reverse(),
    ...lines.map(({ s, k }) => ({
      k,
      values: idx.map((i) => s.values[i] as number),
      kind: "line",
    })),
  ];
  const colors = order.map(({ k }) => palette[k][1]).join(", ");
  const mermaid = [
    "```mermaid",
    `%%{init: {"themeVariables": {"xyChart": {"plotColorPalette": "${colors}"}}}}%%`,
    `xychart-beta${input.horizontal ? " horizontal" : ""}`,
    `    title ${quote(input.title)}`,
    `    x-axis [${labels.map(quote).join(", ")}]`,
    `    y-axis ${quote(axis)}${range}`,
    ...order.map(({ values, kind }) => `    ${kind} [${values.map(fmt).join(", ")}]`),
    "```",
  ].join("\n");
  const notes = [
    `Series: ${series.map((s, k) => `${palette[k][0]} ${s.name}`).join(", ")}${bars.length > 1 ? " (bars stacked)" : ""}.`,
  ];
  if (idx.length < total) notes.push(`${idx.length} of ${total} points shown.`);
  if (dropped > 0)
    notes.push(
      `${dropped} ${dropped === 1 ? "label" : "labels"} without a value in every series left out.`,
    );
  const sources =
    input.source === undefined ? [] : Array.isArray(input.source) ? input.source : [input.source];
  if (sources.length) notes.push(`Source: ${sources.join(", ")}`);
  const caption = notes.join(" ");
  return {
    markdown: `${mermaid}\n\n${caption}`,
    mermaid,
    caption,
    points: idx.length,
    dropped,
    scale,
  };
}
