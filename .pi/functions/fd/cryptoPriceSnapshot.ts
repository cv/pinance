/**
 * Latest price snapshot for a cryptocurrency pair. Needs a Financial Datasets plan with crypto access.
 *
 * @param input.ticker - Crypto pair, such as "BTC-USD" (Bitcoin in USD) or "BTC-ETH" (Bitcoin in Ether).
 */
async function cryptoPriceSnapshot(
  { pinance: { get } },
  input: { ticker: string },
): Promise<{
  provider: "financialdatasets" | "equibles";
  data: { [key: string]: PitJsonValue };
  url: string;
  meta?: { [key: string]: PitJsonValue };
}> {
  return get(
    "financialdatasets",
    "/crypto/prices/snapshot/",
    { ticker: input.ticker },
    { rows: "snapshot", object: true },
  );
}
