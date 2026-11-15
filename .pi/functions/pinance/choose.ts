/**
 * Picks the provider for one dataset from an explicit choice, the active provider, or any configured one.
 *
 * @param input.provider - An explicit choice: "financialdatasets" or "equibles" (or "fd" or "eq").
 * @param input.supported - Providers that have the dataset (default: all).
 * @param input.dataset - What is being fetched, for error messages, such as "crypto prices".
 */
async function choose(
  { pinance: { providers, registry } },
  input: {
    provider?: string;
    supported?: ("financialdatasets" | "equibles")[];
    dataset?: string;
  } = {},
): Promise<"financialdatasets" | "equibles"> {
  const reg = await registry();
  const supported = input.supported ?? reg.providers.map((p) => p.id);
  const name = (id: string) => reg.providers.find((p) => p.id === id);
  const what = input.dataset ?? "this data";
  if (input.provider) {
    const key = input.provider
      .trim()
      .toLowerCase()
      .replace(/[\s_-]/g, "");
    const p = reg.providers.find((x) => x.aliases.includes(key));
    if (!p)
      throw new Error(
        `Unknown provider ${input.provider}; use ${reg.providers.map((x) => x.id).join(" or ")}.`,
      );
    if (!supported.includes(p.id))
      throw new Error(
        `${p.name} does not provide ${what}; ${supported.map((id) => name(id)?.name).join(" or ")} does.`,
      );
    return p.id;
  }
  const state = await providers();
  const candidates = supported.filter((id) => state.configured.includes(id));
  if (state.active && candidates.includes(state.active)) return state.active;
  if (candidates[0]) return candidates[0];
  if (state.configured.length > 0) {
    const need = supported
      .map((id) => `${name(id)?.name} (${name(id)?.keyName}, ${name(id)?.signup})`)
      .join(" or ");
    throw new Error(
      `${what} needs ${need}; only ${state.configured.map((id) => name(id)?.name).join(" and ")} is configured.`,
    );
  }
  if (!supported[0]) throw new Error(`No provider has ${what}.`);
  return supported[0];
}
