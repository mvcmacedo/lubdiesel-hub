/** Removes empty string / null / undefined values so PATCH/POST bodies stay clean. */
export function pruneEmpty<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== '' && value !== null && value !== undefined) {
      out[key] = value;
    }
  }
  return out;
}
