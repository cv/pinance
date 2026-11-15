/**
 * Latest price snapshot for a cryptocurrency pair. Needs a Financial Datasets plan with crypto access.
 *
 * @param input.ticker - Crypto pair, such as "BTC-USD" (Bitcoin in USD) or "BTC-ETH" (Bitcoin in Ether).
 */
async function cryptoPriceSnapshot(
  { fd: { request } },
  input: { ticker: string },
): Promise<{ data: { [key: string]: PitJsonValue }; url: string }> {
  const { data, url } = await request("/crypto/prices/snapshot/", { ticker: input.ticker });
  return { data: data.snapshot ?? {}, url };
}
