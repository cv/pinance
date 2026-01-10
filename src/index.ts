import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import {
	registerEstimatesTools,
	registerFundamentalsTools,
	registerInsiderTradesTools,
	registerMetricsTools,
	registerNewsTools,
	registerPriceTools,
} from "./tools/index.js";

export default function pinance(pi: ExtensionAPI): void {
	registerEstimatesTools(pi);
	registerFundamentalsTools(pi);
	registerInsiderTradesTools(pi);
	registerMetricsTools(pi);
	registerNewsTools(pi);
	registerPriceTools(pi);
}
