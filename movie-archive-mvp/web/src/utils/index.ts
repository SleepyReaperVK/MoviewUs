/**
+ * General-purpose utility functions.
+ * Add date formatters, validators, etc. here.
+ */

/** Clamp a number between min and max. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
