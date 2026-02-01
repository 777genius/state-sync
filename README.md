# state-sync

Reliable **state synchronization** between multiple windows/processes (e.g. Tauri multi-window).

**You provide**:
- a **subscriber** (an invalidation signal: “something changed, refresh!”)
- a **provider** (fetches a snapshot: `{ revision, data }`)
- an **applier** (applies the snapshot to your local state)

**state-sync provides**:
- a small engine that handles common hard parts: **coalescing**, **retry hooks**, **lifecycle**, and avoiding many race conditions around refresh/apply.

## Table of contents

- [What is this?](#what-is-this)
- [How it works (concepts)](#how-it-works-concepts)
- [Packages](#packages)
- [Install](#install)
- [Quickstart (core)](#quickstart-core)
- [Quickstart (Tauri)](#quickstart-tauri)
- [Quickstart (Pinia)](#quickstart-pinia)
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
- Realtime CRDT merging or fine-grained patches. The model here is **“invalidate → fetch canonical snapshot → apply”**.

## How it works (concepts)

- **Topic**: string identifier for a resource (`'settings'`, `'profile'`, `'cache:user:123'`)
- **Revision**: monotonic-ish version identifier for ordering (string)
- **Invalidation event**: “your snapshot may be stale” (subscriber emits these)
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
| [`@statesync/pinia`](packages/pinia/) | Pinia snapshot applier adapter |
| [`@statesync/tauri`](packages/tauri/) | Tauri transport adapters (subscriber + provider) |

## Install

```bash
npm install @statesync/core
# optional adapters:
npm install @statesync/pinia
npm install @statesync/tauri
```

## Quickstart (core)

```ts
import { createConsoleLogger, createRevisionSync } from '@statesync/core';

const handle = createRevisionSync({
  topic: 'settings',
  subscriber: myInvalidationSubscriber, // emits “changed” events
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
  applier: myApplier,
});

await handle.start();
```

## Quickstart (Pinia)

Apply snapshots directly into a Pinia store.

```ts
import { createRevisionSync } from '@statesync/core';
import { createPiniaSnapshotApplier } from '@statesync/pinia';

const handle = createRevisionSync({
  topic: 'settings',
  subscriber: mySubscriber,
  provider: myProvider,
  applier: createPiniaSnapshotApplier({
    store: myPiniaStore,
    // mode: 'replace' | 'merge' (see docs)
  }),
});

await handle.start();
```

## Docs & examples

- **Getting started**: `docs/guide/quickstart.md`
- **Protocol**: `docs/guide/protocol.md`
- **Multi-window guide**: `docs/guide/multi-window.md`
- **Lifecycle contract**: `docs/lifecycle.md`
- **Compatibility**: `docs/compatibility.md`
- **Troubleshooting**: `docs/troubleshooting.md`
- **Examples**: `docs/examples/`
- **Release checklist**: `docs/release-checklist.md`

Also see package-specific READMEs:
- `packages/core/README.md`
- `packages/pinia/README.md`
- `packages/tauri/README.md`

## Development

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Rust crate

The `crates/state-sync` directory contains an experimental Rust crate.
It is **not** part of the npm release and is versioned independently.

```bash
cd crates/state-sync
cargo fmt
cargo clippy --all-targets -- -D warnings
cargo test
```

## License

MIT (see `LICENSE`).
