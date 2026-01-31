import { createRevisionSync, type RevisionSyncHandle } from '../../src/engine';
import type {
  InvalidationEvent,
  InvalidationSubscriber,
  Revision,
  SnapshotApplier,
  SnapshotEnvelope,
  SnapshotProvider,
  SyncErrorContext,
  Unsubscribe,
} from '../../src/types';

const r = (v: string) => v as Revision;

export interface BusConfig {
  ipcDelayMs?: number;
  broadcastJitterMs?: number;
  serializeSnapshots?: boolean;
  /**
   * When true, all broadcasts go through setTimeout(0) — mimicking
   * real Tauri `emit_all` which is always async (Rust→IPC→JS event loop).
   */
  asyncBroadcast?: boolean;
  /**
   * Simulates Rust `Mutex<AppState>` contention: concurrent getSnapshot
   * calls are serialized with this delay between them.
   */
  mutexContentionMs?: number;
  /**
   * Probability (0–1) that an event is delivered twice to a handler.
   * Real IPC can deliver duplicates on reconnect or network hiccups.
   */
  duplicateEventProbability?: number;
  /**
   * Probability (0–1) that an event is silently dropped for a handler.
   * Simulates lossy IPC channels or event listener GC races.
   */
  eventDropProbability?: number;
}

export interface WindowConfig {
  ipcDelayMs?: number;
  failCount?: number;
  snapshotInterceptor?: (envelope: SnapshotEnvelope<unknown>) => SnapshotEnvelope<unknown>;
  onApply?: (snapshot: SnapshotEnvelope<unknown>) => void;
}

export interface WindowHandle<T> {
  id: string;
  subscriber: InvalidationSubscriber;
  provider: SnapshotProvider<T>;
  applier: SnapshotApplier<T>;
  applied: SnapshotEnvelope<T>[];
  errors: SyncErrorContext[];
  handle: RevisionSyncHandle;
}

/**
 * Simulates a Tauri backend with shared store and IPC-like communication.
 *
 * Realistic behaviors:
 * - Snapshots go through JSON serialization round-trip (like real Tauri IPC)
 * - Event broadcast is async with configurable jitter (like real emit_all)
 * - getSnapshot has async IPC delay (like real Tauri invoke)
 * - Each window gets its own deep-copied data (no shared references)
 */
export class MultiWindowBus<T> {
  private data: T;
  private revision = 0;
  private handlers = new Map<string, Set<(e: InvalidationEvent) => void>>();
  private windows = new Map<string, WindowHandle<T>>();
  private configs = new Map<string, WindowConfig>();
  private failCounters = new Map<string, number>();
  private busConfig: Required<BusConfig>;
  private mutexQueue: Promise<void> = Promise.resolve();
  readonly topic: string;

  constructor(initialData: T, topicOrConfig?: string | BusConfig, config?: BusConfig) {
    this.data = initialData;
    const defaults: Required<BusConfig> = {
      ipcDelayMs: 1,
      broadcastJitterMs: 0,
      serializeSnapshots: true,
      asyncBroadcast: false,
      mutexContentionMs: 0,
      duplicateEventProbability: 0,
      eventDropProbability: 0,
    };
    if (typeof topicOrConfig === 'string') {
      this.topic = topicOrConfig;
      this.busConfig = { ...defaults, ...config };
    } else {
      this.topic = 'test';
      this.busConfig = { ...defaults, ...topicOrConfig };
    }
  }

  /**
   * Simulates Rust Mutex<AppState> — concurrent getSnapshot calls are
   * serialized, each waiting for the previous to finish + contention delay.
   */
  private async withMutex<R>(fn: () => Promise<R>): Promise<R> {
    const contentionMs = this.busConfig.mutexContentionMs;
    if (!contentionMs) return fn();

    const prev = this.mutexQueue;
    let release!: () => void;
    this.mutexQueue = new Promise((r) => {
      release = r;
    });

    await prev;
    if (contentionMs > 0) {
      await new Promise((r) => setTimeout(r, contentionMs));
    }
    try {
      return await fn();
    } finally {
      release();
    }
  }

  getStoreRevision(): Revision {
    return r(String(this.revision));
  }

  getStoreData(): T {
    return this.data;
  }

