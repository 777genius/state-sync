/**
 * Electron IPC channel name utilities for state-sync.
 *
 * These functions produce deterministic, namespaced channel strings used by
 * both the main-process handlers ({@link createElectronBroadcaster},
 * {@link createElectronSnapshotHandler}) and the renderer-process transport
 * ({@link createElectronInvalidationSubscriber}, {@link createElectronSnapshotProvider}).
 *
 * Channel format: `statesync:<topic>:<suffix>`
 *
 * @packageDocumentation
 */

/**
 * Returns the IPC channel name used to broadcast invalidation events for a given topic.
 *
 * The main process sends {@link InvalidationEvent} payloads on this channel via
 * `webContents.send()`, and the renderer subscribes via `ipcRenderer.on()`.
 *
 * @param topic - The sync topic identifier (e.g. `"user-profile"`).
 * @returns The fully-qualified IPC channel string in the format `statesync:<topic>:invalidated`.
 *
 * @example
 * ```ts
 * invalidationChannel('user-profile');
 * // => 'statesync:user-profile:invalidated'
 * ```
 */
export function invalidationChannel(topic: string): string {
  return `statesync:${topic}:invalidated`;
}

/**
 * Returns the IPC channel name used for snapshot request/response for a given topic.
 *
 * The main process registers an `ipcMain.handle()` listener on this channel,
 * and the renderer invokes it via `ipcRenderer.invoke()` to fetch the current
 * {@link SnapshotEnvelope}.
 *
 * @param topic - The sync topic identifier (e.g. `"user-profile"`).
 * @returns The fully-qualified IPC channel string in the format `statesync:<topic>:snapshot`.
 *
 * @example
 * ```ts
 * snapshotChannel('user-profile');
 * // => 'statesync:user-profile:snapshot'
 * ```
 */
export function snapshotChannel(topic: string): string {
  return `statesync:${topic}:snapshot`;
}
