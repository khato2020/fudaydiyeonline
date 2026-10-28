import { describe, expect, it } from "vitest";
import { canUseDevOtp, isLocalTestPhone, isSmsProviderError } from "./dev-otp";

describe("local test phones", () => {
  it("accepts +25263 and seven more digits", () => {
    expect(isLocalTestPhone("+252634123456")).toBe(true);
  });

  it("rejects other prefixes and lengths", () => {
    expect(isLocalTestPhone("+252644123456")).toBe(false);
    expect(isLocalTestPhone("+25263412345")).toBe(false);
  });

  it("recognizes the missing SMS provider error", () => {
    expect(isSmsProviderError("Unsupported phone provider")).toBe(true);
    expect(isSmsProviderError("Invalid login credentials")).toBe(false);
  });

  it("is available only in the dev server", () => {
    expect(canUseDevOtp("+252634123456")).toBe(import.meta.env.DEV);
    expect(canUseDevOtp("+252644123456")).toBe(false);
  });
});
