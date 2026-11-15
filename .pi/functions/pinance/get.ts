/**
 * One HTTP GET for any provider in pinance.registry(), returning a common envelope.
 *
 * - `{name}` placeholders in the path are filled from params (encoded, and upper-cased for tickers) and left out of the query.
 * - Ticker parameters are trimmed and upper-cased; undefined values are skipped; arrays repeat the key.
 * - The shell reads the provider's key from the environment or `.env` and sends it in a header through `curl -H @-`, so it
 *   never enters the sandbox, a command line, a URL, or a result. Key-like query parameters are refused.
 * - Errors name the provider, the HTTP status, a hint, and the API's own reason, in either provider's error format.
 * - Requests time out after the provider's timeoutSeconds; callers need a program timeout above that.
 *
 * @param provider - "financialdatasets" or "equibles".
 * @param path - API path, such as "/prices/" or "/v1/stocks/{ticker}/prices".
 * @param params - Path and query parameters.
 * @param options.rows - Response key holding the data, such as "prices" or "data"; the rest of the body becomes meta.
 * @param options.first - Return only the first row (for one-ticker batch endpoints).
 * @param options.object - The rows key holds an object, so a missing one becomes {} instead of [].
 */
async function get(
  { shell: { exec }, pinance: { registry } },
  provider: "financialdatasets" | "equibles",
  path: string,
  params: Record<string, string | number | boolean | string[] | undefined> = {},
  options: { rows?: string; first?: boolean; object?: boolean } = {},
): Promise<{
  provider: "financialdatasets" | "equibles";
  data: any;
  url: string;
  count?: number;
  meta?: { [key: string]: PitJsonValue };
}> {
  const reg = await registry();
  const p = reg.providers.find((x) => x.id === provider);
  if (!p)
    throw new Error(
      `Unknown provider ${provider}; use ${reg.providers.map((x) => x.id).join(" or ")}.`,
    );
  for (const k of Object.keys(params)) {
    if (/^(api[_-]?key|x-api-key|token|authorization)$/i.test(k))
      throw new Error(`Pass the key through ${p.keyName}, never as a parameter.`);
  }
  // encodeURIComponent leaves !'()* alone; escape them too so the URL is safe inside single quotes.
  const enc = (v: string) =>
    encodeURIComponent(v).replace(
      /[!'()*]/g,
      (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`,
    );
  const norm = (k: string, v: string) =>
    p.upperCaseParams.includes(k) ? v.trim().toUpperCase() : v;
  const query = { ...params };
  const filled = path.replace(/\{(\w+)\}/g, (_m, k: string) => {
    const v = query[k];
    if (v === undefined || Array.isArray(v)) throw new Error(`${path} needs a value for ${k}.`);
    delete query[k];
    return enc(norm(k, String(v)));
  });
  if (!new RegExp(p.pathPattern).test(filled)) throw new Error(`Invalid ${p.name} path: ${filled}`);
  const pairs: string[] = [];
  for (const [k, raw] of Object.entries(query)) {
    if (raw === undefined) continue;
    for (const v of Array.isArray(raw) ? raw : [String(raw)])
      pairs.push(`${enc(k)}=${enc(norm(k, v))}`);
  }
  const url = `${p.baseUrl}${filled}${pairs.length ? `?${pairs.join("&")}` : ""}`;
  const seconds = p.timeoutSeconds ?? 60;
  const script = [
    reg.readSettingShell.replaceAll("NAME", p.keyName),
    'if [ -z "$v" ]; then exit 64; fi',
    `printf '${p.authHeader}\\n' "$v" | curl -sS --max-time ${seconds} -H @- -H 'Accept: application/json' -w '\\n%{http_code}' '${url}'`,
  ].join("\n");
  const res = await exec(script, { timeoutMs: (seconds + 10) * 1000, maxBytes: 4_000_000 });
  if (res.code === 64) {
    const others = reg.providers
      .filter((x) => x.id !== p.id)
      .map((x) => `${x.name} (${x.keyName})`);
    throw new Error(
      `${p.keyName} is not set. Get a ${p.name} key at ${p.signup} and export it or add it to .env, or use ${others.join(" or ")} instead.`,
    );
  }
  if (res.code !== 0)
    throw new Error(
      `${p.name} request failed (curl exit ${res.code}): ${res.stderr.trim()} [${url}]`,
    );
  const cut = res.stdout.lastIndexOf("\n");
  const status = Number(res.stdout.slice(cut + 1));
  const text = res.stdout.slice(0, cut);
  if (status < 200 || status >= 300) {
    let detail = text.trim().slice(0, 500);
    try {
      const { error, message } = JSON.parse(text);
      const parts =
        error && typeof error === "object" ? [error.code, error.message] : [error, message];
      const found = parts.filter((x) => typeof x === "string" && x);
      if (found.length) detail = found.join(": ");
    } catch {}
    const hint = p.hints[String(status)] ?? (status >= 500 ? p.hints["5xx"] : "");
    throw new Error(
      [`${p.name} API request failed: HTTP ${status} [${url}]`, hint, detail]
        .filter(Boolean)
        .join("\n"),
    );
  }
  const body = JSON.parse(text);
  if (!options.rows) return { provider, data: body, url };
  const { [options.rows]: value, ...rest } = body ?? {};
  const { meta: inner, ...outer } = rest;
  const meta = {
    ...outer,
    ...(inner && typeof inner === "object" && !Array.isArray(inner) ? inner : {}),
  };
  let data = value ?? (options.object || options.first ? {} : []);
  if (options.first) data = Array.isArray(data) ? (data[0] ?? {}) : data;
  return {
    provider,
    data,
    url,
    ...(Array.isArray(data) ? { count: data.length } : {}),
    ...(Object.keys(meta).length ? { meta } : {}),
  };
}
