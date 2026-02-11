import { afterAll, describe, expect, it, vi } from 'vitest';
import { createRevisionSync } from '../src/engine';
import { compareRevisions } from '../src/revision';
import type { Revision, SnapshotApplier, SnapshotEnvelope } from '../src/types';
import { InMemoryTransport } from './helpers/in-memory-transport';

const r = (v: string) => v as Revision;

// ─── Benchmark A: compareRevisions throughput ───────────────────────────

describe('Benchmark A: compareRevisions throughput', () => {
  const categories = [
    { label: 'small (42 vs 17)', a: r('42'), b: r('17') },
    { label: 'medium (999999 vs 100000)', a: r('999999'), b: r('100000') },
    { label: 'large (max u64 vs max-1)', a: r('18446744073709551615'), b: r('18446744073709551614') },
    { label: 'equal (1000 vs 1000)', a: r('1000'), b: r('1000') },
    { label: 'different-length (99 vs 100)', a: r('99'), b: r('100') },
  ];

  const results: Array<{ Category: string; 'Ops/sec': string; 'ns/op': string }> = [];

  const WARMUP = 10_000;
  const ITERATIONS = 1_000_000;

  for (const { label, a, b } of categories) {
    it(`${label}: > 1M ops/sec`, () => {
      for (let i = 0; i < WARMUP; i++) compareRevisions(a, b);

      const start = performance.now();
      for (let i = 0; i < ITERATIONS; i++) compareRevisions(a, b);
      const elapsed = performance.now() - start;

      const opsPerSec = Math.round(ITERATIONS / (elapsed / 1000));
      const nsPerOp = ((elapsed * 1_000_000) / ITERATIONS).toFixed(1);

      results.push({
        Category: label,
        'Ops/sec': opsPerSec.toLocaleString('en-US'),
        'ns/op': nsPerOp,
      });

      expect(opsPerSec).toBeGreaterThan(1_000_000);
    });
  }

  afterAll(() => {
    console.log('\n📊 Benchmark A: compareRevisions throughput (1M iterations)');
    console.table(results);
  });
});

// ─── Benchmark B: Engine coalescing (InMemoryTransport) ─────────────────

describe('Benchmark B: Engine coalescing (InMemoryTransport)', () => {
  /**
   * NOTE: This benchmark uses InMemoryTransport with configurable delay.
   * getSnapshot delay simulates IPC latency. All I/O is in-process.
   * Numbers prove the JS coalescing logic, not real network behavior.
   */

  const eventCounts = [10, 50, 100, 500, 1000];
  const delays = [1, 10, 50];

  const results: Array<{
    Events: number;
    'IPC Delay (ms)': number;
    Fetches: number;
    'Ratio (events/fetch)': string;
  }> = [];

  for (const count of eventCounts) {
    for (const delay of delays) {
      it(`${count} events, ${delay}ms IPC delay → fetches <= 2`, async () => {
        const transport = new InMemoryTransport<string>();
        transport.setSnapshotDelay(delay);

        let rev = 1;
        transport.setSnapshot({ revision: r(String(rev)), data: 'snap' });

        const applied: SnapshotEnvelope<string>[] = [];
        const applier: SnapshotApplier<string> = {
          apply(snapshot) {
            applied.push(snapshot);
          },
        };

        const getSnapshotSpy = vi.spyOn(transport, 'getSnapshot');

        const handle = createRevisionSync({
          topic: 'bench',
          subscriber: transport,
          provider: transport,
          applier,
        });

        await handle.start();

        const startFetches = getSnapshotSpy.mock.calls.length;

        for (let i = 0; i < count; i++) {
          rev++;
          transport.setSnapshot({ revision: r(String(rev)), data: `snap-${rev}` });
          transport.emit({ topic: 'bench', revision: r(String(rev)) });
        }

        await vi.waitFor(
          () => {
            expect(applied.at(-1)?.revision).toBe(r(String(rev)));
          },
          { timeout: delay * 2 + 5000 },
        );

        const fetches = getSnapshotSpy.mock.calls.length - startFetches;

        results.push({
          Events: count,
          'IPC Delay (ms)': delay,
          Fetches: fetches,
          'Ratio (events/fetch)': fetches > 0 ? (count / fetches).toFixed(1) : 'N/A',
        });

        expect(fetches).toBeLessThanOrEqual(2);

        handle.stop();
        getSnapshotSpy.mockRestore();
      }, delay * 2 + 10_000);
    }
  }

  afterAll(() => {
    console.log('\n📊 Benchmark B: Engine coalescing efficiency');
    console.log('NOTE: IPC delay simulated via InMemoryTransport.setSnapshotDelay()');
    console.table(results);
  });
});
