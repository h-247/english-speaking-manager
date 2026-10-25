/**
 * Computes speaking practice score according to the authoritative formula:
 * Score = 10 * PassCount / (PassCount + FailCount)
 *
 * Requirements:
 * - PassCount and FailCount must be non-negative integers.
 * - Negative and fractional values are rejected (returns null or throws depending on strict validation).
 * - Zero denominator (PassCount + FailCount === 0) returns null (not 0.0).
 * - Result is rounded to 1 decimal place.
 */

export function calculateScore(
  passCount: number | null | undefined,
  failCount: number | null | undefined,
): number | null {
  if (
    passCount === null ||
    passCount === undefined ||
    failCount === null ||
    failCount === undefined
  ) {
    return null;
  }

  // Reject fractional or negative counts
  if (
    !Number.isInteger(passCount) ||
    !Number.isInteger(failCount) ||
    passCount < 0 ||
    failCount < 0
  ) {
    return null;
  }

  const total = passCount + failCount;
  if (total === 0) {
    return null; // Zero denominator
  }

  const rawScore = (10 * passCount) / total;
  // Round to one decimal place mathematically
  return Math.round(rawScore * 10) / 10;
}

/**
 * Format score for UI display.
 * Returns '—' when score is null/unavailable, or '8.0/10' when score exists.
 */
export function formatScore(score: number | null | undefined): string {
  if (score === null || score === undefined || Number.isNaN(score)) {
    return '—';
  }
  return `${score.toFixed(1)}/10`;
}
