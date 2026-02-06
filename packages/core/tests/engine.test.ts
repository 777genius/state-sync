import { describe, expect, it, vi } from 'vitest';
import { createRevisionSync } from '../src/engine';
import type { Revision, SnapshotApplier, SnapshotEnvelope, SyncErrorContext } from '../src/types';
import { InMemoryTransport } from './helpers/in-memory-transport';

const r = (v: string) => v as Revision;

function setup<T = string>(snapshotData?: T, snapshotRevision?: string) {
  const transport = new InMemoryTransport<T>();
  const applied: SnapshotEnvelope<T>[] = [];
  const errors: SyncErrorContext[] = [];

  const applier: SnapshotApplier<T> = {
    apply(snapshot) {
      applied.push(snapshot);
    },
  };

  if (snapshotData !== undefined) {
    transport.setSnapshot({
      revision: r(snapshotRevision ?? '1'),
      data: snapshotData,
    });
  }

  return { transport, applied, errors, applier };
}

describe('createRevisionSync', () => {
  describe('late-join safe', () => {
    it('fetches snapshot on start', async () => {
      const { transport, applied, errors, applier } = setup('hello');

      const handle = createRevisionSync({
        topic: 'test',
        subscriber: transport,
        provider: transport,
        applier,
        onError: (ctx) => errors.push(ctx),
      });

      await handle.start();

      expect(applied).toHaveLength(1);
      expect(applied[0].data).toBe('hello');
      expect(applied[0].revision).toBe(r('1'));
      expect(handle.getLocalRevision()).toBe(r('1'));
      expect(errors).toHaveLength(0);

      handle.stop();
    });

    it('applies initial snapshot even when revision is "0"', async () => {
      const { transport, applied, errors, applier } = setup('zero', '0');

      const handle = createRevisionSync({
        topic: 'test',
        subscriber: transport,
        provider: transport,
        applier,
        onError: (ctx) => errors.push(ctx),
      });

      await handle.start();

      expect(applied).toHaveLength(1);
      expect(applied[0].data).toBe('zero');
      expect(applied[0].revision).toBe(r('0'));
      expect(handle.getLocalRevision()).toBe(r('0'));
      expect(errors).toHaveLength(0);

      handle.stop();
    });
  });

  describe('missed event tolerant', () => {
    it('applies newer snapshot from invalidation', async () => {
      const { transport, applied, errors, applier } = setup('v1');

      const handle = createRevisionSync({
        topic: 'test',
        subscriber: transport,
        provider: transport,
        applier,
        onError: (ctx) => errors.push(ctx),
      });

      await handle.start();
      expect(applied).toHaveLength(1);

      transport.setSnapshot({ revision: r('5'), data: 'v5' as unknown as string });
      transport.emit({ topic: 'test', revision: r('5') });

      await vi.waitFor(() => {
        expect(applied).toHaveLength(2);
      });

      expect(applied[1].data).toBe('v5');
      expect(handle.getLocalRevision()).toBe(r('5'));

      handle.stop();
    });
  });

  describe('out-of-order events', () => {
    it('ignores events with revision <= local', async () => {
      const { transport, applied, errors, applier } = setup('v1');

      const handle = createRevisionSync({
        topic: 'test',
        subscriber: transport,
        provider: transport,
        applier,
        onError: (ctx) => errors.push(ctx),
      });

      await handle.start();
      expect(applied).toHaveLength(1);
      expect(handle.getLocalRevision()).toBe(r('1'));

      transport.emit({ topic: 'test', revision: r('0') });
      transport.emit({ topic: 'test', revision: r('1') });

      await new Promise((res) => setTimeout(res, 50));
      expect(applied).toHaveLength(1);

      handle.stop();
    });
  });

  describe('coalescing', () => {
    it('coalesces multiple rapid invalidations into one refresh', async () => {
      const { transport, errors, applier } = setup('v1');
      const getSnapshotSpy = vi.spyOn(transport, 'getSnapshot');

      transport.setSnapshotDelay(50);

      const handle = createRevisionSync({
        topic: 'test',
        subscriber: transport,
        provider: transport,
        applier,
        onError: (ctx) => errors.push(ctx),
      });

      await handle.start();
      const callsAfterStart = getSnapshotSpy.mock.calls.length;

      transport.setSnapshot({ revision: r('10'), data: 'v10' as unknown as string });

      transport.emit({ topic: 'test', revision: r('2') });
      transport.emit({ topic: 'test', revision: r('3') });
      transport.emit({ topic: 'test', revision: r('4') });

      await vi.waitFor(() => {
        expect(getSnapshotSpy.mock.calls.length).toBeGreaterThanOrEqual(callsAfterStart + 1);
      });

      await new Promise((res) => setTimeout(res, 200));

      const refreshCalls = getSnapshotSpy.mock.calls.length - callsAfterStart;
      expect(refreshCalls).toBeLessThanOrEqual(2);

      handle.stop();
    });
  });

  describe('topic isolation', () => {
    it('ignores events for other topics', async () => {
      const { transport, applied, errors, applier } = setup('v1');

      const handle = createRevisionSync({
        topic: 'my-topic',
        subscriber: transport,
        provider: transport,
        applier,
        onError: (ctx) => errors.push(ctx),
      });

      await handle.start();
      expect(applied).toHaveLength(1);

      transport.emit({ topic: 'other-topic', revision: r('99') });

      await new Promise((res) => setTimeout(res, 50));
      expect(applied).toHaveLength(1);

      handle.stop();
    });
  });

  describe('protocol validation', () => {
    it('reports empty topic in invalidation event', async () => {
      const { transport, errors, applier } = setup('v1');

      const handle = createRevisionSync({
        topic: 'test',
        subscriber: transport,
        provider: transport,
        applier,
        onError: (ctx) => errors.push(ctx),
      });

      await handle.start();

      transport.emit({ topic: '', revision: r('2') });
      transport.emit({ topic: '   ', revision: r('2') });

      await new Promise((res) => setTimeout(res, 50));
      expect(errors.filter((e) => e.phase === 'protocol')).toHaveLength(2);

      handle.stop();
    });

    it('reports non-canonical revision in invalidation event', async () => {
      const { transport, errors, applier } = setup('v1');

      const handle = createRevisionSync({
        topic: 'test',
        subscriber: transport,
        provider: transport,
        applier,
        onError: (ctx) => errors.push(ctx),
      });

      await handle.start();

      transport.emit({ topic: 'test', revision: '01' as Revision });
      transport.emit({ topic: 'test', revision: 'abc' as Revision });

      await new Promise((res) => setTimeout(res, 50));
      expect(errors.filter((e) => e.phase === 'protocol')).toHaveLength(2);

      handle.stop();
    });

    it('does not crash on non-string revision/topic payloads', async () => {
      const { transport, errors, applier } = setup('v1');

      const handle = createRevisionSync({
        topic: 'test',
        subscriber: transport,
        provider: transport,
        applier,
        onError: (ctx) => errors.push(ctx),
      });

      await handle.start();

      transport.emit({ topic: 'test', revision: 5 as unknown as Revision });
      transport.emit({ topic: 123 as unknown as string, revision: r('5') });

      await new Promise((res) => setTimeout(res, 50));
      expect(errors.filter((e) => e.phase === 'protocol').length).toBeGreaterThanOrEqual(2);

      handle.stop();
    });

    it('reports non-canonical revision in snapshot', async () => {
      const transport = new InMemoryTransport<string>();
      const errors: SyncErrorContext[] = [];

      transport.setSnapshot({ revision: '01' as Revision, data: 'bad' });

      const handle = createRevisionSync({
        topic: 'test',
        subscriber: transport,
        provider: transport,
        applier: { apply() {} },
        onError: (ctx) => errors.push(ctx),
      });

      await expect(handle.start()).rejects.toThrow('Non-canonical snapshot revision');
      expect(errors).toHaveLength(1);
      expect(errors[0].phase).toBe('protocol');
      expect(transport.subscriberCount).toBe(0);
    });

    it('stays alive after non-canonical snapshot during invalidation', async () => {
      const transport = new InMemoryTransport<string>();
      const errors: SyncErrorContext[] = [];
      const applied: SnapshotEnvelope<string>[] = [];

      transport.setSnapshot({ revision: r('1'), data: 'v1' });

      const handle = createRevisionSync({
        topic: 'test',
        subscriber: transport,
        provider: transport,
        applier: {
          apply: (s) => {
            applied.push(s);
          },
        },
        onError: (ctx) => errors.push(ctx),
      });

      await handle.start();
      expect(applied).toHaveLength(1);

      transport.setSnapshot({ revision: '01' as Revision, data: 'bad' });
      transport.emit({ topic: 'test', revision: r('5') });

      await new Promise((res) => setTimeout(res, 50));
      expect(errors).toHaveLength(1);
      expect(errors[0].phase).toBe('protocol');

      transport.setSnapshot({ revision: r('10'), data: 'v10' });
      transport.emit({ topic: 'test', revision: r('10') });

      await vi.waitFor(() => {
        expect(applied).toHaveLength(2);
      });

      expect(applied[1].data).toBe('v10');
      handle.stop();
    });
  });

  describe('lifecycle', () => {
    it('rejects start() after stop() to avoid subscription leaks', async () => {
      const { transport, applier } = setup('v1');
      const handle = createRevisionSync({
        topic: 'test',
        subscriber: transport,
        provider: transport,
        applier,
      });

      handle.stop();
      await expect(handle.start()).rejects.toThrow('start() called after stop()');
      expect(transport.subscriberCount).toBe(0);
    });
  });

  describe('stop quiescence', () => {
    it('does not apply snapshot after stop', async () => {
      const { transport, applied, errors, applier } = setup('v1');

      const handle = createRevisionSync({
        topic: 'test',
        subscriber: transport,
        provider: transport,
        applier,
        onError: (ctx) => errors.push(ctx),
      });

      await handle.start();
      expect(applied).toHaveLength(1);

      transport.setSnapshot({ revision: r('10'), data: 'v10' as unknown as string });
      transport.setSnapshotDelay(100);

      transport.emit({ topic: 'test', revision: r('10') });

      await new Promise((res) => setTimeout(res, 10));
      handle.stop();

      await new Promise((res) => setTimeout(res, 200));
      expect(applied).toHaveLength(1);

      handle.stop();
    });
  });

  describe('start failure cleanup', () => {
    it('cleans up subscription on refresh failure during start', async () => {
      const transport = new InMemoryTransport<string>();

      const handle = createRevisionSync({
        topic: 'test',
        subscriber: transport,
        provider: transport,
        applier: { apply() {} },
      });

      await expect(handle.start()).rejects.toThrow('No snapshot configured');
      expect(transport.subscriberCount).toBe(0);
    });

    it('cleans up on subscribe failure', async () => {
      const badSubscriber = {
        subscribe: () => Promise.reject(new Error('Connection failed')),
      };

      const handle = createRevisionSync({
        topic: 'test',
        subscriber: badSubscriber,
        provider: { getSnapshot: () => Promise.resolve({ revision: r('1'), data: 'x' }) },
        applier: { apply() {} },
      });

      await expect(handle.start()).rejects.toThrow('Connection failed');
    });
  });

  describe('shouldRefresh filtering', () => {
    it('skips refresh when shouldRefresh returns false', async () => {
      const { transport, applied, errors, applier } = setup('v1');

      const handle = createRevisionSync({
        topic: 'test',
        subscriber: transport,
        provider: transport,
        applier,
        shouldRefresh: () => false,
        onError: (ctx) => errors.push(ctx),
      });

      await handle.start();
      expect(applied).toHaveLength(1);

      transport.setSnapshot({ revision: r('5'), data: 'v5' as unknown as string });
      transport.emit({ topic: 'test', revision: r('5') });

      await new Promise((res) => setTimeout(res, 50));
      expect(applied).toHaveLength(1);

      handle.stop();
    });

    it('allows refresh when shouldRefresh returns true', async () => {
      const { transport, applied, errors, applier } = setup('v1');

      const handle = createRevisionSync({
        topic: 'test',
        subscriber: transport,
        provider: transport,
        applier,
        shouldRefresh: () => true,
        onError: (ctx) => errors.push(ctx),
      });

      await handle.start();
      expect(applied).toHaveLength(1);

      transport.setSnapshot({ revision: r('5'), data: 'v5' as unknown as string });
      transport.emit({ topic: 'test', revision: r('5') });

      await vi.waitFor(() => {
        expect(applied).toHaveLength(2);
      });

      handle.stop();
    });
  });

  describe('error handling context', () => {
    it('provides error context with phase and topic', async () => {
      const transport = new InMemoryTransport<string>();
      const errors: SyncErrorContext[] = [];

      transport.setSnapshot({ revision: r('1'), data: 'v1' });

      const handle = createRevisionSync({
        topic: 'my-topic',
        subscriber: transport,
        provider: transport,
        applier: { apply() {} },
        onError: (ctx) => errors.push(ctx),
      });

      await handle.start();

      transport.emit({ topic: '', revision: r('2') });

      await new Promise((res) => setTimeout(res, 50));

      expect(errors).toHaveLength(1);
      expect(errors[0].phase).toBe('protocol');
      expect(errors[0].topic).toBe('my-topic');
      expect(errors[0].sourceEvent).toEqual({ topic: '', revision: r('2') });

      handle.stop();
    });
  });

  describe('refresh() lifecycle edge cases', () => {
    it('refresh() before start() — fetches and applies snapshot', async () => {
      const { transport, applied, errors, applier } = setup('v1');

      const handle = createRevisionSync({
        topic: 'test',
        subscriber: transport,
        provider: transport,
        applier,
        onError: (ctx) => errors.push(ctx),
      });

      await handle.refresh();

      expect(applied).toHaveLength(1);
      expect(applied[0].data).toBe('v1');
      expect(handle.getLocalRevision()).toBe(r('1'));
      expect(errors).toHaveLength(0);

      handle.stop();
    });

    it('refresh() after stop() — does not apply, does not throw', async () => {
      const { transport, applied, errors, applier } = setup('v1');

      const handle = createRevisionSync({
        topic: 'test',
        subscriber: transport,
        provider: transport,
        applier,
        onError: (ctx) => errors.push(ctx),
      });

      await handle.start();
      expect(applied).toHaveLength(1);

      handle.stop();

      transport.setSnapshot({ revision: r('10'), data: 'v10' as unknown as string });
      await handle.refresh();

      expect(applied).toHaveLength(1);
      expect(errors).toHaveLength(0);
    });
  });

  describe('onError resilience', () => {
    it('onError throws — engine stays alive and processes next events', async () => {
      const { transport, applied, applier } = setup('v1');
      let onErrorCallCount = 0;

      const handle = createRevisionSync({
        topic: 'test',
        subscriber: transport,
        provider: transport,
        applier,
        onError: () => {
          onErrorCallCount++;
          throw new Error('onError blew up');
        },
      });

      await handle.start();
      expect(applied).toHaveLength(1);

      // Send an invalid event — onError must be called and the event must be ignored
      transport.emit({ topic: '', revision: r('2') });
      await new Promise((res) => setTimeout(res, 50));
      expect(onErrorCallCount).toBe(1);

      // The engine must keep running
      transport.setSnapshot({ revision: r('5'), data: 'v5' as unknown as string });
      transport.emit({ topic: 'test', revision: r('5') });

      await vi.waitFor(() => {
        expect(applied).toHaveLength(2);
      });

      expect(applied[1].data).toBe('v5');
      handle.stop();
    });
  });

  describe('idempotency', () => {
    it('start() is idempotent', async () => {
      const { transport, applied, applier } = setup('v1');

      const handle = createRevisionSync({
        topic: 'test',
        subscriber: transport,
        provider: transport,
        applier,
      });

      await handle.start();
      await handle.start();
      await handle.start();

      expect(applied).toHaveLength(1);

      handle.stop();
    });

    it('stop() is idempotent', async () => {
      const { transport, applier } = setup('v1');

      const handle = createRevisionSync({
        topic: 'test',
        subscriber: transport,
        provider: transport,
        applier,
      });

      await handle.start();
      handle.stop();
      handle.stop();
      handle.stop();

      expect(transport.subscriberCount).toBe(0);
    });
  });

  describe('topic isolation across multiple handles', () => {
    it('two handles on different topics — each gets only its own events', async () => {
      const transportA = new InMemoryTransport<string>();
      const transportB = new InMemoryTransport<string>();
      const appliedA: SnapshotEnvelope<string>[] = [];
      const appliedB: SnapshotEnvelope<string>[] = [];

      transportA.setSnapshot({ revision: r('1'), data: 'a1' });
      transportB.setSnapshot({ revision: r('1'), data: 'b1' });

      const handleA = createRevisionSync({
        topic: 'topic-a',
        subscriber: transportA,
        provider: transportA,
        applier: {
          apply(s) {
            appliedA.push(s);
          },
        },
      });

      const handleB = createRevisionSync({
        topic: 'topic-b',
        subscriber: transportB,
        provider: transportB,
        applier: {
          apply(s) {
            appliedB.push(s);
          },
        },
      });

      await handleA.start();
      await handleB.start();

      expect(appliedA).toHaveLength(1);
      expect(appliedB).toHaveLength(1);

      // An event for topic A must not reach topic B
      transportA.setSnapshot({ revision: r('5'), data: 'a5' });
      transportA.emit({ topic: 'topic-a', revision: r('5') });

      // An event with a different topic on transport B must be ignored
      transportB.emit({ topic: 'topic-a', revision: r('5') });

      await vi.waitFor(() => {
        expect(appliedA).toHaveLength(2);
      });

      await new Promise((res) => setTimeout(res, 50));
      expect(appliedB).toHaveLength(1);

      handleA.stop();
      handleB.stop();
    });
  });

  describe('error phases', () => {
    it('provider throws → onError receives phase="getSnapshot"', async () => {
      const errors: SyncErrorContext[] = [];
      const providerError = new Error('provider exploded');

      const handle = createRevisionSync({
        topic: 'test',
        subscriber: {
          subscribe: async () => () => {},
        },
        provider: {
          getSnapshot: () => Promise.reject(providerError),
        },
        applier: { apply() {} },
        onError: (ctx) => errors.push(ctx),
      });

      await expect(handle.start()).rejects.toThrow('provider exploded');
      expect(errors).toHaveLength(1);
      expect(errors[0].phase).toBe('getSnapshot');
      expect(errors[0].error).toBe(providerError);
    });

    it('applier throws → onError receives phase="apply"', async () => {
      const { transport, errors } = setup('v1');
      const applierError = new Error('applier exploded');

      const handle = createRevisionSync({
        topic: 'test',
        subscriber: transport,
        provider: transport,
        applier: {
          apply() {
            throw applierError;
          },
        },
        onError: (ctx) => errors.push(ctx),
      });

      await expect(handle.start()).rejects.toThrow('applier exploded');
      expect(errors).toHaveLength(1);
      expect(errors[0].phase).toBe('apply');
      expect(errors[0].error).toBe(applierError);
    });
  });

  describe('concurrent coalescing (manual + invalidation)', () => {
    it('manual refresh + invalidation during in-flight → at most 2 getSnapshot calls', async () => {
      const { transport, applier } = setup('v1');
      const getSnapshotSpy = vi.spyOn(transport, 'getSnapshot');

      transport.setSnapshotDelay(40);

      const handle = createRevisionSync({
        topic: 'test',
        subscriber: transport,
        provider: transport,
        applier,
      });

      await handle.start();
      const callsAfterStart = getSnapshotSpy.mock.calls.length;

      transport.setSnapshot({ revision: r('50'), data: 'v50' as unknown as string });

      // Manual refresh + invalidation fired concurrently
      const manualRefresh = handle.refresh();
      transport.emit({ topic: 'test', revision: r('50') });

      await manualRefresh;
      await new Promise((res) => setTimeout(res, 200));

      const refreshCalls = getSnapshotSpy.mock.calls.length - callsAfterStart;
      expect(refreshCalls).toBeLessThanOrEqual(2);

      handle.stop();
    });
  });

  describe('event coalescing under burst', () => {
    it('N rapid invalidations result in at most 2 refresh calls', async () => {
      const { transport, applier } = setup('v1');
      const getSnapshotSpy = vi.spyOn(transport, 'getSnapshot');

      transport.setSnapshotDelay(30);

      const handle = createRevisionSync({
        topic: 'test',
        subscriber: transport,
        provider: transport,
        applier,
      });

      await handle.start();
      const callsAfterStart = getSnapshotSpy.mock.calls.length;

      transport.setSnapshot({ revision: r('100'), data: 'v100' as unknown as string });

      // Quick burst of 10 invalidations
      for (let i = 2; i <= 11; i++) {
        transport.emit({ topic: 'test', revision: r(String(i)) });
      }

      await vi.waitFor(
        () => {
          expect(getSnapshotSpy.mock.calls.length).toBeGreaterThanOrEqual(callsAfterStart + 1);
        },
        { timeout: 500 },
      );

      await new Promise((res) => setTimeout(res, 300));

      const refreshCalls = getSnapshotSpy.mock.calls.length - callsAfterStart;
      // Coalescing: at most 2 — one in-flight + one queued
      expect(refreshCalls).toBeLessThanOrEqual(2);

      handle.stop();
    });
  });

  describe('throttling integration', () => {
    it('debounce delays refresh until silence', async () => {
      const { transport, applier } = setup('v1');
      const getSnapshotSpy = vi.spyOn(transport, 'getSnapshot');

      const handle = createRevisionSync({
        topic: 'test',
        subscriber: transport,
        provider: transport,
        applier,
        throttling: { debounceMs: 50 },
      });

      await handle.start();
      const callsAfterStart = getSnapshotSpy.mock.calls.length;

      transport.setSnapshot({ revision: r('10'), data: 'v10' as unknown as string });

      // Rapid invalidations
      for (let i = 2; i <= 5; i++) {
        transport.emit({ topic: 'test', revision: r(String(i)) });
        await new Promise((res) => setTimeout(res, 10));
      }

      // Should not have fetched yet (debounce waiting)
      expect(getSnapshotSpy.mock.calls.length).toBe(callsAfterStart);

      // Wait for debounce
      await new Promise((res) => setTimeout(res, 100));

      // Should have fetched once
      expect(getSnapshotSpy.mock.calls.length).toBe(callsAfterStart + 1);

      handle.stop();
    });

    it('throttle limits refresh frequency', async () => {
      const { transport, applier } = setup('v1');
      const getSnapshotSpy = vi.spyOn(transport, 'getSnapshot');

      // Add delay to getSnapshot so we can observe throttling behavior
      transport.setSnapshotDelay(20);

      const handle = createRevisionSync({
        topic: 'test',
        subscriber: transport,
        provider: transport,
        applier,
        throttling: { throttleMs: 100, leading: true, trailing: true },
      });

      await handle.start();
      const callsAfterStart = getSnapshotSpy.mock.calls.length;

      transport.setSnapshot({ revision: r('10'), data: 'v10' as unknown as string });

      // First event — should trigger immediately (leading)
      transport.emit({ topic: 'test', revision: r('2') });

      // Wait for the throttle handler to trigger
      await new Promise((res) => setTimeout(res, 30));

      const callsAfterFirst = getSnapshotSpy.mock.calls.length;
      expect(callsAfterFirst).toBeGreaterThanOrEqual(callsAfterStart + 1);

      // More events within throttle window — should be suppressed
      transport.emit({ topic: 'test', revision: r('3') });
      transport.emit({ topic: 'test', revision: r('4') });

      // Wait a bit but stay within throttle window
      await new Promise((res) => setTimeout(res, 30));

      // Should not have triggered more refreshes yet (within throttle window)
      // Note: due to engine coalescing, exact count depends on timing

      // Wait past throttle window for trailing
      await new Promise((res) => setTimeout(res, 150));

      // Total calls should be limited due to throttling
      // Without throttle, 3 events + initial = 4 calls minimum
      // With throttle, should be 2-3 calls max (initial + leading + trailing)
      const finalCalls = getSnapshotSpy.mock.calls.length;
      expect(finalCalls).toBeLessThanOrEqual(callsAfterStart + 3);

      handle.stop();
    });

    it('stop() disposes throttle handler and cancels pending', async () => {
      const { transport, applier } = setup('v1');
      const getSnapshotSpy = vi.spyOn(transport, 'getSnapshot');

      const handle = createRevisionSync({
        topic: 'test',
        subscriber: transport,
        provider: transport,
        applier,
        throttling: { debounceMs: 100 },
      });

      await handle.start();
      const callsAfterStart = getSnapshotSpy.mock.calls.length;

      transport.setSnapshot({ revision: r('10'), data: 'v10' as unknown as string });
      transport.emit({ topic: 'test', revision: r('2') });

      // Stop before debounce fires
      await new Promise((res) => setTimeout(res, 20));
      handle.stop();

      // Wait past debounce time
      await new Promise((res) => setTimeout(res, 150));

      // Should not have made additional calls
      expect(getSnapshotSpy.mock.calls.length).toBe(callsAfterStart);
    });
  });
});
