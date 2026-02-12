/**
 * @statesync/electron — Electron IPC transport for state-sync.
 *
 * Provides main-process, preload, and renderer-process primitives for
 * revision-based state synchronization over Electron's IPC channels.
 *
 * Architecture overview:
 *
 * ```mermaid
 * graph LR
 *     subgraph Main Process
 *         B[Broadcaster]
 *         SH[SnapshotHandler]
 *     end
 *     subgraph Preload
 *         BR[Bridge]
 *     end
 *     subgraph Renderer Process
 *         IS[InvalidationSubscriber]
 *         SP[SnapshotProvider]
 *     end
 *
 *     B -- "IPC send()" --> IS
 *     SP -- "invoke()" --> SH
 *     BR -.- B
 *     BR -.- IS
 * ```
 *
 * **Main process** (`main.ts`):
 * - {@link createElectronBroadcaster} — pushes invalidation events to renderers
 * - {@link createElectronSnapshotHandler} — handles snapshot requests from renderers
 *
 * **Preload** (`preload.ts`):
 * - {@link createElectronBridge} — creates a context-bridge-safe IPC bridge
 *
 * **Renderer process** (`transport.ts`, `sync.ts`):
 * - {@link createElectronInvalidationSubscriber} — listens for invalidation events
 * - {@link createElectronSnapshotProvider} — fetches snapshots via IPC invoke
 * - {@link createElectronRevisionSync} — convenience factory wiring bridge → transport → engine
 *
 * @packageDocumentation
 */
export * from './channels';
export * from './main';
export * from './preload';
export * from './sync';
export * from './transport';
export * from './types';
