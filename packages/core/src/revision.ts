/**
 * Revision utilities for state-sync.
 *
 * Provides validation and comparison functions for revision strings.
 * Revisions are canonical decimal representations of unsigned 64-bit integers,
 * used as monotonically increasing version identifiers in the sync protocol.
 *
 * @module
 */

import type { Revision } from './types';

/** Regular expression that matches canonical non-negative integer strings (no leading zeros except "0" itself). */
const CANONICAL_RE = /^(0|[1-9][0-9]*)$/;

/** String representation of the maximum unsigned 64-bit integer value (2^64 - 1). */
const MAX_U64 = '18446744073709551615';

/**
 * The zero revision constant, representing the initial (empty) revision state.
 *
 * Use this as the starting revision before any snapshots have been applied.
 *
 * @example
 * ```ts
 * import { ZERO_REVISION } from '@statesync/core';
 *
 * let localRevision = ZERO_REVISION; // "0"
 * ```
 */
export const ZERO_REVISION = '0' as Revision;

/**
 * Checks whether a value is a valid canonical revision string.
 *
 * A canonical revision must:
 * - Be a string
 * - Match the pattern `^(0|[1-9][0-9]*)$` (no leading zeros except bare "0")
 * - Represent a value within the unsigned 64-bit integer range (0 to 2^64 - 1)
 *
 * This is a TypeScript type guard that narrows the input to {@link Revision}.
 *
 * @param value - The value to validate. Can be of any type.
 * @returns `true` if the value is a valid canonical revision string, `false` otherwise.
 *
 * @example
 * ```ts
 * import { isCanonicalRevision } from '@statesync/core';
 *
 * isCanonicalRevision('42');    // true
 * isCanonicalRevision('0');     // true
 * isCanonicalRevision('007');   // false (leading zeros)
 * isCanonicalRevision(-1);      // false (not a string)
 * isCanonicalRevision('abc');   // false (non-numeric)
 * ```
 */
export function isCanonicalRevision(value: unknown): value is Revision {
  if (typeof value !== 'string') return false;
  if (!CANONICAL_RE.test(value)) return false;
  if (value.length > MAX_U64.length) return false;
  if (value.length === MAX_U64.length && value > MAX_U64) return false;
  return true;
}

/**
 * Compares two revision strings numerically.
 *
 * Uses string-length comparison followed by lexicographic comparison,
 * which is equivalent to numeric ordering for canonical decimal strings
 * (no leading zeros). This avoids BigInt overhead while remaining correct
 * for the full u64 range.
 *
 * @param a - The first revision to compare.
 * @param b - The second revision to compare.
 * @returns `-1` if `a < b`, `0` if `a === b`, `1` if `a > b`.
 *
 * @example
 * ```ts
 * import { compareRevisions } from '@statesync/core';
 * import type { Revision } from '@statesync/core';
 *
 * const r1 = '10' as Revision;
 * const r2 = '9' as Revision;
 *
 * compareRevisions(r1, r2); // 1  (10 > 9)
 * compareRevisions(r2, r1); // -1 (9 < 10)
 * compareRevisions(r1, r1); // 0
 * ```
 */
export function compareRevisions(a: Revision, b: Revision): -1 | 0 | 1 {
  if (a === b) return 0;
  if (a.length !== b.length) return a.length < b.length ? -1 : 1;
  return a < b ? -1 : 1;
}
