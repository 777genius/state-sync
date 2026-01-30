import type { Logger } from './types';

export interface ConsoleLoggerOptions {
  /**
   * Prefix added to each log line.
   * Default: "[state-sync]"
   */
  prefix?: string;
  /**
   * If true, debug() logs are emitted. Otherwise debug() is a no-op.
   * Default: false
   */
  debug?: boolean;
}

/**
 * Creates a Logger backed by console.* with an optional prefix.
 *
 * This is intentionally tiny DX sugar so users can get useful logs without
 * wiring a full logging system.
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
 * No-op logger for when you want to explicitly disable logs.
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
 * Adds static tags to every log call (useful for windowId/sourceId, etc).
 *
 * This is intentionally small DX sugar: it does not change log levels or format,
 * it only enriches the `extra` payload.
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
