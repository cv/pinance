import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import {
	registerFundamentalsTools,
	registerMetricsTools,
	registerPriceTools,
} from "./tools/index.js";

export default function pinance(pi: ExtensionAPI): void {
	registerFundamentalsTools(pi);
	registerMetricsTools(pi);
	registerPriceTools(pi);
}
