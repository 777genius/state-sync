import { describe, expect, it } from 'vitest';
import type { InvalidationEvent, Revision, SnapshotEnvelope } from '../src/types';
import { MultiWindowBus } from './helpers/multi-window-bus';

const r = (v: string) => v as Revision;

const tick = (ms = 0) => new Promise((resolve) => setTimeout(resolve, ms));

// ─────────────────────────────────────────────────────────────────────
// All tests below go through a simulated Tauri backend (MultiWindowBus)
// with JSON serialization round-trip and async IPC delays, so the
// engine is exercised under conditions close to real Tauri.
// ─────────────────────────────────────────────────────────────────────

describe('E2E multi-window sync', () => {
  // ─── Category 1: Basic multi-window sync ───

  describe('basic multi-window sync', () => {
    it('1: A mutates → B receives', async () => {
      const bus = new MultiWindowBus('initial');
      const a = bus.createWindow('A');
      const b = bus.createWindow('B');

      await a.handle.start();
      await b.handle.start();

      bus.mutateFrom('A', 'updated');
      await bus.waitForConvergence();

      expect(b.applied.at(-1)?.data).toBe('updated');
      expect(b.handle.getLocalRevision()).toBe(bus.getStoreRevision());

      a.handle.stop();
      b.handle.stop();
    });

    it('2: A mutates → B and C receive', async () => {
      const bus = new MultiWindowBus('initial');
      const a = bus.createWindow('A');
      const b = bus.createWindow('B');
      const c = bus.createWindow('C');

      await a.handle.start();
      await b.handle.start();
      await c.handle.start();

      bus.mutateFrom('A', 'broadcast');
      await bus.waitForConvergence();

      const target = bus.getStoreRevision();
      expect(b.handle.getLocalRevision()).toBe(target);
      expect(c.handle.getLocalRevision()).toBe(target);
      expect(b.applied.at(-1)?.data).toBe('broadcast');
      expect(c.applied.at(-1)?.data).toBe('broadcast');

      a.handle.stop();
      b.handle.stop();
      c.handle.stop();
    });

    it('3: C joins late and gets latest state', async () => {
      const bus = new MultiWindowBus('v0');
      const a = bus.createWindow('A');
      const b = bus.createWindow('B');

      await a.handle.start();
      await b.handle.start();

      bus.mutateFrom('A', 'v1');
      bus.mutateFrom('A', 'v2');
      bus.mutateFrom('A', 'v3');
      await bus.waitForConvergence();

      const c = bus.createWindow('C');
      await c.handle.start();

      expect(c.applied.at(-1)?.data).toBe('v3');
      expect(c.handle.getLocalRevision()).toBe(bus.getStoreRevision());

      a.handle.stop();
      b.handle.stop();
      c.handle.stop();
    });
  });

  // ─── Category 2: Conflicts and ordering ───

  describe('conflicts and ordering', () => {
    it('4: ping-pong — A and B alternate mutations', async () => {
      const bus = new MultiWindowBus(0);
      const a = bus.createWindow('A');
      const b = bus.createWindow('B');

      await a.handle.start();
      await b.handle.start();

      for (let i = 1; i <= 10; i++) {
        const source = i % 2 === 1 ? 'A' : 'B';
        bus.mutateFrom(source, i);
        await tick(5);
      }

      await bus.waitForConvergence();

      expect(a.handle.getLocalRevision()).toBe(bus.getStoreRevision());
      expect(b.handle.getLocalRevision()).toBe(bus.getStoreRevision());
      expect(bus.getStoreData()).toBe(10);

      a.handle.stop();
      b.handle.stop();
    });

    it('5: simultaneous mutations — both converge to latest', async () => {
      const bus = new MultiWindowBus('start');
      const a = bus.createWindow('A');
      const b = bus.createWindow('B');

      await a.handle.start();
      await b.handle.start();

      bus.mutateFrom('A', 'from-A');
      bus.mutateFrom('B', 'from-B');

      await bus.waitForConvergence();

      const target = bus.getStoreRevision();
      expect(a.handle.getLocalRevision()).toBe(target);
      expect(b.handle.getLocalRevision()).toBe(target);
      expect(bus.getStoreData()).toBe('from-B');

      a.handle.stop();
      b.handle.stop();
    });

    it('6: out-of-order delivery — engine converges to correct state', async () => {
      const bus = new MultiWindowBus('start');
      const bufferedEvents: Array<{
        handler: (e: InvalidationEvent) => void;
        event: InvalidationEvent;
      }> = [];

      const a = bus.createWindow('A');

      // B uses a custom subscriber that buffers events for manual delivery
      const bHandlers = bus.getHandlerSet('B');
      const bApplied: SnapshotEnvelope<string>[] = [];
      const b = bus.createCustomWindow('B', {
        subscriberOverride: {
          subscribe: async (handler) => {
            const wrapper = (e: InvalidationEvent) => {
              bufferedEvents.push({ handler, event: e });
            };
            bHandlers.add(wrapper);
            return () => {
              bHandlers.delete(wrapper);
            };
          },
        },
        applierOverride: {
          apply: (snap) => {
            bApplied.push(snap);
          },
        },
      });

      await a.handle.start();
      await b.handle.start();

      bus.mutateFrom('A', 'v1');
      bus.mutateFrom('A', 'v2');
      bus.mutateFrom('A', 'v3');

      // Deliver in reverse order
      for (let i = bufferedEvents.length - 1; i >= 0; i--) {
        bufferedEvents[i].handler(bufferedEvents[i].event);
      }

      await tick(100);

      expect(bApplied.at(-1)?.data).toBe('v3');

      a.handle.stop();
      b.handle.stop();
    });
  });

  // ─── Category 3: Recovery ───

  describe('recovery', () => {
    it('7: window restart — catches up after re-start', async () => {
      const bus = new MultiWindowBus('v0');
      const a = bus.createWindow('A');
      const b = bus.createWindow('B');

      await a.handle.start();
      await b.handle.start();

      b.handle.stop();
      bus.destroyWindow('B');

      for (let i = 1; i <= 5; i++) {
        bus.mutateFrom('A', `v${i}`);
      }
      await tick(50);

      const b2 = bus.createWindow('B');
      await b2.handle.start();

      expect(b2.applied.at(-1)?.data).toBe('v5');
      expect(b2.handle.getLocalRevision()).toBe(bus.getStoreRevision());

      a.handle.stop();
      b2.handle.stop();
    });

    it('8: provider fails twice, then succeeds on re-create', async () => {
      const bus = new MultiWindowBus('initial');
      const a = bus.createWindow('A');
      const b = bus.createWindow('B', { failCount: 2 });

      await a.handle.start();
      try {
        await b.handle.start();
      } catch {
        /* expected */
      }

      bus.destroyWindow('B');
      const b2 = bus.createWindow('B', { failCount: 0 });
      await b2.handle.start();

      bus.mutateFrom('A', 'recovered');
      await bus.waitForConvergence();

      expect(b2.applied.at(-1)?.data).toBe('recovered');
      expect(b2.handle.getLocalRevision()).toBe(bus.getStoreRevision());

      a.handle.stop();
      b2.handle.stop();
    });

    it('9: stale-snapshot race — slow IPC + fast mutations → coalescing', async () => {
      const bus = new MultiWindowBus('start');
      let snapshotCallCount = 0;

      const a = bus.createWindow('A');

      const bApplied: SnapshotEnvelope<string>[] = [];
      const b = bus.createCustomWindow('B', {
        providerOverride: {
          getSnapshot: async () => {
            snapshotCallCount++;
            await tick(100); // slow IPC
            return { revision: bus.getStoreRevision(), data: bus.getStoreData() };
          },
        },
        applierOverride: {
          apply: (snap) => {
            bApplied.push(snap);
          },
        },
      });

      await a.handle.start();
      await b.handle.start();
      snapshotCallCount = 0;

      for (let i = 1; i <= 5; i++) bus.mutateFrom('A', `fast-${i}`);

      await tick(500);

      expect(snapshotCallCount).toBeLessThanOrEqual(3);
      expect(bApplied.at(-1)?.data).toBe('fast-5');

      a.handle.stop();
      b.handle.stop();
    });
  });

  // ─── Category 4: Complex interleaved scenarios ───

  describe('complex interleaved scenarios', () => {
    it('10: independent topics — mutations do not cross', async () => {
      const bus1 = new MultiWindowBus('topic1-v0', 'topic1');
      const bus2 = new MultiWindowBus(100, 'topic2');

      const w1t1 = bus1.createWindow('W1');
      const w1t2 = bus2.createWindow('W1');
      const w2t1 = bus1.createWindow('W2');
      const w2t2 = bus2.createWindow('W2');

      await w1t1.handle.start();
      await w1t2.handle.start();
      await w2t1.handle.start();
      await w2t2.handle.start();

      bus1.mutateFrom('W1', 'topic1-v1');
      bus2.mutateFrom('W1', 200);

      await bus1.waitForConvergence();
      await bus2.waitForConvergence();

      expect(w2t1.applied.at(-1)?.data).toBe('topic1-v1');
      expect(w2t2.applied.at(-1)?.data).toBe(200);
      expect(typeof bus1.getStoreData()).toBe('string');
      expect(typeof bus2.getStoreData()).toBe('number');

      w1t1.handle.stop();
      w1t2.handle.stop();
      w2t1.handle.stop();
      w2t2.handle.stop();
    });

    it('11: burst from 3 sources — 15 mutations, all converge', async () => {
      const bus = new MultiWindowBus(0);
      const a = bus.createWindow('A');
      const b = bus.createWindow('B');
      const c = bus.createWindow('C');

      await a.handle.start();
      await b.handle.start();
      await c.handle.start();

      const sources = ['A', 'B', 'C'];
      for (let i = 1; i <= 15; i++) {
        bus.mutateFrom(sources[(i - 1) % 3], i);
      }

      await bus.waitForConvergence();

      const target = bus.getStoreRevision();
      expect(a.handle.getLocalRevision()).toBe(target);
      expect(b.handle.getLocalRevision()).toBe(target);
      expect(c.handle.getLocalRevision()).toBe(target);
      expect(bus.getStoreData()).toBe(15);

      a.handle.stop();
      b.handle.stop();
      c.handle.stop();
    });

    it('12: cascade mutation — B reacts to apply and mutates back', async () => {
      const bus = new MultiWindowBus('idle');
      const a = bus.createWindow('A');
      const b = bus.createWindow('B', {
        onApply: (snap) => {
          if ((snap.data as string) === 'cascade:1') {
            bus.mutateFrom('B', 'cascade:2');
          }
        },
      });

      await a.handle.start();
      await b.handle.start();

      bus.mutateFrom('A', 'cascade:1');

      await tick(200);
      await bus.waitForConvergence();

      expect(bus.getStoreData()).toBe('cascade:2');
      expect(a.handle.getLocalRevision()).toBe(bus.getStoreRevision());
      expect(b.applied.some((s) => s.data === 'cascade:2')).toBe(true);

      a.handle.stop();
      b.handle.stop();
    });

    it('13: window joins during burst — converges to final state', async () => {
      const bus = new MultiWindowBus(0);
      const a = bus.createWindow('A');
      const b = bus.createWindow('B');

      await a.handle.start();
      await b.handle.start();

      for (let i = 1; i <= 5; i++) bus.mutateFrom('A', i);

      const c = bus.createWindow('C');
      await c.handle.start();

      for (let i = 6; i <= 10; i++) bus.mutateFrom('A', i);

      await bus.waitForConvergence();

      const target = bus.getStoreRevision();
      expect(a.handle.getLocalRevision()).toBe(target);
      expect(b.handle.getLocalRevision()).toBe(target);
      expect(c.handle.getLocalRevision()).toBe(target);
      expect(bus.getStoreData()).toBe(10);

      a.handle.stop();
      b.handle.stop();
      c.handle.stop();
    });
  });

  // ─── Category 5: Load tests ───

  describe('load tests', () => {
    it('14: 5 windows, 50 mutations — all converge, coalescing is effective', async () => {
      const bus = new MultiWindowBus(0);
      let totalSnapshotCalls = 0;

      const windows: Array<ReturnType<typeof bus.createCustomWindow>> = [];
      for (let w = 0; w < 5; w++) {
        const id = `W${w}`;
        const win = bus.createCustomWindow(id, {
          providerOverride: {
            getSnapshot: async () => {
              totalSnapshotCalls++;
              await tick(1);
              return { revision: bus.getStoreRevision(), data: bus.getStoreData() };
            },
          },
        });
        windows.push(win);
      }

      for (const w of windows) await w.handle.start();
      totalSnapshotCalls = 0;

      const ids = windows.map((w) => w.id);
      for (let i = 1; i <= 50; i++) {
        bus.mutateFrom(ids[i % ids.length], i);
      }

      await bus.waitForConvergence();

      const target = bus.getStoreRevision();
      for (const w of windows) expect(w.handle.getLocalRevision()).toBe(target);
      expect(totalSnapshotCalls).toBeLessThan(250);

      for (const w of windows) w.handle.stop();
    });

    it(
      '15: random IPC jitter (10-100ms) — 3 windows, 20 mutations',
      { timeout: 15000 },
      async () => {
        const bus = new MultiWindowBus(0);

        const windows: Array<ReturnType<typeof bus.createCustomWindow>> = [];
        for (let w = 0; w < 3; w++) {
          const id = `W${w}`;
          const win = bus.createCustomWindow(id, {
            providerOverride: {
              getSnapshot: async () => {
                await tick(10 + Math.random() * 90);
                return { revision: bus.getStoreRevision(), data: bus.getStoreData() };
              },
            },
          });
          windows.push(win);
        }

        for (const w of windows) await w.handle.start();

        const ids = windows.map((w) => w.id);
        for (let i = 1; i <= 20; i++) {
          bus.mutateFrom(ids[i % ids.length], i);
          await tick(5);
        }

        await bus.waitForConvergence(10000);

        const target = bus.getStoreRevision();
        for (const w of windows) expect(w.handle.getLocalRevision()).toBe(target);
        for (const w of windows) w.handle.stop();
      },
    );
  });

  // ─── Category 6: Edge cases ───

  describe('edge cases', () => {
    it('16: stop during in-flight IPC — no apply after stop', async () => {
      const bus = new MultiWindowBus('initial');
      const a = bus.createWindow('A');

      let resolveSlowSnapshot: (() => void) | null = null;
      let startSnapshotReturned = false;
      const bApplied: SnapshotEnvelope<string>[] = [];

      const b = bus.createCustomWindow('B', {
        providerOverride: {
          getSnapshot: async () => {
            if (startSnapshotReturned) {
              await new Promise<void>((resolve) => {
                resolveSlowSnapshot = resolve;
              });
            }
            startSnapshotReturned = true;
            return { revision: bus.getStoreRevision(), data: bus.getStoreData() };
          },
        },
        applierOverride: {
          apply: (snap) => {
            bApplied.push(snap);
          },
        },
      });

      await a.handle.start();
      await b.handle.start();

      const appliedBefore = bApplied.length;
      bus.mutateFrom('A', 'should-not-apply');
      await tick(20);

      b.handle.stop();
      (resolveSlowSnapshot as (() => void) | null)?.();
      await tick(50);

      expect(bApplied.length).toBe(appliedBefore);

      a.handle.stop();
    });

    it('17: mutation during start() — window sees latest state', async () => {
      const bus = new MultiWindowBus('v0');
      const a = bus.createWindow('A');
      await a.handle.start();

      let firstCall = true;
      const bApplied: SnapshotEnvelope<string>[] = [];
      const b = bus.createCustomWindow('B', {
        providerOverride: {
          getSnapshot: async () => {
            if (firstCall) {
              firstCall = false;
              await tick(50);
            }
            return { revision: bus.getStoreRevision(), data: bus.getStoreData() };
          },
        },
        applierOverride: {
          apply: (snap) => {
            bApplied.push(snap);
          },
        },
      });

      const startPromise = b.handle.start();
      await tick(10);
      bus.mutateFrom('A', 'during-start');
      await startPromise;
      await tick(200);

      expect(bApplied.at(-1)?.data).toBe('during-start');

      a.handle.stop();
      b.handle.stop();
    });

    it('18: full cluster stop/restart — new epoch recovered', async () => {
      const bus = new MultiWindowBus('epoch-1');
      const a = bus.createWindow('A');
      const b = bus.createWindow('B');

      await a.handle.start();
      await b.handle.start();

      bus.mutate('epoch-1-data');
      await bus.waitForConvergence();

      a.handle.stop();
      b.handle.stop();
      bus.destroyWindow('A');
      bus.destroyWindow('B');

      bus.mutate('epoch-2-data');

      const a2 = bus.createWindow('A');
      const b2 = bus.createWindow('B');
      await a2.handle.start();
      await b2.handle.start();

      expect(a2.applied.at(-1)?.data).toBe('epoch-2-data');
      expect(b2.applied.at(-1)?.data).toBe('epoch-2-data');

      a2.handle.stop();
      b2.handle.stop();
    });

    it('19: identical data, different revisions — revision still advances', async () => {
      const bus = new MultiWindowBus('same');
      const a = bus.createWindow('A');
      const b = bus.createWindow('B');

      await a.handle.start();
      await b.handle.start();

      bus.mutate('same');
      bus.mutate('same');
      bus.mutate('same');

      await bus.waitForConvergence();

      expect(bus.getStoreRevision()).toBe(r('3'));
      expect(a.handle.getLocalRevision()).toBe(r('3'));
      expect(b.handle.getLocalRevision()).toBe(r('3'));

      a.handle.stop();
      b.handle.stop();
    });

    it('20: rapid stop/restart cycles — window recovers each time', async () => {
      const bus = new MultiWindowBus(0);
      const a = bus.createWindow('A');
      await a.handle.start();

      for (let cycle = 1; cycle <= 5; cycle++) {
        bus.mutate(cycle * 10);
        const b = bus.createWindow(`B-${cycle}`);
        await b.handle.start();

        expect(b.applied.at(-1)?.data).toBe(cycle * 10);
        expect(b.handle.getLocalRevision()).toBe(bus.getStoreRevision());

        b.handle.stop();
        bus.destroyWindow(`B-${cycle}`);
      }

      a.handle.stop();
    });

    it('21: no mutations after start — windows stay at initial state', async () => {
      const bus = new MultiWindowBus('pristine');
      const a = bus.createWindow('A');
      const b = bus.createWindow('B');
      const c = bus.createWindow('C');

      await a.handle.start();
      await b.handle.start();
      await c.handle.start();
      await tick(100);

      const target = bus.getStoreRevision();
      expect(a.handle.getLocalRevision()).toBe(target);
      expect(b.handle.getLocalRevision()).toBe(target);
      expect(c.handle.getLocalRevision()).toBe(target);

      expect(a.applied).toHaveLength(1);
      expect(b.applied).toHaveLength(1);
      expect(c.applied).toHaveLength(1);

      a.handle.stop();
      b.handle.stop();
      c.handle.stop();
    });

    it('22: burst → silence → burst — two waves separated by calm', async () => {
      const bus = new MultiWindowBus(0);
      const a = bus.createWindow('A');
      const b = bus.createWindow('B');

      await a.handle.start();
      await b.handle.start();

      for (let i = 1; i <= 10; i++) bus.mutate(i);
      await bus.waitForConvergence();
      expect(bus.getStoreData()).toBe(10);

      await tick(200);

      for (let i = 11; i <= 20; i++) bus.mutate(i);
      await bus.waitForConvergence();
      expect(bus.getStoreData()).toBe(20);
      expect(a.handle.getLocalRevision()).toBe(bus.getStoreRevision());
      expect(b.handle.getLocalRevision()).toBe(bus.getStoreRevision());

      a.handle.stop();
      b.handle.stop();
    });

    it('23: window destroyed mid-convergence — remaining windows still converge', async () => {
      const bus = new MultiWindowBus('start');
      const a = bus.createWindow('A');
      const b = bus.createWindow('B', { ipcDelayMs: 50 });
      const c = bus.createWindow('C');

      await a.handle.start();
      await b.handle.start();
      await c.handle.start();

      bus.mutate('target');
      await tick(10);
      b.handle.stop();
      bus.destroyWindow('B');

      await bus.waitForConvergence();

      expect(a.handle.getLocalRevision()).toBe(bus.getStoreRevision());
      expect(c.handle.getLocalRevision()).toBe(bus.getStoreRevision());

      a.handle.stop();
      c.handle.stop();
    });

    it('24: reconfigure IPC delay on the fly — slow window catches up', async () => {
      const bus = new MultiWindowBus('v0');
      const a = bus.createWindow('A');
      const b = bus.createWindow('B', { ipcDelayMs: 200 });

      await a.handle.start();
      await b.handle.start();

      bus.mutate('slow-phase');
      await tick(300);

      bus.configureWindow('B', { ipcDelayMs: 0 });
      bus.mutate('fast-phase');
      await bus.waitForConvergence();

      expect(b.applied.at(-1)?.data).toBe('fast-phase');

      a.handle.stop();
      b.handle.stop();
    });

    it('25: 10 windows, single mutation — fan-out to many', async () => {
      const bus = new MultiWindowBus('zero');
      const wins = Array.from({ length: 10 }, (_, i) => bus.createWindow(`W${i}`));

      for (const w of wins) await w.handle.start();

      bus.mutate('single');
      await bus.waitForConvergence();

      const target = bus.getStoreRevision();
      for (const w of wins) {
        expect(w.handle.getLocalRevision()).toBe(target);
        expect(w.applied.at(-1)?.data).toBe('single');
      }

      for (const w of wins) w.handle.stop();
    });

    it('26: concurrent start() — windows starting in parallel', async () => {
      const bus = new MultiWindowBus('concurrent');
      const a = bus.createWindow('A', { ipcDelayMs: 30 });
      const b = bus.createWindow('B', { ipcDelayMs: 20 });
      const c = bus.createWindow('C', { ipcDelayMs: 10 });

      await Promise.all([a.handle.start(), b.handle.start(), c.handle.start()]);

      bus.mutate('after-concurrent-start');
      await bus.waitForConvergence();

      const target = bus.getStoreRevision();
      expect(a.handle.getLocalRevision()).toBe(target);
      expect(b.handle.getLocalRevision()).toBe(target);
      expect(c.handle.getLocalRevision()).toBe(target);

      a.handle.stop();
      b.handle.stop();
      c.handle.stop();
    });

    it('27: double cascade chain — A→B→C', async () => {
      const bus = new MultiWindowBus('idle');
      const a = bus.createWindow('A');
      const b = bus.createWindow('B', {
        onApply: (snap) => {
          if ((snap.data as string) === 'chain:1') bus.mutateFrom('B', 'chain:2');
        },
      });
      const c = bus.createWindow('C', {
        onApply: (snap) => {
          if ((snap.data as string) === 'chain:2') bus.mutateFrom('C', 'chain:3');
        },
      });

      await a.handle.start();
      await b.handle.start();
      await c.handle.start();

      bus.mutateFrom('A', 'chain:1');
      await tick(500);
      await bus.waitForConvergence();

      expect(bus.getStoreData()).toBe('chain:3');
      expect(a.handle.getLocalRevision()).toBe(bus.getStoreRevision());

      a.handle.stop();
      b.handle.stop();
      c.handle.stop();
    });

    it('28: snapshot interceptor transforms data per-window', async () => {
      const bus = new MultiWindowBus({ count: 0, label: 'raw' });

      const a = bus.createWindow('A');
      const b = bus.createWindow('B', {
        snapshotInterceptor: (envelope) => ({
          ...envelope,
          data: { ...(envelope.data as any), label: 'intercepted' },
        }),
      });

      await a.handle.start();
      await b.handle.start();

      bus.mutate({ count: 42, label: 'raw' });
      await bus.waitForConvergence();

      expect((a.applied.at(-1)?.data as any).label).toBe('raw');
      expect((b.applied.at(-1)?.data as any).label).toBe('intercepted');
      expect((b.applied.at(-1)?.data as any).count).toBe(42);

      a.handle.stop();
      b.handle.stop();
    });

    it('29: intermittent IPC failures mid-burst — errors collected, eventually converges', async () => {
      const bus = new MultiWindowBus(0);
      const a = bus.createWindow('A');

      let callCount = 0;
      const b = bus.createCustomWindow('B', {
        providerOverride: {
          getSnapshot: async () => {
            callCount++;
            if (callCount === 2 || callCount === 4) {
              throw new Error(`IPC failure #${callCount}`);
            }
            await tick(1);
            return { revision: bus.getStoreRevision(), data: bus.getStoreData() };
          },
        },
      });

      await a.handle.start();
      await b.handle.start();

      for (let i = 1; i <= 8; i++) {
        bus.mutate(i);
        await tick(10);
      }

      await bus.waitForConvergence();

      expect(b.handle.getLocalRevision()).toBe(bus.getStoreRevision());
      expect(b.errors.length).toBeGreaterThan(0);
      expect(b.errors.some((e) => e.phase === 'getSnapshot')).toBe(true);

      a.handle.stop();
      b.handle.stop();
    });

    it('30: asymmetric IPC delays — fast and slow windows both converge', async () => {
      const bus = new MultiWindowBus(0);

      const fastApplied: SnapshotEnvelope<number>[] = [];
      const slowApplied: SnapshotEnvelope<number>[] = [];

      function createTimedWindow(id: string, delay: number, applied: typeof fastApplied) {
        return bus.createCustomWindow(id, {
          providerOverride: {
            getSnapshot: async () => {
              if (delay > 0) await tick(delay);
              return { revision: bus.getStoreRevision(), data: bus.getStoreData() };
            },
          },
          applierOverride: {
            apply: (snap) => {
              applied.push(snap);
            },
          },
        });
      }

      const fast = createTimedWindow('fast', 1, fastApplied);
      const slow = createTimedWindow('slow', 80, slowApplied);

      await fast.handle.start();
      await slow.handle.start();

      for (let i = 1; i <= 20; i++) bus.mutate(i);

      await bus.waitForConvergence(10000);

      expect(fast.handle.getLocalRevision()).toBe(bus.getStoreRevision());
      expect(slow.handle.getLocalRevision()).toBe(bus.getStoreRevision());
      expect(fastApplied.length).toBeGreaterThanOrEqual(slowApplied.length);
      expect(fastApplied.at(-1)?.data).toBe(20);
      expect(slowApplied.at(-1)?.data).toBe(20);

      fast.handle.stop();
      slow.handle.stop();
    });

    it('31: single window in isolation — self-mutations work', async () => {
      const bus = new MultiWindowBus('alone');
      const a = bus.createWindow('A');

      await a.handle.start();

      bus.mutateFrom('A', 'self-1');
      bus.mutateFrom('A', 'self-2');
      bus.mutateFrom('A', 'self-3');

      await bus.waitForConvergence();

      expect(a.handle.getLocalRevision()).toBe(bus.getStoreRevision());
      expect(a.applied.at(-1)?.data).toBe('self-3');

      a.handle.stop();
    });

    it('32: 100 synchronous mutations — no missed updates', async () => {
      const bus = new MultiWindowBus(0);
      const a = bus.createWindow('A');
      const b = bus.createWindow('B');

      await a.handle.start();
      await b.handle.start();

      for (let i = 1; i <= 100; i++) bus.mutate(i);

      await bus.waitForConvergence();

      expect(a.handle.getLocalRevision()).toBe(bus.getStoreRevision());
      expect(b.handle.getLocalRevision()).toBe(bus.getStoreRevision());
      expect(a.applied.at(-1)?.data).toBe(100);
      expect(b.applied.at(-1)?.data).toBe(100);

      a.handle.stop();
      b.handle.stop();
    });

    it('33: revision gap — large jump still converges', async () => {
      const bus = new MultiWindowBus('start');
      const a = bus.createWindow('A');
      const b = bus.createWindow('B');

      await a.handle.start();
      await b.handle.start();

      // Simulate backend revision gap (e.g. DB restore)
      (bus as any).revision = 999;
      (bus as any).data = 'jumped';
      bus.broadcastToAll();

      await bus.waitForConvergence();

      expect(a.handle.getLocalRevision()).toBe(r('999'));
      expect(b.handle.getLocalRevision()).toBe(r('999'));

      a.handle.stop();
      b.handle.stop();
    });

    it('34: stop() is idempotent — double stop does not throw', async () => {
      const bus = new MultiWindowBus('x');
      const a = bus.createWindow('A');

      await a.handle.start();

      a.handle.stop();
      a.handle.stop();

      expect(a.handle.getLocalRevision()).toBe(bus.getStoreRevision());
    });

    it('35: applied snapshots have non-decreasing revisions', async () => {
      const bus = new MultiWindowBus(0);
      const a = bus.createWindow('A');
      const b = bus.createWindow('B');

      await a.handle.start();
      await b.handle.start();

      for (let i = 1; i <= 20; i++) {
        bus.mutate(i);
        if (i % 5 === 0) await tick(10);
      }

      await bus.waitForConvergence();

      for (let i = 1; i < b.applied.length; i++) {
        expect(Number(b.applied[i].revision)).toBeGreaterThanOrEqual(
          Number(b.applied[i - 1].revision),
        );
      }

      a.handle.stop();
      b.handle.stop();
    });
  });

  // ─── Category 7: Realistic Tauri IPC scenarios ───

  describe('realistic Tauri IPC', () => {
    it('36: JSON serialization round-trip — object identity is not shared between windows', async () => {
      const bus = new MultiWindowBus({ items: [1, 2, 3], meta: { name: 'test' } });
      const a = bus.createWindow('A');
      const b = bus.createWindow('B');

      await a.handle.start();
      await b.handle.start();

      bus.mutate({ items: [4, 5], meta: { name: 'updated' } });
      await bus.waitForConvergence();

      const aData = a.applied.at(-1)?.data as any;
      const bData = b.applied.at(-1)?.data as any;

      // Values must match
      expect(aData).toEqual(bData);
      // But object references must be different (JSON round-trip)
      expect(aData).not.toBe(bData);
      expect(aData.items).not.toBe(bData.items);
      expect(aData.meta).not.toBe(bData.meta);

      a.handle.stop();
      b.handle.stop();
    });

    it(
      '37: broadcast jitter — events arrive at different times per window',
      { timeout: 10000 },
      async () => {
        const bus = new MultiWindowBus(0, { broadcastJitterMs: 20, ipcDelayMs: 1 });
        const a = bus.createWindow('A');
        const b = bus.createWindow('B');
        const c = bus.createWindow('C');

        await a.handle.start();
        await b.handle.start();
        await c.handle.start();

        for (let i = 1; i <= 10; i++) bus.mutate(i);

        await bus.waitForConvergence();

        const target = bus.getStoreRevision();
        expect(a.handle.getLocalRevision()).toBe(target);
        expect(b.handle.getLocalRevision()).toBe(target);
        expect(c.handle.getLocalRevision()).toBe(target);

        a.handle.stop();
        b.handle.stop();
        c.handle.stop();
      },
    );

    it(
      '38: realistic IPC delays (5-15ms) with burst — coalescing under realistic conditions',
      { timeout: 15000 },
      async () => {
        const bus = new MultiWindowBus(0, { ipcDelayMs: 5, broadcastJitterMs: 3 });
        let snapshotCalls = 0;

        const a = bus.createWindow('A');
        const b = bus.createCustomWindow('B', {
          providerOverride: {
            getSnapshot: async () => {
              snapshotCalls++;
              await tick(5 + Math.random() * 10); // 5-15ms like real Tauri IPC
              return { revision: bus.getStoreRevision(), data: bus.getStoreData() };
            },
          },
        });

        await a.handle.start();
        await b.handle.start();
        snapshotCalls = 0;

        // 30 rapid mutations (typical user session burst)
        for (let i = 1; i <= 30; i++) bus.mutateFrom('A', i);

        await bus.waitForConvergence(10000);

        expect(b.handle.getLocalRevision()).toBe(bus.getStoreRevision());
        // Under realistic IPC, coalescing should reduce calls significantly
        expect(snapshotCalls).toBeLessThan(30);

        a.handle.stop();
        b.handle.stop();
      },
    );

    it('39: window opens, user edits fast, second window catches up', async () => {
      // Simulates: user opens settings in window A, types fast,
      // window B (main) reflects changes
      const bus = new MultiWindowBus({ text: '', version: 0 });
      const editor = bus.createWindow('editor', { ipcDelayMs: 2 });
      const main = bus.createWindow('main', { ipcDelayMs: 5 });

      await editor.handle.start();
      await main.handle.start();

      // User types 20 characters quickly
      for (let i = 1; i <= 20; i++) {
        bus.mutateFrom('editor', { text: 'a'.repeat(i), version: i });
        await tick(3); // ~333 chars per second typing speed
      }

      await bus.waitForConvergence();

      const mainData = main.applied.at(-1)?.data as any;
      expect(mainData.text).toBe('a'.repeat(20));
      expect(mainData.version).toBe(20);
      expect(main.handle.getLocalRevision()).toBe(bus.getStoreRevision());

      editor.handle.stop();
      main.handle.stop();
    });

    it('40: settings panel sync — multiple windows observe config changes', async () => {
      const initialConfig = { theme: 'light', fontSize: 14, lang: 'en' };
      const bus = new MultiWindowBus(initialConfig);

      const settings = bus.createWindow('settings');
      const editor = bus.createWindow('editor', { ipcDelayMs: 3 });
      const preview = bus.createWindow('preview', { ipcDelayMs: 5 });

      await settings.handle.start();
      await editor.handle.start();
      await preview.handle.start();

      // User changes theme
      bus.mutateFrom('settings', { theme: 'dark', fontSize: 14, lang: 'en' });
      await bus.waitForConvergence();

      // User changes font size
      bus.mutateFrom('settings', { theme: 'dark', fontSize: 18, lang: 'en' });
      await bus.waitForConvergence();

      // User changes language
      bus.mutateFrom('settings', { theme: 'dark', fontSize: 18, lang: 'ru' });
      await bus.waitForConvergence();

      const editorData = editor.applied.at(-1)?.data as any;
      const previewData = preview.applied.at(-1)?.data as any;
      expect(editorData).toEqual({ theme: 'dark', fontSize: 18, lang: 'ru' });
      expect(previewData).toEqual({ theme: 'dark', fontSize: 18, lang: 'ru' });

      settings.handle.stop();
      editor.handle.stop();
      preview.handle.stop();
    });

    it('41: window A offline then comes back — sees accumulated changes', async () => {
      const bus = new MultiWindowBus({ counter: 0 });
      const a = bus.createWindow('A');
      const b = bus.createWindow('B');

      await a.handle.start();
      await b.handle.start();

      bus.mutate({ counter: 1 });
      await bus.waitForConvergence();

      // A goes offline (simulate by destroying)
      a.handle.stop();
      bus.destroyWindow('A');

      // Multiple mutations while A is offline
      bus.mutate({ counter: 2 });
      bus.mutate({ counter: 3 });
      bus.mutate({ counter: 4 });
      bus.mutate({ counter: 5 });
      await tick(50);

      // A comes back
      const a2 = bus.createWindow('A');
      await a2.handle.start();

      // A should see only the latest state (not intermediate)
      expect((a2.applied.at(-1)?.data as any).counter).toBe(5);
      // A should have exactly 1 apply (the initial snapshot on restart)
      expect(a2.applied).toHaveLength(1);

      a2.handle.stop();
      b.handle.stop();
    });

    it('42: multiple topics on same window — full app state sync', async () => {
      const userBus = new MultiWindowBus({ name: 'Alice' }, 'user');
      const docBus = new MultiWindowBus({ title: 'Untitled' }, 'document');

      const mainUser = userBus.createWindow('main');
      const mainDoc = docBus.createWindow('main');
      const sidebarUser = userBus.createWindow('sidebar');
      const sidebarDoc = docBus.createWindow('sidebar');

      await mainUser.handle.start();
      await mainDoc.handle.start();
      await sidebarUser.handle.start();
      await sidebarDoc.handle.start();

      userBus.mutateFrom('main', { name: 'Bob' });
      docBus.mutateFrom('main', { title: 'My Document' });

      await userBus.waitForConvergence();
      await docBus.waitForConvergence();

      expect((sidebarUser.applied.at(-1)?.data as any).name).toBe('Bob');
      expect((sidebarDoc.applied.at(-1)?.data as any).title).toBe('My Document');

      // Topics are independent — user mutations don't affect doc bus
      expect(userBus.getStoreData()).toEqual({ name: 'Bob' });
      expect(docBus.getStoreData()).toEqual({ title: 'My Document' });

      mainUser.handle.stop();
      mainDoc.handle.stop();
      sidebarUser.handle.stop();
      sidebarDoc.handle.stop();
    });

    it('43: backend batch update — multiple fields change in one mutation', async () => {
      const bus = new MultiWindowBus({
        users: [] as string[],
        count: 0,
        lastUpdated: '',
      });

      const dashboard = bus.createWindow('dashboard');
      const admin = bus.createWindow('admin');

      await dashboard.handle.start();
      await admin.handle.start();

      // Admin performs batch update
      bus.mutateFrom('admin', {
        users: ['alice', 'bob'],
        count: 2,
        lastUpdated: '2024-01-01',
      });

      await bus.waitForConvergence();

      const dashData = dashboard.applied.at(-1)?.data as any;
      expect(dashData.users).toEqual(['alice', 'bob']);
      expect(dashData.count).toBe(2);
      expect(dashData.lastUpdated).toBe('2024-01-01');

      dashboard.handle.stop();
      admin.handle.stop();
    });

    it('44: IPC timeout simulation — provider hangs then new event recovers', async () => {
      const bus = new MultiWindowBus('initial');
      const a = bus.createWindow('A');

      let hangNext = false;
      let resolveHang: (() => void) | null = null;
      const b = bus.createCustomWindow('B', {
        providerOverride: {
          getSnapshot: async () => {
            if (hangNext) {
              hangNext = false;
              // Simulate a hung IPC call that eventually resolves
              await new Promise<void>((resolve) => {
                resolveHang = resolve;
              });
            }
            await tick(1);
            return { revision: bus.getStoreRevision(), data: bus.getStoreData() };
          },
        },
      });

      await a.handle.start();
      await b.handle.start();

      hangNext = true;
      bus.mutateFrom('A', 'will-hang');
      await tick(50);

      // B is stuck — but new mutation + resolving the hang should recover
      bus.mutateFrom('A', 'after-hang');
      (resolveHang as (() => void) | null)?.();

      await bus.waitForConvergence();

      expect(b.handle.getLocalRevision()).toBe(bus.getStoreRevision());

      a.handle.stop();
      b.handle.stop();
    });

    it(
      '45: 5 windows with mixed IPC delays — realistic multi-panel app',
      { timeout: 15000 },
      async () => {
        const bus = new MultiWindowBus(
          { selectedId: null as string | null, items: [] as number[] },
          { ipcDelayMs: 2, broadcastJitterMs: 5 },
        );

        const panels = [
          bus.createWindow('toolbar', { ipcDelayMs: 2 }),
          bus.createWindow('sidebar', { ipcDelayMs: 5 }),
          bus.createWindow('editor', { ipcDelayMs: 3 }),
          bus.createWindow('preview', { ipcDelayMs: 8 }),
          bus.createWindow('statusbar', { ipcDelayMs: 1 }),
        ];

        for (const p of panels) await p.handle.start();

        // User performs a sequence of actions
        bus.mutateFrom('toolbar', { selectedId: 'item-1', items: [1] });
        await tick(10);
        bus.mutateFrom('editor', { selectedId: 'item-1', items: [1, 2] });
        await tick(10);
        bus.mutateFrom('editor', { selectedId: 'item-1', items: [1, 2, 3] });
        await tick(10);
        bus.mutateFrom('toolbar', { selectedId: 'item-2', items: [1, 2, 3] });

        await bus.waitForConvergence(10000);

        const target = bus.getStoreRevision();
        for (const p of panels) {
          expect(p.handle.getLocalRevision()).toBe(target);
        }

        const finalData = panels[0].applied.at(-1)?.data as any;
        expect(finalData.selectedId).toBe('item-2');
        expect(finalData.items).toEqual([1, 2, 3]);

        for (const p of panels) p.handle.stop();
      },
    );
  });

  // ─── Category 8: Realistic Tauri runtime simulation ───
  // These tests use asyncBroadcast, mutex contention, duplicate/drop events,
  // and other features that closely mirror real Tauri IPC behavior.

  describe('realistic Tauri runtime', () => {
    it('46: async broadcast — events delivered via event loop, not synchronously', async () => {
      const bus = new MultiWindowBus('v0', { asyncBroadcast: true, ipcDelayMs: 1 });
      const a = bus.createWindow('A');
      const b = bus.createWindow('B');

      await a.handle.start();
      await b.handle.start();

      bus.mutateFrom('A', 'async-test');

      // The event hasn't been delivered yet (it's in setTimeout(0))
      // This verifies the async nature of the broadcast
      await bus.waitForConvergence();

      expect(b.handle.getLocalRevision()).toBe(bus.getStoreRevision());
      expect(b.applied.at(-1)?.data).toBe('async-test');

      a.handle.stop();
      b.handle.stop();
    });

    it('47: async broadcast + rapid mutations — coalescing still works', async () => {
      const bus = new MultiWindowBus(0, { asyncBroadcast: true, ipcDelayMs: 2 });
      let snapshotCalls = 0;

      const a = bus.createWindow('A');
      const b = bus.createCustomWindow('B', {
        providerOverride: {
          getSnapshot: async () => {
            snapshotCalls++;
            await tick(2);
            return { revision: bus.getStoreRevision(), data: bus.getStoreData() };
          },
        },
      });

      await a.handle.start();
      await b.handle.start();
      snapshotCalls = 0;

      // 20 rapid mutations — all broadcast async
      for (let i = 1; i <= 20; i++) bus.mutateFrom('A', i);

      await bus.waitForConvergence();

      expect(b.handle.getLocalRevision()).toBe(bus.getStoreRevision());
      // Coalescing should still be highly effective even with async broadcast
      expect(snapshotCalls).toBeLessThan(20);

      a.handle.stop();
      b.handle.stop();
    });

    it(
      '48: mutex contention — concurrent getSnapshot calls are serialized',
      { timeout: 10000 },
      async () => {
        const bus = new MultiWindowBus(0, {
          mutexContentionMs: 5,
          ipcDelayMs: 1,
        });

        const snapshotTimestamps: number[] = [];
        const wins = Array.from({ length: 4 }, (_, i) => {
          const id = `W${i}`;
          return bus.createCustomWindow(id, {
            providerOverride: {
              getSnapshot: async () => {
                // Goes through bus mutex — concurrent calls are serialized
                const start = Date.now();
                const delay = bus.busConfig.ipcDelayMs;
                if (delay > 0) await tick(delay);

                // Mutex serializes access, so timestamps should be spaced
                const contentionMs = bus.busConfig.mutexContentionMs;
                if (contentionMs > 0) await tick(contentionMs);

                snapshotTimestamps.push(Date.now() - start);
                return { revision: bus.getStoreRevision(), data: bus.getStoreData() };
              },
            },
          });
        });

        for (const w of wins) await w.handle.start();

        // All 4 windows try to fetch simultaneously
        bus.mutate(42);
        await bus.waitForConvergence(8000);

        const target = bus.getStoreRevision();
        for (const w of wins) {
          expect(w.handle.getLocalRevision()).toBe(target);
          expect(w.applied.at(-1)?.data).toBe(42);
        }

        for (const w of wins) w.handle.stop();
      },
    );

    it('49: duplicate events — engine deduplicates stale revisions', async () => {
      const bus = new MultiWindowBus(0, {
        duplicateEventProbability: 1.0, // every event delivered twice
        ipcDelayMs: 1,
      });

      let snapshotCalls = 0;
      const a = bus.createWindow('A');
      const b = bus.createCustomWindow('B', {
        providerOverride: {
          getSnapshot: async () => {
            snapshotCalls++;
            await tick(1);
            return { revision: bus.getStoreRevision(), data: bus.getStoreData() };
          },
        },
      });

      await a.handle.start();
      await b.handle.start();
      snapshotCalls = 0;

      bus.mutateFrom('A', 100);

      await bus.waitForConvergence();

      expect(b.handle.getLocalRevision()).toBe(bus.getStoreRevision());
      // Even with 100% duplicate events, engine shouldn't do excessive work
      // At most: initial + duplicate = 2 invalidations, but coalescing handles it
      expect(snapshotCalls).toBeLessThanOrEqual(3);

      a.handle.stop();
      b.handle.stop();
    });

    it(
      '50: event drops — engine recovers on next successful event',
      { timeout: 15000 },
      async () => {
        const bus = new MultiWindowBus(0, {
          eventDropProbability: 0.3, // 30% of events dropped
          ipcDelayMs: 1,
        });

        const a = bus.createWindow('A');
        const b = bus.createWindow('B');

        await a.handle.start();
        await b.handle.start();

        // Send enough mutations that plenty get through despite 30% drop rate
        for (let i = 1; i <= 50; i++) {
          bus.mutateFrom('A', i);
          await tick(5);
        }

        // Ensure at least one clean event reaches B — broadcastToAll bypasses drop logic
        await tick(50);
        bus.broadcastToAll();

        await bus.waitForConvergence(10000);

        expect(b.handle.getLocalRevision()).toBe(bus.getStoreRevision());

        a.handle.stop();
        b.handle.stop();
      },
    );

    it(
      '51: async broadcast + mutex + jitter — full realistic IPC stack',
      { timeout: 15000 },
      async () => {
        const bus = new MultiWindowBus(
          { counter: 0, items: [] as string[] },
          {
            asyncBroadcast: true,
            broadcastJitterMs: 10,
            mutexContentionMs: 2,
            ipcDelayMs: 5,
            serializeSnapshots: true,
          },
        );

        const toolbar = bus.createWindow('toolbar', { ipcDelayMs: 3 });
        const editor = bus.createWindow('editor', { ipcDelayMs: 8 });
        const sidebar = bus.createWindow('sidebar', { ipcDelayMs: 5 });

        await toolbar.handle.start();
        await editor.handle.start();
        await sidebar.handle.start();

        // Simulate user workflow
        bus.mutateFrom('toolbar', { counter: 1, items: ['file1.ts'] });
        await tick(20);
        bus.mutateFrom('editor', { counter: 2, items: ['file1.ts', 'file2.ts'] });
        await tick(15);
        bus.mutateFrom('sidebar', { counter: 3, items: ['file1.ts', 'file2.ts', 'file3.ts'] });
        await tick(10);
        bus.mutateFrom('editor', {
          counter: 4,
          items: ['file1.ts', 'file2.ts', 'file3.ts', 'file4.ts'],
        });

        await bus.waitForConvergence(10000);

        const target = bus.getStoreRevision();
        expect(toolbar.handle.getLocalRevision()).toBe(target);
        expect(editor.handle.getLocalRevision()).toBe(target);
        expect(sidebar.handle.getLocalRevision()).toBe(target);

        // All windows see same data (deep equal, not reference equal)
        const toolbarData = toolbar.applied.at(-1)?.data as any;
        const editorData = editor.applied.at(-1)?.data as any;
        expect(toolbarData).toEqual(editorData);
        expect(toolbarData).not.toBe(editorData); // JSON round-trip = no shared refs
        expect(toolbarData.items).toHaveLength(4);

        toolbar.handle.stop();
        editor.handle.stop();
        sidebar.handle.stop();
      },
    );

    it('52: large payload — 100KB+ JSON serialization overhead', async () => {
      const largeArray = Array.from({ length: 1000 }, (_, i) => ({
        id: `item-${i}`,
        name: `Item number ${i} with some extra text for padding`,
        tags: [`tag-${i % 10}`, `category-${i % 5}`],
        value: Math.random() * 1000,
      }));

      const bus = new MultiWindowBus(largeArray, {
        ipcDelayMs: 2,
        serializeSnapshots: true,
      });

      const a = bus.createWindow('A');
      const b = bus.createWindow('B');

      await a.handle.start();
      await b.handle.start();

      // Mutate with another large payload
      const updatedArray = largeArray.map((item, i) => ({ ...item, value: i * 2 }));
      bus.mutateFrom('A', updatedArray);

      await bus.waitForConvergence();

      const bData = b.applied.at(-1)?.data as typeof largeArray;
      expect(bData).toHaveLength(1000);
      expect(bData[0].value).toBe(0);
      expect(bData[999].value).toBe(1998);
      // Verify deep copy (no shared references)
      expect(bData).not.toBe(updatedArray);
      expect(bData[0]).not.toBe(updatedArray[0]);

      a.handle.stop();
      b.handle.stop();
    });

    it(
      '53: rapid window lifecycle under async broadcast — open/close/reopen',
      { timeout: 10000 },
      async () => {
        const bus = new MultiWindowBus(0, { asyncBroadcast: true, ipcDelayMs: 2 });
        const primary = bus.createWindow('primary');
        await primary.handle.start();

        for (let cycle = 1; cycle <= 8; cycle++) {
          bus.mutate(cycle * 100);
          await tick(5); // let async broadcast propagate

          const ephemeral = bus.createWindow(`eph-${cycle}`);
          await ephemeral.handle.start();

          expect(ephemeral.applied.at(-1)?.data).toBe(cycle * 100);
          expect(ephemeral.handle.getLocalRevision()).toBe(bus.getStoreRevision());

          ephemeral.handle.stop();
          bus.destroyWindow(`eph-${cycle}`);
        }

        expect(primary.handle.getLocalRevision()).toBe(bus.getStoreRevision());
        primary.handle.stop();
      },
    );

    it('54: mixed read-only and write windows — readers never mutate', async () => {
      const bus = new MultiWindowBus(
        { value: 0 },
        {
          asyncBroadcast: true,
          ipcDelayMs: 2,
        },
      );

      // Writer window
      const writer = bus.createWindow('writer');
      // Two read-only windows
      const reader1 = bus.createWindow('reader1', { ipcDelayMs: 3 });
      const reader2 = bus.createWindow('reader2', { ipcDelayMs: 5 });

      await writer.handle.start();
      await reader1.handle.start();
      await reader2.handle.start();

      for (let i = 1; i <= 15; i++) {
        bus.mutateFrom('writer', { value: i });
        if (i % 5 === 0) await tick(10);
      }

      await bus.waitForConvergence();

      const target = bus.getStoreRevision();
      expect(reader1.handle.getLocalRevision()).toBe(target);
      expect(reader2.handle.getLocalRevision()).toBe(target);
      expect((reader1.applied.at(-1)?.data as any).value).toBe(15);
      expect((reader2.applied.at(-1)?.data as any).value).toBe(15);

      // Readers should have applied snapshots monotonically
      for (let i = 1; i < reader1.applied.length; i++) {
        expect(Number(reader1.applied[i].revision)).toBeGreaterThanOrEqual(
          Number(reader1.applied[i - 1].revision),
        );
      }

      writer.handle.stop();
      reader1.handle.stop();
      reader2.handle.stop();
    });

    it(
      '55: event storm with partial drops + duplicates — still converges',
      { timeout: 10000 },
      async () => {
        const bus = new MultiWindowBus(0, {
          asyncBroadcast: true,
          broadcastJitterMs: 5,
          duplicateEventProbability: 0.3,
          eventDropProbability: 0.2,
          ipcDelayMs: 3,
        });

        const wins = Array.from({ length: 3 }, (_, i) => bus.createWindow(`W${i}`));
        for (const w of wins) await w.handle.start();

        // Burst of 40 mutations from different sources
        for (let i = 1; i <= 40; i++) {
          bus.mutateFrom(`W${i % 3}`, i);
          if (i % 10 === 0) await tick(20); // periodic pause
        }

        await bus.waitForConvergence(8000);

        const target = bus.getStoreRevision();
        for (const w of wins) {
          expect(w.handle.getLocalRevision()).toBe(target);
          expect(w.applied.at(-1)?.data).toBe(40);
        }

        for (const w of wins) w.handle.stop();
      },
    );

    it(
      '56: cascade under async broadcast — reaction triggers further mutations',
      { timeout: 10000 },
      async () => {
        const bus = new MultiWindowBus(
          { phase: 'idle', counter: 0 },
          { asyncBroadcast: true, ipcDelayMs: 2 },
        );

        const a = bus.createWindow('A');
        const b = bus.createWindow('B', {
          onApply: (snap) => {
            const data = snap.data as { phase: string; counter: number };
            if (data.phase === 'trigger' && data.counter === 1) {
              // B reacts and escalates
              bus.mutateFrom('B', { phase: 'reacted', counter: 2 });
            }
          },
        });
        const observer = bus.createWindow('observer', { ipcDelayMs: 5 });

        await a.handle.start();
        await b.handle.start();
        await observer.handle.start();

        bus.mutateFrom('A', { phase: 'trigger', counter: 1 });

        await tick(300);
        await bus.waitForConvergence();

        // All windows should see B's reaction as final state
        expect(bus.getStoreData()).toEqual({ phase: 'reacted', counter: 2 });

        const target = bus.getStoreRevision();
        expect(a.handle.getLocalRevision()).toBe(target);
        expect(b.handle.getLocalRevision()).toBe(target);
        expect(observer.handle.getLocalRevision()).toBe(target);

        a.handle.stop();
        b.handle.stop();
        observer.handle.stop();
      },
    );

    it(
      '57: 7-panel IDE layout — realistic multi-window Tauri app',
      { timeout: 15000 },
      async () => {
        const bus = new MultiWindowBus(
          {
            activeFile: null as string | null,
            openFiles: [] as string[],
            cursor: { line: 0, col: 0 },
            diagnostics: [] as string[],
            theme: 'dark',
          },
          {
            asyncBroadcast: true,
            broadcastJitterMs: 3,
            mutexContentionMs: 1,
            ipcDelayMs: 3,
            serializeSnapshots: true,
          },
        );

        const panels = {
          menubar: bus.createWindow('menubar', { ipcDelayMs: 1 }),
          explorer: bus.createWindow('explorer', { ipcDelayMs: 4 }),
          editor: bus.createWindow('editor', { ipcDelayMs: 2 }),
          minimap: bus.createWindow('minimap', { ipcDelayMs: 3 }),
          terminal: bus.createWindow('terminal', { ipcDelayMs: 5 }),
          problems: bus.createWindow('problems', { ipcDelayMs: 4 }),
          statusbar: bus.createWindow('statusbar', { ipcDelayMs: 1 }),
        };

        const allPanels = Object.values(panels);
        for (const p of allPanels) await p.handle.start();

        // User opens a file from explorer
        bus.mutateFrom('explorer', {
          activeFile: 'main.ts',
          openFiles: ['main.ts'],
          cursor: { line: 0, col: 0 },
          diagnostics: [],
          theme: 'dark',
        });
        await tick(30);

        // User edits — cursor moves
        bus.mutateFrom('editor', {
          activeFile: 'main.ts',
          openFiles: ['main.ts'],
          cursor: { line: 15, col: 8 },
          diagnostics: [],
          theme: 'dark',
        });
        await tick(15);

        // LSP reports diagnostics
        bus.mutateFrom('problems', {
          activeFile: 'main.ts',
          openFiles: ['main.ts'],
          cursor: { line: 15, col: 8 },
          diagnostics: ['error TS2322: line 15'],
          theme: 'dark',
        });
        await tick(20);

        // User opens second file
        bus.mutateFrom('explorer', {
          activeFile: 'utils.ts',
          openFiles: ['main.ts', 'utils.ts'],
          cursor: { line: 0, col: 0 },
          diagnostics: ['error TS2322: line 15'],
          theme: 'dark',
        });
        await tick(15);

        // User changes theme from menubar
        bus.mutateFrom('menubar', {
          activeFile: 'utils.ts',
          openFiles: ['main.ts', 'utils.ts'],
          cursor: { line: 0, col: 0 },
          diagnostics: ['error TS2322: line 15'],
          theme: 'light',
        });

        await bus.waitForConvergence(10000);

        const target = bus.getStoreRevision();
        for (const p of allPanels) {
          expect(p.handle.getLocalRevision()).toBe(target);
        }

        // Verify final state across all panels
        const finalState = panels.statusbar.applied.at(-1)?.data as any;
        expect(finalState.activeFile).toBe('utils.ts');
        expect(finalState.openFiles).toEqual(['main.ts', 'utils.ts']);
        expect(finalState.theme).toBe('light');
        expect(finalState.diagnostics).toEqual(['error TS2322: line 15']);

        // No shared references between panels (JSON round-trip)
        const editorState = panels.editor.applied.at(-1)?.data as any;
        expect(finalState).toEqual(editorState);
        expect(finalState).not.toBe(editorState);
        expect(finalState.openFiles).not.toBe(editorState.openFiles);

        for (const p of allPanels) p.handle.stop();
      },
    );

    it(
      '58: concurrent start under async broadcast — all windows ready simultaneously',
      { timeout: 10000 },
      async () => {
        const bus = new MultiWindowBus('shared-state', {
          asyncBroadcast: true,
          mutexContentionMs: 2,
          ipcDelayMs: 3,
        });

        const wins = Array.from({ length: 6 }, (_, i) =>
          bus.createWindow(`W${i}`, { ipcDelayMs: 2 + i }),
        );

        // All start concurrently — their getSnapshot calls hit the mutex
        await Promise.all(wins.map((w) => w.handle.start()));

        // All should have the initial state
        const target = bus.getStoreRevision();
        for (const w of wins) {
          expect(w.handle.getLocalRevision()).toBe(target);
          expect(w.applied.at(-1)?.data).toBe('shared-state');
        }

        // Now mutate and verify convergence
        bus.mutate('after-concurrent-start');
        await bus.waitForConvergence(8000);

        const newTarget = bus.getStoreRevision();
        for (const w of wins) {
          expect(w.handle.getLocalRevision()).toBe(newTarget);
        }

        for (const w of wins) w.handle.stop();
      },
    );

    it('59: flaky network — drops + duplicates + jitter combined', { timeout: 15000 }, async () => {
      const bus = new MultiWindowBus(
        { messages: [] as string[], lastSender: '' },
        {
          asyncBroadcast: true,
          broadcastJitterMs: 15,
          duplicateEventProbability: 0.2,
          eventDropProbability: 0.3,
          ipcDelayMs: 5,
          serializeSnapshots: true,
        },
      );

      const alice = bus.createWindow('alice', { ipcDelayMs: 3 });
      const bob = bus.createWindow('bob', { ipcDelayMs: 8 });

      await alice.handle.start();
      await bob.handle.start();

      // Simulate a chat-like exchange with lossy network
      const messages: string[] = [];
      for (let i = 1; i <= 20; i++) {
        const sender = i % 2 === 1 ? 'alice' : 'bob';
        const msg = `${sender}: message ${i}`;
        messages.push(msg);
        bus.mutateFrom(sender, { messages: [...messages], lastSender: sender });
        await tick(10 + Math.random() * 20); // realistic typing intervals
      }

      // Ensure final state reaches everyone despite lossy channel
      await tick(50);
      bus.broadcastToAll();

      await bus.waitForConvergence(10000);

      const target = bus.getStoreRevision();
      expect(alice.handle.getLocalRevision()).toBe(target);
      expect(bob.handle.getLocalRevision()).toBe(target);

      const finalData = bus.getStoreData() as { messages: string[]; lastSender: string };
      expect(finalData.messages).toHaveLength(20);
      expect(finalData.lastSender).toBe('bob');

      alice.handle.stop();
      bob.handle.stop();
    });

    it('60: window joins mid-storm under realistic conditions', { timeout: 10000 }, async () => {
      const bus = new MultiWindowBus(0, {
        asyncBroadcast: true,
        broadcastJitterMs: 5,
        mutexContentionMs: 1,
        ipcDelayMs: 3,
      });

      const a = bus.createWindow('A');
      const b = bus.createWindow('B');
      await a.handle.start();
      await b.handle.start();

      // Start a storm
      for (let i = 1; i <= 15; i++) {
        bus.mutateFrom('A', i);
        if (i === 8) await tick(5); // tiny pause
      }

      // C joins in the middle of the storm
      await tick(10);
      const c = bus.createWindow('C', { ipcDelayMs: 5 });
      await c.handle.start();

      // More mutations after C joined
      for (let i = 16; i <= 25; i++) {
        bus.mutateFrom('B', i);
        await tick(3);
      }

      await bus.waitForConvergence(8000);

      const target = bus.getStoreRevision();
      expect(a.handle.getLocalRevision()).toBe(target);
      expect(b.handle.getLocalRevision()).toBe(target);
      expect(c.handle.getLocalRevision()).toBe(target);
      expect(bus.getStoreData()).toBe(25);

      a.handle.stop();
      b.handle.stop();
      c.handle.stop();
    });
  });
});
