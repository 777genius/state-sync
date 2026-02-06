import { describe, expect, it } from 'vitest';
import {
  benchmarkCompression,
  createBase64Adapter,
  createCompressionAdapter,
  createLZCompressionAdapter,
  createNoCompressionAdapter,
  estimateCompressionRatio,
  lzCompress,
  lzDecompress,
} from '../src/compression';

describe('LZ compression', () => {
  it('compresses and decompresses simple string', () => {
    const original = 'Hello, World!';
    const compressed = lzCompress(original);
    const decompressed = lzDecompress(compressed);

    expect(decompressed).toBe(original);
  });

  it('handles empty string', () => {
    expect(lzCompress('')).toBe('');
    expect(lzDecompress('')).toBe('');
  });

  it('compresses JSON data', () => {
    const json = JSON.stringify({
      users: Array.from({ length: 50 }, (_, i) => ({
        id: i,
        name: `User ${i}`,
        email: `user${i}@example.com`,
        active: true,
      })),
    });

    const compressed = lzCompress(json);
    const decompressed = lzDecompress(compressed);

    expect(decompressed).toBe(json);
  });

  it('achieves compression on repetitive data', () => {
    const repetitive = 'abcdefghij'.repeat(100);
    const compressed = lzCompress(repetitive);

    expect(lzDecompress(compressed)).toBe(repetitive);
    expect(compressed.length).toBeLessThan(repetitive.length);
  });

  it('handles all ASCII characters', () => {
    let ascii = '';
    for (let i = 32; i < 127; i++) {
      ascii += String.fromCharCode(i);
    }
    ascii = ascii.repeat(10);

    const compressed = lzCompress(ascii);
    const decompressed = lzDecompress(compressed);

    expect(decompressed).toBe(ascii);
  });

  it('handles numeric strings', () => {
    const numbers = '0123456789'.repeat(100);
    const compressed = lzCompress(numbers);

    expect(lzDecompress(compressed)).toBe(numbers);
  });

  it('handles single character', () => {
    const single = 'x';
    expect(lzDecompress(lzCompress(single))).toBe(single);
  });

  it('handles long repeated single character', () => {
    const repeated = 'a'.repeat(1000);
    const compressed = lzCompress(repeated);

    expect(lzDecompress(compressed)).toBe(repeated);
    expect(compressed.length).toBeLessThan(repeated.length);
  });
});

describe('createLZCompressionAdapter', () => {
  it('creates adapter with correct algorithm name', () => {
    const adapter = createLZCompressionAdapter();
    expect(adapter.algorithm).toBe('lz');
  });

  it('compress and decompress work correctly', () => {
    const adapter = createLZCompressionAdapter();
    const original = '{"key": "value", "nested": {"data": [1,2,3]}}';

    const compressed = adapter.compress(original);
    const decompressed = adapter.decompress(compressed);

    expect(decompressed).toBe(original);
  });

  it('compresses real-world JSON effectively', () => {
    const adapter = createLZCompressionAdapter();
    const data = JSON.stringify({
      settings: {
        theme: 'dark',
        language: 'en',
        notifications: true,
      },
      items: Array.from({ length: 20 }, (_, i) => ({
        id: `item-${i}`,
        title: `Item number ${i}`,
        description: 'This is a description that repeats often',
        tags: ['tag1', 'tag2', 'tag3'],
      })),
    });

    const compressed = adapter.compress(data);
    const decompressed = adapter.decompress(compressed);

    expect(decompressed).toBe(data);
    // Should achieve some compression on this repetitive data
    expect(compressed.length).toBeLessThan(data.length);
  });
});

describe('createNoCompressionAdapter', () => {
  it('creates adapter with correct algorithm name', () => {
    const adapter = createNoCompressionAdapter();
    expect(adapter.algorithm).toBe('none');
  });

  it('returns data unchanged', () => {
    const adapter = createNoCompressionAdapter();
    const original = 'test data';

    expect(adapter.compress(original)).toBe(original);
    expect(adapter.decompress(original)).toBe(original);
  });
});

describe('createBase64Adapter', () => {
  it('creates adapter with correct algorithm name', () => {
    const adapter = createBase64Adapter();
    expect(adapter.algorithm).toBe('base64');
  });

  it('encodes and decodes simple string', () => {
    const adapter = createBase64Adapter();
    const original = 'Hello, World!';

    const compressed = adapter.compress(original);
    const decompressed = adapter.decompress(compressed);

    expect(decompressed).toBe(original);
  });

  it('handles Unicode characters', () => {
    const adapter = createBase64Adapter();
    const original = 'Привет мир! 你好世界!';

    const compressed = adapter.compress(original);
    const decompressed = adapter.decompress(compressed);

    expect(decompressed).toBe(original);
  });

  it('handles JSON data', () => {
    const adapter = createBase64Adapter();
    const original = JSON.stringify({
      name: 'Test',
      values: [1, 2, 3],
      nested: { key: 'value' },
    });

    const compressed = adapter.compress(original);
    const decompressed = adapter.decompress(compressed);

    expect(decompressed).toBe(original);
  });

  it('handles empty string', () => {
    const adapter = createBase64Adapter();

    expect(adapter.compress('')).toBe('');
    expect(adapter.decompress('')).toBe('');
  });
});

describe('createCompressionAdapter', () => {
  it('creates adapter from custom implementation', () => {
    const adapter = createCompressionAdapter({
      algorithm: 'custom',
      compress: (data) => `[${data}]`,
      decompress: (data) => data.slice(1, -1),
    });

    expect(adapter.algorithm).toBe('custom');
    expect(adapter.compress('test')).toBe('[test]');
    expect(adapter.decompress('[test]')).toBe('test');
  });
});

describe('estimateCompressionRatio', () => {
  it('returns 1 for empty string', () => {
    const adapter = createNoCompressionAdapter();
    expect(estimateCompressionRatio('', adapter)).toBe(1);
  });

  it('returns 1 for no compression adapter', () => {
    const adapter = createNoCompressionAdapter();
    const ratio = estimateCompressionRatio('test data', adapter);
    expect(ratio).toBe(1);
  });

  it('returns ratio less than 1 for LZ on repetitive data', () => {
    const adapter = createLZCompressionAdapter();
    const repetitive = 'abcdefghij'.repeat(100);
    const ratio = estimateCompressionRatio(repetitive, adapter);
    expect(ratio).toBeLessThan(1);
  });
});

describe('benchmarkCompression', () => {
  it('returns benchmark results', () => {
    const adapter = createNoCompressionAdapter();
    const data = 'test data for benchmarking';

    const result = benchmarkCompression(data, adapter, 10);

    expect(result.ratio).toBe(1);
    expect(result.compressTimeMs).toBeGreaterThanOrEqual(0);
    expect(result.decompressTimeMs).toBeGreaterThanOrEqual(0);
    expect(result.originalSize).toBe(data.length);
    expect(result.compressedSize).toBe(data.length);
  });

  it('shows compression benefit for LZ adapter', () => {
    const adapter = createLZCompressionAdapter();
    const data = 'abcdefghij'.repeat(100);

    const result = benchmarkCompression(data, adapter, 10);

    expect(result.ratio).toBeLessThan(1);
    expect(result.compressedSize).toBeLessThan(result.originalSize);
  });
});
