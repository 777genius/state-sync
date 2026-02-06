---
title: Multi-window patterns
---

# Multi-window patterns

Best practices for syncing state across multiple browser tabs or Tauri windows.

## Architecture overview

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Window A   │     │  Window B   │     │  Window C   │
│  (main)     │     │  (settings) │     │  (popup)    │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       │    invalidation   │                   │
       ├───────────────────┼───────────────────┤
       │                   │                   │
       ▼                   ▼                   ▼
┌─────────────────────────────────────────────────────┐
│              Source of Truth (Backend)              │
│         Rust process / Main thread / API            │
└─────────────────────────────────────────────────────┘
```

## Source of truth

**Rule:** One authoritative source per topic.

```typescript
// Backend (Rust/Node) holds the truth
// All windows fetch from it, never from each other

// Good: All windows sync from backend
const provider = {
  async getSnapshot() {
    return invoke('get_settings'); // Rust command
  }
};

// Bad: Windows syncing from each other
// This creates circular dependencies and race conditions
```

## Handling self-echo

When Window A updates state, it receives its own invalidation event. This is normal but can cause unnecessary refreshes.

### Option 1: Ignore via sourceId

```typescript
const windowId = crypto.randomUUID();

const sync = createRevisionSync({
  topic: 'settings',
  subscriber,
  provider,
  applier,
  shouldRefresh(event) {
    // Skip if this window originated the change
    return event.sourceId !== windowId;
  },
});
```

### Option 2: Let revision gate handle it

The engine automatically skips applying snapshots with the same or lower revision:

```typescript
// Window A: applies revision 5
// Window A: receives self-echo with revision 5
// Engine: skips (5 <= 5)
// No wasted refresh!
```

## Topic naming

Keep topics **domain-oriented**, not UI-oriented:

```typescript
// Good: Domain concepts
'auth-state'
'app-settings'
'user-preferences'

// Bad: UI concepts
'settings-window'
'main-window-state'
'popup-data'
```

## Example: Tauri multi-window

### Rust backend (source of truth)

```rust
use std::sync::Mutex;
use tauri::{AppHandle, Emitter, State};

#[derive(Clone, serde::Serialize, serde::Deserialize)]
struct Settings {
    theme: String,
    language: String,
}

#[derive(Clone, serde::Serialize)]
struct SnapshotEnvelope {
    revision: String,
    data: Settings,
}

struct AppState {
    settings: Settings,
    revision: u64,
}

#[tauri::command]
fn get_settings(state: State<'_, Mutex<AppState>>) -> SnapshotEnvelope {
    let state = state.lock().unwrap();
    SnapshotEnvelope {
        revision: state.revision.to_string(),
        data: state.settings.clone(),
    }
}

#[tauri::command]
fn update_settings(
    app: AppHandle,
    state: State<'_, Mutex<AppState>>,
    settings: Settings,
) -> SnapshotEnvelope {
    let mut state = state.lock().unwrap();
    state.settings = settings;
    state.revision += 1;

    let envelope = SnapshotEnvelope {
        revision: state.revision.to_string(),
        data: state.settings.clone(),
    };

    // Notify all windows
    app.emit("settings:invalidated", &envelope).unwrap();

    envelope
}
```

### TypeScript frontend (each window)

```typescript
import { createTauriRevisionSync } from '@statesync/tauri';
import { createPiniaSnapshotApplier } from '@statesync/pinia';
import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';
import { useSettingsStore } from './stores/settings';

export function setupSettingsSync() {
  const store = useSettingsStore();

  const sync = createTauriRevisionSync({
    topic: 'settings',
    listen,
    invoke,
    eventName: 'settings:invalidated',
    commandName: 'get_settings',
    applier: createPiniaSnapshotApplier(store, {
      mode: 'patch',
    }),
  });

  sync.start();

  // Return cleanup function for component unmount
  return () => sync.stop();
}
```

## Example: Browser tabs (BroadcastChannel)

```typescript
import { createRevisionSync } from '@statesync/core';
import { createZustandSnapshotApplier } from '@statesync/zustand';
import { useSettingsStore } from './stores/settings';

// Shared state in localStorage (or IndexedDB)
let currentRevision = 0;
let currentSettings = { theme: 'light', language: 'en' };

function createBrowserTabSync() {
  const channel = new BroadcastChannel('settings-sync');

  const subscriber = {
    async subscribe(handler) {
      channel.onmessage = (e) => handler(e.data);
      return () => channel.close();
    }
  };

  const provider = {
    async getSnapshot() {
      // In real app: fetch from localStorage or API
      return {
        revision: currentRevision.toString(),
        data: currentSettings,
      };
    }
  };

  const sync = createRevisionSync({
    topic: 'settings',
    subscriber,
    provider,
    applier: createZustandSnapshotApplier(useSettingsStore),
  });

  return sync;
}

// When local state changes, notify other tabs
function broadcastChange(settings) {
  currentRevision++;
  currentSettings = settings;

  const channel = new BroadcastChannel('settings-sync');
  channel.postMessage({
    topic: 'settings',
    revision: currentRevision.toString(),
  });
  channel.close();
}
```

## Persistence + Cross-tab sync

Use `@statesync/persistence` for automatic cross-tab synchronization:

```typescript
import { createRevisionSync } from '@statesync/core';
import {
  createPersistenceApplier,
  createLocalStorageBackend,
} from '@statesync/persistence';

const storage = createLocalStorageBackend({ key: 'settings' });

const applier = createPersistenceApplier({
  storage,
  applier: innerApplier,
  crossTabSync: {
    channelName: 'settings-sync',
    receiveUpdates: true,
    broadcastSaves: true,
  },
});

// Now tabs automatically sync via BroadcastChannel
```

## Debugging multi-window issues

Enable debug logging to trace sync flow:

```typescript
import { createConsoleLogger, tagLogger } from '@statesync/core';

const windowId = new URLSearchParams(location.search).get('window') || 'main';

const logger = tagLogger(
  createConsoleLogger({ level: 'debug' }),
  { windowId }
);

const sync = createRevisionSync({
  topic: 'settings',
  subscriber,
  provider,
  applier,
  logger, // Logs include windowId for each entry
});
```

Output:
```
[debug] [windowId=main] subscribed
[debug] [windowId=main] snapshot applied { revision: "5" }
[debug] [windowId=settings] subscribed
[debug] [windowId=settings] snapshot applied { revision: "5" }
```
