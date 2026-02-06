import type { SnapshotEnvelope } from '@statesync/core';
import type { TauriInvoke } from './transport';

/**
 * Abstract storage backend interface (mirrors @statesync/persistence).
 * Defined here to avoid requiring persistence as a dependency.
 */
export interface StorageBackend<T> {
  save(snapshot: SnapshotEnvelope<T>): Promise<void>;
  load(): Promise<SnapshotEnvelope<T> | null>;
  clear?(): Promise<void>;
}

/**
 * Options for Tauri file-based storage backend.
 */
export interface TauriFileBackendOptions {
  /**
   * Tauri invoke function.
   */
  invoke: TauriInvoke;

  /**
   * Command name for saving state.
   * The command receives `{ snapshot: SnapshotEnvelope<T> }` + args.
   */
  saveCommand: string;

  /**
   * Command name for loading state.
   * The command should return `SnapshotEnvelope<T> | null`.
   */
  loadCommand: string;

  /**
   * Optional command name for clearing state.
   */
  clearCommand?: string;

  /**
   * Optional additional arguments to pass to all commands.
   */
  args?: Record<string, unknown>;
}

/**
 * Creates a StorageBackend that uses Tauri commands for file persistence.
 *
 * The backend delegates all storage operations to Rust-side commands,
 * allowing for secure, native file system access.
 *
 * @example
 * ```typescript
 * // Rust side:
 * #[tauri::command]
 * fn save_settings(snapshot: serde_json::Value) -> Result<(), String> {
 *   // Save to file
 * }
 *
 * #[tauri::command]
 * fn load_settings() -> Result<Option<serde_json::Value>, String> {
 *   // Load from file
 * }
 *
 * // TypeScript side:
 * const storage = createTauriFileBackend<Settings>({
 *   invoke,
 *   saveCommand: 'save_settings',
 *   loadCommand: 'load_settings',
 * });
 * ```
 */
export function createTauriFileBackend<T>(options: TauriFileBackendOptions): StorageBackend<T> {
  const { invoke, saveCommand, loadCommand, clearCommand, args = {} } = options;

  return {
    async save(snapshot: SnapshotEnvelope<T>): Promise<void> {
      await invoke(saveCommand, { snapshot, ...args });
    },

    async load(): Promise<SnapshotEnvelope<T> | null> {
      const result = await invoke<SnapshotEnvelope<T> | null>(loadCommand, args);
      return result ?? null;
    },

    async clear(): Promise<void> {
      if (clearCommand) {
        await invoke(clearCommand, args);
      }
    },
  };
}
