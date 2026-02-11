import type { ElectronIpcRendererLike, ElectronStateSyncBridge } from './types';

/**
 * Creates an ElectronStateSyncBridge from an ipcRenderer-like object.
 *
 * WHY THIS EXISTS: contextBridge does NOT preserve callback identity.
 * Each function crossing the bridge gets a new proxy. This breaks
 * ipcRenderer.removeListener() because the callback reference differs.
 *
 * This bridge solves it by returning an unsubscribe closure from on(),
 * which captures the EXACT listener reference in preload scope.
 *
 * SECURITY: The bridge exposes on() and invoke() for arbitrary channels.
 * Only expose it via contextBridge for your state-sync channels.
 * Do not combine with other ipcMain.handle() registrations that
 * perform privileged operations without additional channel validation.
 *
 * Usage in preload.ts:
 *   const { contextBridge, ipcRenderer } = require('electron');
 *   const { createElectronBridge } = require('@statesync/electron');
 *   contextBridge.exposeInMainWorld('statesync', createElectronBridge(ipcRenderer));
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
