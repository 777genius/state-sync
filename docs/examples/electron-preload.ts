/**
 * Electron preload script — secure bridge for state-sync IPC.
 *
 * Demonstrates:
 * - createElectronBridge() with proper contextBridge isolation
 * - Type-safe bridge for invalidation + snapshot channels
 * - Separate invoke channel for renderer → main writes
 */
import { contextBridge, ipcRenderer } from 'electron';
import { createElectronBridge } from '@statesync/electron';

// State-sync bridge (invalidation + snapshot channels)
contextBridge.exposeInMainWorld('statesync', createElectronBridge(ipcRenderer));

// Write channel for renderer → main updates
contextBridge.exposeInMainWorld('api', {
  updateSettings: (patch: Record<string, unknown>) =>
    ipcRenderer.invoke('update-settings', patch),
});
