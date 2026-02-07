---
title: Error handling & retry
---

# Error handling & retry

Error handling with automatic retry and graceful degradation.

## Error phases

state-sync categorizes errors by phase:

| Phase | When | Should retry? |
|-------|------|---------------|
| `subscribe` | Failed to listen for events | Yes (reconnect) |
| `getSnapshot` | Provider failed to fetch data | Yes (network issue) |
| `apply` | Applier threw while updating state | Maybe (data issue) |
| `protocol` | Invalid revision/topic format | No (fix code) |

## Basic error handling

```typescript
import { createRevisionSync } from '@statesync/core';

const sync = createRevisionSync({
  topic: 'settings',
  subscriber,
  provider,
  applier,
  onError(ctx) {
    // ctx contains: phase, error, topic, localRevision, etc.
    console.error(`Sync error [${ctx.phase}]:`, ctx.error);

    switch (ctx.phase) {
      case 'subscribe':
        // Transport issue - maybe show "offline" indicator
        showOfflineIndicator();
        break;

      case 'getSnapshot':
        // Backend unavailable - show stale data warning
        showStaleDataWarning();
        break;

      case 'apply':
        // Data format issue - log for debugging
        logToSentry(ctx.error, { phase: ctx.phase, topic: ctx.topic });
        break;

      case 'protocol':
        // Bug in code - should not happen in production
        console.error('Protocol error - check backend revision format');
        break;
    }
  },
});
```

## Automatic retry with exponential backoff

```typescript
import { createRevisionSync, withRetry, withRetryReporting } from '@statesync/core';
import type { SyncErrorContext } from '@statesync/core';

// Wrap provider with retry logic
const providerWithRetry = withRetry(
  provider,
  {
    maxAttempts: 3,
    initialDelayMs: 100,
    maxDelayMs: 5000,
  },
  ({ attempt, error, nextDelayMs }) => {
    console.warn(`Retry attempt ${attempt} in ${nextDelayMs}ms:`, error);
  },
);

// Or use withRetryReporting for structured logging via onError
const providerWithReporting = withRetryReporting(provider, {
  topic: 'settings',
  policy: {
    maxAttempts: 5,
    initialDelayMs: 200,
    maxDelayMs: 10_000,
  },
  onError(ctx: SyncErrorContext) {
    console.warn(`Retry [${ctx.phase}] attempt ${ctx.attempt}`, ctx.error);
  },
});

const sync = createRevisionSync({
  topic: 'settings',
  subscriber,
  provider: providerWithReporting,
  applier,
});
```

## Graceful degradation

```typescript
import { createRevisionSync } from '@statesync/core';
import type { SyncErrorContext } from '@statesync/core';
import { createLocalStorageBackend } from '@statesync/persistence';

interface AppState {
  settings: Settings;
  syncStatus: 'synced' | 'stale' | 'offline' | 'error';
  lastSyncAt: number | null;
  error: string | null;
}

const state: AppState = {
  settings: defaultSettings,
  syncStatus: 'offline',
  lastSyncAt: null,
  error: null,
};

const storage = createLocalStorageBackend({ key: 'settings' });

async function initWithGracefulDegradation() {
  // Step 1: Load cached data immediately (instant UI)
  try {
    const cached = await storage.load();
    if (cached) {
      state.settings = cached.data;
      state.syncStatus = 'stale';
      state.lastSyncAt = Date.now(); // Approximate
      console.log('Loaded cached settings');
    }
  } catch (e) {
    console.warn('Failed to load cache:', e);
  }

  // Step 2: Try to start sync
  const sync = createRevisionSync({
    topic: 'settings',
    subscriber,
    provider,
    applier: {
      apply(snapshot) {
        state.settings = snapshot.data;
        state.syncStatus = 'synced';
        state.lastSyncAt = Date.now();
        state.error = null;
      },
    },
    onError(ctx) {
      handleSyncError(ctx);
    },
  });

  try {
    await sync.start();
    state.syncStatus = 'synced';
  } catch (e) {
    // Sync failed to start, but we have cached data
    console.warn('Sync failed to start, using cached data');
    state.syncStatus = state.lastSyncAt ? 'stale' : 'offline';
    state.error = (e as Error).message;

    // Retry connection periodically
    scheduleReconnect(sync);
  }

  return sync;
}

function handleSyncError(ctx: SyncErrorContext) {
  switch (ctx.phase) {
    case 'subscribe':
      state.syncStatus = 'offline';
      state.error = 'Connection lost';
      break;

    case 'getSnapshot':
      state.syncStatus = 'stale';
      state.error = 'Failed to fetch latest data';
      break;

    case 'apply':
      state.syncStatus = 'error';
      state.error = 'Failed to apply update';
      break;
  }
}

function scheduleReconnect(sync: ReturnType<typeof createRevisionSync>) {
  let attempt = 0;

  const retry = () => {
    if (++attempt > 10) return;
    const delay = Math.min(5000 * 1.5 ** attempt, 60_000);

    setTimeout(() => {
      sync.refresh()
        .then(() => { state.syncStatus = 'synced'; state.error = null; })
        .catch(retry);
    }, delay);
  };

  retry();
}
```

## Key points

1. **Always handle errors**: Don't let sync failures crash your app

2. **Categorize by phase**: Different phases need different handling

3. **Retry intelligently**: Use `withRetry` or `withRetryReporting` for transient errors

4. **Degrade gracefully**: Show cached/stale data rather than nothing

5. **Inform users**: Show sync status so users know what's happening

## See also

- [Lifecycle contract](/lifecycle) — error phases reference
- [Troubleshooting](/troubleshooting) — debug common issues
- [Structured logging example](/examples/structured-logging) — JSON logging and metrics
