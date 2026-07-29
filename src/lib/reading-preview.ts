export const GUEST_PREVIEW_FRACTION = 0.3;

export function createReadingPreview(reading: string) {
  const target = Math.max(1, Math.ceil(reading.length * GUEST_PREVIEW_FRACTION));
  const candidate = reading.slice(0, target);
  const finalBreak = Math.max(
    candidate.lastIndexOf("\n\n"),
    candidate.lastIndexOf("。"),
    candidate.lastIndexOf(". "),
  );
  const minimum = Math.floor(target * 0.72);
  return (finalBreak >= minimum ? candidate.slice(0, finalBreak + 1) : candidate).trim();
}
