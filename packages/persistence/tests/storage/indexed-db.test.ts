import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import { createIndexedDBBackend } from '../../src/storage/indexed-db';

type Revision = string & { readonly __brand: 'Revision' };
const r = (v: string) => v as Revision;

// Each test uses unique db names to avoid conflicts
let testCounter = 0;
const uniqueDbName = (base: string) => `${base}-${++testCounter}-${Date.now()}`;

describe('createIndexedDBBackend', () => {
  it('saves and loads snapshot', async () => {
    const storage = createIndexedDBBackend<string>({
      dbName: uniqueDbName('test-db'),
      storeName: 'snapshots',
    });

    await storage.save({ revision: r('1'), data: 'hello' });

    const loaded = await storage.load();

    expect(loaded).not.toBeNull();
    expect(loaded?.revision).toBe('1');
    expect(loaded?.data).toBe('hello');
  });

  it('returns null when no snapshot exists', async () => {
    const storage = createIndexedDBBackend<string>({
      dbName: uniqueDbName('empty-db'),
      storeName: 'snapshots',
    });

    const loaded = await storage.load();

    expect(loaded).toBeNull();
  });

  it('overwrites previous snapshot', async () => {
    const storage = createIndexedDBBackend<string>({
      dbName: uniqueDbName('overwrite-db'),
      storeName: 'snapshots',
    });

    await storage.save({ revision: r('1'), data: 'first' });
    await storage.save({ revision: r('2'), data: 'second' });

    const loaded = await storage.load();

    expect(loaded?.revision).toBe('2');
    expect(loaded?.data).toBe('second');
  });

  it('clears stored snapshot', async () => {
    const storage = createIndexedDBBackend<string>({
      dbName: uniqueDbName('clear-db'),
      storeName: 'snapshots',
    });

    await storage.save({ revision: r('1'), data: 'hello' });
    await storage.clear?.();

    const loaded = await storage.load();

    expect(loaded).toBeNull();
  });

  it('uses custom record key', async () => {
    const dbName = uniqueDbName('multi-key-db');

    const storage1 = createIndexedDBBackend<string>({
      dbName,
      storeName: 'snapshots',
      recordKey: 'key1',
    });

    const storage2 = createIndexedDBBackend<string>({
      dbName,
      storeName: 'snapshots',
      recordKey: 'key2',
    });

    await storage1.save({ revision: r('1'), data: 'data1' });
    await storage2.save({ revision: r('2'), data: 'data2' });

    const loaded1 = await storage1.load();
    const loaded2 = await storage2.load();

    expect(loaded1?.data).toBe('data1');
    expect(loaded2?.data).toBe('data2');
  });

  it('handles complex data types', async () => {
    interface ComplexData {
      name: string;
      items: number[];
      nested: { value: boolean };
    }

    const storage = createIndexedDBBackend<ComplexData>({
      dbName: uniqueDbName('complex-db'),
      storeName: 'snapshots',
    });

    const data: ComplexData = {
      name: 'test',
      items: [1, 2, 3],
      nested: { value: true },
    };

    await storage.save({ revision: r('1'), data });

    const loaded = await storage.load();

    expect(loaded?.data).toEqual(data);
  });

  it('reuses database connection', async () => {
    const storage = createIndexedDBBackend<string>({
      dbName: uniqueDbName('reuse-db'),
      storeName: 'snapshots',
    });

    // Multiple operations should reuse connection
    await storage.save({ revision: r('1'), data: 'first' });
    await storage.load();
    await storage.save({ revision: r('2'), data: 'second' });
    await storage.load();
    await storage.clear?.();

    const loaded = await storage.load();
    expect(loaded).toBeNull();
  });
});
