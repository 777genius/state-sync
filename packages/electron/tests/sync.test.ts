import { describe, expect, it, vi } from 'vitest';
import { createElectronRevisionSync } from '../src/sync';
import type { ElectronStateSyncBridge } from '../src/types';

describe('createElectronRevisionSync (DX sugar)', () => {
  it('wires bridge into a RevisionSyncHandle and applies snapshots', async () => {
    const listeners: Array<(...args: unknown[]) => void> = [];

    let snapshotRevision = '1';
    let snapshotValue = 'initial';

    const bridge: ElectronStateSyncBridge = {
      on(_channel, handler) {
        listeners.push(handler);
        return () => {
          const idx = listeners.indexOf(handler);
          if (idx >= 0) listeners.splice(idx, 1);
        };
      },
      invoke: vi.fn(async () => ({
        revision: snapshotRevision,
        data: { value: snapshotValue },
      })),
    };

    const applied: Array<{ revision: string; value: string }> = [];

    const handle = createElectronRevisionSync<{ value: string }>({
      topic: 'settings',
      bridge,
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
    for (const l of listeners) {
      l({ topic: 'settings', revision: '5' });
    }

    await vi.waitFor(() => {
      expect(applied).toHaveLength(2);
    });

    expect(applied[1]).toEqual({ revision: '5', value: 'updated' });

    handle.stop();
  });

  it('uses custom channel names when provided', async () => {
    const onChannels: string[] = [];
    const invokeChannels: string[] = [];

    const bridge: ElectronStateSyncBridge = {
      on(channel, _handler) {
        onChannels.push(channel);
        return () => {};
      },
      async invoke(channel) {
        invokeChannels.push(channel);
        return { revision: '1', data: null };
      },
    };

    const handle = createElectronRevisionSync<null>({
      topic: 'test',
      bridge,
      applier: { apply() {} },
      invalidationChannel: 'custom:inv',
      snapshotChannel: 'custom:snap',
    });

    await handle.start();

    expect(onChannels).toEqual(['custom:inv']);
    expect(invokeChannels).toEqual(['custom:snap']);

    handle.stop();
  });
});
