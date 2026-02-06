import type { SnapshotEnvelope } from '@statesync/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createPersistenceApplier, loadPersistedSnapshot } from '../src/persistence-applier';
import type { PersistenceErrorContext, StorageBackend } from '../src/types';

type Revision = string & { readonly __brand: 'Revision' };
const r = (v: string) => v as Revision;

function createMockStorage<T>(): StorageBackend<T> & {
  savedSnapshots: SnapshotEnvelope<T>[];
  storedSnapshot: SnapshotEnvelope<T> | null;
} {
  const savedSnapshots: SnapshotEnvelope<T>[] = [];
  let storedSnapshot: SnapshotEnvelope<T> | null = null;

  return {
    savedSnapshots,
    get storedSnapshot() {
      return storedSnapshot;
    },
    set storedSnapshot(v: SnapshotEnvelope<T> | null) {
      storedSnapshot = v;
    },
    async save(snapshot: SnapshotEnvelope<T>): Promise<void> {
      savedSnapshots.push(snapshot);
      storedSnapshot = snapshot;
    },
    async load(): Promise<SnapshotEnvelope<T> | null> {
      return storedSnapshot;
    },
    async clear(): Promise<void> {
      storedSnapshot = null;
    },
  };
}

describe('createPersistenceApplier', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('applies snapshot to inner applier', async () => {
    const storage = createMockStorage<string>();
    const applied: SnapshotEnvelope<string>[] = [];

    const applier = createPersistenceApplier({
      storage,
      applier: {
        apply: (s) => {
          applied.push(s);
        },
      },
    });

    await applier.apply({ revision: r('1'), data: 'hello' });

    expect(applied).toHaveLength(1);
    expect(applied[0].data).toBe('hello');
  });

  it('saves snapshot to storage', async () => {
    const storage = createMockStorage<string>();

    const applier = createPersistenceApplier({
      storage,
      applier: { apply: () => {} },
    });

    await applier.apply({ revision: r('1'), data: 'hello' });

    await vi.advanceTimersByTimeAsync(0);

    expect(storage.savedSnapshots).toHaveLength(1);
    expect(storage.savedSnapshots[0].data).toBe('hello');
  });

  it('debounces save operations', async () => {
    const storage = createMockStorage<string>();

    const applier = createPersistenceApplier({
      storage,
      applier: { apply: () => {} },
      debounceMs: 100,
    });

    await applier.apply({ revision: r('1'), data: 'v1' });
    await applier.apply({ revision: r('2'), data: 'v2' });
    await applier.apply({ revision: r('3'), data: 'v3' });

    expect(storage.savedSnapshots).toHaveLength(0);

    await vi.advanceTimersByTimeAsync(100);

    expect(storage.savedSnapshots).toHaveLength(1);
    expect(storage.savedSnapshots[0].data).toBe('v3');
  });

  it('calls onPersistenceError when save fails', async () => {
    const errors: PersistenceErrorContext[] = [];
    const failingStorage: StorageBackend<string> = {
      save: () => Promise.reject(new Error('Save failed')),
      load: () => Promise.resolve(null),
    };

    const applier = createPersistenceApplier({
      storage: failingStorage,
      applier: { apply: () => {} },
      onPersistenceError: (ctx) => errors.push(ctx),
    });

    await applier.apply({ revision: r('1'), data: 'hello' });

    await vi.advanceTimersByTimeAsync(0);

    expect(errors).toHaveLength(1);
    expect(errors[0].operation).toBe('save');
  });

  it('continues working even if storage fails', async () => {
    const applied: SnapshotEnvelope<string>[] = [];
    const failingStorage: StorageBackend<string> = {
      save: () => Promise.reject(new Error('Save failed')),
      load: () => Promise.resolve(null),
    };

    const applier = createPersistenceApplier({
      storage: failingStorage,
      applier: {
        apply: (s) => {
          applied.push(s);
        },
      },
    });

    await applier.apply({ revision: r('1'), data: 'hello' });

    expect(applied).toHaveLength(1);
    expect(applied[0].data).toBe('hello');
  });

  it('handles sync appliers', async () => {
    const storage = createMockStorage<string>();
    const applied: SnapshotEnvelope<string>[] = [];

    const applier = createPersistenceApplier({
      storage,
      applier: {
        apply: (s) => {
          applied.push(s);
        },
      },
    });

    await applier.apply({ revision: r('1'), data: 'sync' });

    expect(applied).toHaveLength(1);
  });

  describe('dispose()', () => {
    it('cancels pending debounced save', async () => {
      const storage = createMockStorage<string>();

      const applier = createPersistenceApplier({
        storage,
        applier: { apply: () => {} },
        debounceMs: 100,
      });

      await applier.apply({ revision: r('1'), data: 'pending' });
      expect(applier.hasPendingSave()).toBe(true);

      applier.dispose();

      await vi.advanceTimersByTimeAsync(200);

      expect(storage.savedSnapshots).toHaveLength(0);
      expect(applier.hasPendingSave()).toBe(false);
    });

    it('ignores apply after dispose', async () => {
      const storage = createMockStorage<string>();
      const applied: SnapshotEnvelope<string>[] = [];

      const applier = createPersistenceApplier({
        storage,
        applier: {
          apply: (s) => {
            applied.push(s);
          },
        },
      });

      applier.dispose();

      await applier.apply({ revision: r('1'), data: 'ignored' });

      expect(applied).toHaveLength(0);
      expect(storage.savedSnapshots).toHaveLength(0);
    });

    it('is idempotent', () => {
      const storage = createMockStorage<string>();

      const applier = createPersistenceApplier({
        storage,
        applier: { apply: () => {} },
      });

      expect(() => {
        applier.dispose();
        applier.dispose();
        applier.dispose();
      }).not.toThrow();
    });
  });

  describe('hasPendingSave()', () => {
    it('returns true when debounce timer is active', async () => {
      const storage = createMockStorage<string>();

      const applier = createPersistenceApplier({
        storage,
        applier: { apply: () => {} },
        debounceMs: 100,
      });

      expect(applier.hasPendingSave()).toBe(false);

      await applier.apply({ revision: r('1'), data: 'test' });

      expect(applier.hasPendingSave()).toBe(true);

      await vi.advanceTimersByTimeAsync(100);

      expect(applier.hasPendingSave()).toBe(false);
    });
  });

  describe('flush()', () => {
    it('immediately saves pending snapshot', async () => {
      const storage = createMockStorage<string>();

      const applier = createPersistenceApplier({
        storage,
        applier: { apply: () => {} },
        debounceMs: 1000,
      });

      await applier.apply({ revision: r('1'), data: 'pending' });
      expect(storage.savedSnapshots).toHaveLength(0);

      await applier.flush();

      expect(storage.savedSnapshots).toHaveLength(1);
      expect(storage.savedSnapshots[0].data).toBe('pending');
      expect(applier.hasPendingSave()).toBe(false);
    });

    it('does nothing when no pending save', async () => {
      const storage = createMockStorage<string>();

      const applier = createPersistenceApplier({
        storage,
        applier: { apply: () => {} },
      });

      await applier.flush();

      expect(storage.savedSnapshots).toHaveLength(0);
    });

    it('does nothing after dispose', async () => {
      const storage = createMockStorage<string>();

      const applier = createPersistenceApplier({
        storage,
        applier: { apply: () => {} },
        debounceMs: 100,
      });

      await applier.apply({ revision: r('1'), data: 'test' });
      applier.dispose();

      await applier.flush();

      expect(storage.savedSnapshots).toHaveLength(0);
    });
  });
});

