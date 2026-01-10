import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { registerFundamentalsTools, registerPriceTools } from "./tools/index.js";

export default function pinance(pi: ExtensionAPI): void {
	registerFundamentalsTools(pi);
	registerPriceTools(pi);
}
