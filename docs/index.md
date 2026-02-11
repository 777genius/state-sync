---
layout: home
hero:
  name: state-sync
  text: Reliable state synchronization between windows/processes
  tagline: Revision-based ordering • Multi-framework • Persistence & cross-tab sync
  actions:
    - theme: brand
      text: Quickstart
      link: /guide/quickstart
    - theme: alt
      text: Examples
      link: /examples/
    - theme: alt
      text: Architecture
      link: /architecture
    - theme: alt
      text: Comparison
      link: /comparison
features:
  - icon: 🔢
    title: Revision-based ordering
    details: Monotonic revisions ensure updates apply in correct order. Stale events are automatically rejected.
    link: /guide/protocol
    linkText: Learn about protocol
  - icon: 🧩
    title: Multi-framework
    details: Official adapters for Pinia, Zustand, Valtio, Svelte, and Vue. Works with any state management.
    link: /packages/
    linkText: Browse packages
  - icon: 💾
    title: Persistence & caching
    details: localStorage, IndexedDB, schema migrations, compression, TTL. Cross-tab sync via BroadcastChannel.
    link: /packages/persistence
    linkText: Persistence docs
  - icon: 🔌
    title: Transport-agnostic
    details: Tauri events, BroadcastChannel, WebSocket, or custom. Subscriber/provider pattern fits any transport.
    link: /guide/custom-transports
    linkText: Custom transports
  - icon: 🛡️
    title: Resilient
    details: Throttling, retry with backoff, structured error handling by phase, comprehensive logging.
    link: /examples/error-handling
    linkText: Error handling examples
  - icon: 🪶
    title: Tiny footprint
    details: Core is 3.1KB gzipped. Framework adapters are ~0.8KB each. No bloat.
    link: /comparison#bundle-size-minified-gzipped
    linkText: See comparison
  - icon: ⚡
    title: 2ms IPC latency
    details: p50 round-trip through Tauri IPC. 100 events coalesced to 2 fetches.
    link: /benchmarks
    linkText: View benchmarks
  - icon: 🖥️
    title: Tauri & Electron
    details: Same core engine for both platforms. Transport adapters handle the IPC differences.
    link: /packages/tauri
    linkText: Tauri adapter
  - icon: 🔒
    title: TypeScript-first
    details: Full type inference, generic state types, zero any. Framework adapters preserve store types.
    link: /api/
    linkText: API reference
---

<div class="install-row">
  <InstallBlock />
  <div class="badges">
    <a href="https://www.npmjs.com/package/@statesync/core"><img src="https://img.shields.io/npm/v/@statesync/core?style=flat-square&color=3178c6&label=npm" alt="npm version" /></a>
    <a href="https://bundlephobia.com/package/@statesync/core"><img src="https://img.shields.io/bundlephobia/minzip/@statesync/core?style=flat-square&color=22c55e&label=size" alt="bundle size" /></a>
    <a href="https://github.com/777genius/state-sync/blob/main/LICENSE"><img src="https://img.shields.io/github/license/777genius/state-sync?style=flat-square&color=8b5cf6" alt="license" /></a>
    <a href="https://github.com/777genius/state-sync"><img src="https://img.shields.io/github/stars/777genius/state-sync?style=flat-square&color=f59e0b" alt="stars" /></a>
  </div>
</div>

## Install

::: code-group
```bash [npm]
npm install @statesync/core
```
```bash [pnpm]
pnpm add @statesync/core
```
```bash [yarn]
yarn add @statesync/core
```
:::

<details>
<summary>Optional packages</summary>

```bash
# Persistence (caching, migrations, cross-tab sync)
npm install @statesync/persistence

# Framework adapter (pick one)
npm install @statesync/pinia    # Vue + Pinia
npm install @statesync/zustand  # React + Zustand
npm install @statesync/valtio   # React + Valtio
npm install @statesync/svelte   # Svelte
npm install @statesync/vue      # Vue (reactive/ref)

# Transport adapter
npm install @statesync/tauri    # Tauri v2
```

</details>

## Supported Frameworks

<FrameworkGrid />

## Do you need state-sync?

**Yes, if you have:**

| Scenario | Problem state-sync solves |
|----------|---------------------------|
| Multi-window app (Tauri, Electron) | State diverges between windows |
| Multiple browser tabs | User edits in tab A, tab B shows stale data |
| Backend pushes state updates | Events arrive out of order, UI flickers |
| State must survive reload | Need persistence with proper invalidation |

**No, if you have:**

- Single-window app with no persistence needs
- Simple localStorage that never syncs with backend
- Already using a solution like TanStack Query for server state

## How it works

```mermaid
sequenceDiagram
    participant B as Backend
    participant W as Window

    B->>B: State changed
    B->>W: emit { topic, revision }
    W->>B: fetch snapshot
    B-->>W: { revision, data }
    W->>W: revision > local?
    W->>W: Apply state
```

Stale updates are rejected. Rapid events are merged. State stays consistent. [Learn more →](/guide/protocol)

## Explore

<ExploreGrid />

## Quick example

Sync a Zustand store across browser tabs with persistence:

```typescript
import { createRevisionSync } from '@statesync/core';
import { createZustandSnapshotApplier } from '@statesync/zustand';

// 1. Listen for "state changed" events from other tabs
const channel = new BroadcastChannel('my-sync');
const subscriber = {
  async subscribe(handler) {
    channel.onmessage = (e) => handler(e.data);
    return () => channel.close();
  },
};

// 2. Fetch current state
const provider = {
  async getSnapshot() {
    const raw = localStorage.getItem('my-state');
    return raw ? JSON.parse(raw) : { revision: '0', data: {} };
  },
};

// 3. Wire it together
const sync = createRevisionSync({
  topic: 'my-state',
  subscriber,
  provider,
  applier: createZustandSnapshotApplier(useMyStore),
});

await sync.start();
```

[Full Quickstart →](/guide/quickstart)
