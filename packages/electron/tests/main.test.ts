import { describe, expect, it, vi } from 'vitest';
import { createElectronBroadcaster, createElectronSnapshotHandler } from '../src/main';
import type { ElectronWebContentsLike } from '../src/types';

function createMockWebContents(destroyed = false): ElectronWebContentsLike & {
  _sent: Array<{ channel: string; args: unknown[] }>;
} {
  const _sent: Array<{ channel: string; args: unknown[] }> = [];
  return {
    _sent,
    isDestroyed: () => destroyed,
    send(channel, ...args) {
      if (destroyed) throw new Error('Object has been destroyed');
      _sent.push({ channel, args });
    },
  };
}

describe('createElectronBroadcaster', () => {
  it('sends invalidation event to all targets', () => {
    const wc1 = createMockWebContents();
    const wc2 = createMockWebContents();

    const broadcaster = createElectronBroadcaster({
      topic: 'settings',
      getTargets: () => [wc1, wc2],
    });

    broadcaster.invalidate('1');

    expect(wc1._sent).toHaveLength(1);
    expect(wc1._sent[0].channel).toBe('statesync:settings:invalidated');
    expect(wc1._sent[0].args[0]).toMatchObject({
      topic: 'settings',
      revision: '1',
      timestampMs: expect.any(Number),
    });
    expect(wc2._sent).toHaveLength(1);
  });

  it('skips destroyed webContents', () => {
    const alive = createMockWebContents();
    const dead = createMockWebContents(true);

    const broadcaster = createElectronBroadcaster({
      topic: 'test',
      getTargets: () => [alive, dead],
    });

    broadcaster.invalidate('1');

    expect(alive._sent).toHaveLength(1);
    expect(dead._sent).toHaveLength(0);
  });

  it('handles TOCTOU: send() throws after isDestroyed() check', () => {
    const toctou: ElectronWebContentsLike = {
      isDestroyed: () => false,
      send() {
        throw new Error('Object has been destroyed');
      },
    };

    const broadcaster = createElectronBroadcaster({
      topic: 'test',
      getTargets: () => [toctou],
    });

    // Should not throw
    expect(() => broadcaster.invalidate('1')).not.toThrow();
  });

  it('handles empty targets', () => {
    const broadcaster = createElectronBroadcaster({
      topic: 'test',
      getTargets: () => [],
    });

    expect(() => broadcaster.invalidate('1')).not.toThrow();
  });

  it('uses custom channel', () => {
    const wc = createMockWebContents();

    const broadcaster = createElectronBroadcaster({
      topic: 'test',
      getTargets: () => [wc],
      channel: 'custom:channel',
    });

    broadcaster.invalidate('1');

    expect(wc._sent[0].channel).toBe('custom:channel');
  });

  it('passes sourceId in event', () => {
    const wc = createMockWebContents();

    const broadcaster = createElectronBroadcaster({
      topic: 'test',
      getTargets: () => [wc],
    });

    broadcaster.invalidate('1', { sourceId: 'window-1' });

    expect(wc._sent[0].args[0]).toMatchObject({
      sourceId: 'window-1',
      timestampMs: expect.any(Number),
    });
  });

  it('uses default invalidation channel', () => {
    const wc = createMockWebContents();

    const broadcaster = createElectronBroadcaster({
      topic: 'settings',
      getTargets: () => [wc],
    });

    broadcaster.invalidate('1');
    expect(wc._sent[0].channel).toBe('statesync:settings:invalidated');
  });

  it('handles dynamic window list (windows open/close)', () => {
    const windows: (ElectronWebContentsLike & {
      _sent: Array<{ channel: string; args: unknown[] }>;
    })[] = [];

    const broadcaster = createElectronBroadcaster({
      topic: 'test',
      getTargets: () => windows,
    });

    const wc1 = createMockWebContents();
    windows.push(wc1);
    broadcaster.invalidate('1');
    expect(wc1._sent).toHaveLength(1);

    const wc2 = createMockWebContents();
    windows.push(wc2);
    broadcaster.invalidate('2');
    expect(wc1._sent).toHaveLength(2);
    expect(wc2._sent).toHaveLength(1);

    windows.splice(0, 1);
    broadcaster.invalidate('3');
    expect(wc1._sent).toHaveLength(2);
    expect(wc2._sent).toHaveLength(2);
  });
});

