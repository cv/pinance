/**
 * Speaker-labelled earnings call transcript from Equibles, in spoken order.
 *
 * @param input.ticker - Exact listed symbol, such as "NVDA", or "MIC:TICKER" for a non-US listing.
 * @param input.fiscalYear - The company's own fiscal year, such as 2027 for Nvidia's FY2027.
 * @param input.fiscalQuarter - Fiscal quarter, 1-4.
 * @param input.limit - Turns per response (default 50, max 200).
 * @param input.offset - Turns to skip (default 0).
 */
async function earningsCall(
  { eq: { request } },
  input: {
    ticker: string;
    fiscalYear: number;
    fiscalQuarter: 1 | 2 | 3 | 4;
    limit?: number;
    offset?: number;
  },
): Promise<{
  data: { [key: string]: PitJsonValue }[];
  meta: { [key: string]: PitJsonValue };
  url: string;
}> {
  const path = `/v1/stocks/${encodeURIComponent(input.ticker.toUpperCase())}/earnings-calls/${input.fiscalYear}/${input.fiscalQuarter}/speakers`;
  const { data: body, url } = await request(path, { limit: input.limit, offset: input.offset });
  const { data = [], meta = {}, ...rest } = body;
  return { data, meta: { ...rest, ...meta }, url };
}
