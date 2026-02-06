---
title: Core (@statesync/core)
---

## Installation

```bash
npm install @statesync/core
```

## What's inside

The core package provides:
- `createRevisionSync()` — synchronization engine
- `Revision` utils: `isCanonicalRevision`, `compareRevisions`
- retry wrappers: `withRetry`, `withRetryReporting`
- logging helpers: `createConsoleLogger`, `tagLogger`, `noopLogger`

## Quick wiring

```ts
import { createConsoleLogger, createRevisionSync, tagLogger } from '@statesync/core';

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

## See also

- [Quickstart](/guide/quickstart) — full wiring example with a framework adapter
- [How state-sync works](/guide/protocol) — the invalidation-pull protocol
- [Lifecycle contract](/lifecycle) — method semantics, error phases
- [Troubleshooting](/troubleshooting) — common issues and fixes

