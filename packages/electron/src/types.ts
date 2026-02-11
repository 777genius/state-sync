/**
 * Structural types for Electron IPC.
 * No import from 'electron' — fully mockable and testable.
 */

/**
 * Structural type for ipcRenderer-like object.
 * Used by createElectronBridge in preload.
 */
export interface ElectronIpcRendererLike {
  on(channel: string, listener: (event: unknown, ...args: unknown[]) => void): unknown;
  removeListener(channel: string, listener: (event: unknown, ...args: unknown[]) => void): unknown;
  invoke(channel: string, ...args: unknown[]): Promise<unknown>;
}

/**
 * Function that subscribes to IPC events and returns unsubscribe.
 * The unsubscribe pattern solves contextBridge's broken callback identity.
 *
 * Analog of TauriListen, but sync return (not Promise<Unsubscribe>).
 */
export type ElectronListen = (channel: string, handler: (...args: unknown[]) => void) => () => void;

/**
 * Function that invokes a main-process handler.
 * Analog of TauriInvoke.
 */
export type ElectronInvoke = (channel: string, ...args: unknown[]) => Promise<unknown>;

/**
 * The bridge object exposed via contextBridge.exposeInMainWorld.
 * Created by createElectronBridge() in preload.
 *
 * Uses on() returning unsubscribe because contextBridge proxy identity is broken.
 */
export interface ElectronStateSyncBridge {
  on: ElectronListen;
  invoke: ElectronInvoke;
}

/**
 * Structural type for webContents-like object.
 * Used by main-process broadcaster.
 */
export interface ElectronWebContentsLike {
  isDestroyed(): boolean;
  send(channel: string, ...args: unknown[]): void;
}

/**
 * Structural type for ipcMain.handle.
 */
export type ElectronIpcMainHandle = (
  channel: string,
  listener: (event: unknown, ...args: unknown[]) => unknown,
) => void;

/**
 * Structural type for ipcMain.removeHandler.
 */
export type ElectronIpcMainRemoveHandler = (channel: string) => void;
