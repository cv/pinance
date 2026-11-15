/**
 * Bi-monthly FINRA short interest for a stock or ETF from Equibles: short position, change, average daily volume, days to cover.
 *
 * @param input.ticker - Exact listed symbol, such as "GME".
 * @param input.startDate - First settlement date, YYYY-MM-DD (default: trailing 12 months).
 * @param input.endDate - Last settlement date, YYYY-MM-DD.
 * @param input.limit - Rows (default 24, max 500).
 * @param input.offset - Rows to skip.
 */
async function shortInterest(
  { eq: { request } },
  input: { ticker: string; startDate?: string; endDate?: string; limit?: number; offset?: number },
): Promise<{
  data: { [key: string]: PitJsonValue }[];
  meta: { [key: string]: PitJsonValue };
  url: string;
}> {
  const { data: body, url } = await request(
    `/v1/stocks/${encodeURIComponent(input.ticker.toUpperCase())}/short-interest`,
    {
      startDate: input.startDate,
      endDate: input.endDate,
      limit: input.limit,
      offset: input.offset,
    },
  );
  const { data = [], meta = {}, ...rest } = body;
  return { data, meta: { ...rest, ...meta }, url };
}
