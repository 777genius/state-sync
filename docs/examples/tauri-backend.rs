//! Tauri Rust backend — state + commands + events for multi-window sync.
//!
//! Demonstrates:
//! - AppState with Revision from state-sync crate
//! - get_settings command returning SnapshotEnvelope
//! - update_settings command with invalidation broadcast
//! - Tauri Builder setup with managed state

use std::sync::Mutex;
use tauri::{AppHandle, Emitter, State};
use serde::{Deserialize, Serialize};
use state_sync::{InvalidationEvent, Revision, SnapshotEnvelope};

// ─── Types ──────────────────────────────────────────

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

pub struct AppState {
    pub settings: Settings,
    pub revision: Revision,
}

impl Default for AppState {
    fn default() -> Self {
        Self {
            settings: Settings::default(),
            revision: Revision::new(1),
        }
    }
}

// ─── Commands ───────────────────────────────────────

/// Get current settings snapshot
#[tauri::command]
pub fn get_settings(state: State<'_, Mutex<AppState>>) -> SnapshotEnvelope<Settings> {
    let state = state.lock().unwrap();
    SnapshotEnvelope {
        revision: state.revision.to_string(),
        data: state.settings.clone(),
    }
}

/// Update settings and notify all windows
#[tauri::command]
pub fn update_settings(
    app: AppHandle,
    state: State<'_, Mutex<AppState>>,
    settings: Settings,
) -> Result<SnapshotEnvelope<Settings>, String> {
    let mut state = state.lock().unwrap();

    state.settings = settings;
    state.revision = state.revision.next();

    let envelope = SnapshotEnvelope {
        revision: state.revision.to_string(),
        data: state.settings.clone(),
    };

    let event = InvalidationEvent {
        topic: "settings".to_string(),
        revision: state.revision.to_string(),
    };

    app.emit("settings:invalidated", &event)
        .map_err(|e| e.to_string())?;

    Ok(envelope)
}

// ─── App Entry ──────────────────────────────────────

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
