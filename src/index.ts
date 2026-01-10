import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { registerPriceTools } from "./tools/index.js";

export default function pinance(pi: ExtensionAPI): void {
	registerPriceTools(pi);
}
