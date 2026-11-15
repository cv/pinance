/**
 * A Unicode sparkline for tables, terminals, and anywhere Mermaid does not render.
 *
 * @param values - The series, oldest first.
 * @param options.width - Maximum characters (default 24).
 */
async function sparkline(
  {},
  values: (number | null)[],
  options: { width?: number } = {},
): Promise<string> {
  const width = Math.max(1, Math.floor(options.width ?? 24));
  const n = values.length;
  if (n === 0) return "";
  const buckets: (number | null)[] = [];
  const size = Math.max(1, n / width);
  for (let start = 0; start < n; start += size) {
    const from = Math.floor(start);
    const part = values
      .slice(from, Math.max(from + 1, Math.floor(start + size)))
      .filter((v): v is number => typeof v === "number" && Number.isFinite(v));
    buckets.push(part.length ? part.reduce((a, b) => a + b, 0) / part.length : null);
  }
  const nums = buckets.filter((v): v is number => v !== null);
  if (nums.length === 0) return " ".repeat(buckets.length);
  const lo = Math.min(...nums);
  const hi = Math.max(...nums);
  const ticks = "▁▂▃▄▅▆▇█";
  return buckets
    .map((v) =>
      v === null ? " " : hi === lo ? ticks[3] : ticks[Math.round(((v - lo) / (hi - lo)) * 7)],
    )
    .join("");
}
