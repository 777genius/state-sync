/**
 * @statesync/tauri — Tauri transport and persistence bindings for state-sync.
 *
 * This package bridges the {@link https://v2.tauri.app | Tauri v2} IPC layer
 * (events + commands) with the `@statesync/core` revision-sync engine, giving
 * Tauri desktop/mobile apps reactive, revision-based state synchronization
 * between the Rust backend and TypeScript frontend.
 *
 * Main entry points:
 * - {@link createTauriRevisionSync} — one-call convenience factory
 * - {@link createTauriInvalidationSubscriber} / {@link createTauriSnapshotProvider} — lower-level transport primitives
 * - {@link createTauriFileBackend} — Tauri-command-backed persistence
 *
 * @example
 * ```typescript
 * import { invoke } from '@tauri-apps/api/core';
 * import { listen } from '@tauri-apps/api/event';
 * import { createTauriRevisionSync } from '@statesync/tauri';
 *
 * interface AppSettings {
 *   theme: 'light' | 'dark';
 *   locale: string;
 * }
 *
 * const sync = createTauriRevisionSync<AppSettings>({
 *   topic: 'settings',
 *   listen,
 *   invoke,
 *   eventName: 'settings-changed',
 *   commandName: 'get_settings',
 *   applier: {
 *     apply(snapshot) {
 *       console.log('New settings:', snapshot.data);
 *     },
 *   },
 * });
 *
 * await sync.start();
 * ```
 *
 * @packageDocumentation
 */

export * from './persistence';
export * from './sync';
export * from './transport';
