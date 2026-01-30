/**
 * Structured logging + error metrics recipe.
 *
 * Демонстрирует:
 * - Custom Logger для structured output
 * - Error metrics (count by phase/topic)
 * - Integration с onError для observability
 *
 * Ключи, передаваемые engine в extra объект logger:
 *
 * | Вызов              | Ключи extra                                  |
 * |--------------------|----------------------------------------------|
 * | Все вызовы         | `topic`                                      |
 * | error (emitError)  | `topic`, `phase`, `error`                    |
 * | applied snapshot   | `topic`, `revision`                          |
 * | snapshot skipped   | `topic`, `snapshotRevision`, `localRevision` |
 * | invalidation skip  | `topic`, `eventRevision` / `event`           |
 */
import type { Logger, SyncErrorContext, SyncPhase } from 'state-sync';
import { createRevisionSync } from 'state-sync';

// --- Structured Logger ---

function createStructuredLogger(topic: string): Logger {
  return {
    debug(msg, extra) {
      console.log(JSON.stringify({ level: 'debug', topic, msg, ...normalize(extra) }));
    },
    warn(msg, extra) {
      console.warn(JSON.stringify({ level: 'warn', topic, msg, ...normalize(extra) }));
    },
    error(msg, extra) {
      console.error(JSON.stringify({ level: 'error', topic, msg, ...normalize(extra) }));
    },
  };
}

function normalize(extra: unknown): Record<string, unknown> {
  if (extra && typeof extra === 'object' && !Array.isArray(extra)) {
    return extra as Record<string, unknown>;
  }
  return extra !== undefined ? { value: extra } : {};
}

// --- Error Metrics ---

const errorCounts = new Map<string, number>();

function trackError(ctx: SyncErrorContext): void {
  const key = `${ctx.topic ?? 'unknown'}:${ctx.phase}`;
  errorCounts.set(key, (errorCounts.get(key) ?? 0) + 1);

  console.error(
    JSON.stringify({
      level: 'error',
      event: 'sync_error',
      topic: ctx.topic,
      phase: ctx.phase,
      error: ctx.error instanceof Error ? ctx.error.message : String(ctx.error),
      totalForKey: errorCounts.get(key),
    }),
  );
}

function getErrorMetrics(): Record<string, number> {
  return Object.fromEntries(errorCounts);
}

function getErrorCountByPhase(phase: SyncPhase): number {
  let total = 0;
  for (const [key, count] of errorCounts) {
    if (key.endsWith(`:${phase}`)) total += count;
  }
  return total;
}

// --- Usage ---

const topic = 'settings';

const _handle = createRevisionSync({
  topic,
  subscriber: { subscribe: async () => () => {} },
  provider: { getSnapshot: async () => ({ revision: '1' as never, data: {} }) },
  applier: { apply() {} },
  logger: createStructuredLogger(topic),
  onError: trackError,
});

// After some time, inspect metrics:
// console.log(getErrorMetrics());
// console.log('getSnapshot errors:', getErrorCountByPhase('getSnapshot'));
// console.log('apply errors:', getErrorCountByPhase('apply'));

export { createStructuredLogger, trackError, getErrorMetrics, getErrorCountByPhase };
