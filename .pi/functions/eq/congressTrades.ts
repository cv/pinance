/**
 * Stock trades disclosed by members of the U.S. House and Senate, from Equibles.
 *
 * @param input.ticker - Traded symbol, such as "NVDA".
 * @param input.memberId - Member id from GET /v1/congress/members (via eq.request).
 * @param input.transactionType - "Purchase" or "Sale" (default both).
 * @param input.startDate - First transaction date, YYYY-MM-DD (default: trailing year).
 * @param input.endDate - Last transaction date, YYYY-MM-DD.
 * @param input.limit - Rows (default 50, max 500).
 * @param input.offset - Rows to skip.
 */
async function congressTrades(
  { eq: { request } },
  input: {
    ticker?: string;
    memberId?: string;
    transactionType?: "Purchase" | "Sale";
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  },
): Promise<{
  data: { [key: string]: PitJsonValue }[];
  meta: { [key: string]: PitJsonValue };
  url: string;
}> {
  if (!input.ticker && !input.memberId)
    throw new Error("eq.congressTrades needs ticker, memberId, or both.");
  const { data: body, url } = await request("/v1/congress/trades", {
    ticker: input.ticker?.toUpperCase(),
    memberId: input.memberId,
    transactionType: input.transactionType,
    startDate: input.startDate,
    endDate: input.endDate,
    limit: input.limit,
    offset: input.offset,
  });
  const { data = [], meta = {}, ...rest } = body;
  return { data, meta: { ...rest, ...meta }, url };
}
