import { describe, expect, it } from 'vitest';
import { invalidationChannel, snapshotChannel } from '../src/channels';

describe('channel helpers', () => {
  it('invalidationChannel formats correctly', () => {
    expect(invalidationChannel('settings')).toBe('statesync:settings:invalidated');
  });

  it('snapshotChannel formats correctly', () => {
    expect(snapshotChannel('settings')).toBe('statesync:settings:snapshot');
  });

  it('channels are unique per topic', () => {
    expect(invalidationChannel('a')).not.toBe(invalidationChannel('b'));
    expect(snapshotChannel('a')).not.toBe(snapshotChannel('b'));
  });

  it('invalidation and snapshot channels differ for same topic', () => {
    expect(invalidationChannel('settings')).not.toBe(snapshotChannel('settings'));
  });
});
