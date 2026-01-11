import { describe, expect, it } from "vitest";
import {
	formatItemsDescription,
	ITEMS_10K,
	ITEMS_10K_MAP,
	ITEMS_10Q,
	ITEMS_10Q_MAP,
} from "./constants.js";

describe("constants", () => {
	describe("ITEMS_10K_MAP", () => {
		it("should have all required 10-K items", () => {
			expect(ITEMS_10K_MAP["Item-1"]).toBe("Business");
			expect(ITEMS_10K_MAP["Item-1A"]).toBe("Risk Factors");
			expect(ITEMS_10K_MAP["Item-7"]).toBe(
				"Management's Discussion and Analysis of Financial Condition and Results of Operations",
			);
			expect(ITEMS_10K_MAP["Item-8"]).toBe("Financial Statements and Supplementary Data");
		});

		it("should have 21 items", () => {
			expect(Object.keys(ITEMS_10K_MAP).length).toBe(21);
		});
	});

	describe("ITEMS_10Q_MAP", () => {
		it("should have all required 10-Q items", () => {
			expect(ITEMS_10Q_MAP["Item-1"]).toBe("Financial Statements");
			expect(ITEMS_10Q_MAP["Item-2"]).toBe(
				"Management's Discussion and Analysis of Financial Condition and Results of Operations",
			);
			expect(ITEMS_10Q_MAP["Item-3"]).toBe(
				"Quantitative and Qualitative Disclosures About Market Risk",
			);
			expect(ITEMS_10Q_MAP["Item-4"]).toBe("Controls and Procedures");
		});

		it("should have 4 items", () => {
			expect(Object.keys(ITEMS_10Q_MAP).length).toBe(4);
		});
	});

	describe("ITEMS_10K", () => {
		it("should be array of 10-K item keys", () => {
			expect(ITEMS_10K).toContain("Item-1");
			expect(ITEMS_10K).toContain("Item-1A");
			expect(ITEMS_10K).toContain("Item-16");
			expect(ITEMS_10K.length).toBe(21);
		});
	});

	describe("ITEMS_10Q", () => {
		it("should be array of 10-Q item keys", () => {
			expect(ITEMS_10Q).toContain("Item-1");
			expect(ITEMS_10Q).toContain("Item-4");
			expect(ITEMS_10Q.length).toBe(4);
		});
	});

	describe("formatItemsDescription", () => {
		it("should format items map as description string", () => {
			const testMap = {
				"Item-1": "First Item",
				"Item-2": "Second Item",
			};

			const result = formatItemsDescription(testMap);

			expect(result).toBe("  - Item-1: First Item\n  - Item-2: Second Item");
		});

		it("should handle empty map", () => {
			const result = formatItemsDescription({});
			expect(result).toBe("");
		});

		it("should format 10-K items correctly", () => {
			const result = formatItemsDescription(ITEMS_10K_MAP);
			expect(result).toContain("  - Item-1: Business");
			expect(result).toContain("  - Item-1A: Risk Factors");
		});
	});
});
