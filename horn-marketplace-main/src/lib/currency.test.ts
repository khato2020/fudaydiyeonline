import { describe, expect, it } from "vitest";
import { formatPrice, slshToUsd, usdToSlsh } from "./currency";

describe("currency", () => {
  it("converts 1 USD to 8,500 SLSh", () => expect(usdToSlsh(1)).toBe(8500));
  it("converts 17,000 SLSh to 2 USD", () => expect(slshToUsd(17000)).toBe(2));
  it("formats SLSh with separators", () => expect(formatPrice(10, "SLSH")).toBe("85,000 SLSh"));
});
