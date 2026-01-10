import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import {
	registerFundamentalsTools,
	registerMetricsTools,
	registerNewsTools,
	registerPriceTools,
} from "./tools/index.js";

export default function pinance(pi: ExtensionAPI): void {
	registerFundamentalsTools(pi);
	registerMetricsTools(pi);
	registerNewsTools(pi);
	registerPriceTools(pi);
}
