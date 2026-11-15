/**
 * Latest price snapshot for a stock: price, day change, and time.
 *
 * @param input.ticker - Stock ticker, such as "AAPL".
 */
async function priceSnapshot(
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
    "/prices/snapshot/",
    { ticker: input.ticker },
    { rows: "snapshot", object: true },
  );
}
