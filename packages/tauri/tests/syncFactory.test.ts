import { describe, expect, it, vi } from 'vitest';
import { createTauriRevisionSync } from '../src/sync';
import type { TauriInvoke, TauriListen } from '../src/transport';

describe('createTauriRevisionSync (DX sugar)', () => {
  it('wires listen/invoke into a RevisionSyncHandle and applies snapshots', async () => {
    const handlers: Array<(e: { payload: unknown }) => void> = [];

    const listen: TauriListen = vi.fn(async (_eventName, handler) => {
      handlers.push(handler);
      return () => {
        const idx = handlers.indexOf(handler);
        if (idx >= 0) handlers.splice(idx, 1);
      };
    });

    let snapshotRevision = '1';
    let snapshotValue = 'initial';
    const invoke = vi.fn(async () => ({
      revision: snapshotRevision,
      data: { value: snapshotValue },
    })) as unknown as TauriInvoke;

    const applied: Array<{ revision: string; value: string }> = [];

    const handle = createTauriRevisionSync<{ value: string }>({
      topic: 'settings',
      listen,
      invoke,
      eventName: 'evt',
      commandName: 'get_snapshot',
      applier: {
        apply: (s) => {
          applied.push({ revision: s.revision, value: s.data.value });
        },
      },
      logger: { debug() {}, warn() {}, error() {} },
    });

    await handle.start();
    expect(applied).toEqual([{ revision: '1', value: 'initial' }]);

    snapshotRevision = '5';
    snapshotValue = 'updated';
    for (const h of handlers) {
      h({ payload: { topic: 'settings', revision: '5' } });
    }

    await vi.waitFor(() => {
      expect(applied).toHaveLength(2);
    });

    expect(applied[1]).toEqual({ revision: '5', value: 'updated' });

    handle.stop();
  });
});
