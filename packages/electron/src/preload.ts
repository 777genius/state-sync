/**
 * Preload script utilities for Electron state-sync.
 *
 * This module provides {@link createElectronBridge}, which creates a
 * `contextBridge`-safe IPC bridge object. It is designed to run in
 * Electron's **preload** script context with `contextIsolation: true`.
 *
 * @packageDocumentation
 */

import type { ElectronIpcRendererLike, ElectronStateSyncBridge } from './types';

/**
 * Creates an {@link ElectronStateSyncBridge} from an `ipcRenderer`-like object.
 *
 * **Why this exists:** Electron's `contextBridge` does not preserve callback
 * identity — each function crossing the bridge gets a new proxy wrapper.
 * This breaks `ipcRenderer.removeListener()` because the callback reference
 * stored in the main world differs from the one registered in the preload world.
 *
 * This bridge solves the problem by returning an **unsubscribe closure** from
 * `on()`, which captures the exact listener reference in the preload scope.
 * The renderer calls the unsubscribe function instead of `removeListener()`.
 *
 * **Security considerations:**
 * - The bridge exposes `on()` and `invoke()` for **arbitrary channel names**.
 * - Only expose it via `contextBridge.exposeInMainWorld()` for state-sync channels.
 * - Do not combine this bridge with `ipcMain.handle()` registrations that
 *   perform privileged operations without additional channel-name validation.
 * - For maximum security, consider wrapping the bridge to whitelist specific channels.
 *
 * **Process context:** preload script (runs in a Node.js context with `contextIsolation`).
 *
 * @param ipcRenderer - The Electron `ipcRenderer` object or any compatible mock.
 *   See {@link ElectronIpcRendererLike} for the required interface.
 * @returns A bridge object safe to pass to `contextBridge.exposeInMainWorld()`.
 *
 * @example
 * ```ts
 * // preload.ts
 * import { contextBridge, ipcRenderer } from 'electron';
 * import { createElectronBridge } from '@statesync/electron';
 *
 * contextBridge.exposeInMainWorld('statesync', createElectronBridge(ipcRenderer));
 * ```
 *
 * @example
 * ```ts
 * // renderer.ts — consuming the bridge
 * import type { ElectronStateSyncBridge } from '@statesync/electron';
 *
 * const bridge = (window as any).statesync as ElectronStateSyncBridge;
 * const unsubscribe = bridge.on('statesync:todos:invalidated', (event) => {
 *   console.log('Got invalidation:', event);
 * });
 *
 * // Later:
 * unsubscribe();
 * ```
 */
export function createElectronBridge(
  ipcRenderer: ElectronIpcRendererLike,
): ElectronStateSyncBridge {
  return {
    on(channel, handler) {
      let listener: ((event: unknown, ...args: unknown[]) => void) | null = (
        _event: unknown,
        ...args: unknown[]
      ) => handler(...args);
      ipcRenderer.on(channel, listener);
      return () => {
        if (!listener) return;
        ipcRenderer.removeListener(channel, listener);
        listener = null;
      };
    },
    invoke(channel, ...args) {
      return ipcRenderer.invoke(channel, ...args);
    },
  };
}
