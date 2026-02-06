---
title: Vue + Pinia + Tauri
---

# Vue + Pinia + Tauri

Complete multi-window Tauri application with Pinia store synchronization.

::: tip
This example shows a settings panel that syncs across multiple Tauri windows.
:::

## Project structure

```
my-tauri-app/
├── src/
│   ├── stores/
│   │   └── settings.ts      # Pinia store
│   ├── sync/
│   │   └── settings-sync.ts # Sync setup
│   ├── components/
│   │   └── SettingsPanel.vue
│   └── App.vue
└── src-tauri/
    └── src/
        └── lib.rs           # Rust backend
```

## Rust backend

```rust
// src-tauri/src/lib.rs
use std::sync::Mutex;
use tauri::{AppHandle, Emitter, Manager, State, WebviewWindow};
use serde::{Deserialize, Serialize};

// ============================================================================
// Types
// ============================================================================

#[derive(Clone, Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct Settings {
    pub theme: String,
    pub language: String,
    pub font_size: u32,
    pub notifications_enabled: bool,
    pub auto_save: bool,
    pub sidebar_collapsed: bool,
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            theme: "system".to_string(),
            language: "en".to_string(),
            font_size: 14,
            notifications_enabled: true,
            auto_save: true,
            sidebar_collapsed: false,
        }
    }
}

#[derive(Clone, Serialize)]
pub struct SnapshotEnvelope {
    pub revision: String,
    pub data: Settings,
}

#[derive(Clone, Serialize)]
pub struct InvalidationEvent {
    pub topic: String,
    pub revision: String,
    #[serde(rename = "sourceId")]
    pub source_id: Option<String>,
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

// ============================================================================
// Commands
// ============================================================================

/// Get current settings snapshot
#[tauri::command]
pub fn get_settings(state: State<'_, Mutex<AppState>>) -> SnapshotEnvelope {
    let state = state.lock().unwrap();
    SnapshotEnvelope {
        revision: state.revision.to_string(),
        data: state.settings.clone(),
    }
}

/// Update settings and notify all windows
#[tauri::command]
pub fn update_settings(
    window: WebviewWindow,
    app: AppHandle,
    state: State<'_, Mutex<AppState>>,
    settings: Settings,
) -> Result<SnapshotEnvelope, String> {
    let mut state = state.lock().unwrap();

    // Update state
    state.settings = settings;
    state.revision += 1;

    let envelope = SnapshotEnvelope {
        revision: state.revision.to_string(),
        data: state.settings.clone(),
    };

    // Notify ALL windows (including sender, for consistency)
    let event = InvalidationEvent {
        topic: "settings".to_string(),
        revision: state.revision.to_string(),
        source_id: Some(window.label().to_string()),
    };

    app.emit("settings:invalidated", &event)
        .map_err(|e| e.to_string())?;

    Ok(envelope)
}

/// Update a single setting field
#[tauri::command]
pub fn update_setting(
    window: WebviewWindow,
    app: AppHandle,
    state: State<'_, Mutex<AppState>>,
    key: String,
    value: serde_json::Value,
) -> Result<SnapshotEnvelope, String> {
    let mut state = state.lock().unwrap();

    // Update specific field
    match key.as_str() {
        "theme" => {
            state.settings.theme = value.as_str().unwrap_or("system").to_string();
        }
        "language" => {
            state.settings.language = value.as_str().unwrap_or("en").to_string();
        }
        "fontSize" => {
            state.settings.font_size = value.as_u64().unwrap_or(14) as u32;
        }
        "notificationsEnabled" => {
            state.settings.notifications_enabled = value.as_bool().unwrap_or(true);
        }
        "autoSave" => {
            state.settings.auto_save = value.as_bool().unwrap_or(true);
        }
        "sidebarCollapsed" => {
            state.settings.sidebar_collapsed = value.as_bool().unwrap_or(false);
        }
        _ => return Err(format!("Unknown setting key: {}", key)),
    }

    state.revision += 1;

    let envelope = SnapshotEnvelope {
        revision: state.revision.to_string(),
        data: state.settings.clone(),
    };

    let event = InvalidationEvent {
        topic: "settings".to_string(),
        revision: state.revision.to_string(),
        source_id: Some(window.label().to_string()),
    };

    app.emit("settings:invalidated", &event)
        .map_err(|e| e.to_string())?;

    Ok(envelope)
}

/// Open settings window
#[tauri::command]
pub fn open_settings_window(app: AppHandle) -> Result<(), String> {
    // Check if window already exists
    if let Some(window) = app.get_webview_window("settings") {
        window.set_focus().map_err(|e| e.to_string())?;
        return Ok(());
    }

    // Create new settings window
    tauri::WebviewWindowBuilder::new(
        &app,
        "settings",
        tauri::WebviewUrl::App("/settings".into()),
    )
    .title("Settings")
    .inner_size(500.0, 600.0)
    .resizable(true)
    .build()
    .map_err(|e| e.to_string())?;

    Ok(())
}

// ============================================================================
// App Entry
// ============================================================================

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(Mutex::new(AppState::default()))
        .invoke_handler(tauri::generate_handler![
            get_settings,
            update_settings,
            update_setting,
            open_settings_window,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

## Pinia store

```typescript
// src/stores/settings.ts
import { defineStore } from 'pinia';

