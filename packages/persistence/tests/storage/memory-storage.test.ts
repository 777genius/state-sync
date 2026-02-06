import { describe, expect, it } from 'vitest';
import {
  createMemoryStorageBackend,
  createSharedMemoryStorage,
} from '../../src/storage/memory-storage';

type Revision = string & { readonly __brand: 'Revision' };
const r = (v: string) => v as Revision;

describe('createMemoryStorageBackend', () => {
  it('saves and loads snapshot', async () => {
    const storage = createMemoryStorageBackend<string>();

    await storage.save({ revision: r('1'), data: 'hello' });
    const loaded = await storage.load();

    expect(loaded?.data).toBe('hello');
    expect(loaded?.revision).toBe('1');
  });

  it('returns null when no snapshot exists', async () => {
    const storage = createMemoryStorageBackend<string>();
    const loaded = await storage.load();
    expect(loaded).toBeNull();
  });

  it('clears stored data', async () => {
    const storage = createMemoryStorageBackend<string>();

    await storage.save({ revision: r('1'), data: 'test' });
    await storage.clear?.();

    expect(await storage.load()).toBeNull();
  });

  it('uses initial snapshot', async () => {
    const storage = createMemoryStorageBackend<string>({
      initialSnapshot: { revision: r('5'), data: 'initial' },
    });

    const loaded = await storage.load();
    expect(loaded?.data).toBe('initial');
  });

  it('simulates latency', async () => {
    const storage = createMemoryStorageBackend<string>({ latencyMs: 50 });

    const start = Date.now();
    await storage.save({ revision: r('1'), data: 'test' });
    const elapsed = Date.now() - start;

    expect(elapsed).toBeGreaterThanOrEqual(45);
  });

  it('fails on save when failOnSave is true', async () => {
    const storage = createMemoryStorageBackend<string>({ failOnSave: true });

    await expect(storage.save({ revision: r('1'), data: 'test' })).rejects.toThrow(
      'Simulated storage error',
    );
  });

  it('fails on load when failOnLoad is true', async () => {
    const storage = createMemoryStorageBackend<string>({
      initialSnapshot: { revision: r('1'), data: 'test' },
      failOnLoad: true,
    });

    await expect(storage.load()).rejects.toThrow('Simulated storage error');
  });

  it('uses custom error message', async () => {
    const storage = createMemoryStorageBackend<string>({
      failOnSave: true,
      errorMessage: 'Custom error',
    });

    await expect(storage.save({ revision: r('1'), data: 'test' })).rejects.toThrow('Custom error');
  });

  it('enforces max size limit', async () => {
    const storage = createMemoryStorageBackend<string>({ maxSizeBytes: 10 });

    await expect(
      storage.save({ revision: r('1'), data: 'this is a very long string' }),
    ).rejects.toThrow(/quota exceeded/i);
  });

  it('tracks saved snapshots', async () => {
    const storage = createMemoryStorageBackend<string>();

    await storage.save({ revision: r('1'), data: 'first' });
    await storage.save({ revision: r('2'), data: 'second' });

    const saved = storage.getSavedSnapshots();
    expect(saved).toHaveLength(2);
    expect(saved[0].data).toBe('first');
    expect(saved[1].data).toBe('second');
  });

  it('provides raw data access', async () => {
    const storage = createMemoryStorageBackend<string>();

    await storage.save({ revision: r('1'), data: 'test' });
    const raw = storage.getRawData();

    expect(raw?.snapshot.data).toBe('test');
    expect(raw?.metadata.schemaVersion).toBe(1);
    expect(raw?.metadata.savedAt).toBeGreaterThan(0);
  });

  it('resets to initial state', async () => {
    const storage = createMemoryStorageBackend<string>({
      initialSnapshot: { revision: r('0'), data: 'initial' },
    });

    await storage.save({ revision: r('1'), data: 'changed' });
    storage.reset();

    const loaded = await storage.load();
    expect(loaded?.data).toBe('initial');
    expect(storage.getSavedSnapshots()).toHaveLength(0);
  });

  it('can change fail mode dynamically', async () => {
    const storage = createMemoryStorageBackend<string>();

    await storage.save({ revision: r('1'), data: 'test' });

    storage.setFailMode({ save: true });
    await expect(storage.save({ revision: r('2'), data: 'fail' })).rejects.toThrow();

    storage.setFailMode({ save: false });
    await storage.save({ revision: r('3'), data: 'success' });
    expect((await storage.load())?.data).toBe('success');
  });

  it('supports metadata operations', async () => {
    const storage = createMemoryStorageBackend<string>();

    await storage.saveWithMetadata({
      snapshot: { revision: r('1'), data: 'test' },
      metadata: {
        savedAt: 1000,
        schemaVersion: 2,
        sizeBytes: 100,
        compressed: true,
        ttlMs: 5000,
      },
    });

    const loaded = await storage.loadWithMetadata();
    expect(loaded?.metadata.schemaVersion).toBe(2);
    expect(loaded?.metadata.compressed).toBe(true);
    expect(loaded?.metadata.ttlMs).toBe(5000);
  });

  it('reports storage usage', async () => {
    const storage = createMemoryStorageBackend<string>({ maxSizeBytes: 1000 });

    const usageBefore = await storage.getUsage?.();
    expect(usageBefore?.used).toBe(0);
    expect(usageBefore?.quota).toBe(1000);

    await storage.save({ revision: r('1'), data: 'test data' });

    const usageAfter = await storage.getUsage?.();
    expect(usageAfter?.used).toBeGreaterThan(0);
    expect(usageAfter?.percentage).toBeDefined();
  });
});

describe('createSharedMemoryStorage', () => {
  it('shares data between backends with same key', async () => {
    const shared = createSharedMemoryStorage<string>();

    const backend1 = shared.getBackend('key1');
    const backend2 = shared.getBackend('key1');

    await backend1.save({ revision: r('1'), data: 'shared' });
    const loaded = await backend2.load();

    expect(loaded?.data).toBe('shared');
  });

  it('isolates data between different keys', async () => {
    const shared = createSharedMemoryStorage<string>();

    const backend1 = shared.getBackend('key1');
    const backend2 = shared.getBackend('key2');

    await backend1.save({ revision: r('1'), data: 'data1' });
    await backend2.save({ revision: r('2'), data: 'data2' });

    expect((await backend1.load())?.data).toBe('data1');
    expect((await backend2.load())?.data).toBe('data2');
  });

  it('clears all data', async () => {
    const shared = createSharedMemoryStorage<string>();

    await shared.getBackend('key1').save({ revision: r('1'), data: 'data1' });
    await shared.getBackend('key2').save({ revision: r('2'), data: 'data2' });

    shared.clearAll();

    expect(await shared.getBackend('key1').load()).toBeNull();
    expect(await shared.getBackend('key2').load()).toBeNull();
  });
});
