import { describe, expect, it } from "vitest";
import { statusIndex } from "@/lib/job-types";

describe("job progress", () => {
  it("places normal courier jobs on each workflow step", () => {
    expect(statusIndex("opened", null)).toBe(0);
    expect(statusIndex("courier_needed", true)).toBe(3);
    expect(statusIndex("courier_booked", true)).toBe(4);
    expect(statusIndex("completed", true)).toBe(5);
  });

  it("skips courier progress when courier is not required", () => {
    expect(statusIndex("picked", false)).toBe(4);
    expect(statusIndex("completed", false)).toBe(5);
  });
});
