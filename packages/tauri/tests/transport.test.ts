import { describe, expect, it, vi } from 'vitest';

import {
  createTauriInvalidationSubscriber,
  createTauriSnapshotProvider,
  type TauriInvoke,
  type TauriListen,
} from '../src/transport';

describe('state-sync-tauri transport', () => {
  it('createTauriInvalidationSubscriber: forwards event payloads', async () => {
    const listen: TauriListen = vi.fn(async (_eventName, handler) => {
      handler({ payload: { topic: 't', revision: '1' } });
      return () => {};
    });

    const subscriber = createTauriInvalidationSubscriber({ listen, eventName: 'evt' });

    const received: unknown[] = [];
    const unlisten = await subscriber.subscribe((e) => received.push(e));

    expect(typeof unlisten).toBe('function');
    expect(received).toEqual([{ topic: 't', revision: '1' }]);
  });

  it('createTauriSnapshotProvider: invokes command and returns envelope', async () => {
    const invoke = vi.fn(async () => ({
      revision: '1',
      data: { ok: true },
    })) as unknown as TauriInvoke;

    const provider = createTauriSnapshotProvider<{ ok: boolean }>({
      invoke,
      commandName: 'get_snapshot',
      args: { topic: 't' },
    });

    const snapshot = await provider.getSnapshot();

    expect(snapshot).toEqual({ revision: '1', data: { ok: true } });
    expect(invoke).toHaveBeenCalledWith('get_snapshot', { topic: 't' });
  });

  it('unsubscribe: calling unlisten prevents further events', async () => {
    const handlers: Array<(e: { payload: unknown }) => void> = [];
    let unlistenCalled = false;

    const listen: TauriListen = vi.fn(async (_eventName, h) => {
      handlers.push(h);
      return () => {
        unlistenCalled = true;
      };
    });

    const subscriber = createTauriInvalidationSubscriber({ listen, eventName: 'evt' });

    const received: unknown[] = [];
    const unlisten = await subscriber.subscribe((e) => received.push(e));

    expect(handlers).toHaveLength(1);
    handlers[0]({ payload: { topic: 'x', revision: '1' } });
    expect(received).toHaveLength(1);

    unlisten();
    expect(unlistenCalled).toBe(true);
  });

  it('invoke args: passes args exactly as provided', async () => {
    const invoke = vi.fn(async () => ({
      revision: '1',
      data: null,
    })) as unknown as TauriInvoke;

    const customArgs = { topic: 'settings', windowId: 'main', extra: 42 };
    const provider = createTauriSnapshotProvider<null>({
      invoke,
      commandName: 'cmd',
      args: customArgs,
    });

    await provider.getSnapshot();

    expect(invoke).toHaveBeenCalledWith('cmd', customArgs);
  });

  it('garbage payload: subscriber does not crash on unexpected shape', async () => {
    const listen: TauriListen = vi.fn(async (_eventName, handler) => {
      handler({ payload: { garbage: true } });
      return () => {};
    });

    const subscriber = createTauriInvalidationSubscriber({ listen, eventName: 'evt' });

    const received: unknown[] = [];
    const unlisten = await subscriber.subscribe((e) => received.push(e));

    // The transport just forwards the payload — validation happens in the engine
    expect(received).toHaveLength(1);
    expect(received[0]).toEqual({ garbage: true });
    unlisten();
  });
});
