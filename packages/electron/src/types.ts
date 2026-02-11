/**
 * Structural types for Electron IPC primitives.
 *
 * These interfaces and type aliases mirror Electron's built-in IPC types
 * (`ipcRenderer`, `ipcMain`, `webContents`) without importing from `'electron'`.
 * This makes the entire package fully mockable and testable without an Electron
 * runtime dependency.
 *
 * @packageDocumentation
 */

/**
 * Structural type matching the subset of Electron's `ipcRenderer` API
 * required by {@link createElectronBridge}.
 *
 * Consumers can pass the real `ipcRenderer` from `'electron'` or any
 * compatible mock/stub for testing.
 *
 * **Process context:** preload script (Node.js context with `contextIsolation`).
 *
 * @example
 * ```ts
 * // In preload.ts
 * import { ipcRenderer } from 'electron';
 * import { createElectronBridge } from '@statesync/electron';
 *
 * const bridge = createElectronBridge(ipcRenderer);
 * ```
 */
export interface ElectronIpcRendererLike {
  /**
   * Registers a listener for messages on the given IPC channel.
   *
   * @param channel - The IPC channel name to listen on.
   * @param listener - Callback invoked when a message arrives. The first argument
   *   is the Electron `IpcRendererEvent` (typed as `unknown` for structural compatibility),
   *   followed by any payload arguments sent from the main process.
   * @returns Implementation-defined (the return value is not used by state-sync).
   */
  on(channel: string, listener: (event: unknown, ...args: unknown[]) => void): unknown;

  /**
   * Removes a previously registered listener for the given IPC channel.
   *
   * @param channel - The IPC channel name to stop listening on.
   * @param listener - The exact function reference originally passed to {@link on}.
   * @returns Implementation-defined (the return value is not used by state-sync).
   */
  removeListener(channel: string, listener: (event: unknown, ...args: unknown[]) => void): unknown;

  /**
   * Sends an IPC message to the main process and asynchronously returns the response.
   *
   * @param channel - The IPC channel name to invoke.
   * @param args - Optional arguments forwarded to the `ipcMain.handle()` handler.
   * @returns A promise resolving to the value returned by the main-process handler.
   */
  invoke(channel: string, ...args: unknown[]): Promise<unknown>;
}

/**
 * Function signature for subscribing to IPC events from the renderer process,
 * returning a synchronous unsubscribe callback.
 *
 * The unsubscribe-return pattern solves a fundamental Electron limitation:
 * `contextBridge` does not preserve callback identity across the bridge boundary,
 * making `ipcRenderer.removeListener()` unusable from the renderer. By capturing
 * the original listener reference in the preload closure, the returned unsubscribe
 * function can correctly remove it.
 *
 * This is the Electron analog of `TauriListen`, but returns synchronously
 * (Electron's `ipcRenderer.on` is synchronous, unlike Tauri's `listen` which is async).
 *
 * @param channel - The IPC channel name to listen on.
 * @param handler - Callback invoked with the message payload arguments (the Electron
 *   event object is stripped by the bridge).
 * @returns A teardown function that removes the listener. Safe to call multiple times.
 */
export type ElectronListen = (channel: string, handler: (...args: unknown[]) => void) => () => void;

/**
 * Function signature for invoking a main-process IPC handler from the renderer.
 *
 * This is the Electron analog of `TauriInvoke`. It wraps `ipcRenderer.invoke()`
 * and is exposed on the {@link ElectronStateSyncBridge} for use by the transport layer.
 *
 * @param channel - The IPC channel name to invoke (must match an `ipcMain.handle()` registration).
 * @param args - Optional arguments forwarded to the main-process handler.
 * @returns A promise resolving to the value returned by the main-process handler.
 */
export type ElectronInvoke = (channel: string, ...args: unknown[]) => Promise<unknown>;

/**
 * The bridge object exposed to the renderer via `contextBridge.exposeInMainWorld()`.
 *
 * Created by {@link createElectronBridge} in the preload script and consumed by
 * renderer-side factories ({@link createElectronRevisionSync},
 * {@link createElectronInvalidationSubscriber}, {@link createElectronSnapshotProvider}).
 *
 * **Security:** This bridge deliberately uses the unsubscribe-return pattern
 * for {@link on} because `contextBridge` proxies break callback reference identity,
 * making `removeListener()` impossible from the renderer context.
 *
 * **Process context:** Defined in preload, consumed in renderer.
 *
 * @example
 * ```ts
 * // preload.ts
 * contextBridge.exposeInMainWorld('statesync', createElectronBridge(ipcRenderer));
 *
 * // renderer.ts
 * const bridge = (window as any).statesync as ElectronStateSyncBridge;
 * const sync = createElectronRevisionSync({ bridge, topic: 'todos', ... });
 * ```
 */
export interface ElectronStateSyncBridge {
  /**
   * Subscribes to IPC events on the given channel and returns an unsubscribe function.
   *
   * @see {@link ElectronListen} for the full type signature and rationale.
   */
  on: ElectronListen;

  /**
   * Invokes a main-process IPC handler on the given channel and returns the result.
   *
   * @see {@link ElectronInvoke} for the full type signature.
   */
  invoke: ElectronInvoke;
}

/**
 * Structural type matching a subset of Electron's `WebContents` API
 * used by the main-process broadcaster to send invalidation events to renderers.
 *
 * Consumers can pass real `webContents` instances from `BrowserWindow.webContents`
 * or any compatible mock/stub for testing.
 *
 * **Process context:** main process only.
 *
 * @example
 * ```ts
 * const targets: ElectronWebContentsLike[] = BrowserWindow.getAllWindows()
 *   .map(w => w.webContents);
 * ```
 */
export interface ElectronWebContentsLike {
  /**
   * Returns `true` if the underlying native web contents has been destroyed.
   * Used as a guard before calling {@link send} to avoid runtime errors.
   *
   * @returns Whether the web contents instance has been destroyed.
   */
  isDestroyed(): boolean;

  /**
   * Sends an asynchronous IPC message to the renderer process associated
   * with this web contents instance.
   *
   * @param channel - The IPC channel name.
   * @param args - Payload arguments to send along with the message.
   */
  send(channel: string, ...args: unknown[]): void;
}

/**
 * Structural type matching `ipcMain.handle()` from Electron.
 *
 * Registers an asynchronous handler for `ipcRenderer.invoke()` calls
 * on the given channel. Only one handler can be registered per channel.
 *
 * **Process context:** main process only.
 *
 * @param channel - The IPC channel name to handle.
 * @param listener - Async handler invoked when a renderer calls `ipcRenderer.invoke(channel)`.
 *   The first argument is the Electron `IpcMainInvokeEvent` (typed as `unknown`
 *   for structural compatibility), followed by any arguments from the renderer.
 */
export type ElectronIpcMainHandle = (
  channel: string,
  listener: (event: unknown, ...args: unknown[]) => unknown,
) => void;

/**
 * Structural type matching `ipcMain.removeHandler()` from Electron.
 *
 * Removes the handler previously registered via {@link ElectronIpcMainHandle}
 * for the given channel. Used during cleanup/disposal.
 *
 * **Process context:** main process only.
 *
 * @param channel - The IPC channel name whose handler should be removed.
 */
export type ElectronIpcMainRemoveHandler = (channel: string) => void;
