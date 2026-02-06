import type { CompressionAdapter } from './types';

/**
 * Built-in LZ-based compression for localStorage/IndexedDB.
 *
 * Uses a simplified LZW algorithm optimized for JSON strings.
 * No external dependencies required.
 */

// =============================================================================
// LZ Compression Implementation
// =============================================================================

/**
 * Compress a string using LZ-based compression.
 * Returns a UTF-16 safe string for localStorage.
 */
export function lzCompress(input: string): string {
  if (!input) return '';

  const dict = new Map<string, number>();
  let dictSize = 256;
  let current = '';
  const result: number[] = [];

  // Initialize dictionary with single characters
  for (let i = 0; i < 256; i++) {
    dict.set(String.fromCharCode(i), i);
  }

  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    const combined = current + char;

    if (dict.has(combined)) {
      current = combined;
    } else {
      const code = dict.get(current);
      if (code !== undefined) {
        result.push(code);
      }
      if (dictSize < 0xfffe) {
        dict.set(combined, dictSize++);
      }
      current = char;
    }
  }

  if (current) {
    const code = dict.get(current);
    if (code !== undefined) {
      result.push(code);
    }
  }

  // Encode to UTF-16 safe string (2 codes per character)
  return codesToString(result);
}

/**
 * Decompress a string compressed with lzCompress.
 */
export function lzDecompress(compressed: string): string {
  if (!compressed) return '';

  const codes = stringToCodes(compressed);
  if (codes.length === 0) return '';

  const dict: string[] = [];
  let dictSize = 256;

  // Initialize dictionary
  for (let i = 0; i < 256; i++) {
    dict[i] = String.fromCharCode(i);
  }

  let previous = dict[codes[0]];
  if (previous === undefined) {
    throw new Error('[state-sync] Invalid compressed data');
  }

  const result: string[] = [previous];

  for (let i = 1; i < codes.length; i++) {
    const code = codes[i];
    let entry: string;

    if (dict[code] !== undefined) {
      entry = dict[code];
    } else if (code === dictSize) {
      entry = previous + previous[0];
    } else {
      throw new Error(`[state-sync] Invalid compressed data at position ${i}`);
    }

    result.push(entry);

    if (dictSize < 0xfffe) {
      dict[dictSize++] = previous + entry[0];
    }

    previous = entry;
  }

  return result.join('');
}

/**
 * Encode array of codes to UTF-16 string.
 * Uses pairs of codes packed into single characters.
 */
function codesToString(codes: number[]): string {
  const result: string[] = [];

  // Add length marker at the start
  result.push(String.fromCharCode(codes.length & 0xffff));
  result.push(String.fromCharCode((codes.length >> 16) & 0xffff));

  for (let i = 0; i < codes.length; i++) {
    result.push(String.fromCharCode(codes[i]));
  }

  return result.join('');
}

/**
 * Decode UTF-16 string back to array of codes.
 */
function stringToCodes(str: string): number[] {
  if (str.length < 2) return [];

  // Read length from first two characters
  const len = str.charCodeAt(0) | (str.charCodeAt(1) << 16);

  const result: number[] = [];
  for (let i = 2; i < str.length && result.length < len; i++) {
    result.push(str.charCodeAt(i));
  }

  return result;
}

// =============================================================================
// Compression Adapters
// =============================================================================

/**
 * Creates a compression adapter using built-in LZ compression.
 *
 * Typically achieves 40-70% compression on JSON data.
 * No external dependencies required.
 *
 * @example
 * ```typescript
 * const applier = createPersistenceApplier({
 *   storage,
 *   applier: innerApplier,
 *   compression: createLZCompressionAdapter(),
 * });
 * ```
 */
export function createLZCompressionAdapter(): CompressionAdapter {
  return {
    algorithm: 'lz',
    compress: lzCompress,
    decompress: lzDecompress,
  };
}

/**
 * Creates a compression adapter using external lz-string library.
 *
 * Better compression ratio than built-in, but requires external dependency.
 *
 * Install: `pnpm add lz-string`
 *
 * @example
 * ```typescript
 * import LZString from 'lz-string';
 *
 * const compression = createLZStringAdapter(LZString);
 * ```
 */
export function createLZStringAdapter(lzString: {
  compressToUTF16: (input: string) => string;
  decompressFromUTF16: (input: string) => string | null;
}): CompressionAdapter {
  return {
    algorithm: 'lz-string',
    compress: (data) => lzString.compressToUTF16(data),
    decompress: (data) => lzString.decompressFromUTF16(data) ?? '',
  };
}

/**
 * Creates a compression adapter using any compatible library.
 *
 * @example
 * ```typescript
 * import pako from 'pako';
 *
 * const compression = createCompressionAdapter({
 *   algorithm: 'gzip',
 *   compress: (data) => btoa(String.fromCharCode(...pako.gzip(data))),
 *   decompress: (data) => pako.ungzip(
 *     Uint8Array.from(atob(data), c => c.charCodeAt(0)),
 *     { to: 'string' }
 *   ),
 * });
 * ```
 */
export function createCompressionAdapter(options: CompressionAdapter): CompressionAdapter {
  return options;
}

/**
 * Identity compression adapter (no compression).
 * Useful for testing or when compression is not needed.
 */
export function createNoCompressionAdapter(): CompressionAdapter {
  return {
    algorithm: 'none',
    compress: (data) => data,
    decompress: (data) => data,
  };
}

/**
 * Base64 adapter for debugging (increases size but makes data readable).
 * Handles Unicode properly.
 */
export function createBase64Adapter(): CompressionAdapter {
  return {
    algorithm: 'base64',
    compress: (data) => {
      if (!data) return '';
      const bytes = new TextEncoder().encode(data);
      let binary = '';
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return btoa(binary);
    },
    decompress: (data) => {
      if (!data) return '';
      const binary = atob(data);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return new TextDecoder().decode(bytes);
    },
  };
}

/**
 * Estimates compression ratio for given data using a specified adapter.
 * Returns a value between 0 and 1 (lower is better compression).
 */
export function estimateCompressionRatio(data: string, adapter: CompressionAdapter): number {
  if (!data) return 1;
  const compressed = adapter.compress(data);
  return compressed.length / data.length;
}

/**
 * Benchmark compression performance.
 *
 * @returns Object with compression ratio, compress time, decompress time
 */
export function benchmarkCompression(
  data: string,
  adapter: CompressionAdapter,
  iterations = 100,
): {
  ratio: number;
  compressTimeMs: number;
  decompressTimeMs: number;
  originalSize: number;
  compressedSize: number;
} {
  const originalSize = data.length;

  // Warm up
  const compressed = adapter.compress(data);
  adapter.decompress(compressed);

  // Benchmark compress
  const compressStart = performance.now();
  for (let i = 0; i < iterations; i++) {
    adapter.compress(data);
  }
  const compressTimeMs = (performance.now() - compressStart) / iterations;

  // Benchmark decompress
  const decompressStart = performance.now();
  for (let i = 0; i < iterations; i++) {
    adapter.decompress(compressed);
  }
  const decompressTimeMs = (performance.now() - decompressStart) / iterations;

  return {
    ratio: compressed.length / originalSize,
    compressTimeMs,
    decompressTimeMs,
    originalSize,
    compressedSize: compressed.length,
  };
}
