[**@statesync/tauri**](../index.md)

***

[@statesync/tauri](../index.md) / createTauriFileBackend

# Function: createTauriFileBackend()

```ts
function createTauriFileBackend<T>(options): StorageBackend<T>;
```

Defined in: [persistence.ts:171](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/tauri/src/persistence.ts#L171)

Creates a [StorageBackend](../interfaces/StorageBackend.md) that delegates all persistence operations
to Tauri commands, enabling secure native file-system access from the
frontend.

The returned backend exposes three operations:
- **save** — invokes `saveCommand` with `{ snapshot, ...args }`
- **load** — invokes `loadCommand` with `{ ...args }`, returns the result or `null`
- **clear** — invokes `clearCommand` (if provided) with `{ ...args }`

**Rust backend requirements:**
- `saveCommand` must accept a `snapshot` field deserializable as
  `serde_json::Value` (or a typed struct) and persist it.
- `loadCommand` must return `Option<serde_json::Value>` (or the typed
  equivalent), where `None` / `null` means "nothing stored yet".
- `clearCommand` (optional) must delete the stored data.

## Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `T` | The application-specific snapshot data type. |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options` | [`TauriFileBackendOptions`](../interfaces/TauriFileBackendOptions.md) | Configuration specifying the Tauri commands and invoke function. |

## Returns

[`StorageBackend`](../interfaces/StorageBackend.md)\<`T`\>

A [StorageBackend](../interfaces/StorageBackend.md) backed by Tauri IPC commands.

## Example

```typescript
import { invoke } from '@tauri-apps/api/core';
import { createTauriFileBackend } from '@statesync/tauri';

// --- Rust side ---
// #[tauri::command]
// fn save_settings(snapshot: serde_json::Value) -> Result<(), String> {
//   std::fs::write("settings.json", serde_json::to_string(&snapshot).unwrap())
//     .map_err(|e| e.to_string())
// }
//
// #[tauri::command]
// fn load_settings() -> Result<Option<serde_json::Value>, String> {
//   match std::fs::read_to_string("settings.json") {
//     Ok(data) => Ok(Some(serde_json::from_str(&data).unwrap())),
//     Err(_) => Ok(None),
//   }
// }

// --- TypeScript side ---
interface Settings {
  theme: 'light' | 'dark';
  locale: string;
}

const storage = createTauriFileBackend<Settings>({
  invoke,
  saveCommand: 'save_settings',
  loadCommand: 'load_settings',
  clearCommand: 'clear_settings',
});

// Persist a snapshot:
await storage.save({ revision: '1', data: { theme: 'dark', locale: 'en' } });

// Restore on next launch:
const cached = await storage.load();
if (cached) {
  console.log('Restored revision', cached.revision);
}
```
