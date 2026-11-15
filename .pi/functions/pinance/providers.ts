/**
 * Which data providers have a key, and which one to use: Financial Datasets (fd.*) or Equibles (eq.*).
 */
async function providers({ shell: { exec }, pinance: { registry } }): Promise<{
  configured: ("financialdatasets" | "equibles")[];
  active: "financialdatasets" | "equibles" | null;
  preferred: "financialdatasets" | "equibles" | null;
  functions: { financialdatasets: string; equibles: string };
  note: string;
}> {
  const reg = await registry();
  const read = (name: string) => reg.readSettingShell.replaceAll("NAME", name);
  const script = [
    ...reg.providers.flatMap((p) => [
      read(p.keyName),
      `if [ -n "$v" ]; then echo ${p.id}=1; else echo ${p.id}=0; fi`,
    ]),
    read(reg.preferenceVariable),
    'printf "prefer=%s\\n" "$v" | tr -cd "A-Za-z_= \\n-"',
  ].join("\n");
  const res = await exec(script, { timeoutMs: 10_000 });
  const lines = Object.fromEntries(
    res.stdout
      .trim()
      .split("\n")
      .map((l) => [l.split("=")[0], l.slice(l.indexOf("=") + 1)]),
  );
  const configured = reg.providers.filter((p) => lines[p.id] === "1").map((p) => p.id);
  const key = (lines.prefer ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]/g, "");
  const preferred = reg.providers.find((p) => p.aliases.includes(key))?.id ?? null;
  const active = preferred && configured.includes(preferred) ? preferred : (configured[0] ?? null);
  const ns = (id: "financialdatasets" | "equibles") =>
    `${reg.providers.find((p) => p.id === id)?.namespace}.*`;
  const note =
    active === null
      ? `No key is set. Set ${reg.providers.map((p) => `${p.keyName} (${p.signup})`).join(" or ")}. Equibles has a free tier of 100 requests a day.`
      : `Use market.* for quotes, prices, filings, insider trades, and valuation (normalized across providers), and ${ns(active)} for everything else.` +
        (active === "equibles"
          ? " Equibles lacks crypto, third-party news, and pre-split filing items; it adds transcripts, 13F holders, short interest, congressional trades, and filing search."
          : configured.includes("equibles")
            ? " eq.* also works, for transcripts, 13F holders, short interest, congressional trades, and filing search."
            : "");
  return {
    configured,
    active,
    preferred,
    functions: { financialdatasets: ns("financialdatasets"), equibles: ns("equibles") },
    note,
  };
}
