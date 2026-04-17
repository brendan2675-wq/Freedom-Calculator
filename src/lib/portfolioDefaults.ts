import type { ExistingProperty } from "@/types/property";

// Test-data backfills have been removed. This helper is retained as a
// pass-through to keep call sites untouched and to make future migrations easy.
export function normalizeExistingProperties(properties: ExistingProperty[]) {
  if (!Array.isArray(properties)) {
    return { properties: [], changed: false };
  }
  return { properties, changed: false };
}
