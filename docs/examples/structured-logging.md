---
title: Structured logging
---

# Structured logging

Production-ready logging and error metrics pattern for observability.

**What it demonstrates:**
- Custom `Logger` implementation for JSON output
- Error tracking by phase and topic
- Integration with `onError` callback

::: tip
[View source on GitHub](https://github.com/777genius/state-sync/blob/main/docs/examples/structured-logging.ts)
:::

## Logger extra keys

The engine passes these keys to the logger's `extra` object:

| Call               | Extra keys                                   |
|--------------------|----------------------------------------------|
| All calls          | `topic`                                      |
| error (emitError)  | `topic`, `phase`, `error`                    |
| applied snapshot   | `topic`, `revision`                          |
| snapshot skipped   | `topic`, `snapshotRevision`, `localRevision` |
| invalidation skip  | `topic`, `eventRevision` / `event`           |

## Full example

```typescript
import type { Logger, SyncErrorContext, SyncPhase } from '@statesync/core';
import { createRevisionSync } from '@statesync/core';

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

const handle = createRevisionSync({
  topic,
  subscriber: { subscribe: async () => () => {} },
  provider: { getSnapshot: async () => ({ revision: '1' as never, data: {} }) },
  applier: { apply() {} },
  logger: createStructuredLogger(topic),
  onError: trackError,
});

// Start sync
await handle.start();

// After some time, inspect metrics:
console.log(getErrorMetrics());
// { "settings:getSnapshot": 2, "settings:apply": 1 }

console.log('getSnapshot errors:', getErrorCountByPhase('getSnapshot'));
console.log('apply errors:', getErrorCountByPhase('apply'));
```

## Example output

```json
{"level":"debug","topic":"settings","msg":"subscribed"}
{"level":"debug","topic":"settings","msg":"snapshot applied","revision":"1"}
{"level":"error","event":"sync_error","topic":"settings","phase":"getSnapshot","error":"Network error","totalForKey":1}
```

## Quick start with built-in logger

For simpler cases, use the built-in `createConsoleLogger`:

```typescript
import { createConsoleLogger, createRevisionSync } from '@statesync/core';

const handle = createRevisionSync({
  topic: 'settings',
  subscriber,
  provider,
  applier,
  logger: createConsoleLogger({ level: 'debug' }),
});
```

## Adding tags with tagLogger

Add context (window ID, user ID) to all log entries:

```typescript
import { createConsoleLogger, tagLogger } from '@statesync/core';

const baseLogger = createConsoleLogger({ level: 'debug' });
const logger = tagLogger(baseLogger, { windowId: 'main', userId: '123' });

// All logs will include: { windowId: 'main', userId: '123', ... }
```
