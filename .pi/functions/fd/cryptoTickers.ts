/**
 * Lists the cryptocurrency tickers the API has prices for.
 */
async function cryptoTickers({
  fd: { request },
}): Promise<{ data: string[]; url: string; count: number }> {
  const { data, url } = await request("/crypto/prices/tickers/");
  const tickers: string[] = data.tickers ?? [];
  return { data: tickers, url, count: tickers.length };
}
