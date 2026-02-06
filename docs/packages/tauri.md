---
title: Tauri (@statesync/tauri)
---

# @statesync/tauri

Transport adapter for Tauri v2 applications.

## Installation

```bash
npm install @statesync/tauri @statesync/core
```

## Quick start

```typescript
import { createTauriRevisionSync } from '@statesync/tauri';
import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';

const sync = createTauriRevisionSync({
  topic: 'settings',
  listen,
  invoke,
  eventName: 'settings:invalidated',
  commandName: 'get_settings',
  applier: myApplier,
});

await sync.start();
```

## API

### High-level (DX sugar)

- `createTauriRevisionSync(options)` — ready-made wiring of transport + core engine

### Low-level (building blocks)

- `createTauriInvalidationSubscriber(options)` — creates subscriber from Tauri events
- `createTauriSnapshotProvider(options)` — creates provider from Tauri invoke

## Full example

### Rust backend

```rust
// src-tauri/src/lib.rs
use std::sync::Mutex;
use tauri::{AppHandle, Emitter, Manager, State};

#[derive(Clone, serde::Serialize, serde::Deserialize)]
pub struct Settings {
    pub theme: String,
    pub language: String,
    pub notifications_enabled: bool,
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            theme: "light".to_string(),
            language: "en".to_string(),
            notifications_enabled: true,
        }
    }
}

#[derive(Clone, serde::Serialize)]
pub struct SnapshotEnvelope {
    pub revision: String,
    pub data: Settings,
}

#[derive(Clone, serde::Serialize)]
pub struct InvalidationEvent {
    pub topic: String,
    pub revision: String,
}

pub struct AppState {
    pub settings: Settings,
    pub revision: u64,
}

impl Default for AppState {
    fn default() -> Self {
        Self {
            settings: Settings::default(),
            revision: 1,
        }
    }
}

#[tauri::command]
pub fn get_settings(state: State<'_, Mutex<AppState>>) -> SnapshotEnvelope {
    let state = state.lock().unwrap();
    SnapshotEnvelope {
        revision: state.revision.to_string(),
        data: state.settings.clone(),
    }
}

#[tauri::command]
pub fn update_settings(
    app: AppHandle,
    state: State<'_, Mutex<AppState>>,
    settings: Settings,
) -> Result<SnapshotEnvelope, String> {
    let mut state = state.lock().unwrap();
    state.settings = settings;
    state.revision += 1;

    let envelope = SnapshotEnvelope {
        revision: state.revision.to_string(),
        data: state.settings.clone(),
    };

    // Emit invalidation event to all windows
    app.emit("settings:invalidated", InvalidationEvent {
        topic: "settings".to_string(),
        revision: state.revision.to_string(),
    }).map_err(|e| e.to_string())?;

    Ok(envelope)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(Mutex::new(AppState::default()))
        .invoke_handler(tauri::generate_handler![
            get_settings,
            update_settings,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### TypeScript frontend

```typescript
// src/sync/settings.ts
import { createTauriRevisionSync } from '@statesync/tauri';
import { createPiniaSnapshotApplier } from '@statesync/pinia';
import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';
import { useSettingsStore } from '../stores/settings';

export function createSettingsSync() {
  const store = useSettingsStore();

  const sync = createTauriRevisionSync({
    topic: 'settings',
    listen,
    invoke,
    eventName: 'settings:invalidated',
    commandName: 'get_settings',
    applier: createPiniaSnapshotApplier(store, {
      mode: 'patch',
      omitKeys: ['isLoading', 'error'], // UI-only state
    }),
    onError(ctx) {
      console.error(`Sync error [${ctx.phase}]:`, ctx.error);
    },
  });

  return sync;
}

// src/App.vue
import { onMounted, onUnmounted } from 'vue';
import { createSettingsSync } from './sync/settings';

const sync = createSettingsSync();

onMounted(async () => {
  await sync.start();
});

onUnmounted(() => {
  sync.stop();
});
```

## With persistence

Save state to a file via Tauri commands:

```typescript
import { createTauriFileBackend } from '@statesync/tauri';
import { createPersistenceApplier } from '@statesync/persistence';

// Storage backend that uses Tauri commands
const storage = createTauriFileBackend({
  invoke,
  saveCommand: 'save_settings_to_file',
  loadCommand: 'load_settings_from_file',
  clearCommand: 'clear_settings_file',
});

// Wrap applier with persistence
const applier = createPersistenceApplier({
  storage,
  applier: innerApplier,
  throttling: { debounceMs: 500 },
});
```

Rust commands for file storage:

```rust
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

fn get_settings_path(app: &AppHandle) -> PathBuf {
    app.path().app_data_dir().unwrap().join("settings.json")
}

#[tauri::command]
pub fn save_settings_to_file(
    app: AppHandle,
    snapshot: serde_json::Value,
) -> Result<(), String> {
    let path = get_settings_path(&app);
    fs::create_dir_all(path.parent().unwrap()).map_err(|e| e.to_string())?;
    fs::write(&path, serde_json::to_string_pretty(&snapshot).unwrap())
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn load_settings_from_file(app: AppHandle) -> Option<serde_json::Value> {
    let path = get_settings_path(&app);
    fs::read_to_string(&path)
        .ok()
        .and_then(|s| serde_json::from_str(&s).ok())
}

#[tauri::command]
pub fn clear_settings_file(app: AppHandle) -> Result<(), String> {
    let path = get_settings_path(&app);
    if path.exists() {
        fs::remove_file(&path).map_err(|e| e.to_string())?;
    }
    Ok(())
}
```

## Options reference

### createTauriRevisionSync

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `topic` | `string` | Yes | Topic identifier |
| `listen` | `TauriListen` | Yes | Tauri listen function |
| `invoke` | `TauriInvoke` | Yes | Tauri invoke function |
| `eventName` | `string` | Yes | Event name for invalidation |
| `commandName` | `string` | Yes | Command name for getting snapshot |
| `applier` | `SnapshotApplier` | Yes | Applier to update local state |
| `args` | `object` | No | Extra args passed to invoke |
| `throttling` | `object` | No | Throttling options |
| `onError` | `function` | No | Error callback |
| `logger` | `Logger` | No | Logger instance |

## Peer dependencies

`@tauri-apps/api` is declared as an optional peer dependency. This allows tests to run without Tauri installed.
