use std::sync::Arc;

use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter, State, WebviewUrl, WebviewWindowBuilder};
use tokio::sync::RwLock;

// --- Constants ---

const EVENT_INVALIDATION: &str = "state-sync:invalidation";

// --- Types ---

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct InvalidationPayload {
    topic: String,
    revision: String,
    timestamp_ms: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DemoState {
    pub counter: i64,
    pub color: String,
    pub slider_value: u32,
    pub text: String,
}

impl Default for DemoState {
    fn default() -> Self {
        Self {
            counter: 0,
            color: "#3b82f6".to_string(),
            slider_value: 50,
            text: String::new(),
        }
    }
}

#[derive(Debug, Clone, Serialize)]
pub struct SnapshotEnvelope<T: Serialize> {
    pub revision: String,
    pub data: T,
}

pub struct AppState {
    state: Arc<RwLock<DemoState>>,
    revision: Arc<RwLock<u64>>,
}

impl Default for AppState {
    fn default() -> Self {
        Self {
            state: Arc::new(RwLock::new(DemoState::default())),
            revision: Arc::new(RwLock::new(0)),
        }
    }
}

// --- Commands ---

#[tauri::command]
async fn get_demo_snapshot(
    state: State<'_, AppState>,
) -> Result<SnapshotEnvelope<DemoState>, String> {
    let data = state.state.read().await.clone();
    let revision = state.revision.read().await.to_string();
    Ok(SnapshotEnvelope { revision, data })
}

#[tauri::command]
async fn update_demo_state(
    state: State<'_, AppState>,
    app_handle: AppHandle,
    counter: Option<i64>,
    color: Option<String>,
    slider_value: Option<u32>,
    text: Option<String>,
) -> Result<(), String> {
    let mut demo = state.state.write().await;

    if let Some(v) = counter {
        demo.counter = v;
    }
    if let Some(v) = color {
        demo.color = v;
    }
    if let Some(v) = slider_value {
        demo.slider_value = v.min(100);
    }
    if let Some(v) = text {
        demo.text = v;
    }

    let mut rev = state.revision.write().await;
    *rev = rev.saturating_add(1);
    let revision = rev.to_string();

    let _ = app_handle.emit(
        EVENT_INVALIDATION,
        InvalidationPayload {
            topic: "demo".to_string(),
            revision,
            timestamp_ms: chrono::Utc::now().timestamp_millis(),
        },
    );

    Ok(())
}

// --- Benchmark ---

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct BenchBurstResult {
    events_fired: u32,
    elapsed_us: u64,
    final_revision: String,
}

#[tauri::command]
async fn bench_burst(
    state: State<'_, AppState>,
    app_handle: AppHandle,
    count: u32,
    delay_us: Option<u64>,
) -> Result<BenchBurstResult, String> {
    let delay = delay_us.unwrap_or(0);
    let start = std::time::Instant::now();

    for i in 0..count {
        let revision = {
            let mut demo = state.state.write().await;
            demo.counter = i as i64;
            let mut rev = state.revision.write().await;
            *rev = rev.saturating_add(1);
            rev.to_string()
        };

        let _ = app_handle.emit(
            EVENT_INVALIDATION,
            InvalidationPayload {
                topic: "demo".to_string(),
                revision,
                timestamp_ms: chrono::Utc::now().timestamp_millis(),
            },
        );

        if delay > 0 {
            tokio::time::sleep(std::time::Duration::from_micros(delay)).await;
        }
    }

    let elapsed_us = start.elapsed().as_micros() as u64;
    let final_revision = state.revision.read().await.to_string();

    Ok(BenchBurstResult {
        events_fired: count,
        elapsed_us,
        final_revision,
    })
}

// --- Window creation ---

fn open_demo_windows(app: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let window_width: f64 = 380.0;
    let window_height: f64 = 640.0;
    let gap: f64 = 20.0;

    let (center_x, center_y) = if let Some(monitor) = app.primary_monitor()? {
        let size = monitor.size();
        let pos = monitor.position();
        (
            pos.x as f64 + (size.width as f64 / 2.0),
            pos.y as f64 + (size.height as f64 / 2.0),
        )
    } else {
        (960.0, 540.0)
    };

    let total_w = window_width * 3.0 + gap * 2.0;
    let start_x = center_x - total_w / 2.0;
    let top_y = center_y - window_height / 2.0;

    let labels = ["demo-a", "demo-b", "demo-c"];
    let titles = ["Window A", "Window B", "Window C"];

    for (i, (label, title)) in labels.iter().zip(titles.iter()).enumerate() {
        let x = start_x + (window_width + gap) * i as f64;
        WebviewWindowBuilder::new(app, *label, WebviewUrl::App("index.html".into()))
            .title(format!("state-sync  ·  {title}"))
            .inner_size(window_width, window_height)
            .position(x, top_y)
            .resizable(false)
            .decorations(true)
            .visible(true)
            .build()?;
    }

    log::info!("Opened 3 demo windows");

    // Benchmark window: open when BENCH=1 env is set, or always in debug builds
    if std::env::var("BENCH").is_ok() || cfg!(debug_assertions) {
        WebviewWindowBuilder::new(app, "benchmark", WebviewUrl::App("benchmark.html".into()))
            .title("state-sync · Benchmarks")
            .inner_size(720.0, 800.0)
            .resizable(true)
            .decorations(true)
            .visible(true)
            .build()?;
        log::info!("Opened benchmark window");
    }

    Ok(())
}

// --- Entry point ---

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(
            tauri_plugin_log::Builder::default()
                .level(log::LevelFilter::Debug)
                .build(),
        )
        .manage(AppState::default())
        .invoke_handler(tauri::generate_handler![
            get_demo_snapshot,
            update_demo_state,
            bench_burst,
        ])
        .setup(|app| {
            open_demo_windows(app.handle())?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running state-sync demo");
}
