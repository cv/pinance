/**
 * A list endpoint for any provider: pinance.get with the rows under `rows`, always returned as an array with its count,
 *
 * @param provider - "financialdatasets" or "equibles".
 * @param path - API path; `{name}` placeholders are filled from params.
 * @param params - Path and query parameters.
 * @param rows - Response key holding the rows, such as "prices" or "data".
 */
async function list(
  { pinance: { get } },
  provider: "financialdatasets" | "equibles",
  path: string,
  params: Record<string, string | number | boolean | string[] | undefined>,
  rows: string,
): Promise<{
  provider: "financialdatasets" | "equibles";
  data: any[];
  url: string;
  count: number;
  meta: { [key: string]: PitJsonValue };
}> {
  const res = await get(provider, path, params, { rows });
  const data = Array.isArray(res.data) ? res.data : [];
  return { provider: res.provider, data, url: res.url, count: data.length, meta: res.meta ?? {} };
}
