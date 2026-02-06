[**@statesync/tauri**](../index.md)

***

[@statesync/tauri](../index.md) / createTauriFileBackend

# Function: createTauriFileBackend()

```ts
function createTauriFileBackend<T>(options): StorageBackend<T>;
```

Defined in: persistence.ts:73

Creates a StorageBackend that uses Tauri commands for file persistence.

The backend delegates all storage operations to Rust-side commands,
allowing for secure, native file system access.

## Type Parameters

| Type Parameter |
| ------ |
| `T` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`TauriFileBackendOptions`](../interfaces/TauriFileBackendOptions.md) |

## Returns

[`StorageBackend`](../interfaces/StorageBackend.md)\<`T`\>

## Example

```typescript
// Rust side:
#[tauri::command]
fn save_settings(snapshot: serde_json::Value) -> Result<(), String> {
  // Save to file
}

#[tauri::command]
fn load_settings() -> Result<Option<serde_json::Value>, String> {
  // Load from file
}

// TypeScript side:
const storage = createTauriFileBackend<Settings>({
  invoke,
  saveCommand: 'save_settings',
  loadCommand: 'load_settings',
});
```