describe('loadPersistedSnapshot', () => {
  it('loads and applies persisted snapshot', async () => {
    const storage = createMockStorage<string>();
    storage.storedSnapshot = { revision: r('5'), data: 'cached' };

    const applied: SnapshotEnvelope<string>[] = [];

    const result = await loadPersistedSnapshot(storage, {
      apply: (s) => {
        applied.push(s);
      },
    });

    expect(result).not.toBeNull();
    expect(result?.data).toBe('cached');
    expect(applied).toHaveLength(1);
    expect(applied[0].data).toBe('cached');
  });

  it('returns null when no snapshot exists', async () => {
    const storage = createMockStorage<string>();
    const applied: SnapshotEnvelope<string>[] = [];

    const result = await loadPersistedSnapshot(storage, {
      apply: (s) => {
        applied.push(s);
      },
    });

    expect(result).toBeNull();
    expect(applied).toHaveLength(0);
  });

  it('calls onError when load fails', async () => {
    const errors: PersistenceErrorContext[] = [];
    const failingStorage: StorageBackend<string> = {
      save: () => Promise.resolve(),
      load: () => Promise.reject(new Error('Load failed')),
    };

    const result = await loadPersistedSnapshot(failingStorage, { apply: () => {} }, (ctx) =>
      errors.push(ctx),
    );

    expect(result).toBeNull();
    expect(errors).toHaveLength(1);
    expect(errors[0].operation).toBe('load');
  });

  it('handles async appliers', async () => {
    const storage = createMockStorage<string>();
    storage.storedSnapshot = { revision: r('1'), data: 'async' };

    let applyCalled = false;

    await loadPersistedSnapshot(storage, {
      apply: async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        applyCalled = true;
      },
    });

    expect(applyCalled).toBe(true);
  });

  it('rejects invalid revision and calls onError', async () => {
    const storage = createMockStorage<string>();
    // Invalid revision (leading zero)
    storage.storedSnapshot = { revision: '01' as unknown as Revision, data: 'bad' };

    const errors: PersistenceErrorContext[] = [];
    const applied: SnapshotEnvelope<string>[] = [];

    const result = await loadPersistedSnapshot(
      storage,
      {
        apply: (s) => {
          applied.push(s);
        },
      },
      (ctx) => errors.push(ctx),
    );

    expect(result).toBeNull();
    expect(applied).toHaveLength(0);
    expect(errors).toHaveLength(1);
    expect(errors[0].operation).toBe('load');
    expect((errors[0].error as Error).message).toContain('Invalid cached revision');
  });

  it('rejects non-numeric revision', async () => {
    const storage = createMockStorage<string>();
    storage.storedSnapshot = { revision: 'abc' as unknown as Revision, data: 'bad' };

    const errors: PersistenceErrorContext[] = [];

    const result = await loadPersistedSnapshot(storage, { apply: () => {} }, (ctx) =>
      errors.push(ctx),
    );

    expect(result).toBeNull();
    expect(errors).toHaveLength(1);
  });
});
