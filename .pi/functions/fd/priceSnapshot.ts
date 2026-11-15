/**
 * Latest price snapshot for a stock: price, day change, and time.
 *
 * @param input.ticker - Stock ticker, such as "AAPL".
 */
async function priceSnapshot(
  { fd: { request } },
  input: { ticker: string },
): Promise<{ data: { [key: string]: PitJsonValue }; url: string }> {
  const { data, url } = await request("/prices/snapshot/", { ticker: input.ticker });
  return { data: data.snapshot ?? {}, url };
}
