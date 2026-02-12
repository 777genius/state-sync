import type { Revision, SnapshotEnvelope, SyncErrorContext } from '@statesync/core';
import { createRevisionSync } from '@statesync/core';
import { describe, expect, it, vi } from 'vitest';
import { createElectronBridge } from '../src/preload';
import {
  createElectronInvalidationSubscriber,
  createElectronSnapshotProvider,
} from '../src/transport';
import type { ElectronInvoke, ElectronIpcRendererLike, ElectronListen } from '../src/types';

const r = (v: string) => v as Revision;

describe('Electron transport + Engine integration', () => {
  it('garbage payload → protocol error, no crash, no apply', async () => {
    const errors: SyncErrorContext[] = [];
    const applied: SnapshotEnvelope<unknown>[] = [];

    const listeners: Array<(...args: unknown[]) => void> = [];
    const listen: ElectronListen = (_channel, handler) => {
      listeners.push(handler);
      return () => {
        const idx = listeners.indexOf(handler);
        if (idx >= 0) listeners.splice(idx, 1);
      };
    };

    const invoke: ElectronInvoke = vi.fn(async () => ({
      revision: '1',
      data: { value: 'ok' },
    }));

    const handle = createRevisionSync({
      topic: 'settings',
      subscriber: createElectronInvalidationSubscriber({ listen, channel: 'ch:inv' }),
      provider: createElectronSnapshotProvider({ invoke, channel: 'ch:snap' }),
      applier: {
        apply: (s) => {
          applied.push(s);
        },
      },
      onError: (ctx) => errors.push(ctx),
    });

    await handle.start();
    expect(applied).toHaveLength(1);

    for (const l of listeners) {
      l({ garbage: true });
    }

    await new Promise((res) => setTimeout(res, 50));

    expect(errors).toHaveLength(1);
    expect(errors[0].phase).toBe('protocol');
    expect(applied).toHaveLength(1);

    handle.stop();
  });

  it('non-canonical snapshot revision → protocol error', async () => {
    const errors: SyncErrorContext[] = [];
    const applied: SnapshotEnvelope<unknown>[] = [];

    const listen: ElectronListen = (_channel, _handler) => {
      return () => {};
    };

    const invoke: ElectronInvoke = vi.fn(async () => ({
      revision: '01',
      data: { value: 'bad' },
    }));

    const handle = createRevisionSync({
      topic: 'settings',
      subscriber: createElectronInvalidationSubscriber({ listen, channel: 'ch:inv' }),
      provider: createElectronSnapshotProvider({ invoke, channel: 'ch:snap' }),
      applier: {
        apply: (s) => {
          applied.push(s);
        },
      },
      onError: (ctx) => errors.push(ctx),
    });

    await expect(handle.start()).rejects.toThrow('Non-canonical snapshot revision');
    expect(errors).toHaveLength(1);
    expect(errors[0].phase).toBe('protocol');
    expect(applied).toHaveLength(0);
  });

  it('happy path: valid transport → engine applies', async () => {
    const applied: SnapshotEnvelope<{ value: string }>[] = [];
    const errors: SyncErrorContext[] = [];

    const listeners: Array<(...args: unknown[]) => void> = [];
    const listen: ElectronListen = (_channel, handler) => {
      listeners.push(handler);
      return () => {
        const idx = listeners.indexOf(handler);
        if (idx >= 0) listeners.splice(idx, 1);
      };
    };

    let snapshotRevision = '1';
    let snapshotData = 'initial';
    const invoke: ElectronInvoke = vi.fn(async () => ({
      revision: snapshotRevision,
      data: { value: snapshotData },
    }));

    const handle = createRevisionSync<{ value: string }>({
      topic: 'settings',
      subscriber: createElectronInvalidationSubscriber({ listen, channel: 'ch:inv' }),
      provider: createElectronSnapshotProvider({ invoke, channel: 'ch:snap' }),
      applier: {
        apply: (s) => {
          applied.push(s);
        },
      },
      onError: (ctx) => errors.push(ctx),
    });

    await handle.start();

    expect(applied).toHaveLength(1);
    expect(applied[0].revision).toBe(r('1'));
    expect(applied[0].data).toEqual({ value: 'initial' });
    expect(handle.getLocalRevision()).toBe(r('1'));

    snapshotRevision = '5';
    snapshotData = 'updated';
    for (const l of listeners) {
      l({ topic: 'settings', revision: '5' });
    }

    await vi.waitFor(() => {
      expect(applied).toHaveLength(2);
    });

    expect(applied[1].revision).toBe(r('5'));
    expect(applied[1].data).toEqual({ value: 'updated' });
    expect(handle.getLocalRevision()).toBe(r('5'));
    expect(errors).toHaveLength(0);

    handle.stop();
  });

  it('bridge end-to-end: preload → transport → engine', async () => {
    const listeners = new Map<string, Set<(event: unknown, ...args: unknown[]) => void>>();

    const mockIpcRenderer: ElectronIpcRendererLike = {
      on(channel, listener) {
        if (!listeners.has(channel)) listeners.set(channel, new Set());
        listeners.get(channel)?.add(listener);
        return this;
      },
      removeListener(channel, listener) {
        listeners.get(channel)?.delete(listener);
        return this;
      },
      invoke: vi.fn(async () => ({
        revision: '1',
        data: { count: 0 },
      })),
    };

    const bridge = createElectronBridge(mockIpcRenderer);

    const applied: Array<{ revision: string; count: number }> = [];

    const handle = createRevisionSync<{ count: number }>({
      topic: 'counter',
      subscriber: createElectronInvalidationSubscriber({
        listen: bridge.on,
        channel: 'statesync:counter:invalidated',
      }),
      provider: createElectronSnapshotProvider({
        invoke: bridge.invoke,
        channel: 'statesync:counter:snapshot',
      }),
      applier: {
        apply: (s) => {
          applied.push({ revision: s.revision, count: s.data.count });
        },
      },
    });

    await handle.start();
    expect(applied).toEqual([{ revision: '1', count: 0 }]);

    // Simulate main process sending IPC event
    (mockIpcRenderer.invoke as ReturnType<typeof vi.fn>).mockResolvedValue({
      revision: '2',
      data: { count: 1 },
    });

    const invHandlers = listeners.get('statesync:counter:invalidated') ?? new Set();
    expect(invHandlers.size).toBe(1);
    for (const h of invHandlers) {
      h({ sender: {} }, { topic: 'counter', revision: '2' });
    }

    await vi.waitFor(() => {
      expect(applied).toHaveLength(2);
    });

    expect(applied[1]).toEqual({ revision: '2', count: 1 });

    handle.stop();

    // Verify listener was removed
    expect(listeners.get('statesync:counter:invalidated')?.size).toBe(0);
  });

  it('start() after stop() throws', async () => {
    const listen: ElectronListen = (_channel, _handler) => {
      return () => {};
    };

    const invoke: ElectronInvoke = vi.fn(async () => ({
      revision: '1',
      data: null,
    }));

    const handle = createRevisionSync({
      topic: 'test',
      subscriber: createElectronInvalidationSubscriber({ listen, channel: 'ch:inv' }),
      provider: createElectronSnapshotProvider({ invoke, channel: 'ch:snap' }),
      applier: { apply() {} },
    });

    await handle.start();
    handle.stop();

    await expect(handle.start()).rejects.toThrow('start() called after stop()');
  });

  it('invoke error propagates through engine onError', async () => {
    const errors: SyncErrorContext[] = [];

    const listen: ElectronListen = (_channel, _handler) => {
      return () => {};
    };

    const invoke: ElectronInvoke = vi.fn(async () => {
      throw new Error('IPC channel closed');
    });

    const handle = createRevisionSync({
      topic: 'test',
      subscriber: createElectronInvalidationSubscriber({ listen, channel: 'ch:inv' }),
      provider: createElectronSnapshotProvider({ invoke, channel: 'ch:snap' }),
      applier: { apply() {} },
      onError: (ctx) => errors.push(ctx),
    });

    await expect(handle.start()).rejects.toThrow('IPC channel closed');
    expect(errors).toHaveLength(1);
    expect(errors[0].phase).toBe('getSnapshot');
  });

  it('start() is idempotent', async () => {
    const listen: ElectronListen = (_channel, _handler) => {
      return () => {};
    };

    const applied: unknown[] = [];
    const invoke: ElectronInvoke = vi.fn(async () => ({
      revision: '1',
      data: null,
    }));

    const handle = createRevisionSync({
      topic: 'test',
      subscriber: createElectronInvalidationSubscriber({ listen, channel: 'ch:inv' }),
      provider: createElectronSnapshotProvider({ invoke, channel: 'ch:snap' }),
      applier: {
        apply: (s) => {
          applied.push(s);
        },
      },
    });

    await handle.start();
    await handle.start();
    await handle.start();

    expect(applied).toHaveLength(1);

    handle.stop();
  });

  it('stop() is idempotent', async () => {
    const listen: ElectronListen = (_channel, _handler) => {
      return () => {};
    };

    const invoke: ElectronInvoke = vi.fn(async () => ({
      revision: '1',
      data: null,
    }));

    const handle = createRevisionSync({
      topic: 'test',
      subscriber: createElectronInvalidationSubscriber({ listen, channel: 'ch:inv' }),
      provider: createElectronSnapshotProvider({ invoke, channel: 'ch:snap' }),
      applier: { apply() {} },
    });

    await handle.start();

    handle.stop();
    handle.stop();
    handle.stop();
    // Should not throw
  });

  it('multiple topics on same bridge are independent', async () => {
    const listeners = new Map<string, Set<(event: unknown, ...args: unknown[]) => void>>();

    const mockIpcRenderer: ElectronIpcRendererLike = {
      on(channel, listener) {
        if (!listeners.has(channel)) listeners.set(channel, new Set());
        listeners.get(channel)?.add(listener);
        return this;
      },
      removeListener(channel, listener) {
        listeners.get(channel)?.delete(listener);
        return this;
      },
      invoke: vi.fn(async (channel) => {
        if (channel === 'statesync:settings:snapshot') {
          return { revision: '1', data: { theme: 'dark' } };
        }
        return { revision: '1', data: { name: 'Alice' } };
      }),
    };

    const bridge = createElectronBridge(mockIpcRenderer);

    const settingsApplied: unknown[] = [];
    const userApplied: unknown[] = [];

    const settingsHandle = createRevisionSync<{ theme: string }>({
      topic: 'settings',
      subscriber: createElectronInvalidationSubscriber({
        listen: bridge.on,
        channel: 'statesync:settings:invalidated',
      }),
      provider: createElectronSnapshotProvider({
        invoke: bridge.invoke,
        channel: 'statesync:settings:snapshot',
      }),
      applier: {
        apply: (s) => {
          settingsApplied.push(s.data);
        },
      },
    });

    const userHandle = createRevisionSync<{ name: string }>({
      topic: 'user',
      subscriber: createElectronInvalidationSubscriber({
        listen: bridge.on,
        channel: 'statesync:user:invalidated',
      }),
      provider: createElectronSnapshotProvider({
        invoke: bridge.invoke,
        channel: 'statesync:user:snapshot',
      }),
      applier: {
        apply: (s) => {
          userApplied.push(s.data);
        },
      },
    });

    await Promise.all([settingsHandle.start(), userHandle.start()]);

    expect(settingsApplied).toEqual([{ theme: 'dark' }]);
    expect(userApplied).toEqual([{ name: 'Alice' }]);

    expect(listeners.has('statesync:settings:invalidated')).toBe(true);
    expect(listeners.has('statesync:user:invalidated')).toBe(true);

    settingsHandle.stop();
    userHandle.stop();
  });
});
