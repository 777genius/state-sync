# state-sync

Scalable, transport-agnostic state synchronization for multi-window and multi-process apps -- fully typed TypeScript with framework adapters for Pinia, Zustand, Valtio, Svelte, and Vue.

**[Documentation](https://777genius.github.io/state-sync/)** | **[Comparison](https://777genius.github.io/state-sync/comparison)** | **[GitHub](https://github.com/777genius/state-sync)**

---

**You provide**:
- a **subscriber** (an invalidation signal: "something changed, refresh!")
- a **provider** (fetches a snapshot: `{ revision, data }`)
- an **applier** (applies the snapshot to your local state)

**state-sync provides**:
- a small engine that handles common hard parts: **coalescing**, **retry hooks**, **lifecycle**, and avoiding many race conditions around refresh/apply.

## Table of contents

- [What is this?](#what-is-this)
- [Why state-sync?](#why-state-sync)
- [How it works (concepts)](#how-it-works-concepts)
- [Packages](#packages)
- [Install](#install)
- [Quickstart (core)](#quickstart-core)
- [Quickstart (Tauri)](#quickstart-tauri)
- [Framework adapters](#framework-adapters)
- [Docs & examples](#docs--examples)
- [Development](#development)
- [Rust crate](#rust-crate)
- [License](#license)

## What is this?

`state-sync` is a framework-agnostic, transport-agnostic way to keep **one logical piece of state** consistent across multiple runtimes.

Typical use cases:
- **Tauri**: sync settings/auth/cache between windows
- **Web**: sync state between tabs/iframes (planned via BroadcastChannel/adapters)
- Any IPC where you can emit an invalidation + fetch a snapshot

Non-goals:
- Realtime CRDT merging or fine-grained patches. The model here is **"invalidate -> fetch canonical snapshot -> apply"**.

## Why state-sync?

- **Tiny footprint.** The core engine is **3.1 KB gzipped**; each framework adapter adds roughly **0.8 KB**.
- **No vendor lock-in.** Works with any transport (Tauri events, BroadcastChannel, WebSocket, custom IPC) and any state library.
- **One API for every framework.** The same `createRevisionSync` call works with Pinia, Zustand, Valtio, Svelte, and Vue -- swap one line to switch adapters.

See the [full comparison with alternatives](https://777genius.github.io/state-sync/comparison) for details.

## How it works (concepts)

- **Topic**: string identifier for a resource (`'settings'`, `'profile'`, `'cache:user:123'`)
- **Revision**: monotonic-ish version identifier for ordering (string)
- **Invalidation event**: "your snapshot may be stale" (subscriber emits these)
- **Snapshot provider**: returns an envelope `{ revision, data }`
- **Applier**: takes the snapshot and mutates your local state

If invalidations come in fast (or the transport drops/duplicates), the engine aims to behave well:
- it **coalesces** refresh requests
- it keeps a consistent **lifecycle** (`start()`, `stop()`, `refresh()`)
- it exposes structured **error hooks** to help observe retry/refresh failures

## Packages

| Package | What it is |
|---|---|
| [`@statesync/core`](packages/core/) | Engine + revision protocol + types |
| [`@statesync/persistence`](packages/persistence/) | Persistence layer (localStorage, IndexedDB, cross-tab sync) |
| [`@statesync/pinia`](packages/pinia/) | Pinia snapshot applier adapter |
| [`@statesync/zustand`](packages/zustand/) | Zustand snapshot applier adapter |
| [`@statesync/valtio`](packages/valtio/) | Valtio snapshot applier adapter |
| [`@statesync/svelte`](packages/svelte/) | Svelte snapshot applier adapter |
| [`@statesync/vue`](packages/vue/) | Vue (reactive/ref) snapshot applier adapter |
| [`@statesync/tauri`](packages/tauri/) | Tauri transport adapters (subscriber + provider) |
| [`state-sync` (Rust)](crates/state-sync/) | Shared protocol types for Rust backends (`Revision`, `SnapshotEnvelope<T>`, `InvalidationEvent`) |

## Install

```bash
npm install @statesync/core

# Persistence (optional):
npm install @statesync/persistence  # localStorage, IndexedDB, cross-tab sync

# Framework adapters (pick one):
npm install @statesync/pinia    # Pinia
npm install @statesync/zustand  # Zustand
npm install @statesync/valtio   # Valtio
npm install @statesync/svelte   # Svelte
npm install @statesync/vue      # Vue (reactive / ref)

# Transport adapter:
npm install @statesync/tauri    # Tauri v2
```

[![npm @statesync/core](https://img.shields.io/npm/v/@statesync/core?label=%40statesync%2Fcore)](https://www.npmjs.com/package/@statesync/core)
[![npm @statesync/persistence](https://img.shields.io/npm/v/@statesync/persistence?label=%40statesync%2Fpersistence)](https://www.npmjs.com/package/@statesync/persistence)
[![npm @statesync/pinia](https://img.shields.io/npm/v/@statesync/pinia?label=%40statesync%2Fpinia)](https://www.npmjs.com/package/@statesync/pinia)
[![npm @statesync/zustand](https://img.shields.io/npm/v/@statesync/zustand?label=%40statesync%2Fzustand)](https://www.npmjs.com/package/@statesync/zustand)
[![npm @statesync/valtio](https://img.shields.io/npm/v/@statesync/valtio?label=%40statesync%2Fvaltio)](https://www.npmjs.com/package/@statesync/valtio)
[![npm @statesync/svelte](https://img.shields.io/npm/v/@statesync/svelte?label=%40statesync%2Fsvelte)](https://www.npmjs.com/package/@statesync/svelte)
[![npm @statesync/vue](https://img.shields.io/npm/v/@statesync/vue?label=%40statesync%2Fvue)](https://www.npmjs.com/package/@statesync/vue)
[![npm @statesync/tauri](https://img.shields.io/npm/v/@statesync/tauri?label=%40statesync%2Ftauri)](https://www.npmjs.com/package/@statesync/tauri)
[![CI](https://github.com/777genius/state-sync/actions/workflows/ci.yml/badge.svg)](https://github.com/777genius/state-sync/actions/workflows/ci.yml)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@statesync/core?label=core%20gzip)](https://bundlephobia.com/package/@statesync/core)

## Quickstart (core)

```ts
import { createConsoleLogger, createRevisionSync } from '@statesync/core';

const handle = createRevisionSync({
  topic: 'settings',
  subscriber: myInvalidationSubscriber, // emits "changed" events
  provider: mySnapshotProvider, // returns { revision, data }
  applier: {
    apply(snapshot) {
      // snapshot.data is your payload
      console.log('Apply:', snapshot.revision, snapshot.data);
    },
  },
  logger: createConsoleLogger({ debug: true }),
  onError(ctx) {
    // ctx.phase: 'subscribe' | 'getSnapshot' | 'apply' | ...
    console.error(`[${ctx.phase}]`, ctx.error);
  },
});

await handle.start();
```

## Quickstart (Tauri)

Use Tauri **events** for invalidation and **invoke** for snapshots.

```ts
import { createRevisionSync } from '@statesync/core';
import {
  createTauriInvalidationSubscriber,
  createTauriSnapshotProvider,
} from '@statesync/tauri';
import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';

const handle = createRevisionSync({
  topic: 'settings',
  subscriber: createTauriInvalidationSubscriber({
    listen,
    eventName: 'state-sync:invalidation',
  }),
  provider: createTauriSnapshotProvider({
    invoke,
    commandName: 'get_snapshot',
    args: { topic: 'settings' },
  }),
  applier: myApplier, // use any framework adapter below
});

await handle.start();
```

## Framework adapters

Each adapter creates a `SnapshotApplier` for a specific state management library. All adapters share the same options pattern: `mode` (`'patch'` | `'replace'`), `pickKeys`/`omitKeys`, `toState` mapping, and `strict` mode.

```ts
import { createPiniaSnapshotApplier } from '@statesync/pinia';

const applier = createPiniaSnapshotApplier(myPiniaStore, {
  mode: 'patch',
  omitKeys: ['localUiFlag'],
});
```

Every framework adapter follows the same pattern -- swap `createPiniaSnapshotApplier` for `createZustandSnapshotApplier`, `createValtioSnapshotApplier`, `createSvelteSnapshotApplier`, or `createVueSnapshotApplier`. See the [adapter documentation](https://777genius.github.io/state-sync/guide/adapters) for full examples of each.

### Adapter options (shared across all adapters)

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `mode` | `'patch' \| 'replace'` | `'patch'` | Merge vs full replacement |
| `pickKeys` | `string[]` | -- | Only sync these keys |
| `omitKeys` | `string[]` | -- | Never sync these keys |
| `toState` | `(data, ctx) => State` | identity | Map snapshot data to state shape |
| `strict` | `boolean` | `true` | Throw if `toState` returns non-object |

## Docs & examples

Full documentation is hosted at **[777genius.github.io/state-sync](https://777genius.github.io/state-sync/)**.

- **[Getting started](https://777genius.github.io/state-sync/guide/quickstart)**
- **[Protocol](https://777genius.github.io/state-sync/guide/protocol)**
- **[Multi-window guide](https://777genius.github.io/state-sync/guide/multi-window)**
- **[Lifecycle contract](https://777genius.github.io/state-sync/lifecycle)**
- **[Compatibility](https://777genius.github.io/state-sync/compatibility)**
- **[Troubleshooting](https://777genius.github.io/state-sync/troubleshooting)**
- **[Examples](https://777genius.github.io/state-sync/examples/)**

## Development

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Rust crate

The [`state-sync`](crates/state-sync/) Rust crate provides shared protocol types for Tauri (or any Rust) backends:

- **`Revision`** -- monotonic `u64` counter with saturating arithmetic
- **`SnapshotEnvelope<T>`** -- generic `{ revision, data }` envelope (serde-ready)
- **`InvalidationEvent`** -- `{ topic, revision }` change notification (serde-ready)
- **`compare_revisions()`** -- canonical `u64` string comparison

```toml
# src-tauri/Cargo.toml
[dependencies]
state-sync = "0.1"
```

```rust
use state_sync::{InvalidationEvent, Revision, SnapshotEnvelope};

let rev = Revision::new(1);
let envelope = SnapshotEnvelope {
    revision: rev.to_string(),
    data: my_app_state,
};
```

The crate is versioned independently from the npm packages.

```bash
cd crates/state-sync
cargo test
cargo clippy --all-targets -- -D warnings
```

## License

MIT (see `LICENSE`).
