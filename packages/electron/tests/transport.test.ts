import { describe, expect, it, vi } from 'vitest';
import {
  createElectronInvalidationSubscriber,
  createElectronSnapshotProvider,
} from '../src/transport';
import type { ElectronInvoke, ElectronListen } from '../src/types';

describe('@statesync/electron transport', () => {
  it('subscriber: forwards invalidation event payload', async () => {
    const listen: ElectronListen = vi.fn((_channel, handler) => {
      handler({ topic: 't', revision: '1' });
      return () => {};
    });

    const subscriber = createElectronInvalidationSubscriber({ listen, channel: 'ch' });

    const received: unknown[] = [];
    const unsub = await subscriber.subscribe((e) => received.push(e));

    expect(listen).toHaveBeenCalledWith('ch', expect.any(Function));
    expect(typeof unsub).toBe('function');
    expect(received).toEqual([{ topic: 't', revision: '1' }]);
  });

  it('provider: invokes channel and returns envelope', async () => {
    const invoke: ElectronInvoke = vi.fn(async () => ({
      revision: '1',
      data: { ok: true },
    }));

    const provider = createElectronSnapshotProvider<{ ok: boolean }>({
      invoke,
      channel: 'snap-ch',
    });

    const snapshot = await provider.getSnapshot();

    expect(snapshot).toEqual({ revision: '1', data: { ok: true } });
    expect(invoke).toHaveBeenCalledWith('snap-ch');
  });

  it('unsubscribe: calls listen returned function', async () => {
    let unsubCalled = false;
    const listen: ElectronListen = vi.fn((_channel, _handler) => {
      return () => {
        unsubCalled = true;
      };
    });

    const subscriber = createElectronInvalidationSubscriber({ listen, channel: 'ch' });
    const unsub = await subscriber.subscribe(() => {});

    expect(unsubCalled).toBe(false);
    unsub();
    expect(unsubCalled).toBe(true);
  });

  it('garbage payload: subscriber does not crash on unexpected shape', async () => {
    const listen: ElectronListen = vi.fn((_channel, handler) => {
      handler({ garbage: true });
      return () => {};
    });

    const subscriber = createElectronInvalidationSubscriber({ listen, channel: 'ch' });

    const received: unknown[] = [];
    const unsub = await subscriber.subscribe((e) => received.push(e));

    // Transport just forwards — validation happens in engine
    expect(received).toHaveLength(1);
    expect(received[0]).toEqual({ garbage: true });
    unsub();
  });
});
