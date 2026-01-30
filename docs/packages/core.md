---
title: Core (state-sync)
---

## What's inside

The core package provides:
- `createRevisionSync()` — synchronization engine
- `Revision` utils: `isCanonicalRevision`, `compareRevisions`
- retry wrappers: `withRetry`, `withRetryReporting`
- logging helpers: `createConsoleLogger`, `tagLogger`, `noopLogger`

## Quick wiring

```ts
import { createConsoleLogger, createRevisionSync, tagLogger } from 'state-sync';

const base = createConsoleLogger({ debug: true });
const logger = tagLogger(base, { windowId: 'main' });

const handle = createRevisionSync({
  topic: 'app-config',
  subscriber: mySubscriber,
  provider: myProvider,
  applier: myApplier,
  logger,
});

await handle.start();
```

See [Lifecycle](/lifecycle) and [Troubleshooting](/troubleshooting).

