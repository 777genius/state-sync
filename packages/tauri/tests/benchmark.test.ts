import { afterAll, describe, expect, it, vi } from 'vitest';
import { createTauriRevisionSync } from '../src/sync';
import type { TauriInvoke, TauriListen } from '../src/transport';

// ─── Helper: createMockTauri ────────────────────────────────────────────

interface MockTauriOptions {
  ipcDelayMs?: number;
  initialRevision?: string;
  initialData?: unknown;
}

function createMockTauri(opts: MockTauriOptions = {}) {
  const { ipcDelayMs = 0, initialRevision = '1', initialData = 'initial' } = opts;

  const handlers: Array<(e: { payload: unknown }) => void> = [];
  let snapshotRevision = initialRevision;
  let snapshotData: unknown = initialData;

  const listen: TauriListen = vi.fn(async (_eventName, handler) => {
    handlers.push(handler);
    return () => {
      const idx = handlers.indexOf(handler);
      if (idx >= 0) handlers.splice(idx, 1);
    };
  });

  const invoke = vi.fn(async () => {
    if (ipcDelayMs > 0) {
      await new Promise((res) => setTimeout(res, ipcDelayMs));
    }
    return { revision: snapshotRevision, data: snapshotData };
  }) as unknown as TauriInvoke;

  return {
    listen,
    invoke,
    fireEvent(topic: string, revision: string) {
      for (const h of handlers) {
        h({ payload: { topic, revision } });
      }
    },
    setSnapshot(revision: string, data: unknown) {
      snapshotRevision = revision;
      snapshotData = data;
    },
    getInvokeCallCount() {
      return (invoke as ReturnType<typeof vi.fn>).mock.calls.length;
    },
  };
}

const noopLogger = { debug() {}, warn() {}, error() {} };

// ─── Benchmark C: Tauri coalescing efficiency ───────────────────────────

describe('Benchmark C: Tauri coalescing efficiency', () => {
  /**
   * NOTE: IPC is mocked via setTimeout. These numbers measure the JS
   * coalescing logic of createTauriRevisionSync only, not real Tauri IPC.
   */

  const eventCounts = [10, 50, 100, 500, 1000];
  const delays = [1, 10, 50];

  const results: Array<{
    Events: number;
    'IPC Delay (ms)': number;
    'Invoke calls': number;
    'Ratio (events/invoke)': string;
  }> = [];

  for (const count of eventCounts) {
    for (const delay of delays) {
      it(
        `${count} events, ${delay}ms IPC → invoke calls <= 2`,
        async () => {
          const mock = createMockTauri({ ipcDelayMs: delay });
          const applied: Array<{ revision: string }> = [];

          const handle = createTauriRevisionSync<string>({
            topic: 'bench',
            listen: mock.listen,
            invoke: mock.invoke,
            eventName: 'evt',
            commandName: 'get_snapshot',
            applier: {
              apply: (s) => {
                applied.push({ revision: s.revision });
              },
            },
            logger: noopLogger,
          });

          await handle.start();
          const startCalls = mock.getInvokeCallCount();

          let rev = 1;
          for (let i = 0; i < count; i++) {
            rev++;
            mock.setSnapshot(String(rev), `data-${rev}`);
            mock.fireEvent('bench', String(rev));
          }

          await vi.waitFor(
            () => {
              expect(applied.at(-1)?.revision).toBe(String(rev));
            },
            { timeout: delay * 2 + 5000 },
          );

          const invokeCalls = mock.getInvokeCallCount() - startCalls;

          results.push({
            Events: count,
            'IPC Delay (ms)': delay,
            'Invoke calls': invokeCalls,
            'Ratio (events/invoke)': invokeCalls > 0 ? (count / invokeCalls).toFixed(1) : 'N/A',
          });

          expect(invokeCalls).toBeLessThanOrEqual(2);

          handle.stop();
        },
        delay * 2 + 10_000,
      );
    }
  }

  afterAll(() => {
    console.log('\n📊 Benchmark C: Tauri coalescing efficiency');
    console.log('NOTE: IPC mocked via setTimeout, numbers measure JS coalescing logic only');
    console.table(results);
  });
});

// ─── Benchmark D: Race condition verification ───────────────────────────

describe('Benchmark D: Race condition verification', () => {
  /**
   * NOTE: This proves JS engine safety — that the coalescing logic never
   * applies snapshots out of order. It does NOT prove Rust backend thread
   * safety, which requires a separate Tauri-side test harness.
   */

  const EVENT_COUNT = 100;
  const delayRotation = [1, 5, 10, 30, 50];

  it('100 events with variable IPC delay → applied revisions are strictly monotonic', async () => {
    const handlers: Array<(e: { payload: unknown }) => void> = [];
    let snapshotRevision = '1';
    let snapshotData = 'initial';

    const listen: TauriListen = vi.fn(async (_eventName, handler) => {
      handlers.push(handler);
      return () => {
        const idx = handlers.indexOf(handler);
        if (idx >= 0) handlers.splice(idx, 1);
      };
    });

    let callIndex = 0;
    const invoke = vi.fn(async () => {
      const capturedRevision = snapshotRevision;
      const capturedData = snapshotData;
      const delay = delayRotation[callIndex % delayRotation.length] ?? 1;
      callIndex++;
      await new Promise((res) => setTimeout(res, delay));
      return { revision: capturedRevision, data: capturedData };
    }) as unknown as TauriInvoke;

    const appliedRevisions: number[] = [];

    const handle = createTauriRevisionSync<string>({
      topic: 'bench',
      listen,
      invoke,
      eventName: 'evt',
      commandName: 'get_snapshot',
      applier: {
        apply: (s) => {
          appliedRevisions.push(Number(s.revision));
        },
      },
      logger: noopLogger,
    });

    await handle.start();

    for (let i = 2; i <= EVENT_COUNT + 1; i++) {
      snapshotRevision = String(i);
      snapshotData = `data-${i}`;
      for (const h of handlers) {
        h({ payload: { topic: 'bench', revision: String(i) } });
      }
    }

    await vi.waitFor(
      () => {
        expect(appliedRevisions.at(-1)).toBe(EVENT_COUNT + 1);
      },
      { timeout: 30_000 },
    );

    for (let i = 1; i < appliedRevisions.length; i++) {
      expect(
        appliedRevisions[i],
        `Revision at index ${i} (${appliedRevisions[i]}) should be > index ${i - 1} (${appliedRevisions[i - 1]})`,
      ).toBeGreaterThan(appliedRevisions[i - 1] ?? 0);
    }

    expect(appliedRevisions.at(-1)).toBe(EVENT_COUNT + 1);

    console.log('\n📊 Benchmark D: Race condition verification');
    console.log(`NOTE: Proves JS engine safety, not Rust backend thread safety.`);
    console.log(`IPC delays rotated: [${delayRotation.join(', ')}]ms`);
    console.log(`Events: ${EVENT_COUNT}`);
    console.log(`Applied snapshots: ${appliedRevisions.length}`);
    console.log(`All revisions strictly monotonic: ✓`);
    console.log(`Final revision: ${appliedRevisions.at(-1)}`);

    handle.stop();
  }, 60_000);
});
