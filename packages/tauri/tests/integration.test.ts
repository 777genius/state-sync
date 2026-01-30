import type { Revision, SnapshotEnvelope, SyncErrorContext } from 'state-sync';
import { createRevisionSync } from 'state-sync';
import { describe, expect, it, vi } from 'vitest';
import {
  createTauriInvalidationSubscriber,
  createTauriSnapshotProvider,
  type TauriInvoke,
  type TauriListen,
} from '../src/transport';

const r = (v: string) => v as Revision;

describe('Transport + Engine integration', () => {
  it('garbage payload → protocol error, no crash, no apply', async () => {
    const errors: SyncErrorContext[] = [];
    const applied: SnapshotEnvelope<unknown>[] = [];

    const handlers: Array<(e: { payload: unknown }) => void> = [];
    const listen: TauriListen = vi.fn(async (_eventName, handler) => {
      handlers.push(handler);
      return () => {
        const idx = handlers.indexOf(handler);
        if (idx >= 0) handlers.splice(idx, 1);
      };
    });

    const invoke = vi.fn(async () => ({
      revision: '1',
      data: { value: 'ok' },
    })) as unknown as TauriInvoke;

    const handle = createRevisionSync({
      topic: 'settings',
      subscriber: createTauriInvalidationSubscriber({ listen, eventName: 'state-sync:inv' }),
      provider: createTauriSnapshotProvider({ invoke, commandName: 'get_snapshot' }),
      applier: {
        apply: (s) => {
          applied.push(s);
        },
      },
      onError: (ctx) => errors.push(ctx),
    });

    await handle.start();
    expect(applied).toHaveLength(1);

    // Emit garbage payload (no topic/revision)
    for (const h of handlers) {
      h({ payload: { garbage: true } });
    }

    await new Promise((res) => setTimeout(res, 50));

    expect(errors).toHaveLength(1);
    expect(errors[0].phase).toBe('protocol');
    // Applier should NOT have been called again
    expect(applied).toHaveLength(1);

    handle.stop();
  });

  it('non-canonical snapshot revision → protocol error', async () => {
    const errors: SyncErrorContext[] = [];
    const applied: SnapshotEnvelope<unknown>[] = [];

    const listen: TauriListen = vi.fn(async (_eventName, _handler) => {
      return () => {};
    });

    const invoke = vi.fn(async () => ({
      revision: '01',
      data: { value: 'bad' },
    })) as unknown as TauriInvoke;

    const handle = createRevisionSync({
      topic: 'settings',
      subscriber: createTauriInvalidationSubscriber({ listen, eventName: 'state-sync:inv' }),
      provider: createTauriSnapshotProvider({ invoke, commandName: 'get_snapshot' }),
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

    const handlers: Array<(e: { payload: unknown }) => void> = [];
    const listen: TauriListen = vi.fn(async (_eventName, handler) => {
      handlers.push(handler);
      return () => {
        const idx = handlers.indexOf(handler);
        if (idx >= 0) handlers.splice(idx, 1);
      };
    });

    let snapshotRevision = '1';
    let snapshotData = 'initial';
    const invoke = vi.fn(async () => ({
      revision: snapshotRevision,
      data: { value: snapshotData },
    })) as unknown as TauriInvoke;

    const handle = createRevisionSync<{ value: string }>({
      topic: 'settings',
      subscriber: createTauriInvalidationSubscriber({ listen, eventName: 'state-sync:inv' }),
      provider: createTauriSnapshotProvider({ invoke, commandName: 'get_snapshot' }),
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

    // Update snapshot, emit invalidation
    snapshotRevision = '5';
    snapshotData = 'updated';
    for (const h of handlers) {
      h({ payload: { topic: 'settings', revision: '5' } });
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
});
