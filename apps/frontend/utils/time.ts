/**
 * Formats a duration in seconds into a human-readable string.
 * - 3600+  → "Xh Ym"
 * - 60–3599 → "Xm Ys"
 * - 0–59   → "Xs"
 */
export const formatTimeRemaining = (seconds: number): string => {
  if (seconds <= 0) return "0s";

  if (seconds >= 3600) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }

  if (seconds >= 60) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return s > 0 ? `${m}m ${s}s` : `${m}m`;
  }

  return `${seconds}s`;
};
