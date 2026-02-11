/**
 * Logger factory utilities for state-sync.
 *
 * Provides lightweight, ready-to-use {@link Logger} implementations backed
 * by the browser/Node.js console. These are intended as convenient defaults;
 * production applications may supply their own {@link Logger} implementation
 * (e.g., backed by a structured logging service).
 *
 * @module
 */

import type { Logger } from './types';

/**
 * Configuration options for the console-based logger created by
 * {@link createConsoleLogger}.
 */
export interface ConsoleLoggerOptions {
  /**
   * A string prefix prepended to every log message.
   *
   * Useful for distinguishing state-sync logs from other console output.
   *
   * @defaultValue `"[state-sync]"`
   */
  prefix?: string;

  /**
   * Whether `debug()`-level messages are emitted.
   *
   * When `false`, calls to `debug()` are silently dropped (no-op).
   * Set to `true` during development or troubleshooting to see verbose sync output.
   *
   * @defaultValue `false`
   */
  debug?: boolean;
}

/**
 * Creates a {@link Logger} implementation backed by `console.debug`, `console.warn`,
 * and `console.error`.
 *
 * This is intentionally minimal DX sugar so users can get structured logs without
 * wiring a full logging framework. Each log call prepends the configured prefix
 * and passes the optional `extra` payload as a second argument to the console method.
 *
 * @param options - Optional configuration for prefix and debug verbosity.
 *                  Defaults to prefix `"[state-sync]"` and debug disabled.
 * @returns A {@link Logger} instance that delegates to the global `console` object.
 *
 * @example
 * ```ts
 * import { createConsoleLogger } from '@statesync/core';
 *
 * // Basic usage with defaults
 * const logger = createConsoleLogger();
 *
 * // Custom prefix and debug enabled
 * const verboseLogger = createConsoleLogger({
 *   prefix: '[my-app/sync]',
 *   debug: true,
 * });
 *
 * verboseLogger.debug('snapshot fetched', { revision: '42' });
 * // Console output: [my-app/sync] snapshot fetched { revision: '42' }
 * ```
 */
export function createConsoleLogger(options: ConsoleLoggerOptions = {}): Logger {
  const prefix = options.prefix ?? '[state-sync]';
  const debugEnabled = options.debug ?? false;

  return {
    debug(msg, extra) {
      if (!debugEnabled) return;
      // eslint-disable-next-line no-console
      console.debug(prefix, msg, extra);
    },
    warn(msg, extra) {
      // eslint-disable-next-line no-console
      console.warn(prefix, msg, extra);
    },
    error(msg, extra) {
      // eslint-disable-next-line no-console
      console.error(prefix, msg, extra);
    },
  };
}

/**
 * A no-op {@link Logger} instance where all methods (`debug`, `warn`, `error`)
 * are silent stubs.
 *
 * Use this when you want to explicitly disable logging rather than passing
 * `undefined`. This avoids null-checks inside the engine and makes the intent clear.
 *
 * @example
 * ```ts
 * import { noopLogger, createRevisionSync } from '@statesync/core';
 *
 * const handle = createRevisionSync({
 *   // ...
 *   logger: noopLogger, // Explicitly silence all logs
 * });
 * ```
 */
export const noopLogger: Logger = {
  debug() {},
  warn() {},
  error() {},
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null) return false;
  if (Array.isArray(value)) return false;
  return Object.prototype.toString.call(value) === '[object Object]';
}

/**
 * Wraps an existing {@link Logger} to inject static key-value tags into every log call.
 *
 * The tags are merged into the `extra` payload of each `debug`, `warn`, and `error`
 * call. If the original `extra` argument is a plain object, tags and extra are
 * shallow-merged (with `extra` fields taking precedence). If `extra` is a
 * non-object value, it is wrapped as `{ ...tags, extra: value }`.
 *
 * This is intentionally minimal: it does not change log levels, formatting, or
 * the base logger's behavior. It only enriches the structured metadata.
 *
 * @param base - The logger instance to wrap. All calls are delegated to this logger.
 * @param tags - A record of key-value pairs to inject into every log call's `extra` payload.
 *               Common use cases include `windowId`, `sourceId`, or `sessionId`.
 * @returns A new {@link Logger} that delegates to `base` with enriched `extra` payloads.
 *
 * @example
 * ```ts
 * import { createConsoleLogger, tagLogger } from '@statesync/core';
 *
 * const baseLogger = createConsoleLogger({ debug: true });
 * const logger = tagLogger(baseLogger, {
 *   windowId: 'win-1',
 *   sourceId: 'tab-abc',
 * });
 *
 * logger.debug('snapshot applied', { revision: '42' });
 * // Console output includes: { windowId: 'win-1', sourceId: 'tab-abc', revision: '42' }
 * ```
 */
export function tagLogger(base: Logger, tags: Record<string, unknown>): Logger {
  return {
    debug(msg, extra) {
      base.debug(msg, mergeExtra(tags, extra));
    },
    warn(msg, extra) {
      base.warn(msg, mergeExtra(tags, extra));
    },
    error(msg, extra) {
      base.error(msg, mergeExtra(tags, extra));
    },
  };
}

function mergeExtra(tags: Record<string, unknown>, extra: unknown): unknown {
  if (extra === undefined) return tags;
  if (isPlainObject(extra)) return { ...tags, ...extra };
  return { ...tags, extra };
}
