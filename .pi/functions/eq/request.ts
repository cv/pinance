/**
 * Calls the Equibles REST API (https://api.equibles.com/v1) and returns the parsed JSON and the URL to cite.
 *
 * @param path - API path under /v1, such as "/v1/stocks/{ticker}/prices" or "/v1/congress/trades".
 * @param params - Path and query parameters. Undefined values are skipped and arrays repeat the key.
 */
async function request(
  { pinance: { get } },
  path: string,
  params: Record<string, string | number | boolean | string[] | undefined> = {},
): Promise<{ data: any; url: string }> {
  const { data, url } = await get("equibles", path, params);
  return { data, url };
}
