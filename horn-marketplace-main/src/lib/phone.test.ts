import { describe, expect, it } from "vitest";
import { toE164 } from "./phone";

describe("toE164", () => {
  it("accepts local 063 numbers", () => {
    expect(toE164("063 412 3456")).toBe("+252634123456");
  });

  it("accepts +252 international form", () => {
    expect(toE164("+252634123456")).toBe("+252634123456");
  });

  it("rejects too-short input", () => {
    expect(toE164("63")).toBeNull();
  });
});
