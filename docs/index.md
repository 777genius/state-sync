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
  - title: Framework-agnostic
    details: Works with Pinia/React/vanilla state via applier adapters.
  - title: Transport-agnostic
    details: Any IPC/transport (Tauri events+invoke, BroadcastChannel, in-memory) via subscriber/provider.
  - title: Deterministic
    details: Monotonic revisions + snapshot source of truth guard against out-of-order events.
  - title: Production-friendly
    details: Contract tests, strict protocol validation, and observability via phases.
---

## Install

```bash
npm install state-sync
npm install state-sync-pinia   # if Pinia
npm install state-sync-tauri   # if Tauri
```

## Quick example

```ts
import { createConsoleLogger, createRevisionSync } from 'state-sync';

const handle = createRevisionSync({
  topic: 'app-config',
  subscriber: mySubscriber,
  provider: myProvider,
  applier: myApplier,
  logger: createConsoleLogger({ debug: true }),
});

await handle.start();
```

