export const GUEST_PREVIEW_FRACTION = 0.5;

export function createReadingPreview(reading: string) {
  const target = Math.max(1, Math.ceil(reading.length * GUEST_PREVIEW_FRACTION));
  return reading.slice(0, target);
}
