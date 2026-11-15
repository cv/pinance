/**
 * Calls the Financial Datasets API (https://api.financialdatasets.ai) and returns the parsed JSON and the URL to cite.
 *
 * The API key comes from FINANCIAL_DATASETS_API_KEY in the environment, else from the project's `.env`.
 * It is resolved and sent by the shell (`curl -H @-`), so it never enters the sandbox, a command line, or a result.
 *
 * @param endpoint - API path, such as "/prices/snapshot/".
 * @param params - Query parameters. Undefined values are skipped, arrays repeat the key, and `ticker` is upper-cased.
 */
async function request(
  { shell: { exec } },
  endpoint: string,
  params: Record<string, string | number | boolean | string[] | undefined> = {},
): Promise<{ data: any; url: string }> {
  if (!/^\/[a-z0-9\-/]*$/.test(endpoint))
    throw new Error(`Invalid Financial Datasets endpoint: ${endpoint}`);
  // encodeURIComponent leaves !'()* alone; escape them too so the URL is safe inside single quotes.
  const enc = (v: string) =>
    encodeURIComponent(v).replace(
      /[!'()*]/g,
      (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`,
    );
  const pairs: string[] = [];
  for (const [key, raw] of Object.entries(params)) {
    if (raw === undefined) continue;
    const values = Array.isArray(raw)
      ? raw
      : [key === "ticker" ? String(raw).toUpperCase() : String(raw)];
    for (const v of values) pairs.push(`${enc(key)}=${enc(v)}`);
  }
  const url = `https://api.financialdatasets.ai${endpoint}${pairs.length ? `?${pairs.join("&")}` : ""}`;
  const script = [
    'key="$FINANCIAL_DATASETS_API_KEY"',
    'if [ -z "$key" ] && [ -f .env ]; then key=$(sed -n -e "s/^export //" -e "s/^FINANCIAL_DATASETS_API_KEY=//p" .env | tail -n 1 | tr -d "\\r\\"\'"); fi',
    'if [ -z "$key" ]; then exit 64; fi',
    "printf 'x-api-key: %s\\n' \"$key\" | curl -sS --max-time 60 -H @- -w '\\n%{http_code}' '" +
      url +
      "'",
  ].join("\n");
  const res = await exec(script, { timeoutMs: 70_000, maxBytes: 4_000_000 });
  if (res.code === 64) {
    throw new Error(
      "FINANCIAL_DATASETS_API_KEY is not set. Get a key at https://financialdatasets.ai/ and export it, or add it to .env (see .env.example).",
    );
  }
  if (res.code !== 0)
    throw new Error(
      `Financial Datasets request failed (curl exit ${res.code}): ${res.stderr.trim()} [${url}]`,
    );
  const cut = res.stdout.lastIndexOf("\n");
  const status = Number(res.stdout.slice(cut + 1));
  const body = res.stdout.slice(0, cut);
  if (status < 200 || status >= 300) {
    const hints: Record<number, string> = {
      401: "The API key appears to be invalid. Check FINANCIAL_DATASETS_API_KEY.",
      403: "Access denied. The API key may not have access to this endpoint.",
      404: "Data not found. The ticker symbol or requested data may not exist.",
      429: "Rate limit exceeded. Wait a moment, or upgrade the plan at https://financialdatasets.ai/.",
    };
    const hint =
      hints[status] ??
      (status >= 500 ? "The Financial Datasets API is having issues. Try again later." : "");
    throw new Error(
      `Financial Datasets API request failed: HTTP ${status} [${url}]\n${hint}\n${body.slice(0, 500)}`.trim(),
    );
  }
  return { data: JSON.parse(body), url };
}
