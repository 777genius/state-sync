/**
 * Tauri-backed persistence for state-sync snapshots.
 *
 * Provides a {@link StorageBackend} implementation that delegates save, load,
 * and clear operations to Rust-side Tauri commands, giving the frontend
 * secure, native file-system access without direct `fs` calls.
 *
 * @packageDocumentation
 */

import type { SnapshotEnvelope } from '@statesync/core';
import type { TauriInvoke } from './transport';

/**
 * Abstract storage backend interface for persisting snapshot envelopes.
 *
 * This interface mirrors the contract from `@statesync/persistence` and is
 * re-declared here so that `@statesync/tauri` does not require
 * `@statesync/persistence` as a runtime dependency.
 *
 * @typeParam T - The application-specific snapshot data type.
 */
export interface StorageBackend<T> {
  /**
   * Persist a snapshot envelope to the backing store.
   *
   * @param snapshot - The versioned snapshot to save.
   * @returns A promise that resolves when the write is complete.
   */
  save(snapshot: SnapshotEnvelope<T>): Promise<void>;

  /**
   * Load the most recently saved snapshot envelope from the backing store.
   *
   * @returns The stored snapshot, or `null` if no snapshot has been saved yet.
   */
  load(): Promise<SnapshotEnvelope<T> | null>;

  /**
   * Remove any persisted snapshot from the backing store.
   *
   * Implementations may omit this method if clearing is not supported.
   *
   * @returns A promise that resolves when the data has been removed.
   */
  clear?(): Promise<void>;
}

/**
 * Configuration for {@link createTauriFileBackend}.
 */
export interface TauriFileBackendOptions {
  /**
   * A Tauri-compatible `invoke` function used to call Rust commands.
   *
   * Typically `invoke` from `@tauri-apps/api/core`.
   *
   * @see {@link TauriInvoke}
   */
  invoke: TauriInvoke;

  /**
   * The Tauri command name for persisting a snapshot.
   *
   * The Rust command receives `{ snapshot: SnapshotEnvelope<T>, ...args }` as
   * its argument payload. It should write the envelope to disk (or other
   * durable storage) and return `Ok(())`.
   *
   * @example `'save_settings'`
   */
  saveCommand: string;

  /**
   * The Tauri command name for loading a previously persisted snapshot.
   *
   * The Rust command receives `{ ...args }` (or nothing if `args` is empty)
   * and should return `SnapshotEnvelope<T> | null`.
   *
   * @example `'load_settings'`
   */
  loadCommand: string;

  /**
   * Optional Tauri command name for clearing persisted state.
   *
   * If omitted, calling `clear()` on the returned backend is a no-op.
   * When provided, the Rust command receives `{ ...args }` and should
   * delete the stored data.
   *
   * @example `'clear_settings'`
   */
  clearCommand?: string;

  /**
   * Optional additional arguments forwarded to every Tauri command invocation.
   *
   * Useful for scoping storage to a specific user, profile, or namespace.
   *
   * @example
   * ```typescript
   * { profileId: 'default' }
   * ```
   */
  args?: Record<string, unknown>;
}

/**
 * Creates a {@link StorageBackend} that delegates all persistence operations
 * to Tauri commands, enabling secure native file-system access from the
 * frontend.
 *
 * The returned backend exposes three operations:
 * - **save** — invokes `saveCommand` with `{ snapshot, ...args }`
 * - **load** — invokes `loadCommand` with `{ ...args }`, returns the result or `null`
 * - **clear** — invokes `clearCommand` (if provided) with `{ ...args }`
 *
 * **Rust backend requirements:**
 * - `saveCommand` must accept a `snapshot` field deserializable as
 *   `serde_json::Value` (or a typed struct) and persist it.
 * - `loadCommand` must return `Option<serde_json::Value>` (or the typed
 *   equivalent), where `None` / `null` means "nothing stored yet".
 * - `clearCommand` (optional) must delete the stored data.
 *
 * @typeParam T - The application-specific snapshot data type.
 * @param options - Configuration specifying the Tauri commands and invoke function.
 * @returns A {@link StorageBackend} backed by Tauri IPC commands.
 *
 * @example
 * ```typescript
 * import { invoke } from '@tauri-apps/api/core';
 * import { createTauriFileBackend } from '@statesync/tauri';
 *
 * // --- Rust side ---
 * // #[tauri::command]
 * // fn save_settings(snapshot: serde_json::Value) -> Result<(), String> {
 * //   std::fs::write("settings.json", serde_json::to_string(&snapshot).unwrap())
 * //     .map_err(|e| e.to_string())
 * // }
 * //
 * // #[tauri::command]
 * // fn load_settings() -> Result<Option<serde_json::Value>, String> {
 * //   match std::fs::read_to_string("settings.json") {
 * //     Ok(data) => Ok(Some(serde_json::from_str(&data).unwrap())),
 * //     Err(_) => Ok(None),
 * //   }
 * // }
 *
 * // --- TypeScript side ---
 * interface Settings {
 *   theme: 'light' | 'dark';
 *   locale: string;
 * }
 *
 * const storage = createTauriFileBackend<Settings>({
 *   invoke,
 *   saveCommand: 'save_settings',
 *   loadCommand: 'load_settings',
 *   clearCommand: 'clear_settings',
 * });
 *
 * // Persist a snapshot:
 * await storage.save({ revision: '1', data: { theme: 'dark', locale: 'en' } });
 *
 * // Restore on next launch:
 * const cached = await storage.load();
 * if (cached) {
 *   console.log('Restored revision', cached.revision);
 * }
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
