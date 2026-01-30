---
title: Quickstart
---

## 1) Определи topic

Topic — это строковой идентификатор синхронизируемого ресурса, например:
- `app-config`
- `auth-state`
- `settings`

Topic сравнивается строго (`===`).

## 2) Подключи engine

Нужно 3 части:
- **subscriber** (слушает invalidation events)
- **provider** (умеет получить snapshot)
- **applier** (применяет snapshot локально)

```ts
import { createConsoleLogger, createRevisionSync } from 'state-sync';

const handle = createRevisionSync({
  topic: 'settings',
  subscriber: myInvalidationSubscriber,
  provider: mySnapshotProvider,
  applier: mySnapshotApplier,
  logger: createConsoleLogger({ debug: true }),
});

await handle.start();
```

## 3) Stop (одноразовый handle)

После `stop()` handle считается “мёртвым” (защита от утечек подписок).

```ts
handle.stop();
// если нужно снова — создай новый handle через createRevisionSync(...)
```

