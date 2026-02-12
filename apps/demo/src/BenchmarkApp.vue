<template>
  <div class="bench-app">
    <div class="header">
      <h1>Benchmarks</h1>
      <span v-if="running" class="badge">{{ status }}</span>
      <span v-else-if="done" class="badge badge-done">Done</span>
    </div>
    <div class="divider" />

    <p class="global-note">
      Real Tauri IPC. All numbers include serde serialization, Tauri bridge
      overhead, and JS engine processing. Nothing is mocked.
      Close other demo windows before running to avoid resource contention.
    </p>

    <!-- G: Latency -->
    <div v-if="latencyResult" class="bench-section">
      <div class="bench-title">G &middot; Real IPC Roundtrip Latency</div>
      <p class="bench-note">
        Single event &rarr; snapshot fetch &rarr; apply.
        {{ latencyResult.iterations }} iterations.
        Includes: invoke(update) + event delivery + invoke(getSnapshot) + apply.
      </p>
      <table class="bench-table">
        <thead>
          <tr>
            <th>p50</th>
            <th>p95</th>
            <th>p99</th>
            <th>min</th>
            <th>max</th>
            <th>mean</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{{ latencyResult.p50 }} ms</td>
            <td>{{ latencyResult.p95 }} ms</td>
            <td>{{ latencyResult.p99 }} ms</td>
            <td>{{ latencyResult.min }} ms</td>
            <td>{{ latencyResult.max }} ms</td>
            <td>{{ latencyResult.mean }} ms</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- H: Coalescing -->
    <div v-if="coalescingResults.length" class="bench-section">
      <div class="bench-title">H &middot; Coalescing Efficiency (Real IPC)</div>
      <p class="bench-note">
        Burst of N events from Rust backend. Measures actual IPC snapshot
        fetches made by the JS engine.
      </p>
      <table class="bench-table">
        <thead>
          <tr>
            <th>Events</th>
            <th>Fetches</th>
            <th>Ratio</th>
            <th>E2E (ms)</th>
            <th>Rust emit (&micro;s)</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in coalescingResults" :key="r.events">
            <td>{{ r.events }}</td>
            <td>{{ r.fetches }}</td>
            <td>{{ r.ratio }}</td>
            <td>{{ r.totalMs }}</td>
            <td>{{ r.rustEmitUs }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- I: Throughput -->
    <div v-if="throughputResult" class="bench-section">
      <div class="bench-title">I &middot; End-to-End Throughput</div>
      <p class="bench-note">
        1000 events burst &rarr; time until final state applied across all
        windows. Includes full Rust emit + Tauri bridge + JS engine cycle.
      </p>
      <table class="bench-table">
        <thead>
          <tr>
            <th>Events</th>
            <th>Total</th>
            <th>Events/sec</th>
            <th>Rust emit (&micro;s)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{{ throughputResult.events }}</td>
            <td>{{ throughputResult.totalMs }} ms</td>
            <td>{{ throughputResult.eventsPerSec }}</td>
            <td>{{ throughputResult.rustEmitUs }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <button
      class="btn btn-lg btn-block"
      :class="running ? 'btn-danger' : 'btn-primary'"
      :disabled="running"
      @click="runAll"
    >
      {{ running ? status : done ? 'Run Again' : 'Run Benchmarks' }}
    </button>
  </div>
</template>

<script setup lang="ts">
import type { SnapshotEnvelope } from '@statesync/core';
import { createTauriRevisionSync } from '@statesync/tauri';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { onMounted, onUnmounted, reactive, ref, watch } from 'vue';

// --- Local store (isolated from demo windows) ---

interface BenchState {
  counter: number;
  color: string;
  sliderValue: number;
  text: string;
  revision: string;
}

const store = reactive<BenchState>({
  counter: 0,
  color: '',
  sliderValue: 0,
  text: '',
  revision: '0',
});

// --- Counting invoke proxy ---

let snapshotCallCount = 0;

const countingInvoke = (async (cmd: string, args?: Record<string, unknown>) => {
  if (cmd === 'get_demo_snapshot') snapshotCallCount++;
  return invoke(cmd, args);
}) as typeof invoke;

function resetSnapshotCount() {
  snapshotCallCount = 0;
}

// --- Sync handle with counting invoke ---

const sync = createTauriRevisionSync<BenchState>({
  topic: 'demo',
  listen,
  invoke: countingInvoke,
  eventName: 'state-sync:invalidation',
  commandName: 'get_demo_snapshot',
  applier: {
    apply(snapshot: SnapshotEnvelope<BenchState>) {
      store.counter = snapshot.data.counter;
      store.color = snapshot.data.color;
      store.sliderValue = snapshot.data.sliderValue;
      store.text = snapshot.data.text;
      store.revision = snapshot.revision;
    },
  },
});

// --- Helpers ---

function waitForRevision(targetRev: string, timeoutMs = 30000): Promise<void> {
  return new Promise((resolve, reject) => {
    const check = () => Number(store.revision) >= Number(targetRev);
    if (check()) {
      resolve();
      return;
    }
    const timeout = setTimeout(() => {
      unwatch();
      reject(new Error(`Timeout: want rev ${targetRev}, have ${store.revision}`));
    }, timeoutMs);
    const unwatch = watch(
      () => store.revision,
      () => {
        if (check()) {
          clearTimeout(timeout);
          unwatch();
          resolve();
        }
      },
    );
    if (check()) {
      clearTimeout(timeout);
      unwatch();
      resolve();
    }
  });
}

interface BenchBurstResult {
  eventsFired: number;
  elapsedUs: number;
  finalRevision: string;
}

async function burst(count: number, delayUs = 0): Promise<BenchBurstResult> {
  return invoke<BenchBurstResult>('bench_burst', { count, delayUs });
}

function percentile(sorted: number[], p: number): number {
  return sorted[Math.floor((sorted.length * p) / 100)] ?? 0;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// --- Reactive state ---

const running = ref(false);
const done = ref(false);
const status = ref('');

const latencyResult = ref<{
  p50: string;
  p95: string;
  p99: string;
  min: string;
  max: string;
  mean: string;
  iterations: number;
} | null>(null);

const coalescingResults = ref<
  Array<{
    events: number;
    fetches: number;
    ratio: string;
    totalMs: string;
    rustEmitUs: string;
  }>
>([]);

const throughputResult = ref<{
  events: number;
  totalMs: string;
  eventsPerSec: string;
  rustEmitUs: string;
} | null>(null);

// --- Benchmark runner ---

async function runAll() {
  if (running.value) return;
  running.value = true;
  done.value = false;
  latencyResult.value = null;
  coalescingResults.value = [];
  throughputResult.value = null;

  try {
    // Warmup: ensure JIT, connections, initial sync settled
    status.value = 'Warmup...';
    const warmup = await burst(50);
    await waitForRevision(warmup.finalRevision);
    await sleep(200);

    // G: Single IPC roundtrip latency
    const ITERATIONS = 50;
    const latencies: number[] = [];

    for (let i = 0; i < ITERATIONS; i++) {
      status.value = `G: Latency (${i + 1}/${ITERATIONS})`;
      await sleep(5); // ensure engine is idle between iterations

      const t0 = performance.now();
      const result = await burst(1);
      await waitForRevision(result.finalRevision);
      latencies.push(performance.now() - t0);
    }

    latencies.sort((a, b) => a - b);
    const mean = latencies.reduce((s, v) => s + v, 0) / latencies.length;

    latencyResult.value = {
      p50: percentile(latencies, 50).toFixed(2),
      p95: percentile(latencies, 95).toFixed(2),
      p99: percentile(latencies, 99).toFixed(2),
      min: (latencies[0] ?? 0).toFixed(2),
      max: (latencies.at(-1) ?? 0).toFixed(2),
      mean: mean.toFixed(2),
      iterations: ITERATIONS,
    };
    console.log('Benchmark G: Real IPC Roundtrip Latency');
    console.table([latencyResult.value]);

    // H: Coalescing efficiency (3 runs per count, report median)
    const COAL_RUNS = 3;
    const eventCounts = [10, 50, 100, 500, 1000];

    for (const count of eventCounts) {
      const runs: Array<{ fetches: number; totalMs: number; rustEmitUs: number }> = [];

      for (let run = 0; run < COAL_RUNS; run++) {
        status.value = `H: Coalescing (${count} events, run ${run + 1}/${COAL_RUNS})`;
        await sleep(100); // cooldown, ensure engine is idle

        resetSnapshotCount();
        const startCount = snapshotCallCount;

        const t0 = performance.now();
        const result = await burst(count);
        await waitForRevision(result.finalRevision);
        const totalMs = performance.now() - t0;
        const fetches = snapshotCallCount - startCount;

        runs.push({ fetches, totalMs, rustEmitUs: result.elapsedUs });
      }

      // Pick median by totalMs
      runs.sort((a, b) => a.totalMs - b.totalMs);
      const med = runs[Math.floor(runs.length / 2)] ?? runs[0];

      coalescingResults.value.push({
        events: count,
        fetches: med.fetches,
        ratio: med.fetches > 0 ? `${count}:${med.fetches}` : 'N/A',
        totalMs: med.totalMs.toFixed(1),
        rustEmitUs: med.rustEmitUs.toLocaleString('en-US'),
      });
    }
    console.log('Benchmark H: Coalescing Efficiency (Real IPC, median of 3 runs)');
    console.table(coalescingResults.value);

    // I: Throughput (3 runs, report median)
    const THRU_RUNS = 3;
    const thruRuns: Array<{ totalMs: number; rustEmitUs: number }> = [];

    for (let run = 0; run < THRU_RUNS; run++) {
      status.value = `I: Throughput (1000 events, run ${run + 1}/${THRU_RUNS})`;
      await sleep(200);

      const t0 = performance.now();
      const result = await burst(1000);
      await waitForRevision(result.finalRevision);
      thruRuns.push({ totalMs: performance.now() - t0, rustEmitUs: result.elapsedUs });
    }

    thruRuns.sort((a, b) => a.totalMs - b.totalMs);
    const medThru = thruRuns[Math.floor(thruRuns.length / 2)] ?? thruRuns[0];

    throughputResult.value = {
      events: 1000,
      totalMs: medThru.totalMs.toFixed(1),
      eventsPerSec: Math.round(1000 / (medThru.totalMs / 1000)).toLocaleString('en-US'),
      rustEmitUs: medThru.rustEmitUs.toLocaleString('en-US'),
    };
    console.log('Benchmark I: End-to-End Throughput (median of 3 runs)');
    console.table([throughputResult.value]);

    status.value = '';
    done.value = true;
  } catch (e) {
    status.value = `Error: ${e}`;
    console.error('[benchmark]', e);
  } finally {
    running.value = false;
  }
}

onMounted(async () => {
  await sync.start();
  await sleep(300);
  runAll();
});

onUnmounted(() => {
  sync.stop();
});
</script>

<style scoped>
:global(#app) {
  max-width: 720px;
}

.bench-app {
  max-width: 680px;
  margin: 0 auto;
  padding: 24px;
}

.global-note {
  font-size: 12px;
  color: var(--text-muted);
  margin-bottom: 20px;
  line-height: 1.6;
}

.bench-section {
  margin-bottom: 24px;
}

.bench-title {
  font-size: 14px;
  font-weight: 700;
  margin-bottom: 4px;
}

.bench-note {
  font-size: 11px;
  color: var(--text-muted);
  margin-bottom: 8px;
  line-height: 1.5;
}

.bench-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  font-variant-numeric: tabular-nums;
}

.bench-table th {
  text-align: left;
  padding: 6px 10px;
  background: var(--surface);
  border: 1px solid var(--border);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: var(--text-muted);
}

.bench-table td {
  padding: 6px 10px;
  border: 1px solid var(--border);
}

.badge-done {
  background: rgba(34, 197, 94, 0.15) !important;
  color: var(--success) !important;
}
</style>
