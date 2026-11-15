/**
 * Which data providers have a key, and which one to use: Financial Datasets (fd.*) or Equibles (eq.*).
 */
async function providers({ shell: { exec } }): Promise<{
  configured: ("financialdatasets" | "equibles")[];
  active: "financialdatasets" | "equibles" | null;
  preferred: "financialdatasets" | "equibles" | null;
  functions: { financialdatasets: string; equibles: string };
  note: string;
}> {
  const read = (name: string) =>
    `v="\${${name}:-}"; if [ -z "$v" ] && [ -f .env ]; then v=$(sed -n -e "s/^export //" -e "s/^${name}=//p" .env | tail -n 1 | tr -d "\\r\\"'"); fi`;
  const script = [
    read("FINANCIAL_DATASETS_API_KEY"),
    'if [ -n "$v" ]; then echo fd=1; else echo fd=0; fi',
    read("EQUIBLES_API_KEY"),
    'if [ -n "$v" ]; then echo eq=1; else echo eq=0; fi',
    read("PINANCE_PROVIDER"),
    'printf "prefer=%s\\n" "$v" | tr -cd "A-Za-z_= \\n-"',
  ].join("\n");
  const res = await exec(script, { timeoutMs: 10_000 });
  const lines = Object.fromEntries(
    res.stdout
      .trim()
      .split("\n")
      .map((l) => [l.split("=")[0], l.slice(l.indexOf("=") + 1)]),
  );
  const configured: ("financialdatasets" | "equibles")[] = [];
  if (lines.fd === "1") configured.push("financialdatasets");
  if (lines.eq === "1") configured.push("equibles");
  const key = (lines.prefer ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]/g, "");
  const preferred =
    key === "fd" || key === "financialdatasets"
      ? "financialdatasets"
      : key === "eq" || key === "equibles"
        ? "equibles"
        : null;
  const active = preferred && configured.includes(preferred) ? preferred : (configured[0] ?? null);
  const note =
    active === null
      ? "No key is set. Set FINANCIAL_DATASETS_API_KEY (https://financialdatasets.ai/) or EQUIBLES_API_KEY (https://equibles.com/dashboard/apikeys, free tier: 100 requests/day)."
      : active === "equibles"
        ? "Use eq.* functions. Equibles lacks crypto, third-party news, and pre-split filing items; it adds transcripts, 13F holders, short interest, congressional trades, and filing search."
        : "Use fd.* functions." +
          (configured.includes("equibles")
            ? " eq.* also works, for transcripts, 13F holders, short interest, congressional trades, and filing search."
            : "");
  return {
    configured,
    active,
    preferred,
    functions: { financialdatasets: "fd.*", equibles: "eq.*" },
    note,
  };
}
