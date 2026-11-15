/**
 * A pie chart as a Mermaid block for breakdowns, with the same conventions as chart.xy.
 *
 * @param input.title - Chart title.
 * @param input.slices - { label, value } pairs; values must be positive.
 * @param input.maxSlices - Most slices, counting "Other" (default 6).
 * @param input.minShare - Smallest share for its own slice (default 0.02, or 2%).
 * @param input.unit - Unit after the scale, such as "$" or "shares".
 * @param input.scale - "auto" (default), "none", "K", "M", "B", or "T".
 * @param input.decimals - Decimal places after scaling (default 1).
 * @param input.source - URL or URLs to cite under the chart.
 */
async function pie(
  {},
  input: {
    title: string;
    slices: { label: string; value: number }[];
    maxSlices?: number;
    minShare?: number;
    unit?: string;
    scale?: "auto" | "none" | "K" | "M" | "B" | "T";
    decimals?: number;
    source?: string | string[];
  },
): Promise<{ markdown: string; mermaid: string; caption: string; slices: number; scale: string }> {
  const colors = [
    "#3b82f6",
    "#ef4444",
    "#22c55e",
    "#f97316",
    "#a855f7",
    "#eab308",
    "#14b8a6",
    "#ec4899",
    "#9ca3af",
  ];
  const valid = input.slices
    .filter((s) => Number.isFinite(s.value) && s.value > 0)
    .sort((a, b) => b.value - a.value);
  if (valid.length === 0) throw new Error("chart.pie needs at least one positive slice.");
  const max = Math.min(Math.max(2, Math.floor(input.maxSlices ?? 6)), colors.length - 1);
  const sum = valid.reduce((a, s) => a + s.value, 0);
  const minShare = input.minShare ?? 0.02;
  let keep = valid.filter((s, k) => k < max && s.value / sum >= minShare);
  let rest = valid.slice(keep.length);
  if (rest.length > 0 && keep.length >= max) {
    rest = valid.slice(max - 1);
    keep = valid.slice(0, max - 1);
  }
  const slices =
    rest.length > 1
      ? [...keep, { label: `Other (${rest.length})`, value: rest.reduce((a, s) => a + s.value, 0) }]
      : valid.slice(0, keep.length + rest.length);
  const peak = Math.max(...slices.map((s) => s.value));
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
  const decimals = input.decimals ?? 1;
  const suffix = scale === "none" ? "" : scale;
  const unit = input.unit === "$" ? `$${suffix}` : [suffix, input.unit ?? ""].join(" ").trim();
  const title = unit ? `${input.title} (${unit})` : input.title;
  const quote = (s: string) => `"${s.replace(/"/g, "'")}"`;
  const vars = Object.fromEntries(
    slices.map((s, k) => [
      `pie${k + 1}`,
      s.label.startsWith("Other (") ? colors[colors.length - 1] : colors[k],
    ]),
  );
  const mermaid = [
    "```mermaid",
    `%%{init: {"themeVariables": ${JSON.stringify(vars)}}}%%`,
    `pie showData title ${title.replace(/[\n"]/g, " ")}`,
    ...slices.map((s) => `    ${quote(s.label)} : ${Number((s.value / div).toFixed(decimals))}`),
    "```",
  ].join("\n");
  const notes: string[] = [];
  const other = slices.find((s) => s.label.startsWith("Other ("));
  if (other) notes.push(`Other: ${rest.map((s) => s.label).join(", ")}.`);
  const sources =
    input.source === undefined ? [] : Array.isArray(input.source) ? input.source : [input.source];
  if (sources.length) notes.push(`Source: ${sources.join(", ")}`);
  const caption = notes.join(" ");
  return {
    markdown: caption ? `${mermaid}\n\n${caption}` : mermaid,
    mermaid,
    caption,
    slices: slices.length,
    scale,
  };
}
