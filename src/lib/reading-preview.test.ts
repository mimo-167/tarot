import { describe, expect, it } from "vitest";
import { createReadingPreview, GUEST_PREVIEW_FRACTION } from "@/lib/reading-preview";

describe("createReadingPreview", () => {
  it("returns approximately the first thirty percent without leaking the rest", () => {
    const reading = `${"第一部分。".repeat(40)}${"LOCKED".repeat(40)}`;
    const preview = createReadingPreview(reading);
    expect(preview.length).toBeLessThanOrEqual(Math.ceil(reading.length * GUEST_PREVIEW_FRACTION));
    expect(preview.length).toBeGreaterThan(reading.length * 0.2);
    expect(preview).not.toContain("LOCKED");
  });

  it("does not return an empty preview for short readings", () => {
    expect(createReadingPreview("hello")).toBe("he");
  });
});