export interface Settings {
  theme: 'light' | 'dark' | 'system';
  language: string;
  fontSize: number;
  notificationsEnabled: boolean;
  autoSave: boolean;
  sidebarCollapsed: boolean;
}

interface SettingsState extends Settings {
  // UI-only state (not synced)
  isSaving: boolean;
  lastSyncedAt: number | null;
}

export const useSettingsStore = defineStore('settings', {
  state: (): SettingsState => ({
    // Synced settings
    theme: 'system',
    language: 'en',
    fontSize: 14,
    notificationsEnabled: true,
    autoSave: true,
    sidebarCollapsed: false,
    // UI-only
    isSaving: false,
    lastSyncedAt: null,
  }),

  getters: {
    effectiveTheme(): 'light' | 'dark' {
      if (this.theme === 'system') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light';
      }
      return this.theme;
    },
  },

  actions: {
    setTheme(theme: Settings['theme']) {
      this.theme = theme;
    },

    setLanguage(language: string) {
      this.language = language;
    },

    setFontSize(size: number) {
      this.fontSize = Math.max(10, Math.min(24, size));
    },

    toggleNotifications() {
      this.notificationsEnabled = !this.notificationsEnabled;
    },

    toggleAutoSave() {
      this.autoSave = !this.autoSave;
    },

    toggleSidebar() {
      this.sidebarCollapsed = !this.sidebarCollapsed;
    },

    markSynced() {
      this.lastSyncedAt = Date.now();
    },
  },
});
```

## Sync setup

```typescript
// src/sync/settings-sync.ts
import { createTauriRevisionSync } from '@statesync/tauri';
import { createPiniaSnapshotApplier } from '@statesync/pinia';
import { createConsoleLogger, tagLogger } from '@statesync/core';
import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { useSettingsStore, type Settings } from '../stores/settings';

let syncHandle: ReturnType<typeof createTauriRevisionSync> | null = null;

export async function initSettingsSync() {
  const store = useSettingsStore();
  const windowLabel = getCurrentWindow().label;

  // Logger with window context
  const logger = tagLogger(
    createConsoleLogger({ debug: true }),
    { window: windowLabel }
  );

  // Create applier that excludes UI state
  const applier = createPiniaSnapshotApplier(store, {
    mode: 'patch',
    omitKeys: ['isSaving', 'lastSyncedAt'],
  });

  // Wrap applier to track sync time
  const wrappedApplier = {
    apply(snapshot: { revision: string; data: Settings }) {
      applier.apply(snapshot);
      store.markSynced();
    },
  };

  syncHandle = createTauriRevisionSync({
    topic: 'settings',
    listen,
    invoke,
    eventName: 'settings:invalidated',
    commandName: 'get_settings',
    applier: wrappedApplier,
    logger,
    // Optional: skip refresh if this window made the change
    shouldRefresh(event) {
      // Always refresh to ensure consistency
      // Revision gate will skip if already up-to-date
      return true;
    },
    onError(ctx) {
      console.error(`Settings sync error [${ctx.phase}]:`, ctx.error);
    },
  });

  await syncHandle.start();
  console.log(`Settings sync started for window: ${windowLabel}`);
}

export function stopSettingsSync() {
  if (syncHandle) {
    syncHandle.stop();
    syncHandle = null;
  }
}

// Helper to update settings via Rust backend
export async function updateSettings(settings: Partial<Settings>) {
  const store = useSettingsStore();
  store.isSaving = true;

  try {
    const currentSettings = {
      theme: store.theme,
      language: store.language,
      fontSize: store.fontSize,
      notificationsEnabled: store.notificationsEnabled,
      autoSave: store.autoSave,
      sidebarCollapsed: store.sidebarCollapsed,
      ...settings,
    };

    await invoke('update_settings', { settings: currentSettings });
  } finally {
    store.isSaving = false;
  }
}

// Helper to update single setting
export async function updateSetting<K extends keyof Settings>(
  key: K,
  value: Settings[K]
) {
  const store = useSettingsStore();
  store.isSaving = true;

  try {
    await invoke('update_setting', { key, value });
  } finally {
    store.isSaving = false;
  }
}
```

## Vue component

```vue
<!-- src/components/SettingsPanel.vue -->
<script setup lang="ts">
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useSettingsStore } from '../stores/settings';
import { updateSetting } from '../sync/settings-sync';

const store = useSettingsStore();
const {
  theme,
  language,
  fontSize,
  notificationsEnabled,
  autoSave,
  sidebarCollapsed,
  isSaving,
  lastSyncedAt,
} = storeToRefs(store);

