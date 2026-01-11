import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import {
	registerCryptoTools,
	registerEstimatesTools,
	registerFilingsTools,
	registerFundamentalsTools,
	registerInsiderTradesTools,
	registerMetricsTools,
	registerNewsTools,
	registerPriceTools,
	registerSegmentsTools,
} from "./tools/index.js";

const FINANCIAL_RESEARCH_PROMPT = `
## Financial Research Guidelines

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
\`\`\`
`;

export default function pinance(pi: ExtensionAPI): void {
	// Register all financial data tools
	registerCryptoTools(pi);
	registerEstimatesTools(pi);
	registerFilingsTools(pi);
	registerFundamentalsTools(pi);
	registerInsiderTradesTools(pi);
	registerMetricsTools(pi);
	registerNewsTools(pi);
	registerPriceTools(pi);
	registerSegmentsTools(pi);

	// Inject financial research guidelines into system prompt
	pi.on("before_agent_start", async (event) => {
		return {
			systemPrompt: event.systemPrompt + FINANCIAL_RESEARCH_PROMPT,
		};
	});
}
