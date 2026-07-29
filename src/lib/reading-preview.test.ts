import { describe, expect, it } from "vitest";
import { createReadingPreview, GUEST_PREVIEW_FRACTION } from "@/lib/reading-preview";

describe("createReadingPreview", () => {
  it("returns the first fifty percent without leaking the rest", () => {
    const reading = `${"第一部分。".repeat(80)}${"LOCKED".repeat(40)}`;
    const preview = createReadingPreview(reading);
    expect(preview.length).toBe(Math.ceil(reading.length * GUEST_PREVIEW_FRACTION));
    expect(preview).not.toContain("LOCKED");
  });

  it("does not return an empty preview for short readings", () => {
    expect(createReadingPreview("hello")).toBe("hel");
  });
});
