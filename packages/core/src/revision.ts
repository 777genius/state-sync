import type { Revision } from './types';

const CANONICAL_RE = /^(0|[1-9][0-9]*)$/;

const MAX_U64 = '18446744073709551615';

export const ZERO_REVISION = '0' as Revision;

export function isCanonicalRevision(value: unknown): value is Revision {
  if (typeof value !== 'string') return false;
  if (!CANONICAL_RE.test(value)) return false;
  if (value.length > MAX_U64.length) return false;
  if (value.length === MAX_U64.length && value > MAX_U64) return false;
  return true;
}

export function compareRevisions(a: Revision, b: Revision): -1 | 0 | 1 {
  if (a === b) return 0;
  if (a.length !== b.length) return a.length < b.length ? -1 : 1;
  return a < b ? -1 : 1;
}
