---
title: Core (@statesync/core)
---

## Installation

```bash
npm install @statesync/core
```

## What's inside

The core package provides everything needed to wire up the invalidation-pull protocol:

- **Engine** — `createRevisionSync()` creates the sync handle
- **Revision** — `isCanonicalRevision`, `compareRevisions`, `ZERO_REVISION`
- **Retry** — `withRetry`, `withRetryReporting` wrap a provider with exponential backoff
- **Throttle** — `createThrottledHandler` controls refresh rate on rapid invalidations
- **Logger** — `createConsoleLogger`, `tagLogger`, `noopLogger`
- **Types** — `Topic`, `Revision`, `InvalidationEvent`, `SnapshotEnvelope`, `InvalidationSubscriber`, `SnapshotProvider`, `SnapshotApplier`, `Logger`, `SyncPhase`, `SyncErrorContext`

## createRevisionSync

```ts
import { createRevisionSync } from '@statesync/core';

const handle = createRevisionSync({
  topic: 'app-config',
  subscriber: mySubscriber,
  provider: myProvider,
  applier: myApplier,
});

await handle.start();
```

### Options

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `topic` | `string` | Yes | Non-empty topic identifier |
| `subscriber` | `InvalidationSubscriber` | Yes | Subscribes to invalidation events |
| `provider` | `SnapshotProvider<T>` | Yes | Fetches snapshots |
| `applier` | `SnapshotApplier<T>` | Yes | Applies snapshots to local state |
| `shouldRefresh` | `(event: InvalidationEvent) => boolean` | No | Filter invalidation events before refresh |
| `logger` | `Logger` | No | Logger instance for debug/warn/error |
| `onError` | `(ctx: SyncErrorContext) => void` | No | Error callback with phase context |
| `throttling` | `InvalidationThrottlingOptions` | No | Control refresh rate on rapid events |

### Handle methods

| Method | Returns | Description |
|--------|---------|-------------|
| `start()` | `Promise<void>` | Subscribe + initial refresh. Throws if subscribe or first refresh fails. |
| `stop()` | `void` | Unsubscribe + stop all pending refreshes. Idempotent. |
| `refresh()` | `Promise<void>` | Manually trigger a snapshot pull. Coalesces if already in-flight. |
| `getLocalRevision()` | `Revision` | Returns the last applied revision (starts at `"0"`). |

## Throttling

Control how fast invalidation events trigger refreshes:

```ts
const handle = createRevisionSync({
  topic: 'app-config',
  subscriber,
  provider,
  applier,
  throttling: {
    debounceMs: 100,   // Wait 100ms of silence
    throttleMs: 500,   // Max 1 refresh per 500ms
    leading: true,     // Fire on first event (default: true)
    trailing: true,    // Fire after quiet period (default: true)
  },
});
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `debounceMs` | `number` | — | Wait for N ms of silence before refresh |
| `throttleMs` | `number` | — | At most 1 refresh per N ms |
| `leading` | `boolean` | `true` | Fire immediately on first event |
| `trailing` | `boolean` | `true` | Fire after the quiet period ends |

## Retry

Wrap a `SnapshotProvider` with exponential backoff:

```ts
import { withRetry, withRetryReporting } from '@statesync/core';

// Simple retry
const retryProvider = withRetry(myProvider, {
  maxAttempts: 3,
  initialDelayMs: 500,
  backoffMultiplier: 2,
  maxDelayMs: 10_000,
});

// Retry with logging/reporting
const retryProvider = withRetryReporting(myProvider, {
  topic: 'app-config',
  policy: { maxAttempts: 5 },
  logger,
  onError,
});
```

### RetryPolicy

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `maxAttempts` | `number` | `3` | Max attempts (including first try) |
| `initialDelayMs` | `number` | `500` | Initial delay before first retry |
| `backoffMultiplier` | `number` | `2` | Exponential backoff factor |
| `maxDelayMs` | `number` | `10000` | Maximum delay cap |

## Logging

```ts
import { createConsoleLogger, tagLogger, noopLogger } from '@statesync/core';

// Console logger with debug output
const base = createConsoleLogger({ prefix: '[my-app]', debug: true });

// Add static tags to all log calls
const logger = tagLogger(base, { windowId: 'main', userId: '123' });

// Disable all logging
const silent = noopLogger;
```

### createConsoleLogger options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `prefix` | `string` | `"[state-sync]"` | Prefix for log lines |
| `debug` | `boolean` | `false` | Enable debug-level output |

## Protocol types

```ts
import type {
  Topic,
  Revision,
  InvalidationEvent,
  SnapshotEnvelope,
  InvalidationSubscriber,
  SnapshotProvider,
  SnapshotApplier,
  Logger,
  SyncPhase,
  SyncErrorContext,
} from '@statesync/core';
```

`Revision` is a branded string (`string & { __brand: 'Revision' }`) — canonical decimal u64 format (e.g. `"0"`, `"42"`, `"18446744073709551615"`).

`SyncPhase` covers: `'start'`, `'subscribe'`, `'invalidation'`, `'refresh'`, `'getSnapshot'`, `'apply'`, `'protocol'`, `'throttle'`.

## Quick wiring

```ts
import { createConsoleLogger, createRevisionSync, tagLogger } from '@statesync/core';

const base = createConsoleLogger({ debug: true });
const logger = tagLogger(base, { windowId: 'main' });

const handle = createRevisionSync({
  topic: 'app-config',
  subscriber: mySubscriber,
  provider: myProvider,
  applier: myApplier,
  logger,
  onError(ctx) {
    console.error(`[${ctx.phase}]`, ctx.error);
  },
  throttling: { debounceMs: 100 },
});

await handle.start();

// Later
handle.stop();
```

## See also

- [Quickstart](/guide/quickstart) — full wiring example with a framework adapter
- [How state-sync works](/guide/protocol) — the invalidation-pull protocol
- [Lifecycle contract](/lifecycle) — method semantics, error phases
- [Troubleshooting](/troubleshooting) — common issues and fixes
