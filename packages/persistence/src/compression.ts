import type { CompressionAdapter } from './types';

/**
 * Built-in LZ-based compression for localStorage/IndexedDB.
 *
 * Provides a simplified LZW (Lempel-Ziv-Welch) algorithm optimized for JSON strings.
 * No external dependencies required. Typically achieves 40-70% compression on JSON data.
 *
 * @packageDocumentation
 */

// =============================================================================
// LZ Compression Implementation
// =============================================================================

/**
 * Compress a string using a built-in LZW-based algorithm.
 *
 * The output is a UTF-16 safe string suitable for direct storage in
 * localStorage or any string-based backend. The dictionary size is capped
 * at 0xFFFE entries to stay within the BMP (Basic Multilingual Plane).
 *
 * @param input - The raw string to compress. Returns an empty string if input is falsy.
 * @returns The compressed string representation.
 *
 * @example
 * ```typescript
 * const compressed = lzCompress(JSON.stringify(myState));
 * const restored = JSON.parse(lzDecompress(compressed));
 * ```
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
 * Decompress a string that was previously compressed with {@link lzCompress}.
 *
 * @param compressed - The compressed string to decompress. Returns an empty string if input is falsy.
 * @returns The original uncompressed string.
 * @throws {Error} If the compressed data is invalid or corrupt.
 *
 * @example
 * ```typescript
 * const original = lzDecompress(compressed);
 * ```
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
 * Creates a {@link CompressionAdapter} using the built-in LZW compression.
 *
 * This is a zero-dependency adapter that typically achieves 40-70% compression
 * on JSON data. Suitable for most use cases where external libraries are undesirable.
 *
 * @returns A compression adapter with algorithm name `'lz'`.
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
 * Creates a {@link CompressionAdapter} backed by the external `lz-string` library.
 *
 * Offers better compression ratios than the built-in adapter but requires
 * `lz-string` as a peer dependency. Uses UTF-16 encoding for localStorage safety.
 *
 * Install: `pnpm add lz-string`
 *
 * @param lzString - The `lz-string` module or an object with compatible
 *   `compressToUTF16` and `decompressFromUTF16` methods.
 * @returns A compression adapter with algorithm name `'lz-string'`.
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
 * Creates a {@link CompressionAdapter} from a user-supplied implementation.
 *
 * This is a convenience factory for wrapping any compression library that
 * operates on strings. The returned adapter is the same object passed in --
 * no wrapping or copying is performed.
 *
 * @param options - An object implementing the {@link CompressionAdapter} interface.
 * @returns The same adapter object, typed as {@link CompressionAdapter}.
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
 * Creates a no-op {@link CompressionAdapter} that passes data through unchanged.
 *
 * Useful for testing, debugging, or when compression overhead is not worth the
 * storage savings. The algorithm name is `'none'`.
 *
 * @returns A compression adapter that performs no compression or decompression.
 */
export function createNoCompressionAdapter(): CompressionAdapter {
  return {
    algorithm: 'none',
    compress: (data) => data,
    decompress: (data) => data,
  };
}

/**
 * Creates a {@link CompressionAdapter} that encodes data as Base64.
 *
 * This **increases** data size (approximately 33% larger) but produces
 * human-readable output that is useful for debugging and inspection.
 * Handles Unicode strings correctly via `TextEncoder`/`TextDecoder`.
 *
 * @returns A compression adapter with algorithm name `'base64'`.
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
 * Estimates the compression ratio of a given string using the specified adapter.
 *
 * @param data - The input string to compress for measurement. Returns `1` if empty.
 * @param adapter - The compression adapter to evaluate.
 * @returns A ratio where lower values indicate better compression (values above 1
 *   mean the "compressed" output is larger than the original).
 *   For example, `0.4` means the compressed output is 40% of the original size.
 *
 * @example
 * ```typescript
 * const ratio = estimateCompressionRatio(jsonString, createLZCompressionAdapter());
 * console.log(`Compression ratio: ${(ratio * 100).toFixed(1)}%`);
 * ```
 */
export function estimateCompressionRatio(data: string, adapter: CompressionAdapter): number {
  if (!data) return 1;
  const compressed = adapter.compress(data);
  return compressed.length / data.length;
}

/**
 * Benchmarks a compression adapter's performance by running multiple iterations.
 *
 * Performs a warm-up pass before measuring, then runs `iterations` rounds each
 * of compress and decompress to compute average timings.
 *
 * @param data - The input string to use for benchmarking.
 * @param adapter - The compression adapter to benchmark.
 * @param iterations - Number of iterations for each operation. Higher values
 *   produce more stable results but take longer.
 * @returns An object containing:
 *   - `ratio` -- compressed size / original size (lower is better)
 *   - `compressTimeMs` -- average compress time per iteration in milliseconds
 *   - `decompressTimeMs` -- average decompress time per iteration in milliseconds
 *   - `originalSize` -- length of the input string in characters
 *   - `compressedSize` -- length of the compressed string in characters
 *
 * @example
 * ```typescript
 * const result = benchmarkCompression(largeJson, createLZCompressionAdapter(), 200);
 * console.log(`Ratio: ${result.ratio}, Compress: ${result.compressTimeMs}ms`);
 * ```
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
