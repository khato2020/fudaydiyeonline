import { describe, expect, it } from "vitest";
import { nextStatus } from "./order-status";

describe("order status queue", () => {
  it("moves New → Packed", () => expect(nextStatus("new")).toBe("packed"));
  it("moves Packed → Out for Delivery", () => expect(nextStatus("packed")).toBe("out_for_delivery"));
  it("moves Out for Delivery → Completed", () => expect(nextStatus("out_for_delivery")).toBe("completed"));
  it("stops at Completed", () => expect(nextStatus("completed")).toBeNull());
});
