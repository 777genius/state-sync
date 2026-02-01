---
title: Quickstart
---

## 1) Define a topic

Topic is a string identifier for the synchronized resource, for example:
- `app-config`
- `auth-state`
- `settings`

Topics are compared strictly (`===`).

## 2) Wire the engine

You need 3 parts:
- **subscriber** (listens for invalidation events)
- **provider** (fetches snapshots)
- **applier** (applies snapshots locally)

```ts
import { createConsoleLogger, createRevisionSync } from '@statesync/core';

const handle = createRevisionSync({
  topic: 'settings',
  subscriber: myInvalidationSubscriber,
  provider: mySnapshotProvider,
  applier: mySnapshotApplier,
  logger: createConsoleLogger({ debug: true }),
});

await handle.start();
```

## 3) Stop (single-use handle)

After `stop()`, the handle is considered “dead” (to protect against subscription leaks).

```ts
handle.stop();
// if you need it again, create a new handle via createRevisionSync(...)
```

