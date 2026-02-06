import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createLocalStorageBackend } from '../../src/storage/local-storage';

type Revision = string & { readonly __brand: 'Revision' };
const r = (v: string) => v as Revision;

const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    reset: () => {
      store = {};
    },
  };
})();

vi.stubGlobal('localStorage', mockLocalStorage);

describe('createLocalStorageBackend', () => {
  beforeEach(() => {
    mockLocalStorage.reset();
    vi.clearAllMocks();
  });

  it('saves snapshot to localStorage', async () => {
    const storage = createLocalStorageBackend<string>({ key: 'test-key' });

    await storage.save({ revision: r('1'), data: 'hello' });

    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      'test-key',
      JSON.stringify({ revision: '1', data: 'hello' }),
    );
  });

  it('loads snapshot from localStorage', async () => {
    const storage = createLocalStorageBackend<string>({ key: 'test-key' });

    mockLocalStorage.getItem.mockReturnValueOnce(JSON.stringify({ revision: '5', data: 'cached' }));

    const result = await storage.load();

    expect(result).toEqual({ revision: '5', data: 'cached' });
    expect(mockLocalStorage.getItem).toHaveBeenCalledWith('test-key');
  });

  it('returns null when no data exists', async () => {
    const storage = createLocalStorageBackend<string>({ key: 'test-key' });

    mockLocalStorage.getItem.mockReturnValueOnce(null as unknown as string);

    const result = await storage.load();

    expect(result).toBeNull();
  });

  it('clears stored data', async () => {
    const storage = createLocalStorageBackend<string>({ key: 'test-key' });

    await storage.clear?.();

    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('test-key');
  });

  it('uses custom serializer', async () => {
    const serialize = vi.fn(() => 'custom-serialized');
    const storage = createLocalStorageBackend<string>({
      key: 'test-key',
      serialize,
    });

    await storage.save({ revision: r('1'), data: 'hello' });

    expect(serialize).toHaveBeenCalledWith({ revision: '1', data: 'hello' });
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('test-key', 'custom-serialized');
  });

  it('uses custom deserializer', async () => {
    const deserialize = vi.fn((_data: string) => ({ revision: r('99'), data: 'custom' }));
    const storage = createLocalStorageBackend<string>({
      key: 'test-key',
      deserialize,
    });

    mockLocalStorage.getItem.mockReturnValueOnce('some-data');

    const result = await storage.load();

    expect(deserialize).toHaveBeenCalledWith('some-data');
    expect(result).toEqual({ revision: '99', data: 'custom' });
  });

  it('handles complex data types', async () => {
    interface ComplexData {
      name: string;
      items: number[];
      nested: { value: boolean };
    }

    const storage = createLocalStorageBackend<ComplexData>({ key: 'complex' });

    const data: ComplexData = {
      name: 'test',
      items: [1, 2, 3],
      nested: { value: true },
    };

    await storage.save({ revision: r('1'), data });

    mockLocalStorage.getItem.mockReturnValueOnce(JSON.stringify({ revision: '1', data }));

    const result = await storage.load();

    expect(result?.data).toEqual(data);
  });

  describe('error handling', () => {
    it('throws informative error on QuotaExceededError', async () => {
      const storage = createLocalStorageBackend<string>({ key: 'quota-test' });

      const quotaError = new DOMException('Quota exceeded', 'QuotaExceededError');
      mockLocalStorage.setItem.mockImplementationOnce(() => {
        throw quotaError;
      });

      await expect(storage.save({ revision: r('1'), data: 'large-data' })).rejects.toThrow(
        /localStorage quota exceeded.*quota-test/,
      );
    });

    it('includes data size in quota error message', async () => {
      const storage = createLocalStorageBackend<string>({ key: 'size-test' });

      const quotaError = new DOMException('Quota exceeded', 'QuotaExceededError');
      mockLocalStorage.setItem.mockImplementationOnce(() => {
        throw quotaError;
      });

      await expect(storage.save({ revision: r('1'), data: 'x'.repeat(2048) })).rejects.toThrow(
        /Data size: \d+KB/,
      );
    });

    it('rethrows non-quota errors unchanged', async () => {
      const storage = createLocalStorageBackend<string>({ key: 'other-error' });

      const otherError = new Error('Some other error');
      mockLocalStorage.setItem.mockImplementationOnce(() => {
        throw otherError;
      });

      await expect(storage.save({ revision: r('1'), data: 'test' })).rejects.toThrow(
        'Some other error',
      );
    });

    it('throws informative error on deserialize failure', async () => {
      const storage = createLocalStorageBackend<string>({ key: 'corrupt-key' });

      mockLocalStorage.getItem.mockReturnValueOnce('not valid json {{{');

      await expect(storage.load()).rejects.toThrow(/Failed to deserialize.*corrupt-key/);
    });

    it('includes original error message in deserialize error', async () => {
      const storage = createLocalStorageBackend<string>({ key: 'parse-error' });

      mockLocalStorage.getItem.mockReturnValueOnce('invalid');

      await expect(storage.load()).rejects.toThrow(/Original error:/);
    });

    it('throws informative error when custom deserializer fails', async () => {
      const storage = createLocalStorageBackend<string>({
        key: 'custom-fail',
        deserialize: () => {
          throw new Error('Custom parse error');
        },
      });

      mockLocalStorage.getItem.mockReturnValueOnce('some-data');

      await expect(storage.load()).rejects.toThrow(/Custom parse error/);
    });
  });
});