  configureWindow(id: string, config: Partial<WindowConfig>): void {
    const existing = this.configs.get(id) ?? {};
    this.configs.set(id, { ...existing, ...config });
    if (config.failCount !== undefined) {
      this.failCounters.set(id, config.failCount);
    }
  }

  private serializeData(data: T): T {
    if (!this.busConfig.serializeSnapshots) return data;
    return JSON.parse(JSON.stringify(data));
  }

  createWindow(id: string, config?: WindowConfig): WindowHandle<T> {
    if (config) {
      this.configs.set(id, config);
      if (config.failCount !== undefined) {
        this.failCounters.set(id, config.failCount);
      }
    }

    const windowHandlers = new Set<(e: InvalidationEvent) => void>();
    this.handlers.set(id, windowHandlers);

    const applied: SnapshotEnvelope<T>[] = [];
    const errors: SyncErrorContext[] = [];

    const subscriber: InvalidationSubscriber = {
      subscribe: async (handler: (e: InvalidationEvent) => void): Promise<Unsubscribe> => {
        windowHandlers.add(handler);
        return () => {
          windowHandlers.delete(handler);
        };
      },
    };

    const provider: SnapshotProvider<T> = {
      getSnapshot: async (): Promise<SnapshotEnvelope<T>> => {
        const cfg = this.configs.get(id);

        const remaining = this.failCounters.get(id) ?? 0;
        if (remaining > 0) {
          this.failCounters.set(id, remaining - 1);
          throw new Error(`Simulated provider failure for window ${id}`);
        }

        return this.withMutex(async () => {
          // IPC delay: per-window override or bus default
          const delay = cfg?.ipcDelayMs ?? this.busConfig.ipcDelayMs;
          if (delay > 0) {
            await new Promise((resolve) => setTimeout(resolve, delay));
          }

          let envelope: SnapshotEnvelope<T> = {
            revision: r(String(this.revision)),
            data: this.serializeData(this.data),
          };

          if (cfg?.snapshotInterceptor) {
            envelope = cfg.snapshotInterceptor(
              envelope as SnapshotEnvelope<unknown>,
            ) as SnapshotEnvelope<T>;
          }

          return envelope;
        });
      },
    };

    const onApplyCallback = config?.onApply;
    const applier: SnapshotApplier<T> = {
      apply: (snapshot: SnapshotEnvelope<T>): void => {
        applied.push(snapshot);
        onApplyCallback?.(snapshot as SnapshotEnvelope<unknown>);
      },
    };

    const handle = createRevisionSync({
      topic: this.topic,
      subscriber,
      provider,
      applier,
      onError: (ctx) => errors.push(ctx),
    });

    const windowHandle: WindowHandle<T> = {
      id,
      subscriber,
      provider,
      applier,
      applied,
      errors,
      handle,
    };

    this.windows.set(id, windowHandle);
    return windowHandle;
  }

  /**
   * Create a window with fully custom subscriber/provider/applier.
   * Unlike raw private field access, this properly registers the window
   * for convergence checks and handler management.
   */
  createCustomWindow(
    id: string,
    opts: {
      providerOverride?: SnapshotProvider<T>;
      applierOverride?: SnapshotApplier<T>;
      subscriberOverride?: InvalidationSubscriber;
    },
  ): WindowHandle<T> {
    // Reuse existing handler set if created via getHandlerSet(), otherwise create new
    const windowHandlers = this.handlers.get(id) ?? new Set<(e: InvalidationEvent) => void>();
    this.handlers.set(id, windowHandlers);

    const applied: SnapshotEnvelope<T>[] = [];
    const errors: SyncErrorContext[] = [];

    const defaultSubscriber: InvalidationSubscriber = {
      subscribe: async (handler: (e: InvalidationEvent) => void): Promise<Unsubscribe> => {
        windowHandlers.add(handler);
        return () => {
          windowHandlers.delete(handler);
        };
      },
    };

    const defaultProvider: SnapshotProvider<T> = {
      getSnapshot: async () => {
        return this.withMutex(async () => {
          const delay = this.busConfig.ipcDelayMs;
          if (delay > 0) await new Promise((resolve) => setTimeout(resolve, delay));
          return {
            revision: r(String(this.revision)),
            data: this.serializeData(this.data),
          };
        });
      },
    };

    const subscriber = opts.subscriberOverride ?? defaultSubscriber;
    const provider = opts.providerOverride ?? defaultProvider;
    const applier = opts.applierOverride ?? {
      apply: (snapshot: SnapshotEnvelope<T>): void => {
        applied.push(snapshot);
      },
    };

    const handle = createRevisionSync({
      topic: this.topic,
      subscriber,
      provider,
      applier,
      onError: (ctx) => errors.push(ctx),
    });

    const windowHandle: WindowHandle<T> = {
      id,
      subscriber,
      provider,
      applier,
      applied,
      errors,
      handle,
    };

    this.windows.set(id, windowHandle);
    return windowHandle;
  }