const lastSyncedFormatted = computed(() => {
  if (!lastSyncedAt.value) return 'Never';
  return new Date(lastSyncedAt.value).toLocaleTimeString();
});

const languages = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'de', name: 'Deutsch' },
  { code: 'ru', name: 'Русский' },
];
</script>

<template>
  <div class="settings-panel" :class="{ saving: isSaving }">
    <header>
      <h1>Settings</h1>
      <span class="sync-status">
        Last synced: {{ lastSyncedFormatted }}
      </span>
    </header>

    <section>
      <h2>Appearance</h2>

      <div class="setting">
        <label for="theme">Theme</label>
        <select
          id="theme"
          :value="theme"
          @change="updateSetting('theme', ($event.target as HTMLSelectElement).value as any)"
        >
          <option value="light">Light</option>
          <option value="dark">Dark</option>
          <option value="system">System</option>
        </select>
      </div>

      <div class="setting">
        <label for="fontSize">Font Size</label>
        <div class="font-size-control">
          <button @click="updateSetting('fontSize', fontSize - 1)" :disabled="fontSize <= 10">
            −
          </button>
          <span>{{ fontSize }}px</span>
          <button @click="updateSetting('fontSize', fontSize + 1)" :disabled="fontSize >= 24">
            +
          </button>
        </div>
      </div>

      <div class="setting">
        <label for="sidebarCollapsed">Sidebar</label>
        <button
          id="sidebarCollapsed"
          @click="updateSetting('sidebarCollapsed', !sidebarCollapsed)"
        >
          {{ sidebarCollapsed ? 'Expand' : 'Collapse' }}
        </button>
      </div>
    </section>

    <section>
      <h2>Language</h2>

      <div class="setting">
        <label for="language">Display Language</label>
        <select
          id="language"
          :value="language"
          @change="updateSetting('language', ($event.target as HTMLSelectElement).value)"
        >
          <option v-for="lang in languages" :key="lang.code" :value="lang.code">
            {{ lang.name }}
          </option>
        </select>
      </div>
    </section>

    <section>
      <h2>Behavior</h2>

      <div class="setting toggle">
        <label for="notifications">Notifications</label>
        <input
          type="checkbox"
          id="notifications"
          :checked="notificationsEnabled"
          @change="updateSetting('notificationsEnabled', !notificationsEnabled)"
        />
      </div>

      <div class="setting toggle">
        <label for="autoSave">Auto-save</label>
        <input
          type="checkbox"
          id="autoSave"
          :checked="autoSave"
          @change="updateSetting('autoSave', !autoSave)"
        />
      </div>
    </section>

    <div v-if="isSaving" class="saving-indicator">
      Saving...
    </div>
  </div>
</template>

<style scoped>
.settings-panel {
  max-width: 500px;
  margin: 0 auto;
  padding: 20px;
}

.settings-panel.saving {
  opacity: 0.7;
  pointer-events: none;
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.sync-status {
  font-size: 12px;
  color: #666;
}

section {
  margin-bottom: 24px;
}

h2 {
  font-size: 14px;
  text-transform: uppercase;
  color: #888;
  margin-bottom: 12px;
}

.setting {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #eee;
}

.font-size-control {
  display: flex;
  align-items: center;
  gap: 12px;
}

.saving-indicator {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: #333;
  color: white;
  padding: 8px 16px;
  border-radius: 4px;
}
</style>
```

## App setup

```typescript
// src/main.ts
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import { initSettingsSync, stopSettingsSync } from './sync/settings-sync';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.mount('#app');

// Initialize sync after Pinia is ready
initSettingsSync().catch(console.error);

// Cleanup on window close
window.addEventListener('beforeunload', () => {
  stopSettingsSync();
});
```

## Testing multi-window

1. Start your Tauri app (main window)
2. Click "Open Settings" to open settings window
3. Change a setting in either window
4. Both windows update instantly

```
Main Window: Change theme to "Dark"
↓
Rust backend: updates state, revision 1 → 2
↓
Rust backend: emits "settings:invalidated" to all windows
↓
Settings Window: receives event, fetches snapshot, applies (theme = "Dark")
Main Window: receives event, skips (already has revision 2)
```

## Key points

1. **Rust is source of truth**: All changes go through `invoke()` to Rust backend

2. **Events broadcast to all windows**: Including the window that made the change

3. **Revision gate prevents duplicates**: Window that made the change skips refresh

4. **UI state excluded**: `isSaving`, `lastSyncedAt` not synced between windows

5. **TypeScript types match Rust**: `Settings` interface matches Rust struct (camelCase via serde)

## See also

- [@statesync/tauri](/packages/tauri) — Tauri transport API
- [@statesync/pinia](/packages/pinia) — Pinia adapter API
- [Multi-window patterns](/guide/multi-window) — cross-window architecture
- [Writing state](/guide/writing-state) — UI → backend patterns
