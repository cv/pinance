/**
 * Calls the Financial Datasets API (https://api.financialdatasets.ai) and returns the parsed JSON and the URL to cite.
 *
 * @param endpoint - API path, such as "/prices/snapshot/".
 * @param params - Query parameters. Undefined values are skipped, arrays repeat the key, and `ticker` is upper-cased.
 */
async function request(
  { pinance: { get } },
  endpoint: string,
  params: Record<string, string | number | boolean | string[] | undefined> = {},
): Promise<{ data: any; url: string }> {
  const { data, url } = await get("financialdatasets", endpoint, params);
  return { data, url };
}
