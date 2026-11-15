/**
 * Calls the Equibles REST API (https://api.equibles.com/v1) and returns the parsed JSON and the URL to cite.
 *
 * The API key comes from EQUIBLES_API_KEY in the environment, else from the project's `.env`. The shell resolves it and
 * sends it as `Authorization: Bearer` through `curl -H @-`, so it never enters the sandbox, a command line, a URL, or a result.
 * Every request counts against the plan's daily allowance (Free: 100/day, shared with the MCP server), including 4xx answers.
 *
 * @param path - API path under /v1, such as "/v1/stocks/AAPL/prices". Encode path segments such as tickers yourself.
 * @param params - Query parameters. Undefined values are skipped and arrays repeat the key. Paged endpoints take `limit` and `offset`.
 */
async function request(
  { shell: { exec } },
  path: string,
  params: Record<string, string | number | boolean | string[] | undefined> = {},
): Promise<{ data: any; url: string }> {
  if (!/^\/v1\/[A-Za-z0-9\-._~/%:]*$/.test(path)) throw new Error(`Invalid Equibles path: ${path}`);
  if ("api_key" in params || "apiKey" in params)
    throw new Error("Pass the key through EQUIBLES_API_KEY, never as a query parameter.");
  const enc = (v: string) =>
    encodeURIComponent(v).replace(
      /[!'()*]/g,
      (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`,
    );
  const pairs: string[] = [];
  for (const [key, raw] of Object.entries(params)) {
    if (raw === undefined) continue;
    for (const v of Array.isArray(raw) ? raw : [String(raw)]) pairs.push(`${enc(key)}=${enc(v)}`);
  }
  const url = `https://api.equibles.com${path}${pairs.length ? `?${pairs.join("&")}` : ""}`;
  const script = [
    'key="$EQUIBLES_API_KEY"',
    'if [ -z "$key" ] && [ -f .env ]; then key=$(sed -n -e "s/^export //" -e "s/^EQUIBLES_API_KEY=//p" .env | tail -n 1 | tr -d "\\r\\"\'"); fi',
    'if [ -z "$key" ]; then exit 64; fi',
    "printf 'Authorization: Bearer %s\\n' \"$key\" | curl -sS --max-time 60 -H @- -H 'Accept: application/json' -w '\\n%{http_code}' '" +
      url +
      "'",
  ].join("\n");
  const res = await exec(script, { timeoutMs: 70_000, maxBytes: 4_000_000 });
  if (res.code === 64) {
    throw new Error(
      "EQUIBLES_API_KEY is not set. Create a free key at https://equibles.com/dashboard/apikeys and export it, or add it to .env.",
    );
  }
  if (res.code !== 0)
    throw new Error(
      `Equibles request failed (curl exit ${res.code}): ${res.stderr.trim()} [${url}]`,
    );
  const cut = res.stdout.lastIndexOf("\n");
  const status = Number(res.stdout.slice(cut + 1));
  const body = res.stdout.slice(0, cut);
  if (status < 200 || status >= 300) {
    let detail = body.slice(0, 500);
    try {
      const e = JSON.parse(body).error;
      if (e) detail = `${e.code}: ${e.message}`;
    } catch {}
    const hint =
      status === 429
        ? "Daily request allowance used up; it resets at 00:00 UTC (see https://equibles.com/pricing)."
        : "";
    throw new Error(
      `Equibles API request failed: HTTP ${status} [${url}]\n${detail}\n${hint}`.trim(),
    );
  }
  return { data: JSON.parse(body), url };
}
