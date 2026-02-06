import type { SnapshotEnvelope } from '@statesync/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createPersistenceApplier } from '../src/persistence-applier';
import { createMemoryStorageBackend } from '../src/storage/memory-storage';

type Revision = string & { readonly __brand: 'Revision' };
const r = (v: string) => v as Revision;

describe('Persistence Events', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('emits saveStart event', async () => {
    const storage = createMemoryStorageBackend<string>();
    const events: SnapshotEnvelope<string>[] = [];

    const applier = createPersistenceApplier({
      storage,
      applier: { apply: () => {} },
    });

    applier.on('saveStart', (snapshot) => {
      events.push(snapshot);
    });

    await applier.apply({ revision: r('1'), data: 'test' });
    await vi.advanceTimersByTimeAsync(0);

    expect(events).toHaveLength(1);
    expect(events[0].data).toBe('test');

    applier.dispose();
  });

  it('emits saveComplete event with duration', async () => {
    const storage = createMemoryStorageBackend<string>();
    const completions: { snapshot: SnapshotEnvelope<string>; duration: number }[] = [];

    const applier = createPersistenceApplier({
      storage,
      applier: { apply: () => {} },
    });

    applier.on('saveComplete', (snapshot, duration) => {
      completions.push({ snapshot, duration });
    });

    await applier.apply({ revision: r('1'), data: 'test' });
    await vi.advanceTimersByTimeAsync(0);

    expect(completions).toHaveLength(1);
    expect(completions[0].snapshot.data).toBe('test');
    expect(completions[0].duration).toBeGreaterThanOrEqual(0);

    applier.dispose();
  });

  it('emits saveError event on failure', async () => {
    const storage = createMemoryStorageBackend<string>({ failOnSave: true });
    const errors: { error: unknown; snapshot: SnapshotEnvelope<string> }[] = [];

    const applier = createPersistenceApplier({
      storage,
      applier: { apply: () => {} },
    });

    applier.on('saveError', (error, snapshot) => {
      errors.push({ error, snapshot });
    });

    await applier.apply({ revision: r('1'), data: 'test' });
    await vi.advanceTimersByTimeAsync(0);

    expect(errors).toHaveLength(1);
    expect(errors[0].error).toBeInstanceOf(Error);

    applier.dispose();
  });

  it('supports multiple listeners', async () => {
    const storage = createMemoryStorageBackend<string>();
    let count = 0;

    const applier = createPersistenceApplier({
      storage,
      applier: { apply: () => {} },
    });

    applier.on('saveComplete', () => count++);
    applier.on('saveComplete', () => count++);
    applier.on('saveComplete', () => count++);

    await applier.apply({ revision: r('1'), data: 'test' });
    await vi.advanceTimersByTimeAsync(0);

    expect(count).toBe(3);

    applier.dispose();
  });

  it('unsubscribes correctly', async () => {
    const storage = createMemoryStorageBackend<string>();
    let count = 0;

    const applier = createPersistenceApplier({
      storage,
      applier: { apply: () => {} },
    });

    const unsub = applier.on('saveComplete', () => count++);
    unsub();

    await applier.apply({ revision: r('1'), data: 'test' });
    await vi.advanceTimersByTimeAsync(0);

    expect(count).toBe(0);

    applier.dispose();
  });

  it('ignores errors in event handlers', async () => {
    const storage = createMemoryStorageBackend<string>();
    let secondHandlerCalled = false;

    const applier = createPersistenceApplier({
      storage,
      applier: { apply: () => {} },
    });

    applier.on('saveComplete', () => {
      throw new Error('Handler error');
    });

    applier.on('saveComplete', () => {
      secondHandlerCalled = true;
    });

    await applier.apply({ revision: r('1'), data: 'test' });
    await vi.advanceTimersByTimeAsync(0);

    expect(secondHandlerCalled).toBe(true);

    applier.dispose();
  });
});

describe('Persistence Stats', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('tracks save count', async () => {
    const storage = createMemoryStorageBackend<string>();

    const applier = createPersistenceApplier({
      storage,
      applier: { apply: () => {} },
    });

    expect(applier.getStats().saveCount).toBe(0);

    await applier.apply({ revision: r('1'), data: 'test1' });
    await vi.advanceTimersByTimeAsync(0);

    expect(applier.getStats().saveCount).toBe(1);

    await applier.apply({ revision: r('2'), data: 'test2' });
    await vi.advanceTimersByTimeAsync(0);

    expect(applier.getStats().saveCount).toBe(2);

    applier.dispose();
  });

  it('tracks save error count', async () => {
    const storage = createMemoryStorageBackend<string>();

    const applier = createPersistenceApplier({
      storage,
      applier: { apply: () => {} },
    });

    await applier.apply({ revision: r('1'), data: 'test1' });
    await vi.advanceTimersByTimeAsync(0);

    storage.setFailMode({ save: true });

    await applier.apply({ revision: r('2'), data: 'test2' });
    await vi.advanceTimersByTimeAsync(0);

    const stats = applier.getStats();
    expect(stats.saveCount).toBe(1);
    expect(stats.saveErrorCount).toBe(1);

    applier.dispose();
  });

  it('tracks total bytes saved', async () => {
    const storage = createMemoryStorageBackend<string>();

    const applier = createPersistenceApplier({
      storage,
      applier: { apply: () => {} },
    });

    await applier.apply({ revision: r('1'), data: 'short' });
    await vi.advanceTimersByTimeAsync(0);

    const stats = applier.getStats();
    expect(stats.totalBytesSaved).toBeGreaterThan(0);

    applier.dispose();
  });

  it('tracks last save timestamp', async () => {
    const storage = createMemoryStorageBackend<string>();

    const applier = createPersistenceApplier({
      storage,
      applier: { apply: () => {} },
    });

    expect(applier.getStats().lastSaveAt).toBeNull();

    vi.setSystemTime(new Date(1000));
    await applier.apply({ revision: r('1'), data: 'test' });
    await vi.advanceTimersByTimeAsync(0);

    expect(applier.getStats().lastSaveAt).toBe(1000);

    applier.dispose();
  });

  it('tracks last save duration', async () => {
    const storage = createMemoryStorageBackend<string>();

    const applier = createPersistenceApplier({
      storage,
      applier: { apply: () => {} },
    });

    expect(applier.getStats().lastSaveDurationMs).toBeNull();

    await applier.apply({ revision: r('1'), data: 'test' });
    await vi.advanceTimersByTimeAsync(0);

    expect(applier.getStats().lastSaveDurationMs).toBeGreaterThanOrEqual(0);

    applier.dispose();
  });

  it('tracks throttled count', async () => {
    const storage = createMemoryStorageBackend<string>();

    const applier = createPersistenceApplier({
      storage,
      applier: { apply: () => {} },
      throttling: { throttleMs: 100 },
    });

    // First save goes through
    await applier.apply({ revision: r('1'), data: 'test1' });
    await vi.advanceTimersByTimeAsync(0);

    // These should be throttled
    await applier.apply({ revision: r('2'), data: 'test2' });
    await applier.apply({ revision: r('3'), data: 'test3' });

    expect(applier.getStats().throttledCount).toBeGreaterThan(0);

    applier.dispose();
  });
});
