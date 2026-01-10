import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import {
	registerEstimatesTools,
	registerFundamentalsTools,
	registerMetricsTools,
	registerNewsTools,
	registerPriceTools,
} from "./tools/index.js";

export default function pinance(pi: ExtensionAPI): void {
	registerEstimatesTools(pi);
	registerFundamentalsTools(pi);
	registerMetricsTools(pi);
	registerNewsTools(pi);
	registerPriceTools(pi);
}
