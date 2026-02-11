import { describe, expect, it, vi } from 'vitest';
import { createElectronBridge } from '../src/preload';
import type { ElectronIpcRendererLike } from '../src/types';

function createMockIpcRenderer(): ElectronIpcRendererLike & {
  _listeners: Map<string, Set<(event: unknown, ...args: unknown[]) => void>>;
} {
  const _listeners = new Map<string, Set<(event: unknown, ...args: unknown[]) => void>>();
  return {
    _listeners,
    on(channel, listener) {
      if (!_listeners.has(channel)) _listeners.set(channel, new Set());
      _listeners.get(channel)?.add(listener);
      return this;
    },
    removeListener(channel, listener) {
      _listeners.get(channel)?.delete(listener);
      return this;
    },
    invoke: vi.fn(async () => 'result'),
  };
}

describe('createElectronBridge', () => {
  it('on() returns an unsubscribe function', () => {
    const ipc = createMockIpcRenderer();
    const bridge = createElectronBridge(ipc);

    const unsub = bridge.on('ch', () => {});
    expect(typeof unsub).toBe('function');
  });

  it('unsubscribe calls removeListener with the EXACT same listener reference', () => {
    const ipc = createMockIpcRenderer();
    const bridge = createElectronBridge(ipc);

    bridge.on('ch', () => {});
    expect(ipc._listeners.get('ch')?.size).toBe(1);

    const chListeners = ipc._listeners.get('ch');
    const [listener] = chListeners ?? [];

    const unsub = bridge.on('ch2', () => {});
    expect(ipc._listeners.get('ch2')?.size).toBe(1);

    unsub();
    expect(ipc._listeners.get('ch2')?.size).toBe(0);

    // Original listener on 'ch' is untouched
    expect(ipc._listeners.get('ch')?.size).toBe(1);
    expect(ipc._listeners.get('ch')?.has(listener)).toBe(true);
  });

  it('strips IPC event arg from callback', () => {
    const ipc = createMockIpcRenderer();
    const bridge = createElectronBridge(ipc);

    const received: unknown[] = [];
    bridge.on('ch', (...args) => received.push(args));

    // Simulate IPC event dispatch: first arg is the event object
    const chListeners = ipc._listeners.get('ch');
    const [listener] = chListeners ?? [];
    listener({ sender: {} }, 'payload1', 'payload2');

    expect(received).toEqual([['payload1', 'payload2']]);
  });

  it('invoke() proxies to ipcRenderer.invoke', async () => {
    const ipc = createMockIpcRenderer();
    (ipc.invoke as ReturnType<typeof vi.fn>).mockResolvedValue({ data: 42 });

    const bridge = createElectronBridge(ipc);
    const result = await bridge.invoke('ch', 'arg1', 'arg2');

    expect(result).toEqual({ data: 42 });
    expect(ipc.invoke).toHaveBeenCalledWith('ch', 'arg1', 'arg2');
  });

  it('multiple subscriptions on same channel are independent', () => {
    const ipc = createMockIpcRenderer();
    const bridge = createElectronBridge(ipc);

    const unsub1 = bridge.on('ch', () => {});
    const unsub2 = bridge.on('ch', () => {});

    expect(ipc._listeners.get('ch')?.size).toBe(2);

    unsub1();
    expect(ipc._listeners.get('ch')?.size).toBe(1);

    unsub2();
    expect(ipc._listeners.get('ch')?.size).toBe(0);
  });

  it('double unsubscribe is safe', () => {
    const ipc = createMockIpcRenderer();
    const bridge = createElectronBridge(ipc);

    const unsub = bridge.on('ch', () => {});
    expect(ipc._listeners.get('ch')?.size).toBe(1);

    unsub();
    expect(ipc._listeners.get('ch')?.size).toBe(0);

    // Second call should not throw
    expect(() => unsub()).not.toThrow();
  });

  it('handler is not called after unsubscribe', () => {
    const ipc = createMockIpcRenderer();
    const bridge = createElectronBridge(ipc);

    const received: unknown[] = [];
    const unsub = bridge.on('ch', (...args) => received.push(args));

    unsub();

    // Simulate IPC event after unsubscribe
    const remaining = ipc._listeners.get('ch');
    for (const listener of remaining ?? []) {
      listener({ sender: {} }, 'should-not-arrive');
    }

    expect(received).toHaveLength(0);
  });

  it('invoke() propagates errors from ipcRenderer', async () => {
    const ipc = createMockIpcRenderer();
    (ipc.invoke as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('IPC down'));

    const bridge = createElectronBridge(ipc);

    await expect(bridge.invoke('ch')).rejects.toThrow('IPC down');
  });
});
