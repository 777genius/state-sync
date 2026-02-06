---
title: Error handling & retry
---

# Error handling & retry

Production-ready error handling with automatic retry and graceful degradation.

::: tip
Proper error handling is crucial for multi-window apps where network/IPC can fail.
:::

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

// Wrap provider with retry logic
const providerWithRetry = withRetry(provider, {
  maxAttempts: 3,
  baseDelayMs: 100,
  maxDelayMs: 5000,
  // Only retry network errors, not data errors
  shouldRetry: (error) => {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return true; // Network error
    }
    if (error.name === 'TimeoutError') {
      return true;
    }
    return false; // Don't retry data errors
  },
});

// Add retry reporting
const providerWithReporting = withRetryReporting(providerWithRetry, {
  onRetry(attempt, error, delayMs) {
    console.warn(`Retry attempt ${attempt} after ${delayMs}ms:`, error.message);
  },
  onExhausted(attempts, lastError) {
    console.error(`All ${attempts} retry attempts failed:`, lastError);
    showConnectionError();
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
import { createRevisionSync, createConsoleLogger } from '@statesync/core';
import { loadPersistedSnapshot, createLocalStorageBackend } from '@statesync/persistence';

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
    state.error = e.message;

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
  let attempts = 0;
  const maxAttempts = 10;
  const baseDelay = 5000;

  const tryReconnect = async () => {
    if (attempts >= maxAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    attempts++;
    const delay = Math.min(baseDelay * Math.pow(1.5, attempts), 60000);

    console.log(`Reconnection attempt ${attempts} in ${delay}ms`);

    setTimeout(async () => {
      try {
        await sync.refresh();
        state.syncStatus = 'synced';
        state.error = null;
        attempts = 0;
        console.log('Reconnected successfully');
      } catch (e) {
        tryReconnect();
      }
    }, delay);
  };

  tryReconnect();
}
```

## UI indicators

```vue
<!-- SyncStatus.vue -->
<script setup lang="ts">
import { computed } from 'vue';
import { useSyncStore } from '../stores/sync';

const store = useSyncStore();

const statusText = computed(() => {
  switch (store.syncStatus) {
    case 'synced':
      return 'All changes saved';
    case 'stale':
      return `Last synced ${formatTime(store.lastSyncAt)}`;
    case 'offline':
      return 'Offline - changes will sync when connected';
    case 'error':
      return store.error || 'Sync error';
  }
});

const statusClass = computed(() => ({
  synced: store.syncStatus === 'synced',
  stale: store.syncStatus === 'stale',
  offline: store.syncStatus === 'offline',
  error: store.syncStatus === 'error',
}));

function formatTime(timestamp: number | null) {
  if (!timestamp) return 'never';
  const diff = Date.now() - timestamp;
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} min ago`;
  return new Date(timestamp).toLocaleTimeString();
}
</script>

<template>
  <div class="sync-status" :class="statusClass">
    <span class="icon">
      <span v-if="syncStatus === 'synced'">✓</span>
      <span v-else-if="syncStatus === 'stale'">⏱</span>
      <span v-else-if="syncStatus === 'offline'">⚡</span>
      <span v-else>⚠</span>
    </span>
    <span class="text">{{ statusText }}</span>
  </div>
</template>

<style scoped>
.sync-status {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 12px;
}

.synced {
  background: #e8f5e9;
  color: #2e7d32;
}

.stale {
  background: #fff3e0;
  color: #ef6c00;
}

.offline {
  background: #e3f2fd;
  color: #1565c0;
}

.error {
  background: #ffebee;
  color: #c62828;
}
</style>
```

## Error boundaries (React)

```tsx
// ErrorBoundary.tsx
import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class SyncErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Sync error boundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

// Usage
function App() {
  return (
    <SyncErrorBoundary
      fallback={
        <div className="error-state">
          <h2>Unable to sync</h2>
          <p>Please check your connection and try again.</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      }
    >
      <CartProvider>
        <ShopPage />
      </CartProvider>
    </SyncErrorBoundary>
  );
}
```

## Monitoring & alerting

```typescript
import { createRevisionSync } from '@statesync/core';

// Error tracking
const errorCounts: Record<string, number> = {};
const ERROR_THRESHOLD = 5;
const ERROR_WINDOW_MS = 60000;
const errorTimestamps: number[] = [];

function trackError(ctx: SyncErrorContext) {
  const key = `${ctx.topic}:${ctx.phase}`;
  errorCounts[key] = (errorCounts[key] || 0) + 1;
  errorTimestamps.push(Date.now());

  // Clean old timestamps
  const cutoff = Date.now() - ERROR_WINDOW_MS;
  while (errorTimestamps.length && errorTimestamps[0] < cutoff) {
    errorTimestamps.shift();
  }

  // Alert if too many errors
  if (errorTimestamps.length >= ERROR_THRESHOLD) {
    alertOps({
      message: `High sync error rate: ${errorTimestamps.length} errors in last minute`,
      context: { errorCounts, topic: ctx.topic },
    });
  }

  // Send to monitoring
  sendToDatadog({
    metric: 'state_sync.error',
    tags: [`topic:${ctx.topic}`, `phase:${ctx.phase}`],
    value: 1,
  });
}

const sync = createRevisionSync({
  topic: 'settings',
  subscriber,
  provider,
  applier,
  onError: trackError,
});
```

## Key points

1. **Always handle errors**: Don't let sync failures crash your app

2. **Categorize by phase**: Different phases need different handling

3. **Retry intelligently**: Only retry transient errors, not data errors

4. **Degrade gracefully**: Show cached/stale data rather than nothing

5. **Inform users**: Show sync status so users know what's happening

6. **Monitor in production**: Track error rates to catch issues early
