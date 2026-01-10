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

export default function pinance(pi: ExtensionAPI): void {
	registerCryptoTools(pi);
	registerEstimatesTools(pi);
	registerFilingsTools(pi);
	registerFundamentalsTools(pi);
	registerInsiderTradesTools(pi);
	registerMetricsTools(pi);
	registerNewsTools(pi);
	registerPriceTools(pi);
	registerSegmentsTools(pi);
}
