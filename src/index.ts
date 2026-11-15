import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { activeProvider, PROVIDERS, type ProviderState, providerState } from "./providers.js";
import {
	registerCryptoTools,
	registerEquiblesTools,
	registerEstimatesTools,
	registerFilingsTools,
	registerFundamentalsTools,
	registerInsiderTradesTools,
	registerMetricsTools,
	registerNewsTools,
	registerPriceTools,
	registerSegmentsTools,
} from "./tools/index.js";

/** Rendered by pi as a `<financial_research>` section of the system prompt. */
export const FINANCIAL_RESEARCH_PROMPT = `Under pit, the same data is available as saved functions: \`fd.*\` for Financial Datasets (such as \`fd.prices\` and \`fd.financialStatements\`) and \`eq.*\` for Equibles (such as \`eq.prices\` and \`eq.financialStatement\`). Call \`pinance.providers()\` to see which provider has a key, and use that one. Fetch independent data in one program with Promise.all and return only the fields you need; each result has a \`url\` to cite.

When answering financial questions using the pinance tools:

### Workflow
1. **Parse**: Extract tickers (normalize company names → symbols), metrics, and time periods
2. **Fetch**: Call tools in parallel when independent (e.g., fetching data for multiple tickers)
3. **Validate**: Before answering, verify you have data for ALL entities mentioned. For comparisons, ensure you have all sides.
4. **Respond**: Lead with the key finding, then supporting data

### Response Format
- **First sentence**: Direct answer to the question
- **Data**: Cite specific numbers from the API responses
- **Sources**: Always end with a "Sources:" section listing the API URLs used

Example sources section:
Sources:
- AAPL financials: https://api.financialdatasets.ai/...
- MSFT financials: https://api.financialdatasets.ai/...

### For Complex Queries
When comparing multiple companies or doing multi-step analysis, track progress:
\`\`\`
Research Progress:
- [x] Step 1: Parsed query - AAPL, MSFT, GOOGL operating margins
- [x] Step 2: Fetched all three income statements
- [x] Step 3: Calculated margins, ready to respond
\`\`\``;

/**
 * One line naming the data provider the tools use, from the keys that are set. It changes only when
 * the keys do, so the prompt section stays cached.
 */
export function providerPromptLine(state: ProviderState): string {
	const active = activeProvider(state);
	if (!active) {
		return "No data provider key is set. Tools will say which key is missing: FINANCIAL_DATASETS_API_KEY (Financial Datasets) or EQUIBLES_API_KEY (Equibles).";
	}
	const others = state.configured.filter((id) => id !== active).map((id) => PROVIDERS[id].name);
	const also =
		others.length > 0
			? ` ${others.join(", ")} is also configured; set PINANCE_PROVIDER to switch.`
			: "";
	const warning = state.invalidPreference
		? ` PINANCE_PROVIDER=${state.invalidPreference} names no provider; use financialdatasets or equibles.`
		: "";
	return `Data provider: ${PROVIDERS[active].name}. Shared tools use it; tools marked "Needs" another provider fail without that key.${also}${warning}`;
}

export default function pinance(pi: ExtensionAPI): void {
	// Register the financial data tools. Provider-specific tools register only when their key is set
	// (or when no key is set yet).
	registerCryptoTools(pi);
	registerEquiblesTools(pi);
	registerEstimatesTools(pi);
	registerFilingsTools(pi);
	registerFundamentalsTools(pi);
	registerInsiderTradesTools(pi);
	registerMetricsTools(pi);
	registerNewsTools(pi);
	registerPriceTools(pi);
	registerSegmentsTools(pi);

	// Add the research guidelines as a structured prompt section. Pi diffs sections against what the
	// model already has, so this costs one patch per session instead of a new prompt every run.
	pi.on("before_agent_start", (event) => {
		event.systemPromptOptions.sections.financial_research = `${FINANCIAL_RESEARCH_PROMPT}\n\n${providerPromptLine(providerState())}`;
	});
}
