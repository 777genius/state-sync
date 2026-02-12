import type {
  InvalidationEvent,
  Revision,
  RevisionSyncHandle,
  SnapshotEnvelope,
} from '@statesync/core';
import { createRevisionSync } from '@statesync/core';
import {
  createElectronInvalidationSubscriber,
  createElectronSnapshotProvider,
} from '../../src/transport';
import type { ElectronListen } from '../../src/types';

export interface WindowHandle<T> {
  id: string;
  handle: RevisionSyncHandle;
  getApplied: () => SnapshotEnvelope<T>[];
}

/**
 * Multi-window simulation bus for Electron integration tests.
 * Simulates main process + multiple renderer windows communicating via IPC.
 */
export class MultiWindowElectronBus<T> {
  private data: T;
  private revision = 0;
  private windowListeners = new Map<string, Set<(...args: unknown[]) => void>>();
  private windows = new Map<string, WindowHandle<T>>();
  readonly topic: string;

  constructor(initialData: T, topic = 'test') {
    this.data = initialData;
    this.topic = topic;
  }

  getStoreRevision(): string {
    return String(this.revision);
  }

  getStoreData(): T {
    return JSON.parse(JSON.stringify(this.data));
  }

  createWindow(id: string): WindowHandle<T> {
    const listeners = new Set<(...args: unknown[]) => void>();
    this.windowListeners.set(id, listeners);

    const listen: ElectronListen = (_channel, handler) => {
      listeners.add(handler);
      return () => {
        listeners.delete(handler);
      };
    };

    const applied: SnapshotEnvelope<T>[] = [];

    const handle = createRevisionSync<T>({
      topic: this.topic,
      subscriber: createElectronInvalidationSubscriber({
        listen,
        channel: `statesync:${this.topic}:invalidated`,
      }),
      provider: createElectronSnapshotProvider<T>({
        invoke: async () => ({
          revision: String(this.revision) as Revision,
          data: JSON.parse(JSON.stringify(this.data)),
        }),
        channel: `statesync:${this.topic}:snapshot`,
      }),
      applier: {
        apply(snapshot) {
          applied.push(snapshot);
        },
      },
    });

    const windowHandle: WindowHandle<T> = {
      id,
      handle,
      getApplied: () => applied,
    };

    this.windows.set(id, windowHandle);
    return windowHandle;
  }

  destroyWindow(id: string): void {
    const win = this.windows.get(id);
    if (win) {
      win.handle.stop();
      this.windowListeners.delete(id);
      this.windows.delete(id);
    }
  }

  mutate(data: T): void {
    this.data = data;
    this.revision++;
    this.broadcast();
  }

  private broadcast(): void {
    const event: InvalidationEvent = {
      topic: this.topic,
      revision: String(this.revision) as Revision,
      timestampMs: Date.now(),
    };

    for (const [_id, listeners] of this.windowListeners) {
      for (const listener of listeners) {
        listener(event);
      }
    }
  }

  async waitForConvergence(timeout = 5000): Promise<void> {
    const start = Date.now();
    const expectedRevision = String(this.revision);

    while (Date.now() - start < timeout) {
      let allConverged = true;
      for (const [_id, win] of this.windows) {
        if (win.handle.getLocalRevision() !== expectedRevision) {
          allConverged = false;
          break;
        }
      }
      if (allConverged) return;
      await new Promise((r) => setTimeout(r, 10));
    }

    throw new Error(`Convergence timeout after ${timeout}ms`);
  }

  getWindow(id: string): WindowHandle<T> {
    const win = this.windows.get(id);
    if (!win) throw new Error(`Window ${id} not found`);
    return win;
  }

  getAllWindows(): WindowHandle<T>[] {
    return Array.from(this.windows.values());
  }
}