  /**
   * Register an externally-created handle into the bus for convergence checks.
   */
  registerHandle(id: string, handle: RevisionSyncHandle): void {
    this.windows.set(id, {
      id,
      handle,
      subscriber: null as any,
      provider: null as any,
      applier: null as any,
      applied: [],
      errors: [],
    });
  }

  /**
   * Get the handler set for a given window id, to hook a custom subscriber.
   */
  getHandlerSet(id: string): Set<(e: InvalidationEvent) => void> {
    let set = this.handlers.get(id);
    if (!set) {
      set = new Set();
      this.handlers.set(id, set);
    }
    return set;
  }

  destroyWindow(id: string): void {
    const win = this.windows.get(id);
    if (win) {
      win.handle.stop();
      this.handlers.delete(id);
      this.windows.delete(id);
    }
  }

  mutate(data: T): void {
    this.data = data;
    this.revision++;
    this.broadcast();
  }

  mutateFrom(windowId: string, data: T): void {
    this.data = data;
    this.revision++;
    this.broadcast(windowId);
  }

  private broadcast(sourceWindowId?: string): void {
    const event: InvalidationEvent = {
      topic: this.topic,
      revision: r(String(this.revision)),
      sourceId: sourceWindowId,
    };

    const jitter = this.busConfig.broadcastJitterMs;
    const asyncMode = this.busConfig.asyncBroadcast;
    const dupProb = this.busConfig.duplicateEventProbability;
    const dropProb = this.busConfig.eventDropProbability;

    for (const [, windowHandlers] of this.handlers) {
      for (const handler of windowHandlers) {
        // Simulate event drop (lossy IPC)
        if (dropProb > 0 && Math.random() < dropProb) continue;

        const deliver = () => {
          handler(event);
          // Simulate duplicate delivery (IPC reconnect / network hiccup)
          if (dupProb > 0 && Math.random() < dupProb) {
            setTimeout(() => handler(event), 1 + Math.random() * 3);
          }
        };

        if (jitter > 0) {
          const delay = Math.random() * jitter;
          setTimeout(deliver, delay);
        } else if (asyncMode) {
          // Real Tauri emit_all is always async: Rust → serde → IPC → JS event loop
          setTimeout(deliver, 0);
        } else {
          deliver();
        }
      }
    }
  }

  broadcastToAll(): void {
    const event: InvalidationEvent = {
      topic: this.topic,
      revision: r(String(this.revision)),
    };

    for (const [, windowHandlers] of this.handlers) {
      for (const handler of windowHandlers) {
        handler(event);
      }
    }
  }

  async waitForConvergence(timeout = 5000): Promise<void> {
    const start = Date.now();
    const targetRevision = r(String(this.revision));

    while (Date.now() - start < timeout) {
      let allConverged = true;
      for (const [, win] of this.windows) {
        if (win.handle.getLocalRevision() !== targetRevision) {
          allConverged = false;
          break;
        }
      }
      if (allConverged) return;
      await new Promise((resolve) => setTimeout(resolve, 5));
    }

    const states: string[] = [];
    for (const [id, win] of this.windows) {
      states.push(`${id}=${win.handle.getLocalRevision()}`);
    }
    throw new Error(
      `Convergence timeout after ${timeout}ms. Store=${targetRevision}, windows: ${states.join(', ')}`,
    );
  }

  getWindow(id: string): WindowHandle<T> {
    const win = this.windows.get(id);
    if (!win) throw new Error(`Window ${id} not found`);
    return win;
  }

  getAllWindows(): WindowHandle<T>[] {
    return [...this.windows.values()];
  }
}
