import { describe, expect, it } from 'vitest';
import { compareRevisions, isCanonicalRevision, ZERO_REVISION } from '../src/revision';
import type { Revision } from '../src/types';

describe('isCanonicalRevision', () => {
  it('accepts "0"', () => {
    expect(isCanonicalRevision('0')).toBe(true);
  });

  it('rejects non-strings', () => {
    expect(isCanonicalRevision(0)).toBe(false);
    expect(isCanonicalRevision(1)).toBe(false);
    expect(isCanonicalRevision(null)).toBe(false);
    expect(isCanonicalRevision(undefined)).toBe(false);
    expect(isCanonicalRevision({})).toBe(false);
  });

  it('accepts positive integers without leading zeros', () => {
    expect(isCanonicalRevision('1')).toBe(true);
    expect(isCanonicalRevision('42')).toBe(true);
    expect(isCanonicalRevision('999999999999')).toBe(true);
  });

  it('accepts max u64', () => {
    expect(isCanonicalRevision('18446744073709551615')).toBe(true);
  });

  it('rejects leading zeros', () => {
    expect(isCanonicalRevision('00')).toBe(false);
    expect(isCanonicalRevision('01')).toBe(false);
    expect(isCanonicalRevision('007')).toBe(false);
  });

  it('rejects empty string', () => {
    expect(isCanonicalRevision('')).toBe(false);
  });

  it('rejects non-digit characters', () => {
    expect(isCanonicalRevision('abc')).toBe(false);
    expect(isCanonicalRevision('12a')).toBe(false);
    expect(isCanonicalRevision('-1')).toBe(false);
    expect(isCanonicalRevision('1.0')).toBe(false);
    expect(isCanonicalRevision(' 1')).toBe(false);
  });

  it('rejects values exceeding u64 max', () => {
    expect(isCanonicalRevision('18446744073709551616')).toBe(false);
    expect(isCanonicalRevision('99999999999999999999')).toBe(false);
  });

  it('rejects values longer than 20 digits', () => {
    expect(isCanonicalRevision('999999999999999999999')).toBe(false);
  });
});

describe('compareRevisions', () => {
  const r = (v: string) => v as Revision;

  it('returns 0 for equal revisions', () => {
    expect(compareRevisions(r('0'), r('0'))).toBe(0);
    expect(compareRevisions(r('42'), r('42'))).toBe(0);
  });

  it('compares by length first', () => {
    expect(compareRevisions(r('9'), r('10'))).toBe(-1);
    expect(compareRevisions(r('100'), r('99'))).toBe(1);
  });

  it('compares lexicographically for same length', () => {
    expect(compareRevisions(r('10'), r('20'))).toBe(-1);
    expect(compareRevisions(r('20'), r('10'))).toBe(1);
  });

  it('handles ZERO_REVISION', () => {
    expect(compareRevisions(ZERO_REVISION, r('1'))).toBe(-1);
    expect(compareRevisions(r('1'), ZERO_REVISION)).toBe(1);
    expect(compareRevisions(ZERO_REVISION, ZERO_REVISION)).toBe(0);
  });
});
