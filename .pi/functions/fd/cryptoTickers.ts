/**
 * Lists the cryptocurrency tickers the API has prices for.
 */
async function cryptoTickers({
  pinance: { list },
}): Promise<{
  provider: "financialdatasets" | "equibles";
  data: string[];
  url: string;
  count: number;
  meta?: { [key: string]: PitJsonValue };
}> {
  return list("financialdatasets", "/crypto/prices/tickers/", {}, "tickers");
}