describe('createElectronSnapshotHandler', () => {
  it('registers handler and disposes', () => {
    const handleFn = vi.fn();
    const removeHandlerFn = vi.fn();

    const handler = createElectronSnapshotHandler({
      topic: 'settings',
      getSnapshot: () => ({ revision: '1' as any, data: { ok: true } }),
      handle: handleFn,
      removeHandler: removeHandlerFn,
    });

    expect(handleFn).toHaveBeenCalledWith('statesync:settings:snapshot', expect.any(Function));

    handler.dispose();
    expect(removeHandlerFn).toHaveBeenCalledWith('statesync:settings:snapshot');
  });

  it('handler invokes getSnapshot', async () => {
    let registeredHandler: (event: unknown) => unknown = () => {};

    const handleFn = vi.fn((_channel: string, listener: (event: unknown) => unknown) => {
      registeredHandler = listener;
    });

    createElectronSnapshotHandler({
      topic: 'test',
      getSnapshot: () => ({ revision: '5' as any, data: { value: 'hello' } }),
      handle: handleFn,
      removeHandler: vi.fn(),
    });

    const result = await registeredHandler({});
    expect(result).toEqual({ revision: '5', data: { value: 'hello' } });
  });

  it('uses custom channel', () => {
    const handleFn = vi.fn();

    createElectronSnapshotHandler({
      topic: 'test',
      getSnapshot: () => ({ revision: '1' as any, data: null }),
      handle: handleFn,
      removeHandler: vi.fn(),
      channel: 'custom:snap',
    });

    expect(handleFn).toHaveBeenCalledWith('custom:snap', expect.any(Function));
  });

  it('uses default snapshot channel', () => {
    const handleFn = vi.fn();

    createElectronSnapshotHandler({
      topic: 'settings',
      getSnapshot: () => ({ revision: '1' as any, data: null }),
      handle: handleFn,
      removeHandler: vi.fn(),
    });

    expect(handleFn).toHaveBeenCalledWith('statesync:settings:snapshot', expect.any(Function));
  });

  it('handler propagates getSnapshot errors', async () => {
    let registeredHandler: (event: unknown) => unknown = () => {};

    const handleFn = vi.fn((_channel: string, listener: (event: unknown) => unknown) => {
      registeredHandler = listener;
    });

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    createElectronSnapshotHandler({
      topic: 'test',
      getSnapshot: () => {
        throw new Error('DB down');
      },
      handle: handleFn,
      removeHandler: vi.fn(),
    });

    await expect(registeredHandler({})).rejects.toThrow('DB down');
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('dispose() is idempotent', () => {
    const handleFn = vi.fn();
    const removeHandlerFn = vi.fn();

    const handler = createElectronSnapshotHandler({
      topic: 'test',
      getSnapshot: () => ({ revision: '1' as any, data: null }),
      handle: handleFn,
      removeHandler: removeHandlerFn,
    });

    handler.dispose();
    handler.dispose();
    handler.dispose();

    expect(removeHandlerFn).toHaveBeenCalledTimes(1);
  });

  it('handler awaits async getSnapshot', async () => {
    let registeredHandler: (event: unknown) => unknown = () => {};

    const handleFn = vi.fn((_channel: string, listener: (event: unknown) => unknown) => {
      registeredHandler = listener;
    });

    createElectronSnapshotHandler({
      topic: 'test',
      getSnapshot: async () => {
        await new Promise((r) => setTimeout(r, 10));
        return { revision: '5' as any, data: { value: 'async' } };
      },
      handle: handleFn,
      removeHandler: vi.fn(),
    });

    const result = await registeredHandler({});
    expect(result).toEqual({ revision: '5', data: { value: 'async' } });
  });
});
