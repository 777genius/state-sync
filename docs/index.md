---
layout: home
hero:
  name: state-sync
  text: Reliable state synchronization between windows/processes
  tagline: Invalidation → Fetch snapshot → Apply (revision gate)
  actions:
    - theme: brand
      text: Quickstart
      link: /guide/quickstart
    - theme: alt
      text: Packages
      link: /packages/
    - theme: alt
      text: Lifecycle
      link: /lifecycle
features:
  - title: Multi-framework
    details: Official adapters for Pinia, Zustand, Valtio, Svelte, and Vue (reactive/ref).
  - title: Transport-agnostic
    details: Any IPC/transport (Tauri events+invoke, BroadcastChannel, in-memory) via subscriber/provider.
  - title: Deterministic
    details: Monotonic revisions + snapshot source of truth guard against out-of-order events.
  - title: Production-friendly
    details: Contract tests, strict protocol validation, and observability via phases.
---

## Install

```bash
npm install @statesync/core

# Framework adapters (pick one)
npm install @statesync/pinia    # Pinia
npm install @statesync/zustand  # Zustand
npm install @statesync/valtio   # Valtio
npm install @statesync/svelte   # Svelte
npm install @statesync/vue      # Vue (reactive / ref)

# Transport adapter
npm install @statesync/tauri    # Tauri v2
```

## Quick example

```ts
import { createConsoleLogger, createRevisionSync } from '@statesync/core';

const handle = createRevisionSync({
  topic: 'app-config',
  subscriber: mySubscriber,
  provider: myProvider,
  applier: myApplier,
  logger: createConsoleLogger({ debug: true }),
});

await handle.start();
```

